import type http from 'node:http';
import {
  decideGuidedSemanticResolution,
  GUIDED_SEMANTIC_RESOLUTION_VERSION,
  initializeReview,
  proposeGuidedSemanticResolution,
  type BpmnCanonicalReconciliationResult,
  type BpmnWorkspaceService,
  type GuidedResolutionAnswer,
  type GuidedResolutionProposal,
} from '../../../packages/application/src/index.ts';
import type { ImmutableDocumentRepository } from '../../../packages/foundation/src/repository.ts';
import type { OpaqueId } from '../../../packages/foundation/src/ids.ts';

type ReconciledBinding = Extract<BpmnCanonicalReconciliationResult, { status: 'RECONCILED' }>;

export interface OneAppSemanticResolutionDependencies {
  repo: ImmutableDocumentRepository;
  workspace: BpmnWorkspaceService;
  bindings: Map<string, ReconciledBinding>;
}

export interface OneAppFreezeBlocker {
  findingRef: string;
  code: string;
  targetRef: string;
  title: string;
  question: string;
  targetLabel?: string;
}

const MAX_JSON_BYTES = 20 * 1024 * 1024;
const GUIDED_CODES = new Set(['SV-CFL-001', 'SV-SUB-002', 'SV-EVT-001', 'SV-EVT-002', 'SV-EVT-003', 'SV-SRC-001']);

function json(res: http.ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

async function jsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.byteLength;
    if (total > MAX_JSON_BYTES) throw new TypeError('R1-11C request exceeds the Talos One-App limit');
    chunks.push(buffer);
  }
  if (!chunks.length) return {};
  const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new TypeError('Expected a JSON object');
  return parsed as Record<string, unknown>;
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${field} must be a non-empty string`);
  return value.trim();
}

function publicBinding(binding: ReconciledBinding): unknown {
  return {
    status: binding.status,
    processDefinition: binding.processDefinition,
    processRevision: binding.processRevision,
    validation: binding.validation,
    diagnostics: binding.diagnostics,
  };
}

function targetLabel(binding: ReconciledBinding, targetRef: string): string | undefined {
  const node = binding.processRevision.nodes.find((candidate) => candidate.id === targetRef);
  if (node) return node.name ?? node.kind;
  const edge = binding.processRevision.edges.find((candidate) => candidate.id === targetRef);
  if (!edge) return undefined;
  const source = binding.processRevision.nodes.find((candidate) => candidate.id === edge.sourceNodeId);
  const target = binding.processRevision.nodes.find((candidate) => candidate.id === edge.targetNodeId);
  return `${source?.name ?? 'Previous step'} → ${target?.name ?? 'Next step'}`;
}

function friendlyBlocker(code: string, label?: string): { title: string; question: string } {
  const target = label ? ` “${label}”` : '';
  switch (code) {
    case 'SV-CFL-001':
      return { title: 'Choose when this path is used', question: `When should this path${target} be followed?` };
    case 'SV-SUB-002':
      return { title: 'Complete this subprocess', question: `How should${target} behave, and when is it finished?` };
    case 'SV-EVT-003':
      return { title: 'Tell us what this step waits for', question: `What are we waiting for at${target || ' this step'}?` };
    case 'SV-EVT-002':
      return { title: 'Complete the wait timing', question: `What exact duration or time applies to${target || ' this wait'}?` };
    case 'SV-EVT-001':
      return { title: 'Tell us what continues the process', question: `What exactly lets${target || ' this wait'} continue?` };
    case 'SV-SRC-001':
      return { title: 'Confirm Talos’s interpretation', question: `Talos inferred the business meaning of${target || ' this item'}. Is that interpretation correct?` };
    default:
      return { title: 'One detail still needs confirmation', question: `Please confirm the missing business detail${target}.` };
  }
}

export function projectOneAppFreezeBlockers(binding: ReconciledBinding): OneAppFreezeBlocker[] {
  const questionByFinding = new Map<string, (typeof binding.validation.questions)[number]>();
  for (const question of binding.validation.questions) {
    for (const ref of question.findingRefs) questionByFinding.set(ref, question);
  }
  return binding.validation.findings
    .filter((finding) => finding.blockerClass !== 'NONE')
    .map((finding) => {
      const question = questionByFinding.get(finding.id);
      const primaryTarget = question?.targetRef ?? finding.targetRefs[0] ?? binding.processRevision.id;
      const label = targetLabel(binding, primaryTarget);
      const friendly = friendlyBlocker(finding.code, label);
      return {
        findingRef: finding.id,
        code: finding.code,
        targetRef: primaryTarget,
        title: friendly.title,
        question: friendly.question,
        ...(label ? { targetLabel: label } : {}),
      };
    });
}

export function createOneAppSemanticResolutionRouter(dependencies: OneAppSemanticResolutionDependencies) {
  const { repo, workspace, bindings } = dependencies;
  const proposals = new Map<string, GuidedResolutionProposal>();

  return {
    async handle(req: http.IncomingMessage, res: http.ServerResponse, url: URL): Promise<boolean> {
      if (req.method === 'POST' && url.pathname === '/api/semantic-resolution/propose') {
        const input = await jsonBody(req);
        const revisionId = text(input.revisionId, 'revisionId');
        const binding = bindings.get(revisionId);
        if (!binding) throw new TypeError('one-app guided resolution requires the active process review revision');
        if (!Array.isArray(input.answers)) throw new TypeError('answers must be an array');
        const proposal = proposeGuidedSemanticResolution({
          processRevision: binding.processRevision,
          validation: binding.validation,
          answers: input.answers as GuidedResolutionAnswer[],
          authority: {
            answeredBy: typeof input.answeredBy === 'string' && input.answeredBy.trim() ? input.answeredBy : 'one-app-product-user',
            authorityRef: text(input.authorityRef, 'authorityRef'),
            rationale: text(input.rationale, 'rationale'),
            answeredAt: new Date().toISOString(),
          },
        });
        proposals.set(proposal.id, proposal);
        json(res, 201, {
          proposal,
          blockers: projectOneAppFreezeBlockers(binding).filter((blocker) => GUIDED_CODES.has(blocker.code)),
          createsCanonicalRevision: false,
          confirmsProcess: false,
          authorizesAutomationDesign: false,
          authorizesExecution: false,
        });
        return true;
      }

      if (req.method === 'POST' && url.pathname === '/api/semantic-resolution/decide') {
        const input = await jsonBody(req);
        const revisionId = text(input.revisionId, 'revisionId');
        const proposalId = text(input.proposalId, 'proposalId');
        const binding = bindings.get(revisionId);
        if (!binding) throw new TypeError('one-app guided resolution requires the active process review revision');
        const proposal = proposals.get(proposalId);
        if (!proposal) throw new TypeError('one-app guided semantic-resolution proposal not found');
        const decision = text(input.decision, 'decision');
        if (decision !== 'ACCEPT' && decision !== 'REJECT') throw new TypeError('decision must be ACCEPT or REJECT');
        const decidedBy = typeof input.decidedBy === 'string' && input.decidedBy.trim() ? input.decidedBy : 'one-app-product-user';
        const authorityRef = text(input.authorityRef, 'authorityRef');
        const decidedAt = new Date().toISOString();
        const result = decideGuidedSemanticResolution({
          proposal,
          processRevision: binding.processRevision,
          validation: binding.validation,
          decision,
          decidedBy,
          authorityRef,
          rationale: text(input.rationale, 'rationale'),
          decidedAt,
        });
        proposals.delete(proposalId);

        if (result.decision === 'REJECT') {
          json(res, 200, {
            decision: result,
            createsCanonicalRevision: false,
            currentRevisionId: revisionId,
            requiresProcessReconfirmation: false,
            authorizesAutomationDesign: false,
            authorizesExecution: false,
          });
          return true;
        }

        repo.append({
          id: result.resolvedRevision.id as OpaqueId,
          aggregateKind: 'ProcessRevision',
          schemaVersion: GUIDED_SEMANTIC_RESOLUTION_VERSION,
          payload: result.resolvedRevision,
          parentId: binding.processRevision.id as OpaqueId,
          createdAt: result.resolvedRevision.createdAt,
        });
        repo.append({
          id: result.validation.assessment.id as OpaqueId,
          aggregateKind: 'ValidationAssessment',
          schemaVersion: GUIDED_SEMANTIC_RESOLUTION_VERSION,
          payload: result.validation.assessment,
          parentId: result.resolvedRevision.id as OpaqueId,
          createdAt: result.validation.assessment.assessedAt,
        });

        const alignedRevision = workspace.realignToCanonical({
          revisionId,
          canonicalProcessRevisionId: result.resolvedRevision.id,
          alignedBy: decidedBy,
          authorityRef,
          alignedAt: decidedAt,
        });
        const review = initializeReview(repo, result.resolvedRevision, result.validation, { createdBy: decidedBy });
        const resolvedBinding: ReconciledBinding = {
          ...binding,
          sourceBpmnRevision: binding.alignedBpmnRevision,
          alignedBpmnRevision: alignedRevision,
          processRevision: result.resolvedRevision,
          validation: result.validation,
          review,
        };

        bindings.delete(revisionId);
        bindings.set(alignedRevision.id, resolvedBinding);

        json(res, 201, {
          decision: result,
          revision: alignedRevision,
          reconciliation: publicBinding(resolvedBinding),
          freezeBlockers: projectOneAppFreezeBlockers(resolvedBinding),
          requiresProcessReconfirmation: true,
          confirmation: null,
          authorizesAutomationDesign: false,
          authorizesExecution: false,
        });
        return true;
      }

      return false;
    },
  };
}
