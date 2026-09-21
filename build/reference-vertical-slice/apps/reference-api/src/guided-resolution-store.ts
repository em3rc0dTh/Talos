import { digestDeterministicJson } from '../../../packages/foundation/src/digest.ts';
import { createOpaqueId, type OpaqueId } from '../../../packages/foundation/src/ids.ts';
import type { ImmutableDocumentRepository } from '../../../packages/foundation/src/repository.ts';
import type {
  BpmnCanonicalReconciliationResult,
  GuidedResolutionAnswer,
  GuidedResolutionProposal,
} from '../../../packages/application/src/index.ts';

type ReconciledBinding = Extract<BpmnCanonicalReconciliationResult, { status: 'RECONCILED' }>;

const PROPOSAL_KIND = 'GuidedSemanticResolutionProposal';
const DECISION_KIND = 'GuidedSemanticResolutionDecisionReceipt';
const PROPOSAL_SCHEMA = 'talos.r1-11d.guided-resolution-proposal.v1';
const DECISION_SCHEMA = 'talos.r1-11d.guided-resolution-decision.v1';

export interface DurableGuidedResolutionProposal {
  proposal: GuidedResolutionProposal;
  fingerprint: string;
  revisionId: string;
  validationAssessmentId: string;
  bindingSnapshot: ReconciledBinding;
  createdAt: string;
}

export interface DurableGuidedResolutionDecision {
  proposalId: string;
  decision: 'ACCEPT' | 'REJECT';
  response: Record<string, unknown>;
  bindingSnapshot: ReconciledBinding;
  createdAt: string;
}

export function guidedResolutionFingerprint(input: {
  revisionId: string;
  validationAssessmentId: string;
  answers: GuidedResolutionAnswer[];
}): string {
  return digestDeterministicJson({
    revisionId: input.revisionId,
    validationAssessmentId: input.validationAssessmentId,
    answers: input.answers,
  });
}

export class DurableGuidedResolutionStore {
  readonly #repo: ImmutableDocumentRepository;

  constructor(repo: ImmutableDocumentRepository) {
    this.#repo = repo;
  }

  findProposalByFingerprint(fingerprint: string): DurableGuidedResolutionProposal | undefined {
    const items = this.#repo.listByKind<DurableGuidedResolutionProposal>(PROPOSAL_KIND);
    for (let index = items.length - 1; index >= 0; index -= 1) {
      const item = items[index]!.payload;
      if (item.fingerprint === fingerprint) return item;
    }
    return undefined;
  }

  getProposal(proposalId: string): DurableGuidedResolutionProposal | undefined {
    const document = this.#repo.get<DurableGuidedResolutionProposal>(proposalId as OpaqueId);
    return document?.aggregateKind === PROPOSAL_KIND ? document.payload : undefined;
  }

  saveProposal(input: DurableGuidedResolutionProposal): void {
    this.#repo.append({
      id: input.proposal.id as OpaqueId,
      aggregateKind: PROPOSAL_KIND,
      schemaVersion: PROPOSAL_SCHEMA,
      payload: input,
      parentId: input.bindingSnapshot.processRevision.id as OpaqueId,
      createdAt: input.createdAt,
    });
  }

  decisionId(proposalId: string, decision: 'ACCEPT' | 'REJECT'): OpaqueId {
    return createOpaqueId('review', `r1-11d:guided-resolution-decision:${proposalId}:${decision}`);
  }

  getDecision(proposalId: string, decision: 'ACCEPT' | 'REJECT'): DurableGuidedResolutionDecision | undefined {
    const document = this.#repo.get<DurableGuidedResolutionDecision>(this.decisionId(proposalId, decision));
    return document?.aggregateKind === DECISION_KIND ? document.payload : undefined;
  }

  recoverBindings(): ReconciledBinding[] {
    const byRevision = new Map<string, ReconciledBinding>();
    for (const document of this.#repo.listByKind<DurableGuidedResolutionProposal>(PROPOSAL_KIND)) {
      const binding = document.payload.bindingSnapshot;
      byRevision.set(binding.alignedBpmnRevision.id, binding);
    }
    for (const document of this.#repo.listByKind<DurableGuidedResolutionDecision>(DECISION_KIND)) {
      const binding = document.payload.bindingSnapshot;
      byRevision.set(binding.alignedBpmnRevision.id, binding);
    }
    return [...byRevision.values()];
  }

  saveDecision(input: DurableGuidedResolutionDecision): void {
    this.#repo.append({
      id: this.decisionId(input.proposalId, input.decision),
      aggregateKind: DECISION_KIND,
      schemaVersion: DECISION_SCHEMA,
      payload: input,
      parentId: input.proposalId as OpaqueId,
      createdAt: input.createdAt,
    });
  }
}
