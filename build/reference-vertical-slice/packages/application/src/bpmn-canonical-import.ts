import { createOpaqueId, type OpaqueId } from '../../foundation/src/ids.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import {
  alignBpmnRevisionToCanonical,
  buildBpmnCanonicalSourceView,
  type BpmnCanonicalSourceNode,
  type BpmnProcessRevision,
} from '../../review/src/index.ts';
import { validateProcessRevision } from '../../semantic-core/src/validation.ts';
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

function canonical(seed: string): CanonicalId {
  return createOpaqueId('canonical', seed);
}

function nodeKind(element: BpmnCanonicalSourceNode): {
  kind?: ProcessNodeKind;
  details?: Record<string, unknown>;
  diagnostic?: NativeBpmnCanonicalDiagnostic;
} {
  switch (element.type) {
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
      const diverges = element.outgoingCount > 1;
      const converges = element.incomingCount > 1;
      if (diverges && converges) {
        return {
          diagnostic: {
            code: 'UNSUPPORTED_PARALLEL_GATEWAY_SHAPE',
            message: 'A single BPMN parallel gateway that both joins and splits requires an explicit Talos expansion before automation design.',
            bpmnElementId: element.id,
            bpmnType: element.type,
          },
        };
      }
      if (converges) return { kind: 'JOIN', details: { joinPolicy: 'ALL' } };
      if (diverges) return { kind: 'PARALLEL_SPLIT' };
      return {
        diagnostic: {
          code: 'UNSUPPORTED_PARALLEL_GATEWAY_SHAPE',
          message: 'Parallel gateway direction cannot be established from its BPMN flow structure.',
          bpmnElementId: element.id,
          bpmnType: element.type,
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
          message: `Native BPMN element ${element.type} is preserved but is not yet mapped by ${NATIVE_BPMN_CANONICAL_ADAPTER_VERSION}.`,
          bpmnElementId: element.id,
          bpmnType: element.type,
        },
      };
  }
}

function appendDocument<T>(
  repo: ImmutableDocumentRepository,
  id: OpaqueId,
  kind: string,
  payload: T,
  createdAt: string,
  parentId?: OpaqueId,
): void {
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
    ...(revision.parentBpmnRevisionId ? { parentId: revision.parentBpmnRevisionId as OpaqueId } : {}),
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

    const sourceView = await buildBpmnCanonicalSourceView(sourceRevision.bpmnXml);
    if (sourceView.semanticDigest !== sourceRevision.semanticDigest) {
      throw new TypeError('Native BPMN revision semantic digest does not match its current XML');
    }
    if (sourceView.processes.length !== 1) {
      return {
        status: 'BLOCKED',
        sourceBpmnRevision: sourceRevision,
        diagnostics: [{
          code: 'MULTIPLE_PROCESS_SCOPES_UNSUPPORTED',
          message: `Native BPMN reconciliation currently requires exactly one bpmn:Process; received ${sourceView.processes.length}.`,
        }],
      };
    }

    const process = sourceView.processes[0]!;
    const diagnostics: NativeBpmnCanonicalDiagnostic[] = [];
    const semanticDigest = sourceRevision.semanticDigest;
    const nodeIdByBpmnId = new Map<string, CanonicalId>();
    const actorIdsByNode = new Map<string, CanonicalId[]>();
    const actors: Actor[] = [];

    for (const lane of process.lanes) {
      const actorId = canonical(`native-bpmn:${semanticDigest}:lane:${lane.id}`);
      actors.push({
        id: actorId,
        kind: 'UNKNOWN',
        name: lane.name ?? lane.id,
        sourceReferences: [lane.id],
        provenanceRefs: [],
      });
      for (const flowNodeId of lane.flowNodeIds) {
        const current = actorIdsByNode.get(flowNodeId) ?? [];
        if (!current.includes(actorId)) current.push(actorId);
        actorIdsByNode.set(flowNodeId, current);
      }
    }

    const nodes: ProcessNode[] = [];
    for (const element of process.nodes) {
      const mapping = nodeKind(element);
      if (!mapping.kind) {
        diagnostics.push(mapping.diagnostic!);
        continue;
      }
      const id = canonical(`native-bpmn:${semanticDigest}:node:${element.id}`);
      nodeIdByBpmnId.set(element.id, id);
      nodes.push({
        id,
        kind: mapping.kind,
        ...(element.name ? { name: element.name } : {}),
        actorRefs: [...(actorIdsByNode.get(element.id) ?? [])],
        inputRefs: [],
        outputRefs: [],
        ruleRefs: [],
        details: {
          ...(mapping.details ?? {}),
          bpmnElementId: element.id,
          bpmnType: element.type,
        },
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
    for (const flow of process.flows) {
      const sourceNodeId = nodeIdByBpmnId.get(flow.sourceId);
      const targetNodeId = nodeIdByBpmnId.get(flow.targetId);
      if (!sourceNodeId || !targetNodeId) {
        diagnostics.push({
          code: 'FLOW_ENDPOINT_UNSUPPORTED',
          message: `Sequence flow ${flow.id} references a BPMN element that was not canonically mapped.`,
          bpmnElementId: flow.id,
          bpmnType: 'bpmn:SequenceFlow',
        });
        continue;
      }

      const sourceNode = nodeById.get(sourceNodeId)!;
      let kind: ProcessEdgeKind = 'SEQUENCE';
      let conditionRuleRef: CanonicalId | undefined;

      if (flow.isDefault) {
        kind = 'DEFAULT';
      } else if (sourceNode.kind === 'DECISION') {
        kind = 'CONDITIONAL';
        if (flow.conditionBody) {
          conditionRuleRef = canonical(`native-bpmn:${semanticDigest}:rule:${flow.id}`);
          rules.push({
            id: conditionRuleRef,
            naturalLanguage: flow.conditionBody,
            expression: {
              body: flow.conditionBody,
              ...(flow.conditionLanguage ? { language: flow.conditionLanguage } : {}),
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
        id: canonical(`native-bpmn:${semanticDigest}:edge:${flow.id}`),
        sourceNodeId,
        targetNodeId,
        kind,
        ...(conditionRuleRef ? { conditionRuleRef } : {}),
        ...(flow.name ? { label: flow.name } : {}),
        truthClass: 'SOURCE_TRUTH',
        provenanceRefs: [],
        sourceExtensionRefs: [],
      });
    }

    if (diagnostics.length > 0) {
      return { status: 'BLOCKED', sourceBpmnRevision: sourceRevision, diagnostics };
    }

    const reconciledAt = input.reconciledAt ?? new Date().toISOString();
    const processDefinitionId = canonical(`native-bpmn:${semanticDigest}:process-definition:${process.id}`);
    const processRevisionId = canonical(`native-bpmn:${semanticDigest}:process-revision:v1`);
    const processDefinition: ProcessDefinition = {
      id: processDefinitionId,
      canonicalName: process.name ?? process.id,
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
        sourceViewVersion: sourceView.version,
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
