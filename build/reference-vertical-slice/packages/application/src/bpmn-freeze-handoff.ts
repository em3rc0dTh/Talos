import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import { createOpaqueId, type OpaqueId } from '../../foundation/src/ids.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import {
  evaluateAutomationHandoffConfirmation,
  type BpmnProcessRevision,
  type BusinessProcessConfirmationRecord,
  type AutomationHandoffConfirmationResult,
} from '../../review/src/bpmn-confirmation.ts';
import type {
  FreezeRequestPayload,
  ReviewCommand,
  ReviewId,
  ScopeFreezeRequest,
  SemanticFreezeApplication,
  SemanticFreezeRecord,
} from '../../review/src/types.ts';
import type { ProcessRevision, ValidationAssessment } from '../../semantic-core/src/types.ts';
import type { ReviewContextBundle } from '../../review/src/workspace.ts';
import { applyFreezeCommand, type FreezeResult } from './review.ts';

const BPMN_FREEZE_HANDOFF_SCHEMA = 'talos-bpmn-freeze-handoff-v0.1';

export type BpmnFreezeHandoffResult =
  | 'FROZEN'
  | 'REJECTED_BPMN_CONFIRMATION'
  | 'REJECTED_CANONICAL_BASELINE_MISMATCH'
  | 'REJECTED_VALIDATION_GATE'
  | 'REJECTED_FREEZE_AUTHORITY'
  | 'REJECTED_FREEZE_REQUEST'
  | 'FAILED';

export interface BpmnFreezeHandoffRecord {
  id: ReviewId;
  bpmnRevisionId: ReviewId;
  businessProcessConfirmationId?: ReviewId;
  canonicalProcessRevisionId: string;
  reviewWorkspaceRevisionId: ReviewId;
  reviewBaselineBundleId: ReviewId;
  pinnedValidationAssessmentId?: string;
  freezeCommandId: ReviewId;
  freezeRequestPayloadId: ReviewId;
  confirmationGateResult: AutomationHandoffConfirmationResult;
  result: BpmnFreezeHandoffResult;
  semanticFreezeApplicationId?: ReviewId;
  semanticFreezeApplicationResult?: SemanticFreezeApplication['result'];
  semanticFreezeRecordId?: ReviewId;
  diagnosticRefs: string[];
  evaluatedAt: string;
}

export interface ConfirmedBpmnFreezeHandoffInput {
  currentBpmnRevision: BpmnProcessRevision;
  confirmation?: BusinessProcessConfirmationRecord;
  canonicalProcessRevision: ProcessRevision;
  reviewContext: ReviewContextBundle;
  freezeCommand: ReviewCommand;
  freezePayload: FreezeRequestPayload;
  scopeRequests: ScopeFreezeRequest[];
  assessments: ValidationAssessment[];
  evaluatedAt?: string;
}

export interface ConfirmedBpmnFreezeHandoffResult {
  handoff: BpmnFreezeHandoffRecord;
  freeze?: FreezeResult;
  freezeRecord?: SemanticFreezeRecord;
}

function appendHandoff(repo: ImmutableDocumentRepository, handoff: BpmnFreezeHandoffRecord): void {
  repo.append({
    id: handoff.id as OpaqueId,
    aggregateKind: 'BpmnFreezeHandoffRecord',
    schemaVersion: BPMN_FREEZE_HANDOFF_SCHEMA,
    payload: handoff,
    parentId: handoff.bpmnRevisionId as OpaqueId,
    createdAt: handoff.evaluatedAt,
  });
}

function makeHandoff(
  input: ConfirmedBpmnFreezeHandoffInput,
  result: BpmnFreezeHandoffResult,
  confirmationGateResult: AutomationHandoffConfirmationResult,
  diagnosticRefs: string[],
  freeze?: FreezeResult,
): BpmnFreezeHandoffRecord {
  const evaluatedAt = input.evaluatedAt ?? input.freezeCommand.requestedAt;
  const pinnedValidationAssessmentId = input.reviewContext.workspaceRevision.baselineValidationAssessmentId;
  const id = createOpaqueId('review', digestDeterministicJson({
    kind: 'BpmnFreezeHandoffRecord',
    bpmnRevisionId: input.currentBpmnRevision.id,
    ...(input.confirmation ? { businessProcessConfirmationId: input.confirmation.id } : {}),
    canonicalProcessRevisionId: input.canonicalProcessRevision.id,
    reviewWorkspaceRevisionId: input.reviewContext.workspaceRevision.id,
    reviewBaselineBundleId: input.reviewContext.baselineBundle.id,
    ...(pinnedValidationAssessmentId ? { pinnedValidationAssessmentId } : {}),
    freezeCommandId: input.freezeCommand.id,
    freezeRequestPayloadId: input.freezePayload.id,
    confirmationGateResult,
    result,
    ...(freeze ? { semanticFreezeApplicationResult: freeze.freezeApplication.result } : {}),
    ...(freeze?.freezeRecord ? { semanticFreezeRecordId: freeze.freezeRecord.id } : {}),
  }));
  return {
    id,
    bpmnRevisionId: input.currentBpmnRevision.id,
    ...(input.confirmation ? { businessProcessConfirmationId: input.confirmation.id } : {}),
    canonicalProcessRevisionId: input.canonicalProcessRevision.id,
    reviewWorkspaceRevisionId: input.reviewContext.workspaceRevision.id,
    reviewBaselineBundleId: input.reviewContext.baselineBundle.id,
    ...(pinnedValidationAssessmentId ? { pinnedValidationAssessmentId } : {}),
    freezeCommandId: input.freezeCommand.id,
    freezeRequestPayloadId: input.freezePayload.id,
    confirmationGateResult,
    result,
    ...(freeze ? {
      semanticFreezeApplicationId: freeze.freezeApplication.id,
      semanticFreezeApplicationResult: freeze.freezeApplication.result,
    } : {}),
    ...(freeze?.freezeRecord ? { semanticFreezeRecordId: freeze.freezeRecord.id } : {}),
    diagnosticRefs,
    evaluatedAt,
  };
}

function mapFreezeResult(freeze: FreezeResult): { result: BpmnFreezeHandoffResult; diagnostics: string[] } {
  switch (freeze.freezeApplication.result) {
    case 'FROZEN':
      return { result: 'FROZEN', diagnostics: [] };
    case 'REJECTED_VALIDATION_GATE':
      return { result: 'REJECTED_VALIDATION_GATE', diagnostics: ['BPMN_HANDOFF_REQUIRES_EXACT_READY_BASELINE_ASSESSMENT'] };
    case 'REJECTED_AUTHORITY':
      return { result: 'REJECTED_FREEZE_AUTHORITY', diagnostics: ['BPMN_CONFIRMATION_AUTHORITY_DOES_NOT_SUBSTITUTE_FOR_FREEZE_AUTHORITY'] };
    case 'REJECTED_STALE':
      return { result: 'REJECTED_FREEZE_REQUEST', diagnostics: ['FREEZE_REQUEST_STALE_AGAINST_CURRENT_REVIEW_BASELINE'] };
    case 'REJECTED_INVALID_SCOPE_SET':
      return { result: 'REJECTED_FREEZE_REQUEST', diagnostics: ['INVALID_FREEZE_REQUEST_GRAPH'] };
    case 'PARTIAL_SCOPE_FREEZE':
      return { result: 'REJECTED_FREEZE_REQUEST', diagnostics: ['AUTOMATION_DESIGN_HANDOFF_REQUIRES_COMPLETE_REQUESTED_SCOPE_FREEZE'] };
    default:
      return { result: 'FAILED', diagnostics: ['SEMANTIC_FREEZE_EVALUATION_FAILED'] };
  }
}

/**
 * Independent structural safety net at the automation-design handoff.
 *
 * Perception quality and semantic validation normally reject these shapes
 * earlier, but business confirmation must never turn a disconnected canonical
 * graph into automation authority. The gate is source-agnostic: image, native
 * BPMN and corrected canvases are evaluated from the same canonical graph.
 */
export function assessAutomationHandoffTopology(process: ProcessRevision): string[] {
  if (process.nodes.length === 0) return ['AUTOMATION_HANDOFF_PROCESS_GRAPH_EMPTY'];

  const nodeIds = new Set(process.nodes.map((node) => String(node.id)));
  const incoming = new Map<string, number>([...nodeIds].map((id) => [id, 0]));
  const outgoing = new Map<string, string[]>([...nodeIds].map((id) => [id, []]));
  const diagnostics = new Set<string>();

  for (const edge of process.edges) {
    const source = String(edge.sourceNodeId);
    const target = String(edge.targetNodeId);
    if (!nodeIds.has(source) || !nodeIds.has(target)) {
      diagnostics.add('AUTOMATION_HANDOFF_EDGE_ENDPOINT_OUTSIDE_CANONICAL_GRAPH');
      continue;
    }
    outgoing.get(source)!.push(target);
    incoming.set(target, (incoming.get(target) ?? 0) + 1);
  }

  const entries = [...nodeIds].filter((id) => (incoming.get(id) ?? 0) === 0);
  if (entries.length !== 1) {
    diagnostics.add('AUTOMATION_HANDOFF_REQUIRES_SINGLE_CONNECTED_PROCESS_ENTRY');
  }

  if (entries.length === 1) {
    const reached = new Set<string>();
    const stack = [entries[0]];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (reached.has(current)) continue;
      reached.add(current);
      for (const next of outgoing.get(current) ?? []) {
        if (!reached.has(next)) stack.push(next);
      }
    }
    if (reached.size !== nodeIds.size) {
      diagnostics.add('AUTOMATION_HANDOFF_REJECTS_DISCONNECTED_PROCESS_GRAPH');
    }
  }

  const ends = process.nodes.filter((node) => node.kind === 'END');
  for (const end of ends) {
    if ((incoming.get(String(end.id)) ?? 0) === 0) {
      diagnostics.add('AUTOMATION_HANDOFF_END_REQUIRES_INCOMING_FLOW');
    }
  }

  if (ends.length > 0) {
    for (const node of process.nodes) {
      if (node.kind === 'END') continue;
      if ((outgoing.get(String(node.id)) ?? []).length === 0) {
        diagnostics.add('AUTOMATION_HANDOFF_NON_TERMINAL_DEAD_END');
      }
    }
  }

  return [...diagnostics].sort();
}

/**
 * I7B-07 integration boundary.
 *
 * A BPMN confirmation can authorize entry into this gate, but it cannot create
 * a semantic freeze by itself. The exact current canonical review baseline and
 * the existing semantic-freeze validator remain authoritative for readiness.
 */
export function applyConfirmedBpmnFreezeHandoff(
  repo: ImmutableDocumentRepository,
  input: ConfirmedBpmnFreezeHandoffInput,
): ConfirmedBpmnFreezeHandoffResult {
  const expectedCanonicalProcessRevisionId = input.canonicalProcessRevision.id;
  const confirmationGate = evaluateAutomationHandoffConfirmation({
    currentBpmnRevision: input.currentBpmnRevision,
    expectedCanonicalProcessRevisionId,
    ...(input.confirmation ? { confirmation: input.confirmation } : {}),
  });

  if (!confirmationGate.authorized) {
    const handoff = makeHandoff(
      input,
      'REJECTED_BPMN_CONFIRMATION',
      confirmationGate.result,
      confirmationGate.diagnosticRefs,
    );
    appendHandoff(repo, handoff);
    return { handoff };
  }

  const workspaceProcessRevisionId = input.reviewContext.workspaceRevision.baselineProcessRevisionId;
  const baselineProcessRevisionId = input.reviewContext.baselineBundle.baselineProcessRevisionId;
  const baselineWorkspaceRevisionId = input.reviewContext.baselineBundle.reviewWorkspaceRevisionId;
  const canonicalBaselineMismatch = workspaceProcessRevisionId !== expectedCanonicalProcessRevisionId
    || baselineProcessRevisionId !== expectedCanonicalProcessRevisionId
    || baselineWorkspaceRevisionId !== input.reviewContext.workspaceRevision.id
    || input.currentBpmnRevision.canonicalProcessRevisionId !== expectedCanonicalProcessRevisionId
    || input.confirmation?.canonicalProcessRevisionId !== expectedCanonicalProcessRevisionId;

  if (canonicalBaselineMismatch) {
    const handoff = makeHandoff(
      input,
      'REJECTED_CANONICAL_BASELINE_MISMATCH',
      confirmationGate.result,
      ['CONFIRMED_BPMN_AND_ACTIVE_REVIEW_BASELINE_MUST_PIN_THE_SAME_PROCESS_REVISION'],
    );
    appendHandoff(repo, handoff);
    return { handoff };
  }

  const topologyDiagnostics = assessAutomationHandoffTopology(input.canonicalProcessRevision);
  if (topologyDiagnostics.length > 0) {
    const handoff = makeHandoff(
      input,
      'REJECTED_VALIDATION_GATE',
      confirmationGate.result,
      topologyDiagnostics,
    );
    appendHandoff(repo, handoff);
    return { handoff };
  }

  const freeze = applyFreezeCommand(
    repo,
    input.reviewContext,
    input.freezeCommand,
    input.freezePayload,
    input.scopeRequests,
    input.assessments,
  );
  const mapped = mapFreezeResult(freeze);
  const handoff = makeHandoff(input, mapped.result, confirmationGate.result, mapped.diagnostics, freeze);
  appendHandoff(repo, handoff);
  return {
    handoff,
    freeze,
    ...(freeze.freezeRecord ? { freezeRecord: freeze.freezeRecord } : {}),
  };
}
