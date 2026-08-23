import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  BpmnWorkspaceService,
  NativeBpmnCanonicalReconciliationService,
  applyConfirmedBpmnFreezeHandoff,
  approveOneAppAutomation,
  decideOneAppAutomationSuggestion,
  mapOneAppApprovedTemporalDesign,
  openOneAppAutomationDesign,
  reviewOneAppExecutionPlan,
  selectOneAppAutomationCapabilities,
  type NativeBpmnCanonicalReconciliationResult,
  type OneAppAutomationContext,
} from '../../../packages/application/src/index.ts';
import { createOpaqueId, type OpaqueId } from '../../../packages/foundation/src/ids.ts';
import { LocalImageByteStore } from '../../../packages/image-perception/src/byte-store.ts';
import { SqliteDocumentStore } from '../../../packages/persistence-sqlite/src/sqlite-document-store.ts';

export interface TalosOneAppOptions {
  port?: number;
  host?: string;
  runtimeDir?: string;
}

type Reconciled = Extract<NativeBpmnCanonicalReconciliationResult, { status: 'RECONCILED' }>;

interface OneAppSession {
  revisionId: string;
  binding: Reconciled;
  automation: OneAppAutomationContext;
}

const MAX_JSON_BYTES = 10 * 1024 * 1024;

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
    if (total > MAX_JSON_BYTES) throw new TypeError('Request payload exceeds the Talos one-app limit');
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

function array(value: unknown, field: string): any[] {
  if (!Array.isArray(value)) throw new TypeError(`${field} must be an array`);
  return value;
}

function publicReconciliation(result: NativeBpmnCanonicalReconciliationResult): unknown {
  if (result.status === 'BLOCKED') return { status: result.status, diagnostics: result.diagnostics };
  return {
    status: result.status,
    processDefinition: result.processDefinition,
    processRevision: result.processRevision,
    validation: result.validation,
    diagnostics: result.diagnostics,
  };
}

export async function startTalosOneApp(options: TalosOneAppOptions = {}) {
  const host = options.host ?? '127.0.0.1';
  const runtimeDir = options.runtimeDir ?? mkdtempSync(path.join(os.tmpdir(), 'talos-one-app-'));
  const ownsDir = !options.runtimeDir;
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-one-app.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const workspace = new BpmnWorkspaceService(repo, byteStore);
  const reconciler = new NativeBpmnCanonicalReconciliationService(repo);
  const bindings = new Map<string, Reconciled>();
  const automationSessions = new Map<string, OneAppSession>();
  const reviewSessions = new Map<string, OneAppSession>();
  const approvalSessions = new Map<string, OneAppSession>();

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? host}`);

      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/api/status')) {
        json(res, 200, {
          status: 'READY',
          releaseGate: 'I9-01_ONE_APP_NATIVE_BPMN_E2E',
          inputRoutes: ['NATIVE_BPMN'],
          imageInputIntegratedIntoOneApp: false,
          authorityChain: [
            'PROCESS_CONFIRMATION',
            'AUTOMATION_DESIGN_FREEZE',
            'AUTOMATION_DESIGN_WORKSPACE',
            'EXPLICIT_CAPABILITY_SELECTION',
            'EXECUTION_PLAN_REVIEW',
            'EXPLICIT_AUTOMATION_APPROVAL',
            'APPROVED_TEMPORAL_MAPPING',
          ],
          automaticCapabilityBindingAuthorized: false,
          automaticTemporalDesignAuthorized: false,
          deploymentAuthorized: false,
          executionAuthorized: false,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/input/bpmn') {
        const input = await jsonBody(req);
        const initiatedBy = typeof input.initiatedBy === 'string' ? input.initiatedBy : 'one-app-user';
        const imported = await workspace.importNativeBpmn({
          bpmnXml: text(input.bpmnXml, 'bpmnXml'),
          declaredName: typeof input.fileName === 'string' ? input.fileName : 'uploaded-process.bpmn',
          initiatedBy,
        });
        const reconciliation = await reconciler.reconcile({
          bpmnRevisionId: imported.revision.id,
          reconciledBy: initiatedBy,
        });
        if (reconciliation.status === 'RECONCILED') {
          bindings.set(reconciliation.alignedBpmnRevision.id, reconciliation);
        }
        json(res, reconciliation.status === 'RECONCILED' ? 201 : 200, {
          ...imported,
          revision: reconciliation.status === 'RECONCILED' ? reconciliation.alignedBpmnRevision : imported.revision,
          reconciliation: publicReconciliation(reconciliation),
          automaticConfirmationAuthorized: false,
          automaticAutomationDesignAuthorized: false,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/bpmn/confirm') {
        const input = await jsonBody(req);
        const revisionId = text(input.revisionId, 'revisionId');
        const binding = bindings.get(revisionId);
        if (!binding) throw new TypeError('one-app canonical reconciliation context not found for this BPMN revision');
        const canonicalProcessRevisionId = text(input.canonicalProcessRevisionId, 'canonicalProcessRevisionId');
        if (canonicalProcessRevisionId !== binding.processRevision.id) {
          throw new TypeError('one-app confirmation must pin the exact reconciled ProcessRevision');
        }
        const result = workspace.confirm({
          revisionId,
          canonicalProcessRevisionId: binding.processRevision.id,
          confirmedBy: typeof input.confirmedBy === 'string' ? input.confirmedBy : 'one-app-user',
          authorityRef: text(input.authorityRef, 'authorityRef'),
          ...(typeof input.rationale === 'string' && input.rationale.trim() ? { rationale: input.rationale } : {}),
        });
        json(res, 201, {
          ...result,
          automaticAutomationDesignAuthorized: false,
          automaticExecutionAuthorized: false,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/bpmn/automation-design-approval') {
        const input = await jsonBody(req);
        const revisionId = text(input.revisionId, 'revisionId');
        const confirmationId = text(input.confirmationId, 'confirmationId');
        const approvedBy = typeof input.approvedBy === 'string' ? input.approvedBy : 'one-app-user';
        const authorityRef = text(input.authorityRef, 'authorityRef');
        const currentRevision = workspace.getRevision(revisionId);
        if (!currentRevision) throw new TypeError('one-app BPMN workspace revision not found');
        const binding = bindings.get(revisionId);
        if (!binding) throw new TypeError('one-app canonical reconciliation context not found for this BPMN revision');
        const confirmationDocument = repo.get(confirmationId as OpaqueId);
        if (!confirmationDocument || confirmationDocument.aggregateKind !== 'BusinessProcessConfirmationRecord') {
          throw new TypeError('one-app business-process confirmation record not found');
        }
        const at = new Date().toISOString();
        const reviewContext = binding.review.context;
        const assessment = binding.validation.assessment;
        const semanticScopeRef = reviewContext.scopeBinding.semanticScopeRef;
        const commandId = createOpaqueId('review', `i9-01:automation-design:${revisionId}:${confirmationId}:${approvedBy}:${at}`);
        const payloadId = createOpaqueId('review', `i9-01:freeze-payload:${commandId}`);
        const requestId = createOpaqueId('review', `i9-01:freeze-scope:${commandId}:${semanticScopeRef}`);
        const result = applyConfirmedBpmnFreezeHandoff(repo, {
          currentBpmnRevision: currentRevision,
          confirmation: confirmationDocument.payload as any,
          canonicalProcessRevision: binding.processRevision,
          reviewContext,
          freezeCommand: {
            id: commandId,
            reviewWorkspaceDefinitionId: reviewContext.workspaceDefinition.id,
            expectedReviewWorkspaceRevisionId: reviewContext.workspaceRevision.id,
            expectedReviewBaselineBundleId: reviewContext.baselineBundle.id,
            primarySemanticScopeRef: semanticScopeRef,
            targetSemanticScopeRefs: [semanticScopeRef],
            actionKind: 'REQUEST_FREEZE',
            targetSubjectRefs: [],
            actionPayloadRef: payloadId,
            rationale: 'Approve the exact confirmed business process for automation design only.',
            authorityRef,
            requestedBy: approvedBy,
            requestedAt: at,
          },
          freezePayload: {
            id: payloadId,
            reviewCommandId: commandId,
            freezeKind: 'AUTOMATION_DESIGN_HANDOFF',
            scopeRequestRefs: [requestId],
            requestedAt: at,
          },
          scopeRequests: [{
            id: requestId,
            freezeRequestPayloadId: payloadId,
            semanticScopeRef,
            requestedDisposition: 'ACCEPTED',
            referencedValidationAssessmentRefs: [assessment.id],
          }],
          assessments: [assessment],
          evaluatedAt: at,
        });

        if (result.handoff.result !== 'FROZEN' || !result.freezeRecord || !result.freeze?.scopeRecords?.[0]) {
          json(res, 200, {
            ...result,
            automationDesignOpened: false,
            deploymentAuthorized: false,
            executionAuthorized: false,
          });
          return;
        }

        const automation = openOneAppAutomationDesign(repo, {
          process: binding.processRevision,
          scope: binding.validation.scope,
          assessment,
          freeze: result.freezeRecord,
          scopeFreeze: result.freeze.scopeRecords[0],
          createdAt: at,
        });
        const session: OneAppSession = { revisionId, binding, automation };
        automationSessions.set(automation.workspace.workspace.id, session);

        json(res, 201, {
          ...result,
          automationDesignOpened: true,
          automationDesign: automation.workspace,
          capabilitySelectionCreated: false,
          deploymentAuthorized: false,
          executionAuthorized: false,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/automation/suggestion/decide') {
        const input = await jsonBody(req);
        const workspaceId = text(input.workspaceId, 'workspaceId');
        const session = automationSessions.get(workspaceId);
        if (!session) throw new TypeError('one-app Automation Design Workspace not found');
        const decision = text(input.decision, 'decision');
        if (!['ACCEPT', 'REPLACE', 'REJECT', 'DEFER'].includes(decision)) {
          throw new TypeError('decision must be ACCEPT, REPLACE, REJECT or DEFER');
        }
        session.automation = decideOneAppAutomationSuggestion(session.automation, {
          suggestionRef: text(input.suggestionRef, 'suggestionRef'),
          capabilityRequirementRef: text(input.capabilityRequirementRef, 'capabilityRequirementRef'),
          decision: decision as any,
          decidedBy: typeof input.decidedBy === 'string' ? input.decidedBy : 'one-app-user',
          authorityRef: text(input.authorityRef, 'authorityRef'),
          rationale: text(input.rationale, 'rationale'),
          ...(input.replacement && typeof input.replacement === 'object' ? { replacement: input.replacement as any } : {}),
          decidedAt: new Date().toISOString(),
        });
        json(res, 201, {
          ...session.automation.workspace,
          capabilitySelectionCreated: false,
          executionPlanAuthorized: false,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/automation/capability/select') {
        const input = await jsonBody(req);
        const workspaceId = text(input.workspaceId, 'workspaceId');
        const session = automationSessions.get(workspaceId);
        if (!session) throw new TypeError('one-app explicit capability selection requires an existing Automation Design Workspace');
        session.automation = selectOneAppAutomationCapabilities(
          repo,
          session.automation,
          array(input.selections, 'selections') as any,
          new Date().toISOString(),
        );
        json(res, 201, session.automation.selection);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/automation/execution-plan/review') {
        const input = await jsonBody(req);
        const workspaceId = text(input.workspaceId, 'workspaceId');
        const session = automationSessions.get(workspaceId);
        if (!session) throw new TypeError('one-app ExecutionPlan review requires an existing Automation Design Workspace');
        const decisions = input.decisions && typeof input.decisions === 'object' ? input.decisions as any : {};
        session.automation = reviewOneAppExecutionPlan(
          repo,
          session.automation,
          decisions,
          new Date().toISOString(),
        );
        const review = session.automation.executionReview;
        if (!review) throw new TypeError('one-app ExecutionPlan review was not created');
        reviewSessions.set(review.review.id, session);
        json(res, 201, review);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/automation/approve') {
        const input = await jsonBody(req);
        const reviewId = text(input.reviewId, 'reviewId');
        const session = reviewSessions.get(reviewId);
        if (!session) throw new TypeError('one-app automation approval requires an existing ExecutionPlan review');
        session.automation = approveOneAppAutomation(repo, session.automation, {
          approvedBy: typeof input.approvedBy === 'string' ? input.approvedBy : 'one-app-user',
          authorityRef: text(input.authorityRef, 'authorityRef'),
          rationale: text(input.rationale, 'rationale'),
          approvedAt: new Date().toISOString(),
        });
        const approval = session.automation.approval;
        if (!approval) throw new TypeError('one-app automation approval was not created');
        approvalSessions.set(approval.id, session);
        json(res, 201, approval);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/automation/temporal-mapping') {
        const input = await jsonBody(req);
        const approvalId = text(input.approvalId, 'approvalId');
        const session = approvalSessions.get(approvalId);
        if (!session) throw new TypeError('one-app Temporal mapping requires an explicit I8-06 automation approval');
        session.automation = mapOneAppApprovedTemporalDesign(
          repo,
          session.automation,
          {
            waits: Array.isArray(input.waits) ? input.waits as any : [],
            humans: Array.isArray(input.humans) ? input.humans as any : [],
          },
          new Date().toISOString(),
        );
        const mapping = session.automation.mapping;
        if (!mapping) throw new TypeError('one-app approved Temporal mapping was not created');
        json(res, 201, {
          mapping,
          runtimePolicyAuthorized: false,
          deploymentAuthorized: false,
          executionAuthorized: false,
        });
        return;
      }

      json(res, 404, { error: 'not found', code: 'ONE_APP_ROUTE_NOT_FOUND' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const conflict = /not found|requires|must pin|must use|cannot|approval|confirmation|reconciliation|freeze|blocked|already exists/i.test(message);
      json(res, conflict ? 409 : 400, {
        error: message,
        code: conflict ? 'ONE_APP_AUTHORITY_ORDER_VIOLATION' : 'ONE_APP_REQUEST_REJECTED',
      });
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port ?? 0, host, () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Talos one-app server did not bind a TCP address');
  let closed = false;
  return {
    baseUrl: `http://${host}:${address.port}`,
    runtimeDir,
    async close() {
      if (closed) return;
      closed = true;
      await new Promise<void>((resolve) => server.close(() => resolve()));
      repo.close();
      if (ownsDir) rmSync(runtimeDir, { recursive: true, force: true });
    },
  };
}
