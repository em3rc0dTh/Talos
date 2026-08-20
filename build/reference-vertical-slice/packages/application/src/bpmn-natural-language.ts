import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import { createOpaqueId, type OpaqueId } from '../../foundation/src/ids.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import {
  buildBpmnXmlVisibleDiff,
  createBpmnCorrectionProviderRequest,
  createBpmnProcessRevision,
  decideNaturalLanguageBpmnCorrection,
  inspectBpmnXml,
  proposeNaturalLanguageBpmnCorrection,
  validateBpmnCorrectionProviderResponse,
  type BpmnCorrectionProvider,
  type BpmnProcessRevision,
  type BpmnXmlVisibleDiff,
  type NaturalLanguageBpmnCorrectionProposal,
} from '../../review/src/index.ts';

const NL_BPMN_SCHEMA = 'talos-natural-language-bpmn-correction-v0.1';

export type BpmnCorrectionAttemptStatus =
  | 'PROPOSED_FOR_REVIEW'
  | 'SAFE_STOP_PROVIDER_FAILURE'
  | 'SAFE_STOP_PROVIDER_NO_RESULT'
  | 'SAFE_STOP_INVALID_PROPOSAL'
  | 'SAFE_STOP_NO_SEMANTIC_CHANGE';

export interface BpmnCorrectionAttemptRecord {
  id: OpaqueId;
  requestId: string;
  baseBpmnRevisionId: string;
  instruction: string;
  requestedBy: string;
  requestedAt: string;
  completedAt: string;
  status: BpmnCorrectionAttemptStatus;
  providerId?: string;
  modelId?: string;
  modelVersion?: string;
  pipelineVersion?: string;
  proposedBpmnRevisionId?: string;
  proposalId?: string;
  diagnostic?: string;
  automaticApplyAuthorized: false;
}

export interface NaturalLanguageBpmnCorrectionDecisionRecord {
  id: OpaqueId;
  proposalId: string;
  baseBpmnRevisionId: string;
  proposedBpmnRevisionId: string;
  decision: 'ACCEPTED' | 'REJECTED';
  decidedBy: string;
  decidedAt: string;
  authorityRef?: string;
  automaticCanonicalAlignmentAuthorized: false;
  automaticConfirmationAuthorized: false;
  automaticExecutionAuthorized: false;
}

export type NaturalLanguageBpmnProposalResult =
  | {
      status: 'PROPOSED_FOR_REVIEW';
      attempt: BpmnCorrectionAttemptRecord;
      proposal: NaturalLanguageBpmnCorrectionProposal;
      proposedRevision: BpmnProcessRevision;
      diff: BpmnXmlVisibleDiff;
    }
  | {
      status: Exclude<BpmnCorrectionAttemptStatus, 'PROPOSED_FOR_REVIEW'>;
      attempt: BpmnCorrectionAttemptRecord;
    };

function append<T>(repo: ImmutableDocumentRepository, input: {
  id: OpaqueId;
  aggregateKind: string;
  payload: T;
  createdAt: string;
  parentId?: OpaqueId;
}): void {
  repo.append({
    id: input.id,
    aggregateKind: input.aggregateKind,
    schemaVersion: NL_BPMN_SCHEMA,
    payload: input.payload,
    ...(input.parentId ? { parentId: input.parentId } : {}),
    createdAt: input.createdAt,
  });
}

function attemptId(input: {
  requestId: string;
  requestedAt: string;
  requestedBy: string;
}): OpaqueId {
  return createOpaqueId('review', digestDeterministicJson({ kind: 'BpmnCorrectionAttemptRecord', ...input }));
}

export class NaturalLanguageBpmnCorrectionService {
  readonly #repo: ImmutableDocumentRepository;
  readonly #provider: BpmnCorrectionProvider;
  readonly #now: () => string;

  constructor(repo: ImmutableDocumentRepository, provider: BpmnCorrectionProvider, now: () => string = () => new Date().toISOString()) {
    this.#repo = repo;
    this.#provider = provider;
    this.#now = now;
  }

  #getRevision(id: string): BpmnProcessRevision | undefined {
    return this.#repo.get<BpmnProcessRevision>(id as OpaqueId)?.payload;
  }

  #nextRevisionNumber(): number {
    const revisions = this.#repo.listByKind<BpmnProcessRevision>('BpmnProcessRevision');
    return revisions.reduce((highest, document) => Math.max(highest, document.payload.revisionNumber), 0) + 1;
  }

  #persistAttempt(record: BpmnCorrectionAttemptRecord): void {
    append(this.#repo, {
      id: record.id,
      aggregateKind: 'BpmnCorrectionAttemptRecord',
      payload: record,
      createdAt: record.completedAt,
      parentId: record.baseBpmnRevisionId as OpaqueId,
    });
  }

  #safeStop(input: {
    requestId: string;
    baseRevision: BpmnProcessRevision;
    instruction: string;
    requestedBy: string;
    requestedAt: string;
    status: Exclude<BpmnCorrectionAttemptStatus, 'PROPOSED_FOR_REVIEW'>;
    diagnostic?: string;
    provider?: { providerId: string; modelId: string; modelVersion: string; pipelineVersion: string };
  }): NaturalLanguageBpmnProposalResult {
    const completedAt = this.#now();
    const attempt: BpmnCorrectionAttemptRecord = {
      id: attemptId({ requestId: input.requestId, requestedAt: input.requestedAt, requestedBy: input.requestedBy }),
      requestId: input.requestId,
      baseBpmnRevisionId: input.baseRevision.id,
      instruction: input.instruction,
      requestedBy: input.requestedBy,
      requestedAt: input.requestedAt,
      completedAt,
      status: input.status,
      ...(input.provider ?? {}),
      ...(input.diagnostic ? { diagnostic: input.diagnostic } : {}),
      automaticApplyAuthorized: false,
    };
    this.#persistAttempt(attempt);
    return { status: input.status, attempt };
  }

  async propose(input: {
    baseBpmnRevisionId: string;
    instruction: string;
    requestedBy: string;
    requestedAt?: string;
  }): Promise<NaturalLanguageBpmnProposalResult> {
    const baseRevision = this.#getRevision(input.baseBpmnRevisionId);
    if (!baseRevision) throw new TypeError('Natural-language correction base BPMN revision not found');
    if (baseRevision.state !== 'DRAFT') throw new TypeError('Natural-language correction requires a DRAFT BPMN revision');
    const requestedAt = input.requestedAt ?? this.#now();
    const request = createBpmnCorrectionProviderRequest({
      baseBpmnRevisionId: baseRevision.id,
      baseBpmnXml: baseRevision.bpmnXml,
      baseBpmnXmlSha256: baseRevision.bpmnXmlSha256,
      baseSemanticDigest: baseRevision.semanticDigest,
      instruction: input.instruction,
    });

    let response;
    try {
      response = validateBpmnCorrectionProviderResponse(await this.#provider.propose(request), request);
    } catch (error) {
      return this.#safeStop({
        requestId: request.requestId,
        baseRevision,
        instruction: request.instruction,
        requestedBy: input.requestedBy,
        requestedAt,
        status: 'SAFE_STOP_PROVIDER_FAILURE',
        diagnostic: error instanceof Error ? error.message : String(error),
      });
    }

    const provider = {
      providerId: response.providerId,
      modelId: response.modelId,
      modelVersion: response.modelVersion,
      pipelineVersion: response.pipelineVersion,
    };
    if (response.status === 'NO_RESULT') {
      return this.#safeStop({
        requestId: request.requestId,
        baseRevision,
        instruction: request.instruction,
        requestedBy: input.requestedBy,
        requestedAt,
        status: 'SAFE_STOP_PROVIDER_NO_RESULT',
        diagnostic: response.reason,
        provider,
      });
    }

    let inspection;
    try {
      inspection = await inspectBpmnXml(response.proposedBpmnXml);
    } catch (error) {
      return this.#safeStop({
        requestId: request.requestId,
        baseRevision,
        instruction: request.instruction,
        requestedBy: input.requestedBy,
        requestedAt,
        status: 'SAFE_STOP_INVALID_PROPOSAL',
        diagnostic: error instanceof Error ? error.message : String(error),
        provider,
      });
    }

    if (inspection.modelSemanticDigest === baseRevision.semanticDigest) {
      return this.#safeStop({
        requestId: request.requestId,
        baseRevision,
        instruction: request.instruction,
        requestedBy: input.requestedBy,
        requestedAt,
        status: 'SAFE_STOP_NO_SEMANTIC_CHANGE',
        diagnostic: 'Provider proposal does not change BPMN business semantics',
        provider,
      });
    }

    const completedAt = this.#now();
    const proposedRevision = createBpmnProcessRevision({
      revisionNumber: this.#nextRevisionNumber(),
      parentBpmnRevisionId: baseRevision.id,
      sourceRoute: baseRevision.sourceRoute,
      editMode: 'NATURAL_LANGUAGE_PATCH',
      sourceArtifactRefs: baseRevision.sourceArtifactRefs,
      sourceRepresentationRefs: baseRevision.sourceRepresentationRefs,
      canonicalAlignmentStatus: 'REQUIRES_CANONICAL_RECONCILIATION',
      bpmnXml: response.proposedBpmnXml,
      semanticDigest: inspection.modelSemanticDigest,
      diagramDigest: inspection.modelDiagramDigest,
      createdAt: completedAt,
      createdBy: `model-provider:${response.providerId}/${response.modelId}`,
    });
    const proposal = proposeNaturalLanguageBpmnCorrection({
      baseRevision,
      proposedRevision,
      instruction: request.instruction,
      requestedBy: input.requestedBy,
      proposedAt: completedAt,
    });
    const diff = buildBpmnXmlVisibleDiff(baseRevision.bpmnXml, proposedRevision.bpmnXml);
    const attempt: BpmnCorrectionAttemptRecord = {
      id: attemptId({ requestId: request.requestId, requestedAt, requestedBy: input.requestedBy }),
      requestId: request.requestId,
      baseBpmnRevisionId: baseRevision.id,
      instruction: request.instruction,
      requestedBy: input.requestedBy,
      requestedAt,
      completedAt,
      status: 'PROPOSED_FOR_REVIEW',
      ...provider,
      proposedBpmnRevisionId: proposedRevision.id,
      proposalId: proposal.id,
      automaticApplyAuthorized: false,
    };

    append(this.#repo, {
      id: proposedRevision.id as OpaqueId,
      aggregateKind: 'BpmnProcessRevision',
      payload: proposedRevision,
      createdAt: proposedRevision.createdAt,
      parentId: baseRevision.id as OpaqueId,
    });
    append(this.#repo, {
      id: proposal.id as OpaqueId,
      aggregateKind: 'NaturalLanguageBpmnCorrectionProposal',
      payload: proposal,
      createdAt: proposal.proposedAt,
      parentId: baseRevision.id as OpaqueId,
    });
    this.#persistAttempt(attempt);
    return { status: 'PROPOSED_FOR_REVIEW', attempt, proposal, proposedRevision, diff };
  }

  getProposal(proposalId: string): NaturalLanguageBpmnCorrectionProposal | undefined {
    return this.#repo.get<NaturalLanguageBpmnCorrectionProposal>(proposalId as OpaqueId)?.payload;
  }

  getDecision(proposalId: string): NaturalLanguageBpmnCorrectionDecisionRecord | undefined {
    const decisions = this.#repo.listByKind<NaturalLanguageBpmnCorrectionDecisionRecord>('NaturalLanguageBpmnCorrectionDecisionRecord');
    return decisions.find((document) => document.payload.proposalId === proposalId)?.payload;
  }

  decide(input: {
    proposalId: string;
    decision: 'ACCEPT' | 'REJECT';
    decidedBy: string;
    decidedAt?: string;
    authorityRef?: string;
  }): {
    proposal: NaturalLanguageBpmnCorrectionProposal;
    decision: NaturalLanguageBpmnCorrectionDecisionRecord;
    acceptedRevision?: BpmnProcessRevision;
  } {
    const proposal = this.getProposal(input.proposalId);
    if (!proposal) throw new TypeError('Natural-language BPMN proposal not found');
    if (this.getDecision(input.proposalId)) throw new TypeError('Natural-language BPMN proposal already has a decision');
    const decidedAt = input.decidedAt ?? this.#now();
    const effective = decideNaturalLanguageBpmnCorrection(proposal, input.decision, {
      decidedBy: input.decidedBy,
      decidedAt,
      ...(input.authorityRef ? { authorityRef: input.authorityRef } : {}),
    });
    const decision: NaturalLanguageBpmnCorrectionDecisionRecord = {
      id: createOpaqueId('review', digestDeterministicJson({
        kind: 'NaturalLanguageBpmnCorrectionDecisionRecord',
        proposalId: proposal.id,
        decision: effective.status,
        decidedBy: input.decidedBy,
        decidedAt,
      })),
      proposalId: proposal.id,
      baseBpmnRevisionId: proposal.baseBpmnRevisionId,
      proposedBpmnRevisionId: proposal.proposedBpmnRevisionId,
      decision: effective.status === 'ACCEPTED' ? 'ACCEPTED' : 'REJECTED',
      decidedBy: input.decidedBy,
      decidedAt,
      ...(input.authorityRef ? { authorityRef: input.authorityRef } : {}),
      automaticCanonicalAlignmentAuthorized: false,
      automaticConfirmationAuthorized: false,
      automaticExecutionAuthorized: false,
    };
    append(this.#repo, {
      id: decision.id,
      aggregateKind: 'NaturalLanguageBpmnCorrectionDecisionRecord',
      payload: decision,
      createdAt: decision.decidedAt,
      parentId: proposal.id as OpaqueId,
    });

    const acceptedRevision = decision.decision === 'ACCEPTED'
      ? this.#getRevision(proposal.proposedBpmnRevisionId)
      : undefined;
    return {
      proposal: effective,
      decision,
      ...(acceptedRevision ? { acceptedRevision } : {}),
    };
  }
}
