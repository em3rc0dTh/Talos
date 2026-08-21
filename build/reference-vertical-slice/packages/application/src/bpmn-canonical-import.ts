import { BpmnModdle } from 'bpmn-moddle';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import { createOpaqueId, type OpaqueId } from '../../foundation/src/ids.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import {
  alignBpmnRevisionToCanonical,
  inspectBpmnXml,
  talosBpmnModdleDescriptor,
  type BpmnProcessRevision,
} from '../../review/src/index.ts';
import {
  validateProcessRevision,
} from '../../semantic-core/src/validation.ts';
import type {
  Actor,
  BusinessRule,
  CanonicalId,
  ProcessDefinition,
  ProcessEdge,
  ProcessEdgeKind,
  ProcessNode,
  ProcessNodeKind,
  ProcessRevision,
  ValidationBundle,
} from '../../semantic-core/src/types.ts';
import { persistValidationBundle } from './validation-persistence.ts';
import { initializeReview, type InitializedReview } from './review.ts';

export const NATIVE_BPMN_CANONICAL_ADAPTER_VERSION = 'talos-native-bpmn-canonical-adapter-v0.1';
const CANONICAL_SCHEMA = 'talos-native-bpmn-canonical-v0.1';
const BPMN_WORKSPACE_SCHEMA = 'talos-bpmn-workspace-v0.1';

type AnyRecord = Record<string, any>;

export interface NativeBpmnCanonicalDiagnostic {
  code:
    | 'MULTIPLE_PROCESS_SCOPES_UNSUPPORTED'
    | 'UNSUPPORTED_BPMN_ELEMENT'
    | 'UNSUPPORTED_PARALLEL_GATEWAY_SHAPE'
    | 'FLOW_ENDPOINT_UNSUPPORTED'
    | 'SOURCE_REVISION_NOT_NATIVE_BPMN'
    | 'SOURCE_REVISION_NOT_DRAFT'
    | 'SOURCE_REVISION_ALREADY_ALIGNED';
  message: string;
  bpmnElementId?: string;
  bpmnType?: string;
}

export type NativeBpmnCanonicalReconciliationResult =
  | {
      status: 'RECONCILED';
      sourceBpmnRevision: BpmnProcessRevision;
      alignedBpmnRevision: BpmnProcessRevision;
      processDefinition: ProcessDefinition;
      processRevision: ProcessRevision;
      validation: ValidationBundle;
      review: InitializedReview;
      diagnostics: NativeBpmnCanonicalDiagnostic[];
    }
  | {
      status: 'BLOCKED';
      sourceBpmnRevision: BpmnProcessRevision;
      diagnostics: NativeBpmnCanonicalDiagnostic[];
    };

function createModdle(): BpmnModdle {
  return new BpmnModdle({ talos: talosBpmnModdleDescriptor as any });
}

function canonical(seed: string): CanonicalId {
  return createOpaqueId('canonical', seed);
}

function sourceType(element: AnyRecord): string {
  return typeof element.$type === 'string' ? element.$type : 'UNKNOWN';
}

function sourceId(element: AnyRecord): string {
  return typeof element.id === 'string' && element.id ? element.id : sourceType(element);
}

function normalizedName(element: AnyRecord): string | undefined {
  const name = typeof element.name === 'string' ? element.name.trim() : '';
  return name || undefined;
}

function flattenLanes(process: AnyRecord): AnyRecord[] {
  const out: AnyRecord[] = [];
  const visitLane = (lane: AnyRecord) => {
    out.push(lane);
    const childLaneSet = lane.childLaneSet;
    for (const child of childLaneSet?.lanes ?? []) visitLane(child);
  };
  for (const laneSet of process.laneSets ?? []) {
    for (const lane of laneSet.lanes ?? []) visitLane(lane);
  }
  return out;
}

function nodeKind(element: AnyRecord, incoming: number, outgoing: number): { kind?: ProcessNodeKind; details?: Record<string, unknown>; diagnostic?: NativeBpmnCanonicalDiagnostic } {
  const type = sourceType(element);
  switch (type) {
    case 'bpmn:StartEvent':
      return { kind: 'EVENT' };
    case 'bpmn:EndEvent':
      return { kind: 'END' };
    case 'bpmn:Task':
    case 'bpmn:ServiceTask':
    case 'bpmn:ScriptTask':
    case 'bpmn:SendTask':
    case 'bpmn:ReceiveTask':
    case 'bpmn:ManualTask':
    case 'bpmn:BusinessRuleTask':
      return { kind: 'ACTION' };
    case 'bpmn:UserTask':
      return { kind: 'HUMAN_INTERACTION' };
    case 'bpmn:ExclusiveGateway':
      return { kind: 'DECISION' };
    case 'bpmn:ParallelGateway': {
      const diverges = outgoing > 1;
      const converges = incoming > 1;
      if (diverges && converges) {
        return {
          diagnostic: {
            code: 'UNSUPPORTED_PARALLEL_GATEWAY_SHAPE',
            message: 'A single BPMN parallel gateway that both joins and splits requires an explicit Talos expansion before automation design.',
            bpmnElementId: sourceId(element),
            bpmnType: type,
          },
        };
      }
      if (converges) return { kind: 'JOIN', details: { joinPolicy: 'ALL' } };
      if (diverges) return { kind: 'PARALLEL_SPLIT' };
      return {
        diagnostic: {
          code: 'UNSUPPORTED_PARALLEL_GATEWAY_SHAPE',
          message: 'Parallel gateway direction cannot be established from its BPMN flow structure.',
          bpmnElementId: sourceId(element),
          bpmnType: type,
        },
      };
    }
    case 'bpmn:SubProcess':
      return { kind: 'SUBPROCESS', details: { subprocessMode: 'EMBEDDED' } };
    case 'bpmn:CallActivity':
      return { kind: 'SUBPROCESS', details: { subprocessMode: 'CALL_ACTIVITY' } };
    default:
      return {
        diagnostic: {
          code: 'UNSUPPORTED_BPMN_ELEMENT',
          message: `Native BPMN element ${type} is preserved but is not yet mapped by ${NATIVE_BPMN_CANONICAL_ADAPTER_VERSION}.`,
          bpmnElementId: sourceId(element),
          bpmnType: type,
        },
      };
  }
}

function appendDocument<T>(repo: ImmutableDocumentRepository, id: OpaqueId, kind: string, payload: T, createdAt: string, parentId?: OpaqueId): void {
  repo.append({
    id,
    aggregateKind: kind,
    schemaVersion: CANONICAL_SCHEMA,
    payload,
    ...(parentId ? { parentId } : {}),
    createdAt,
  });
}

function appendAlignedBpmn(repo: ImmutableDocumentRepository, revision: BpmnProcessRevision): void {
  repo.append({
    id: revision.id as OpaqueId,
    aggregateKind: 'BpmnProcessRevision',
    schemaVersion: BPMN_WORKSPACE_SCHEMA,
    payload: revision,
    parentId: revision.parentBpmnRevisionId as OpaqueId,
    createdAt: revision.createdAt,
  });
}

export class NativeBpmnCanonicalReconciliationService {
  readonly #repo: ImmutableDocumentRepository;

  constructor(repo: ImmutableDocumentRepository) {
    this.#repo = repo;
  }

  #getRevision(revisionId: string): BpmnProcessRevision | undefined {
    return this.#repo.get<BpmnProcessRevision>(revisionId as OpaqueId)?.payload;
  }

  #nextBpmnRevisionNumber(): number {
    return this.#repo.listByKind<BpmnProcessRevision>('BpmnProcessRevision')
      .reduce((highest, document) => Math.max(highest, document.payload.revisionNumber), 0) + 1;
  }

  async reconcile(input: {
    bpmnRevisionId: string;
    reconciledBy: string;
    reconciledAt?: string;
  }): Promise<NativeBpmnCanonicalReconciliationResult> {
    const sourceRevision = this.#getRevision(input.bpmnRevisionId);
    if (!sourceRevision) throw new TypeError('Native BPMN reconciliation revision not found');
    if (sourceRevision.sourceRoute !== 'NATIVE_BPMN') {
      return {
        status: 'BLOCKED',
        sourceBpmnRevision: sourceRevision,
        diagnostics: [{ code: 'SOURCE_REVISION_NOT_NATIVE_BPMN', message: 'Only exact native BPMN source revisions use the deterministic native BPMN canonical adapter.' }],
      };
    }
    if (sourceRevision.state !== 'DRAFT') {
      return {
        status: 'BLOCKED',
        sourceBpmnRevision: sourceRevision,
        diagnostics: [{ code: 'SOURCE_REVISION_NOT_DRAFT', message: 'Only a DRAFT BPMN revision may be reconciled.' }],
      };
    }
    if (sourceRevision.canonicalAlignmentStatus === 'ALIGNED_TO_CANONICAL') {
      return {
        status: 'BLOCKED',
        sourceBpmnRevision: sourceRevision,
        diagnostics: [{ code: 'SOURCE_REVISION_ALREADY_ALIGNED', message: 'This BPMN revision is already aligned to a canonical ProcessRevision.' }],
      };
    }

    const inspected = await inspectBpmnXml(sourceRevision.bpmnXml);
    if (inspected.modelSemanticDigest !== sourceRevision.semanticDigest) {
      throw new TypeError('Native BPMN revision semantic digest does not match its current XML');
    }

    const moddle = createModdle();
    const parsed = await moddle.fromXML(sourceRevision.bpmnXml);
    const definitions = parsed.rootElement as AnyRecord;
    const processes = (definitions.rootElements ?? []).filter((element: AnyRecord) => element.$type === 'bpmn:Process');
    if (processes.length !== 1) {
      return {
        status: 'BLOCKED',
        sourceBpmnRevision: sourceRevision,
        diagnostics: [{
          code: 'MULTIPLE_PROCESS_SCOPES_UNSUPPORTED',
          message: `Native BPMN reconciliation currently requires exactly one bpmn:Process; received ${processes.length}.`,
        }],
      };
    }

    const process = processes[0] as AnyRecord;
    const flowElements: AnyRecord[] = process.flowElements ?? [];
    const sequenceFlows = flowElements.filter((element) => element.$type === 'bpmn:SequenceFlow');
    const flowNodes = flowElements.filter((element) => element.$type !== 'bpmn:SequenceFlow');
    const incomingCount = new Map<string, number>();
    const outgoingCount = new Map<string, number>();
    for (const flow of sequenceFlows) {
      const source = sourceId(flow.sourceRef ?? {});
      const target = sourceId(flow.targetRef ?? {});
      outgoingCount.set(source, (outgoingCount.get(source) ?? 0) + 1);
      incomingCount.set(target, (incomingCount.get(target) ?? 0) + 1);
    }

    const diagnostics: NativeBpmnCanonicalDiagnostic[] = [];
    const semanticDigest = sourceRevision.semanticDigest;
    const nodeIdByBpmnId = new Map<string, CanonicalId>();
    const actorIdsByNode = new Map<string, CanonicalId[]>();
    const actors: Actor[] = [];

    for (const lane of flattenLanes(process)) {
      const laneId = sourceId(lane);
      const actorId = canonical(`native-bpmn:${semanticDigest}:lane:${laneId}`);
      actors.push({
        id: actorId,
        kind: 'UNKNOWN',
        name: normalizedName(lane) ?? laneId,
        sourceReferences: [laneId],
        provenanceRefs: [],
      });
      for (const flowNode of lane.flowNodeRef ?? []) {
        const id = sourceId(flowNode);
        const current = actorIdsByNode.get(id) ?? [];
        if (!current.includes(actorId)) current.push(actorId);
        actorIdsByNode.set(id, current);
      }
    }

    const nodes: ProcessNode[] = [];
    for (const element of flowNodes) {
      const bpmnId = sourceId(element);
      const mapping = nodeKind(element, incomingCount.get(bpmnId) ?? 0, outgoingCount.get(bpmnId) ?? 0);
      if (!mapping.kind) {
        diagnostics.push(mapping.diagnostic!);
        continue;
      }
      const id = canonical(`native-bpmn:${semanticDigest}:node:${bpmnId}`);
      nodeIdByBpmnId.set(bpmnId, id);
      nodes.push({
        id,
        kind: mapping.kind,
        ...(normalizedName(element) ? { name: normalizedName(element) } : {}),
        actorRefs: [...(actorIdsByNode.get(bpmnId) ?? [])],
        inputRefs: [],
        outputRefs: [],
        ruleRefs: [],
        ...(mapping.details ? { details: { ...mapping.details, bpmnElementId: bpmnId, bpmnType: sourceType(element) } } : { details: { bpmnElementId: bpmnId, bpmnType: sourceType(element) } }),
        truthClass: 'SOURCE_TRUTH',
        provenanceRefs: [],
        sourceExtensionRefs: [],
      });
    }

    if (diagnostics.length > 0) {
      return { status: 'BLOCKED', sourceBpmnRevision: sourceRevision, diagnostics };
    }

    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const rules: BusinessRule[] = [];
    const edges: ProcessEdge[] = [];
    for (const flow of sequenceFlows) {
      const bpmnFlowId = sourceId(flow);
      const sourceBpmnId = sourceId(flow.sourceRef ?? {});
      const targetBpmnId = sourceId(flow.targetRef ?? {});
      const sourceNodeId = nodeIdByBpmnId.get(sourceBpmnId);
      const targetNodeId = nodeIdByBpmnId.get(targetBpmnId);
      if (!sourceNodeId || !targetNodeId) {
        diagnostics.push({
          code: 'FLOW_ENDPOINT_UNSUPPORTED',
          message: `Sequence flow ${bpmnFlowId} references a BPMN element that was not canonically mapped.`,
          bpmnElementId: bpmnFlowId,
          bpmnType: 'bpmn:SequenceFlow',
        });
        continue;
      }

      const sourceNode = nodeById.get(sourceNodeId)!;
      const sourceElement = flow.sourceRef as AnyRecord;
      const isDefault = sourceElement?.default && sourceId(sourceElement.default) === bpmnFlowId;
      const conditionBody = typeof flow.conditionExpression?.body === 'string'
        ? flow.conditionExpression.body.trim()
        : typeof flow.conditionExpression === 'string'
          ? flow.conditionExpression.trim()
          : '';
      let kind: ProcessEdgeKind = 'SEQUENCE';
      let conditionRuleRef: CanonicalId | undefined;

      if (isDefault) {
        kind = 'DEFAULT';
      } else if (sourceNode.kind === 'DECISION') {
        kind = 'CONDITIONAL';
        if (conditionBody) {
          conditionRuleRef = canonical(`native-bpmn:${semanticDigest}:rule:${bpmnFlowId}`);
          rules.push({
            id: conditionRuleRef,
            naturalLanguage: conditionBody,
            expression: {
              body: conditionBody,
              ...(typeof flow.conditionExpression?.language === 'string' && flow.conditionExpression.language
                ? { language: flow.conditionExpression.language }
                : {}),
            },
            inputs: [],
            truthClass: 'SOURCE_TRUTH',
            unresolvedTerms: [],
            provenanceRefs: [],
          });
          sourceNode.ruleRefs.push(conditionRuleRef);
        }
      } else if (sourceNode.kind === 'PARALLEL_SPLIT' || nodeById.get(targetNodeId)?.kind === 'JOIN') {
        kind = 'PARALLEL';
      }

      edges.push({
        id: canonical(`native-bpmn:${semanticDigest}:edge:${bpmnFlowId}`),
        sourceNodeId,
        targetNodeId,
        kind,
        ...(conditionRuleRef ? { conditionRuleRef } : {}),
        ...(normalizedName(flow) ? { label: normalizedName(flow) } : {}),
        truthClass: 'SOURCE_TRUTH',
        provenanceRefs: [],
        sourceExtensionRefs: [],
      });
    }

    if (diagnostics.length > 0) {
      return { status: 'BLOCKED', sourceBpmnRevision: sourceRevision, diagnostics };
    }

    const reconciledAt = input.reconciledAt ?? new Date().toISOString();
    const processDefinitionId = canonical(`native-bpmn:${semanticDigest}:process-definition:${sourceId(process)}`);
    const processRevisionId = canonical(`native-bpmn:${semanticDigest}:process-revision:v1`);
    const processDefinition: ProcessDefinition = {
      id: processDefinitionId,
      canonicalName: normalizedName(process) ?? sourceId(process),
      lifecycleStatus: 'ACTIVE',
      revisionIds: [processRevisionId],
    };
    const processRevision: ProcessRevision = {
      id: processRevisionId,
      processDefinitionId,
      revision: 1,
      createdAt: reconciledAt,
      parentRevisionIds: [],
      derivationKind: 'IMPORT',
      sourceArtifactIds: [],
      nodes,
      edges,
      actors,
      variables: [],
      dataObjects: [],
      rules,
      semanticClaims: [],
      conflictRecords: [],
      annotations: [{
        kind: 'NATIVE_BPMN_CANONICALIZATION',
        adapterVersion: NATIVE_BPMN_CANONICAL_ADAPTER_VERSION,
        sourceBpmnRevisionId: sourceRevision.id,
        sourceBpmnXmlSha256: sourceRevision.bpmnXmlSha256,
        sourceSemanticDigest: sourceRevision.semanticDigest,
      }],
      provenanceLinks: [],
      sourceExtensions: [],
      semanticStatus: 'NORMALIZED',
      executionReadiness: 'NOT_ASSESSED',
      validationFindingRefs: [],
    };
    const validation = validateProcessRevision(processRevision, 'AUTOMATION_DESIGN_READINESS', { assessedAt: reconciledAt });

    appendDocument(this.#repo, processDefinition.id as OpaqueId, 'ProcessDefinition', processDefinition, reconciledAt);
    appendDocument(this.#repo, processRevision.id as OpaqueId, 'ProcessRevision', processRevision, reconciledAt);
    persistValidationBundle(this.#repo, validation);
    const review = initializeReview(this.#repo, processRevision, validation, {
      createdAt: reconciledAt,
      createdBy: input.reconciledBy,
      sourceRepresentationRefs: sourceRevision.sourceRepresentationRefs,
      adapterResultContextRefs: [`native-bpmn-adapter:${NATIVE_BPMN_CANONICAL_ADAPTER_VERSION}`],
    });
    const alignedBpmnRevision = alignBpmnRevisionToCanonical(sourceRevision, {
      canonicalProcessRevisionId: processRevision.id,
      alignedBy: input.reconciledBy,
      alignedAt: reconciledAt,
      authorityRef: `deterministic-adapter:${NATIVE_BPMN_CANONICAL_ADAPTER_VERSION}`,
      revisionNumber: this.#nextBpmnRevisionNumber(),
    });
    appendAlignedBpmn(this.#repo, alignedBpmnRevision);

    return {
      status: 'RECONCILED',
      sourceBpmnRevision: sourceRevision,
      alignedBpmnRevision,
      processDefinition,
      processRevision,
      validation,
      review,
      diagnostics: [],
    };
  }
}
