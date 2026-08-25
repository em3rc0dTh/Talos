import type http from 'node:http';
import type { ImmutableDocumentRepository } from '../../../packages/foundation/src/repository.ts';
import {
  BpmnCanonicalReconciliationService,
  type BpmnCanonicalReconciliationResult,
} from '../../../packages/application/src/bpmn-canonical-import.ts';
import type { BpmnWorkspaceService } from '../../../packages/application/src/bpmn-workspace.ts';

type ReconciledBinding = Extract<BpmnCanonicalReconciliationResult, { status: 'RECONCILED' }>;

export interface OneAppReviewRouterDependencies {
  repo: ImmutableDocumentRepository;
  workspace: BpmnWorkspaceService;
  bindings: Map<string, ReconciledBinding>;
}

const MAX_REVIEW_JSON_BYTES = 20 * 1024 * 1024;

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
    if (total > MAX_REVIEW_JSON_BYTES) throw new TypeError('R1 process-review request exceeds the Talos One-App limit');
    chunks.push(buffer);
  }
  if (chunks.length === 0) return {};
  const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new TypeError('Expected a JSON object');
  return parsed as Record<string, unknown>;
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${field} must be a non-empty string`);
  return value;
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

function reviewAuthorityEnvelope() {
  return {
    automaticConfirmationAuthorized: false,
    automaticFreezeAuthorized: false,
    automaticAutomationDesignAuthorized: false,
    automaticDeploymentAuthorized: false,
    automaticExecutionAuthorized: false,
  } as const;
}

/**
 * R1-03 review/correction routes over the same One-App repository and binding map.
 *
 * The router does not own a parallel semantic engine. Semantic BPMN corrections
 * are appended by BpmnWorkspaceService and immediately re-enter the certified
 * source-aware structured BPMN reconciler. When a correction succeeds, the old
 * review head is retired from the active binding map so stale confirmation cannot
 * bypass the corrected revision.
 */
export function createOneAppReviewRouter(dependencies: OneAppReviewRouterDependencies) {
  const { repo, workspace, bindings } = dependencies;
  const structuredReconciler = new BpmnCanonicalReconciliationService(repo);
  const historyBindings = new Map<string, ReconciledBinding>();

  function retireActiveHead(revisionId: string, binding: ReconciledBinding): void {
    historyBindings.set(revisionId, binding);
    bindings.delete(revisionId);
  }

  function reviewPayload(revisionId: string, binding: ReconciledBinding, state: 'ACTIVE' | 'SUPERSEDED') {
    const revision = workspace.getRevision(revisionId)
      ?? (state === 'SUPERSEDED' ? binding.alignedBpmnRevision : undefined);
    if (!revision) throw new TypeError('one-app process review BPMN revision not found');
    const context = binding.review.context;
    return {
      status: state === 'ACTIVE' ? 'PROCESS_REVIEW_REQUIRED' : 'PROCESS_REVIEW_SUPERSEDED',
      state,
      revision,
      reconciliation: publicBinding(binding),
      review: {
        workspaceDefinitionId: context.workspaceDefinition.id,
        workspaceRevisionId: context.workspaceRevision.id,
        baselineBundleId: context.baselineBundle.id,
        semanticScopeRef: context.scopeBinding.semanticScopeRef,
        sourceRepresentationRefs: context.workspaceDefinition.sourceRepresentationRefs,
        explanationDraftId: binding.review.explanation.draft.id,
        questions: binding.validation.questions,
        findings: binding.validation.findings,
      },
      allowedReviewActions: state === 'ACTIVE'
        ? ['EDIT_BPMN', 'INSPECT_EVIDENCE', 'REQUEST_BUSINESS_CONFIRMATION']
        : ['INSPECT_EVIDENCE'],
      requiresBusinessProcessConfirmation: true,
      ...reviewAuthorityEnvelope(),
    };
  }

  return {
    async handle(req: http.IncomingMessage, res: http.ServerResponse, url: URL): Promise<boolean> {
      if (req.method === 'GET' && url.pathname === '/api/process-review') {
        const revisionId = text(url.searchParams.get('revisionId'), 'revisionId');
        const active = bindings.get(revisionId);
        if (active) {
          json(res, 200, reviewPayload(revisionId, active, 'ACTIVE'));
          return true;
        }
        const historical = historyBindings.get(revisionId);
        if (historical) {
          json(res, 200, reviewPayload(revisionId, historical, 'SUPERSEDED'));
          return true;
        }
        throw new TypeError('one-app process review context not found for this BPMN revision');
      }

      if (req.method === 'POST' && url.pathname === '/api/bpmn/edit') {
        const input = await jsonBody(req);
        const baseRevisionId = text(input.baseRevisionId, 'baseRevisionId');
        const baseBinding = bindings.get(baseRevisionId);
        if (!baseBinding) {
          if (historyBindings.has(baseRevisionId)) throw new TypeError('one-app process review base revision is stale');
          throw new TypeError('one-app process review context not found for this BPMN revision');
        }
        const baseRevision = workspace.getRevision(baseRevisionId);
        if (!baseRevision) throw new TypeError('one-app process review BPMN revision not found');
        if (baseRevision.state !== 'DRAFT') throw new TypeError('one-app process correction requires a DRAFT BPMN review revision');

        const editMode = text(input.editMode, 'editMode');
        if (editMode !== 'GRAPH_EDIT' && editMode !== 'XML_EDIT') {
          throw new TypeError('editMode must be GRAPH_EDIT or XML_EDIT');
        }
        const editedBy = typeof input.editedBy === 'string' && input.editedBy.trim()
          ? input.editedBy
          : 'one-app-product-user';
        const edited = await workspace.edit({
          baseRevisionId,
          editedBpmnXml: text(input.bpmnXml, 'bpmnXml'),
          editMode,
          editedBy,
        });

        if (edited.requiresCanonicalReconciliation) {
          const reconciled = await structuredReconciler.reconcile({
            bpmnRevisionId: edited.revision.id,
            reconciledBy: editedBy,
          });
          if (reconciled.status !== 'RECONCILED') {
            json(res, 200, {
              status: 'CORRECTION_BLOCKED',
              activeReviewRevisionId: baseRevisionId,
              attemptedRevision: edited.revision,
              changeClass: edited.changeClass,
              reconciliation: {
                status: reconciled.status,
                diagnostics: reconciled.diagnostics,
              },
              sourceTruthChanged: false,
              requiresBusinessProcessConfirmation: true,
              ...reviewAuthorityEnvelope(),
            });
            return true;
          }

          retireActiveHead(baseRevisionId, baseBinding);
          bindings.set(reconciled.alignedBpmnRevision.id, reconciled);
          json(res, 201, {
            status: 'CORRECTED_PROCESS_REVIEW_REQUIRED',
            previousRevisionId: baseRevisionId,
            revision: reconciled.alignedBpmnRevision,
            changeClass: edited.changeClass,
            reconciliation: publicBinding(reconciled),
            sourceTruthChanged: false,
            requiresBusinessProcessConfirmation: true,
            requiresProcessReconfirmation: true,
            ...reviewAuthorityEnvelope(),
          });
          return true;
        }

        const nextBinding: ReconciledBinding = {
          ...baseBinding,
          sourceBpmnRevision: edited.revision,
          alignedBpmnRevision: edited.revision,
        };
        retireActiveHead(baseRevisionId, baseBinding);
        bindings.set(edited.revision.id, nextBinding);
        json(res, 201, {
          status: edited.changeClass === 'VISUAL_ONLY'
            ? 'VISUAL_REVIEW_REVISION_CREATED'
            : 'REVIEW_REVISION_CREATED',
          previousRevisionId: baseRevisionId,
          ...edited,
          reconciliation: publicBinding(nextBinding),
          sourceTruthChanged: false,
          requiresBusinessProcessConfirmation: true,
          requiresProcessReconfirmation: false,
          ...reviewAuthorityEnvelope(),
        });
        return true;
      }

      return false;
    },
  };
}
