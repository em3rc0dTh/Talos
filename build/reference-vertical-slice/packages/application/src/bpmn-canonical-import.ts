import { createOpaqueId, getIdKind, type OpaqueId } from '../../foundation/src/ids.ts';
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
  SemanticClaim,
  SourceId,
  TruthClass,
  ValidationBundle,
} from '../../semantic-core/src/types.ts';
import { persistValidationBundle } from './validation-persistence.ts';
import { initializeReview, type InitializedReview } from './review.ts';

export const NATIVE_BPMN_CANONICAL_ADAPTER_VERSION = 'talos-native-bpmn-canonical-adapter-v0.1';
export const STRUCTURED_BPMN_CANONICAL_ADAPTER_VERSION = 'talos-structured-bpmn-canonical-adapter-v0.1';
const NATIVE_CANONICAL_SCHEMA = 'talos-native-bpmn-canonical-v0.1';
const STRUCTURED_CANONICAL_SCHEMA = 'talos-structured-bpmn-canonical-v0.1';
const BPMN_WORKSPACE_SCHEMA = 'talos-bpmn-workspace-v0.1';

export interface BpmnCanonicalDiagnostic {
  code:
    | 'MULTIPLE_PROCESS_SCOPES_UNSUPPORTED'
    | 'COLLABORATION_PARTICIPANT_PROCESS_UNRESOLVED'
    | 'MESSAGE_FLOW_ENDPOINT_UNSUPPORTED'
    | 'UNSUPPORTED_BPMN_ELEMENT'
    | 'UNSUPPORTED_PARALLEL_GATEWAY_SHAPE'
    | 'FLOW_ENDPOINT_UNSUPPORTED'
    | 'SOURCE_REVISION_NOT_NATIVE_BPMN'
    | 'SOURCE_REVISION_ROUTE_UNSUPPORTED'
    | 'SOURCE_REVISION_NOT_DRAFT'
    | 'SOURCE_REVISION_ALREADY_ALIGNED';
  message: string;
  bpmnElementId?: string;
  bpmnType?: string;
}

export type NativeBpmnCanonicalDiagnostic = BpmnCanonicalDiagnostic;

export type BpmnCanonicalReconciliationResult =
  | {
      status: 'RECONCILED';
      sourceBpmnRevision: BpmnProcessRevision;
      alignedBpmnRevision: BpmnProcessRevision;
      processDefinition: ProcessDefinition;
      processRevision: ProcessRevision;
      validation: ValidationBundle;
      review: InitializedReview;
      diagnostics: BpmnCanonicalDiagnostic[];
    }
  | {
      status: 'BLOCKED';
      sourceBpmnRevision: BpmnProcessRevision;
      diagnostics: BpmnCanonicalDiagnostic[];
    };

interface ReconciliationPolicy {
  allowedRoutes: readonly BpmnProcessRevision['sourceRoute'][];
  adapterVersion: string;
  schemaVersion: string;
  preserveNativeSeedContract: boolean;
  persistProcessDefinitionState: boolean;
}

function canonical(seed: string): CanonicalId {
  return createOpaqueId('canonical', seed);
}

function nodeKind(element: BpmnCanonicalSourceNode, adapterVersion: string): {
  kind?: ProcessNodeKind;
  details?: Record<string, unknown>;
  diagnostic?: BpmnCanonicalDiagnostic;
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
          message: `BPMN element ${element.type} is preserved but is not yet mapped by ${adapterVersion}.`,
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
  schemaVersion: string,
  parentId?: OpaqueId,
): void {
  repo.append({
    id,
    aggregateKind: kind,
    schemaVersion,
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

function truthClassForRoute(route: BpmnProcessRevision['sourceRoute']): TruthClass {
  return route === 'IMAGE_INTERPRETATION' ? 'INFERRED' : 'SOURCE_TRUTH';
}

function sourceArtifactsForRevision(revision: BpmnProcessRevision): SourceId[] {
  return revision.sourceArtifactRefs
    .filter((ref) => getIdKind(ref) === 'source') as SourceId[];
}

function seedPrefix(revision: BpmnProcessRevision, policy: ReconciliationPolicy): string {
  if (policy.preserveNativeSeedContract && revision.sourceRoute === 'NATIVE_BPMN') return 'native-bpmn';
  return `structured-bpmn:${revision.sourceRoute.toLowerCase()}`;
}

function inferredClaim(
  seed: string,
  subjectRef: string,
  propertyPath: string,
  value: unknown,
  createdAt: string,
): SemanticClaim {
  return {
    id: createOpaqueId('provenance', `structured-bpmn-claim:${seed}:${subjectRef}:${propertyPath}`),
    subjectRef,
    propertyPath,
    value,
    perspective: 'BUSINESS_INTENT',
    truthClass: 'INFERRED',
    evidenceFragmentRefs: [],
    provenanceLinkRefs: [],
    createdAt,
    interpretationMethod: 'BPMN_STRUCTURED_RECONCILIATION',
    interpreterVersion: STRUCTURED_BPMN_CANONICAL_ADAPTER_VERSION,
  };
}

async function reconcileWithPolicy(
  repo: ImmutableDocumentRepository,
  input: {
    bpmnRevisionId: string;
    reconciledBy: string;
    reconciledAt?: string;
  },
  policy: ReconciliationPolicy,
): Promise<BpmnCanonicalReconciliationResult> {
  const sourceRevision = repo.get<BpmnProcessRevision>(input.bpmnRevisionId as OpaqueId)?.payload;
  if (!sourceRevision) throw new TypeError('BPMN reconciliation revision not found');
  if (!policy.allowedRoutes.includes(sourceRevision.sourceRoute)) {
    return {
      status: 'BLOCKED',
      sourceBpmnRevision: sourceRevision,
      diagnostics: [{
        code: policy.allowedRoutes.length === 1 && policy.allowedRoutes[0] === 'NATIVE_BPMN'
          ? 'SOURCE_REVISION_NOT_NATIVE_BPMN'
          : 'SOURCE_REVISION_ROUTE_UNSUPPORTED',
        message: `BPMN source route ${sourceRevision.sourceRoute} is not accepted by ${policy.adapterVersion}.`,
      }],
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
    throw new TypeError('BPMN revision semantic digest does not match its current XML');
  }
  if (sourceView.processes.length === 0) {
    return {
      status: 'BLOCKED',
      sourceBpmnRevision: sourceRevision,
      diagnostics: [{
        code: 'MULTIPLE_PROCESS_SCOPES_UNSUPPORTED',
        message: 'BPMN reconciliation requires at least one bpmn:Process.',
      }],
    };
  }

  const processIds = new Set(sourceView.processes.map((process) => process.id));
  const coveringCollaborations = sourceView.collaborations.filter((collaboration) => {
    const referenced = new Set(
      collaboration.participants
        .map((participant) => participant.processRef)
        .filter((ref): ref is string => Boolean(ref)),
    );
    return sourceView.processes.every((process) => referenced.has(process.id));
  });
  if (sourceView.processes.length > 1 && coveringCollaborations.length !== 1) {
    return {
      status: 'BLOCKED',
      sourceBpmnRevision: sourceRevision,
      diagnostics: [{
        code: 'MULTIPLE_PROCESS_SCOPES_UNSUPPORTED',
        message: `BPMN contains ${sourceView.processes.length} process scopes. Talos requires exactly one Collaboration whose participants reference every process scope before those scopes can be normalized together.`,
      }],
    };
  }

  const collaboration = sourceView.processes.length > 1
    ? coveringCollaborations[0]
    : sourceView.collaborations.find((candidate) => candidate.participants.some((participant) => participant.processRef === sourceView.processes[0]!.id));
  const diagnostics: BpmnCanonicalDiagnostic[] = [];
  const semanticDigest = sourceRevision.semanticDigest;
  const prefix = seedPrefix(sourceRevision, policy);
  const truthClass = truthClassForRoute(sourceRevision.sourceRoute);
  const nodeIdByBpmnId = new Map<string, CanonicalId>();
  const actorIdsByNode = new Map<string, CanonicalId[]>();
  const actors: Actor[] = [];

  if (collaboration) {
    for (const participant of collaboration.participants) {
      if (!participant.processRef) continue;
      if (!processIds.has(participant.processRef)) {
        diagnostics.push({
          code: 'COLLABORATION_PARTICIPANT_PROCESS_UNRESOLVED',
          message: `Participant ${participant.id} references process ${participant.processRef}, which is not present in the BPMN source view.`,
          bpmnElementId: participant.id,
          bpmnType: 'bpmn:Participant',
        });
        continue;
      }
      const actorId = canonical(`${prefix}:${semanticDigest}:participant:${participant.id}`);
      actors.push({
        id: actorId,
        kind: 'UNKNOWN',
        name: participant.name ?? participant.id,
        sourceReferences: [participant.id, participant.processRef],
        provenanceRefs: [],
      });
      const process = sourceView.processes.find((candidate) => candidate.id === participant.processRef)!;
      for (const element of process.nodes) {
        const current = actorIdsByNode.get(element.id) ?? [];
        if (!current.includes(actorId)) current.push(actorId);
        actorIdsByNode.set(element.id, current);
      }
    }
  }

  for (const process of sourceView.processes) {
    for (const lane of process.lanes) {
      const actorId = canonical(`${prefix}:${semanticDigest}:lane:${lane.id}`);
      actors.push({
        id: actorId,
        kind: 'UNKNOWN',
        name: lane.name ?? lane.id,
        sourceReferences: [lane.id, process.id],
        provenanceRefs: [],
      });
      for (const flowNodeId of lane.flowNodeIds) {
        const current = actorIdsByNode.get(flowNodeId) ?? [];
        if (!current.includes(actorId)) current.push(actorId);
        actorIdsByNode.set(flowNodeId, current);
      }
    }
  }

  const nodes: ProcessNode[] = [];
  for (const process of sourceView.processes) {
    for (const element of process.nodes) {
      const mapping = nodeKind(element, policy.adapterVersion);
      if (!mapping.kind) {
        diagnostics.push(mapping.diagnostic!);
        continue;
      }
      const id = canonical(`${prefix}:${semanticDigest}:node:${element.id}`);
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
          bpmnProcessId: process.id,
          sourceBpmnRevisionId: sourceRevision.id,
        },
        truthClass,
        provenanceRefs: [],
        sourceExtensionRefs: [],
      });
    }
  }

  if (diagnostics.length > 0) {
    return { status: 'BLOCKED', sourceBpmnRevision: sourceRevision, diagnostics };
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const rules: BusinessRule[] = [];
  const edges: ProcessEdge[] = [];
  for (const process of sourceView.processes) {
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
          conditionRuleRef = canonical(`${prefix}:${semanticDigest}:rule:${flow.id}`);
          rules.push({
            id: conditionRuleRef,
            naturalLanguage: flow.conditionBody,
            expression: {
              body: flow.conditionBody,
              ...(flow.conditionLanguage ? { language: flow.conditionLanguage } : {}),
            },
            inputs: [],
            truthClass,
            unresolvedTerms: [],
            provenanceRefs: [],
          });
          sourceNode.ruleRefs.push(conditionRuleRef);
        }
      } else if (sourceNode.kind === 'PARALLEL_SPLIT' || nodeById.get(targetNodeId)?.kind === 'JOIN') {
        kind = 'PARALLEL';
      }

      edges.push({
        id: canonical(`${prefix}:${semanticDigest}:edge:${flow.id}`),
        sourceNodeId,
        targetNodeId,
        kind,
        ...(conditionRuleRef ? { conditionRuleRef } : {}),
        ...(flow.name ? { label: flow.name } : {}),
        truthClass,
        provenanceRefs: [],
        sourceExtensionRefs: [],
      });
    }
  }

  if (collaboration) {
    for (const flow of collaboration.messageFlows) {
      const sourceNodeId = nodeIdByBpmnId.get(flow.sourceId);
      const targetNodeId = nodeIdByBpmnId.get(flow.targetId);
      if (!sourceNodeId || !targetNodeId) {
        diagnostics.push({
          code: 'MESSAGE_FLOW_ENDPOINT_UNSUPPORTED',
          message: `Message flow ${flow.id} must reference canonically mapped flow nodes. Participant-level or unsupported endpoints remain preserved in source but are not guessed into Canonical node relations.`,
          bpmnElementId: flow.id,
          bpmnType: 'bpmn:MessageFlow',
        });
        continue;
      }
      edges.push({
        id: canonical(`${prefix}:${semanticDigest}:edge:${flow.id}`),
        sourceNodeId,
        targetNodeId,
        kind: 'MESSAGE',
        ...(flow.name ? { label: flow.name } : {}),
        truthClass,
        provenanceRefs: [],
        sourceExtensionRefs: [],
      });
    }
  }

  if (diagnostics.length > 0) {
    return { status: 'BLOCKED', sourceBpmnRevision: sourceRevision, diagnostics };
  }

  const reconciledAt = input.reconciledAt ?? new Date().toISOString();
  const isCollaboration = sourceView.processes.length > 1 && Boolean(collaboration);
  const primaryProcess = sourceView.processes[0]!;
  const definitionScopeKey = isCollaboration ? `collaboration:${collaboration!.id}` : primaryProcess.id;
  const collaborationParticipantNames = collaboration?.participants
    .map((participant) => participant.name)
    .filter((name): name is string => Boolean(name)) ?? [];
  const processDefinitionId = canonical(`${prefix}:${semanticDigest}:process-definition:${definitionScopeKey}`);
  const processRevisionId = canonical(`${prefix}:${semanticDigest}:process-revision:v1`);
  const processDefinition: ProcessDefinition = {
    id: processDefinitionId,
    canonicalName: isCollaboration
      ? collaboration!.name ?? (collaborationParticipantNames.length > 0 ? collaborationParticipantNames.join(' ↔ ') : collaboration!.id)
      : primaryProcess.name ?? primaryProcess.id,
    lifecycleStatus: 'ACTIVE',
    revisionIds: [processRevisionId],
  };

  const semanticClaims: SemanticClaim[] = [];
  if (truthClass === 'INFERRED') {
    for (const node of nodes) {
      semanticClaims.push(inferredClaim(semanticDigest, node.id, 'kind', node.kind, reconciledAt));
      if (node.name) semanticClaims.push(inferredClaim(semanticDigest, node.id, 'name', node.name, reconciledAt));
    }
    for (const edge of edges) {
      semanticClaims.push(inferredClaim(semanticDigest, edge.id, 'kind', edge.kind, reconciledAt));
      semanticClaims.push(inferredClaim(semanticDigest, edge.id, 'sourceNodeId', edge.sourceNodeId, reconciledAt));
      semanticClaims.push(inferredClaim(semanticDigest, edge.id, 'targetNodeId', edge.targetNodeId, reconciledAt));
      if (edge.label) semanticClaims.push(inferredClaim(semanticDigest, edge.id, 'label', edge.label, reconciledAt));
    }
    for (const rule of rules) {
      semanticClaims.push(inferredClaim(semanticDigest, rule.id, 'naturalLanguage', rule.naturalLanguage, reconciledAt));
    }
  }

  const processRevision: ProcessRevision = {
    id: processRevisionId,
    processDefinitionId,
    revision: 1,
    createdAt: reconciledAt,
    parentRevisionIds: [],
    derivationKind: 'IMPORT',
    sourceArtifactIds: sourceArtifactsForRevision(sourceRevision),
    nodes,
    edges,
    actors,
    variables: [],
    dataObjects: [],
    rules,
    semanticClaims,
    conflictRecords: [],
    annotations: [{
      kind: sourceRevision.sourceRoute === 'NATIVE_BPMN'
        ? 'NATIVE_BPMN_CANONICALIZATION'
        : 'STRUCTURED_BPMN_RECONCILIATION',
      adapterVersion: policy.adapterVersion,
      sourceViewVersion: sourceView.version,
      sourceRoute: sourceRevision.sourceRoute,
      sourceBpmnRevisionId: sourceRevision.id,
      sourceBpmnXmlSha256: sourceRevision.bpmnXmlSha256,
      sourceSemanticDigest: sourceRevision.semanticDigest,
      sourceArtifactRefs: sourceRevision.sourceArtifactRefs,
      sourceRepresentationRefs: sourceRevision.sourceRepresentationRefs,
      bpmnProcessIds: sourceView.processes.map((process) => process.id),
      bpmnCollaborationIds: sourceView.collaborations.map((candidate) => candidate.id),
      bpmnParticipantIds: collaboration?.participants.map((participant) => participant.id) ?? [],
      bpmnMessageFlowIds: collaboration?.messageFlows.map((flow) => flow.id) ?? [],
      truthClass,
    }],
    provenanceLinks: [],
    sourceExtensions: [],
    semanticStatus: 'NORMALIZED',
    executionReadiness: 'NOT_ASSESSED',
    validationFindingRefs: [],
  };
  const validation = validateProcessRevision(processRevision, 'AUTOMATION_DESIGN_READINESS', { assessedAt: reconciledAt });

  appendDocument(repo, processDefinition.id as OpaqueId, 'ProcessDefinition', processDefinition, reconciledAt, policy.schemaVersion);
  if (policy.persistProcessDefinitionState) {
    appendDocument(
      repo,
      createOpaqueId('canonical', `process-definition-state:${processDefinition.id}:${processRevision.id}`),
      'ProcessDefinitionState',
      processDefinition,
      reconciledAt,
      policy.schemaVersion,
    );
  }
  appendDocument(repo, processRevision.id as OpaqueId, 'ProcessRevision', processRevision, reconciledAt, policy.schemaVersion);
  for (const claim of semanticClaims) {
    appendDocument(repo, claim.id as OpaqueId, 'SemanticClaim', claim, reconciledAt, 'provenance-v0.3-reference');
  }
  persistValidationBundle(repo, validation);
  const review = initializeReview(repo, processRevision, validation, {
    createdAt: reconciledAt,
    createdBy: input.reconciledBy,
    sourceRepresentationRefs: sourceRevision.sourceRepresentationRefs,
    adapterResultContextRefs: [
      sourceRevision.sourceRoute === 'NATIVE_BPMN'
        ? `native-bpmn-adapter:${NATIVE_BPMN_CANONICAL_ADAPTER_VERSION}`
        : `structured-bpmn-adapter:${STRUCTURED_BPMN_CANONICAL_ADAPTER_VERSION}:${sourceRevision.sourceRoute}`,
    ],
  });
  const alignedBpmnRevision = alignBpmnRevisionToCanonical(sourceRevision, {
    canonicalProcessRevisionId: processRevision.id,
    alignedBy: input.reconciledBy,
    alignedAt: reconciledAt,
    authorityRef: `deterministic-adapter:${policy.adapterVersion}`,
    revisionNumber: repo.listByKind<BpmnProcessRevision>('BpmnProcessRevision')
      .reduce((highest, document) => Math.max(highest, document.payload.revisionNumber), 0) + 1,
  });
  appendAlignedBpmn(repo, alignedBpmnRevision);

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

/** Historical I7B-08 contract. This remains native-BPMN-only. */
export class NativeBpmnCanonicalReconciliationService {
  readonly #repo: ImmutableDocumentRepository;

  constructor(repo: ImmutableDocumentRepository) {
    this.#repo = repo;
  }

  async reconcile(input: {
    bpmnRevisionId: string;
    reconciledBy: string;
    reconciledAt?: string;
  }): Promise<NativeBpmnCanonicalReconciliationResult> {
    return reconcileWithPolicy(this.#repo, input, {
      allowedRoutes: ['NATIVE_BPMN'],
      adapterVersion: NATIVE_BPMN_CANONICAL_ADAPTER_VERSION,
      schemaVersion: NATIVE_CANONICAL_SCHEMA,
      preserveNativeSeedContract: true,
      persistProcessDefinitionState: false,
    });
  }
}

/**
 * I7C-05 source-aware structured BPMN reconciler.
 *
 * It accepts semantic BPMN edits regardless of whether the BPMN originated as
 * native BPMN, an image interpretation, or Talos Canvas. Image-derived meaning
 * remains INFERRED until explicit process confirmation; no source-truth upgrade
 * occurs merely because a valid BPMN model exists.
 */
export class BpmnCanonicalReconciliationService {
  readonly #repo: ImmutableDocumentRepository;

  constructor(repo: ImmutableDocumentRepository) {
    this.#repo = repo;
  }

  async reconcile(input: {
    bpmnRevisionId: string;
    reconciledBy: string;
    reconciledAt?: string;
  }): Promise<BpmnCanonicalReconciliationResult> {
    return reconcileWithPolicy(this.#repo, input, {
      allowedRoutes: ['NATIVE_BPMN', 'IMAGE_INTERPRETATION', 'TALOS_CANVAS'],
      adapterVersion: STRUCTURED_BPMN_CANONICAL_ADAPTER_VERSION,
      schemaVersion: STRUCTURED_CANONICAL_SCHEMA,
      preserveNativeSeedContract: false,
      persistProcessDefinitionState: true,
    });
  }
}
