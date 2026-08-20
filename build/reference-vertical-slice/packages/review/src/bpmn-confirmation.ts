import { digestDeterministicJson, sha256Utf8 } from '../../foundation/src/digest.ts';
import { createOpaqueId } from '../../foundation/src/ids.ts';
import type { CanonicalId } from '../../semantic-core/src/types.ts';
import type { ReviewId } from './types.ts';

export type BpmnInputRoute = 'IMAGE_INTERPRETATION' | 'NATIVE_BPMN' | 'TALOS_CANVAS';
export type BpmnEditMode = 'INITIAL_PROJECTION' | 'NATIVE_BPMN_IMPORT' | 'GRAPH_EDIT' | 'XML_EDIT' | 'NATURAL_LANGUAGE_PATCH';
export type BpmnRevisionState = 'DRAFT' | 'CONFIRMED' | 'SUPERSEDED';
export type BpmnChangeClass = 'NO_CHANGE' | 'VISUAL_ONLY' | 'SEMANTIC';

export interface BpmnProcessRevision {
  id: ReviewId;
  revisionNumber: number;
  parentBpmnRevisionId?: ReviewId;
  sourceRoute: BpmnInputRoute;
  editMode: BpmnEditMode;
  sourceArtifactRefs: string[];
  sourceRepresentationRefs: string[];
  canonicalProcessRevisionId: CanonicalId;
  bpmnXml: string;
  bpmnXmlSha256: string;
  /** Digest of normalized BPMN business semantics, excluding BPMN-DI layout. */
  semanticDigest: string;
  /** Digest of BPMN-DI/layout state only. */
  diagramDigest: string;
  state: BpmnRevisionState;
  createdAt: string;
  createdBy: string;
  supersedesBpmnRevisionId?: ReviewId;
}

export interface CreateBpmnProcessRevisionInput {
  revisionNumber: number;
  parentBpmnRevisionId?: ReviewId;
  sourceRoute: BpmnInputRoute;
  editMode: BpmnEditMode;
  sourceArtifactRefs?: string[];
  sourceRepresentationRefs?: string[];
  canonicalProcessRevisionId: CanonicalId;
  bpmnXml: string;
  semanticDigest: string;
  diagramDigest: string;
  createdAt: string;
  createdBy: string;
  supersedesBpmnRevisionId?: ReviewId;
}

export interface NaturalLanguageBpmnCorrectionProposal {
  id: ReviewId;
  baseBpmnRevisionId: ReviewId;
  instruction: string;
  proposedBpmnRevisionId: ReviewId;
  status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED';
  automaticApplyAuthorized: false;
  requestedBy: string;
  proposedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  authorityRef?: string;
}

export interface BusinessProcessConfirmationRecord {
  id: ReviewId;
  bpmnRevisionId: ReviewId;
  bpmnXmlSha256: string;
  canonicalProcessRevisionId: CanonicalId;
  semanticDigest: string;
  status: 'CONFIRMED' | 'REVOKED';
  confirmedBy: string;
  confirmedAt: string;
  authorityRef: string;
  rationale?: string;
  revokedAt?: string;
  revokedBy?: string;
}

export type AutomationHandoffConfirmationResult =
  | 'AUTHORIZED'
  | 'REJECTED_MISSING_CONFIRMATION'
  | 'REJECTED_BPMN_NOT_CONFIRMED'
  | 'REJECTED_STALE_BPMN_REVISION'
  | 'REJECTED_XML_DIGEST_MISMATCH'
  | 'REJECTED_SEMANTIC_DIGEST_MISMATCH'
  | 'REJECTED_PROCESS_REVISION_MISMATCH'
  | 'REJECTED_REVOKED_CONFIRMATION'
  | 'REJECTED_MISSING_AUTHORITY';

export interface AutomationHandoffConfirmationEvaluation {
  result: AutomationHandoffConfirmationResult;
  authorized: boolean;
  diagnosticRefs: string[];
}

function requireText(value: string, field: string): void {
  if (value.trim().length === 0) throw new TypeError(`${field} must not be empty`);
}

export function createBpmnProcessRevision(input: CreateBpmnProcessRevisionInput): BpmnProcessRevision {
  if (!Number.isInteger(input.revisionNumber) || input.revisionNumber < 1) {
    throw new TypeError('revisionNumber must be a positive integer');
  }
  requireText(input.bpmnXml, 'bpmnXml');
  requireText(input.semanticDigest, 'semanticDigest');
  requireText(input.diagramDigest, 'diagramDigest');
  requireText(input.createdBy, 'createdBy');

  const bpmnXmlSha256 = sha256Utf8(input.bpmnXml);
  const id = createOpaqueId('review', digestDeterministicJson({
    kind: 'BpmnProcessRevision',
    revisionNumber: input.revisionNumber,
    parentBpmnRevisionId: input.parentBpmnRevisionId,
    sourceRoute: input.sourceRoute,
    editMode: input.editMode,
    canonicalProcessRevisionId: input.canonicalProcessRevisionId,
    bpmnXmlSha256,
    semanticDigest: input.semanticDigest,
    diagramDigest: input.diagramDigest,
  }));

  return {
    id,
    revisionNumber: input.revisionNumber,
    ...(input.parentBpmnRevisionId ? { parentBpmnRevisionId: input.parentBpmnRevisionId } : {}),
    sourceRoute: input.sourceRoute,
    editMode: input.editMode,
    sourceArtifactRefs: [...(input.sourceArtifactRefs ?? [])],
    sourceRepresentationRefs: [...(input.sourceRepresentationRefs ?? [])],
    canonicalProcessRevisionId: input.canonicalProcessRevisionId,
    bpmnXml: input.bpmnXml,
    bpmnXmlSha256,
    semanticDigest: input.semanticDigest,
    diagramDigest: input.diagramDigest,
    state: 'DRAFT',
    createdAt: input.createdAt,
    createdBy: input.createdBy,
    ...(input.supersedesBpmnRevisionId ? { supersedesBpmnRevisionId: input.supersedesBpmnRevisionId } : {}),
  };
}

export function classifyBpmnChange(before: BpmnProcessRevision, after: BpmnProcessRevision): BpmnChangeClass {
  if (before.semanticDigest !== after.semanticDigest) return 'SEMANTIC';
  if (before.diagramDigest !== after.diagramDigest || before.bpmnXmlSha256 !== after.bpmnXmlSha256) return 'VISUAL_ONLY';
  return 'NO_CHANGE';
}

export function proposeNaturalLanguageBpmnCorrection(input: {
  baseRevision: BpmnProcessRevision;
  proposedRevision: BpmnProcessRevision;
  instruction: string;
  requestedBy: string;
  proposedAt: string;
}): NaturalLanguageBpmnCorrectionProposal {
  requireText(input.instruction, 'instruction');
  if (input.proposedRevision.parentBpmnRevisionId !== input.baseRevision.id) {
    throw new TypeError('Natural-language proposal must derive from the exact current BPMN revision');
  }
  if (input.proposedRevision.editMode !== 'NATURAL_LANGUAGE_PATCH') {
    throw new TypeError('Natural-language proposal must point to a NATURAL_LANGUAGE_PATCH revision');
  }

  return {
    id: createOpaqueId('review', digestDeterministicJson({
      kind: 'NaturalLanguageBpmnCorrectionProposal',
      base: input.baseRevision.id,
      proposed: input.proposedRevision.id,
      instruction: input.instruction,
    })),
    baseBpmnRevisionId: input.baseRevision.id,
    instruction: input.instruction,
    proposedBpmnRevisionId: input.proposedRevision.id,
    status: 'PROPOSED',
    automaticApplyAuthorized: false,
    requestedBy: input.requestedBy,
    proposedAt: input.proposedAt,
  };
}

export function decideNaturalLanguageBpmnCorrection(
  proposal: NaturalLanguageBpmnCorrectionProposal,
  decision: 'ACCEPT' | 'REJECT',
  input: { decidedBy: string; decidedAt: string; authorityRef?: string },
): NaturalLanguageBpmnCorrectionProposal {
  if (proposal.status !== 'PROPOSED') throw new TypeError('Only a PROPOSED natural-language correction may be decided');
  if (decision === 'ACCEPT' && !input.authorityRef) throw new TypeError('Accepting a BPMN correction requires authorityRef');
  return {
    ...proposal,
    status: decision === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
    decidedBy: input.decidedBy,
    decidedAt: input.decidedAt,
    ...(input.authorityRef ? { authorityRef: input.authorityRef } : {}),
  };
}

export function confirmBusinessProcess(
  revision: BpmnProcessRevision,
  input: {
    canonicalProcessRevisionId: CanonicalId;
    confirmedBy: string;
    confirmedAt: string;
    authorityRef: string;
    rationale?: string;
  },
): { revision: BpmnProcessRevision; confirmation: BusinessProcessConfirmationRecord } {
  requireText(input.authorityRef, 'authorityRef');
  if (revision.state !== 'DRAFT') throw new TypeError('Only a DRAFT BPMN revision may be confirmed');
  if (revision.canonicalProcessRevisionId !== input.canonicalProcessRevisionId) {
    throw new TypeError('BPMN revision and canonical ProcessRevision must refer to the same business meaning');
  }

  const confirmedRevision: BpmnProcessRevision = { ...revision, state: 'CONFIRMED' };
  const confirmation: BusinessProcessConfirmationRecord = {
    id: createOpaqueId('review', digestDeterministicJson({
      kind: 'BusinessProcessConfirmationRecord',
      bpmnRevisionId: revision.id,
      bpmnXmlSha256: revision.bpmnXmlSha256,
      canonicalProcessRevisionId: input.canonicalProcessRevisionId,
      semanticDigest: revision.semanticDigest,
      authorityRef: input.authorityRef,
    })),
    bpmnRevisionId: revision.id,
    bpmnXmlSha256: revision.bpmnXmlSha256,
    canonicalProcessRevisionId: input.canonicalProcessRevisionId,
    semanticDigest: revision.semanticDigest,
    status: 'CONFIRMED',
    confirmedBy: input.confirmedBy,
    confirmedAt: input.confirmedAt,
    authorityRef: input.authorityRef,
    ...(input.rationale ? { rationale: input.rationale } : {}),
  };
  return { revision: confirmedRevision, confirmation };
}

export function revokeBusinessProcessConfirmation(
  confirmation: BusinessProcessConfirmationRecord,
  input: { revokedBy: string; revokedAt: string },
): BusinessProcessConfirmationRecord {
  return { ...confirmation, status: 'REVOKED', revokedBy: input.revokedBy, revokedAt: input.revokedAt };
}

/**
 * Hard precondition for entering automation design from the BPMN workspace.
 * This does not itself create a SemanticFreezeRecord or any downstream artifact.
 */
export function evaluateAutomationHandoffConfirmation(input: {
  currentBpmnRevision: BpmnProcessRevision;
  expectedCanonicalProcessRevisionId: CanonicalId;
  confirmation?: BusinessProcessConfirmationRecord;
}): AutomationHandoffConfirmationEvaluation {
  const { currentBpmnRevision, expectedCanonicalProcessRevisionId, confirmation } = input;
  if (!confirmation) return { result: 'REJECTED_MISSING_CONFIRMATION', authorized: false, diagnosticRefs: ['BPMN_CONFIRMATION_REQUIRED'] };
  if (confirmation.status === 'REVOKED') return { result: 'REJECTED_REVOKED_CONFIRMATION', authorized: false, diagnosticRefs: ['BPMN_CONFIRMATION_REVOKED'] };
  if (!confirmation.authorityRef) return { result: 'REJECTED_MISSING_AUTHORITY', authorized: false, diagnosticRefs: ['BPMN_CONFIRMATION_AUTHORITY_REQUIRED'] };
  if (currentBpmnRevision.state !== 'CONFIRMED') return { result: 'REJECTED_BPMN_NOT_CONFIRMED', authorized: false, diagnosticRefs: ['CURRENT_BPMN_REVISION_NOT_CONFIRMED'] };
  if (confirmation.bpmnRevisionId !== currentBpmnRevision.id) return { result: 'REJECTED_STALE_BPMN_REVISION', authorized: false, diagnosticRefs: ['CONFIRMATION_DOES_NOT_PIN_CURRENT_BPMN_REVISION'] };
  if (confirmation.bpmnXmlSha256 !== currentBpmnRevision.bpmnXmlSha256) return { result: 'REJECTED_XML_DIGEST_MISMATCH', authorized: false, diagnosticRefs: ['CONFIRMED_BPMN_XML_DIGEST_MISMATCH'] };
  if (confirmation.semanticDigest !== currentBpmnRevision.semanticDigest) return { result: 'REJECTED_SEMANTIC_DIGEST_MISMATCH', authorized: false, diagnosticRefs: ['CONFIRMED_BPMN_SEMANTIC_DIGEST_MISMATCH'] };
  if (confirmation.canonicalProcessRevisionId !== expectedCanonicalProcessRevisionId
      || currentBpmnRevision.canonicalProcessRevisionId !== expectedCanonicalProcessRevisionId) {
    return { result: 'REJECTED_PROCESS_REVISION_MISMATCH', authorized: false, diagnosticRefs: ['CONFIRMATION_DOES_NOT_PIN_EXPECTED_PROCESS_REVISION'] };
  }
  return { result: 'AUTHORIZED', authorized: true, diagnosticRefs: [] };
}
