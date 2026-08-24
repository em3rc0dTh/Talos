import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  BpmnWorkspaceService,
  NativeBpmnCanonicalReconciliationService,
  applyConfirmedBpmnFreezeHandoff,
  approveOneAppAutomation,
  approveOneAppDeploymentAttempt,
  buildImageBpmnReviewCandidate,
  confirmImageInterpretedBusinessProcess,
  decideOneAppAutomationSuggestion,
  designOneAppDeployment,
  designOneAppExplicitRuntimePolicy,
  initializeReview,
  mapOneAppApprovedTemporalDesign,
  openOneAppAutomationDesign,
  realizeOneAppDeploymentEnvironment,
  recordOneAppAuthorizedDeploymentAttempt,
  reviewOneAppExecutionPlan,
  selectOneAppAutomationCapabilities,
  type BpmnCanonicalReconciliationResult,
  type OneAppAutomationContext,
} from '../../../packages/application/src/index.ts';
import { createOpaqueId, type OpaqueId } from '../../../packages/foundation/src/ids.ts';
import {
  LocalImageByteStore,
  resolveImagePerceptionRuntimeBinding,
} from '../../../packages/image-perception/src/index.ts';
import { SqliteDocumentStore } from '../../../packages/persistence-sqlite/src/sqlite-document-store.ts';

export interface OneAppDeploymentAttemptExecutorInput {
  context: OneAppAutomationContext;
  deploymentApprovalId: string;
  attemptNumber: 1;
  startedAt: string;
}

export interface OneAppDeploymentAttemptExecutorResult {
  completedAt: string;
  result: 'SUCCEEDED' | 'PARTIAL' | 'FAILED' | 'CANCELLED';
  diagnosticRefs: string[];
  evidenceRefs: string[];
  orchestratorRef: string;
}

export interface TalosOneAppOptions {
  port?: number;
  host?: string;
  runtimeDir?: string;
  imagePerceptionEnv?: Readonly<Record<string, string | undefined>>;
  imagePerceptionFetchImpl?: typeof fetch;
  deploymentAttemptExecutor?: (
    input: OneAppDeploymentAttemptExecutorInput,
  ) => Promise<OneAppDeploymentAttemptExecutorResult>;
}

type ReconciledBinding = Extract<BpmnCanonicalReconciliationResult, { status: 'RECONCILED' }>;

interface OneAppSession {
  revisionId: string;
  binding: ReconciledBinding;
  automation: OneAppAutomationContext;
}

const MAX_JSON_BYTES = 20 * 1024 * 1024;

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

function publicReconciliation(result: BpmnCanonicalReconciliationResult): unknown {
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
  const nativeReconciler = new NativeBpmnCanonicalReconciliationService(repo);
  const imageRuntime = resolveImagePerceptionRuntimeBinding(options.imagePerceptionEnv ?? process.env);
  const bindings = new Map<string, ReconciledBinding>();
  const automationSessions = new Map<string, OneAppSession>();
  const reviewSessions = new Map<string, OneAppSession>();
  const approvalSessions = new Map<string, OneAppSession>();
  const deploymentApprovalSessions = new Map<string, OneAppSession>();

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? host}`);

      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/api/status')) {
        const imageConfigured = imageRuntime.status === 'CONFIGURED';
        json(res, 200, {
          status: 'READY',
          releaseGate: imageConfigured
            ? 'I9-02_ONE_APP_IMAGE_BPMN_E2E'
            : 'I9-01_ONE_APP_NATIVE_BPMN_E2E',
          currentAuthorityStage: 'I9-03_EXPLICIT_RUNTIME_POLICY_DESIGN',
          latestAuthorityStage: 'I9-04_DEPLOYMENT_DESIGN',
          environmentRealizationStage: 'I9-05_ENVIRONMENT_REALIZATION',
          deploymentAttemptStage: 'I9-06_EXPLICIT_DEPLOYMENT_APPROVAL_ATTEMPT',
          inputRoutes: imageConfigured ? ['IMAGE_PNG', 'NATIVE_BPMN'] : ['NATIVE_BPMN'],
          imageInputIntegratedIntoOneApp: imageConfigured,
          image: {
            exactSourceIntake: true,
            liveVisionInterpretation: imageConfigured,
            correlatedProviderResponsesRequired: true,
            ...(imageConfigured ? {
              provider: {
                providerId: imageRuntime.binding.descriptor.providerId,
                providerVersion: imageRuntime.binding.descriptor.providerVersion,
                modelRef: imageRuntime.binding.descriptor.modelRef,
                modelVersion: imageRuntime.binding.descriptor.modelVersion,
                pipelineVersion: imageRuntime.binding.descriptor.pipelineVersion,
                authConfigured: imageRuntime.binding.descriptor.authConfigured,
              },
            } : {
              reason: imageRuntime.reason,
            }),
          },
          authorityChain: [
            'PROCESS_CONFIRMATION',
            'AUTOMATION_DESIGN_FREEZE',
            'AUTOMATION_DESIGN_WORKSPACE',
            'EXPLICIT_CAPABILITY_SELECTION',
            'EXECUTION_PLAN_REVIEW',
            'EXPLICIT_AUTOMATION_APPROVAL',
            'APPROVED_TEMPORAL_MAPPING',
            'EXPLICIT_RUNTIME_POLICY_DESIGN',
            'DEPLOYMENT_DESIGN',
            'ENVIRONMENT_REALIZATION',
            'EXPLICIT_DEPLOYMENT_APPROVAL',
            'DEPLOYMENT_ATTEMPT',
          ],
          automaticCapabilityBindingAuthorized: false,
          automaticTemporalDesignAuthorized: false,
          automaticRuntimePolicyDefaultsAuthorized: false,
          automaticDeploymentRealizationAuthorized: false,
          automaticDeploymentAttemptAuthorized: false,
          deploymentAttemptExecutorConfigured: Boolean(options.deploymentAttemptExecutor),
          deploymentAuthorized: false,
          executionAuthorized: false,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/input/image') {
        const input = await jsonBody(req);
        const pngBytes = Buffer.from(text(input.imageBase64, 'imageBase64'), 'base64');
        const declaredName = typeof input.fileName === 'string' ? input.fileName : 'uploaded-process.png';
        const initiatedBy = typeof input.initiatedBy === 'string' ? input.initiatedBy : 'one-app-user';

        if (imageRuntime.status !== 'CONFIGURED') {
          const preserved = workspace.intakeImage({ pngBytes, declaredName, initiatedBy });
          json(res, 202, {
            ...preserved,
            interpretation: { status: 'NOT_CONFIGURED', reason: imageRuntime.reason },
            automaticConfirmationAuthorized: false,
            automaticAutomationDesignAuthorized: false,
          });
          return;
        }

        const result = await buildImageBpmnReviewCandidate(
          repo,
          byteStore,
          pngBytes,
          imageRuntime.binding,
          {
            declaredName,
            initiatedBy,
            ...(options.imagePerceptionFetchImpl ? { fetchImpl: options.imagePerceptionFetchImpl } : {}),
          },
        );

        if (result.status !== 'BPMN_READY_FOR_PROCESS_REVIEW') {
          json(res, 200, {
            status: result.status,
            sourceArtifactId: result.intake.artifact.id,
            sourceRepresentationId: result.intake.representation.id,
            sourceContentSha256: result.intake.representation.contentHash,
            width: result.intake.coordinateSpace.width,
            height: result.intake.coordinateSpace.height,
            mediaType: 'image/png',
            perceptionDecision: result.perception.admission.decision,
            diagnostics: result.perception.attempt.diagnostics,
            automaticConfirmationAuthorized: false,
            automaticFreezeAuthorized: false,
            automaticExecutionAuthorized: false,
          });
          return;
        }

        const adapterResultId = result.perception.attempt.result?.id;
        const review = initializeReview(repo, result.semantic.normalization.processRevision, result.semantic.validation, {
          createdBy: initiatedBy,
          sourceRepresentationRefs: [result.intake.representation.id],
          ...(adapterResultId ? { adapterResultContextRefs: [adapterResultId] } : {}),
        });
        const binding: ReconciledBinding = {
          status: 'RECONCILED',
          sourceBpmnRevision: result.projection.bpmnRevision,
          alignedBpmnRevision: result.projection.bpmnRevision,
          processDefinition: result.semantic.normalization.processDefinition,
          processRevision: result.semantic.normalization.processRevision,
          validation: result.semantic.validation,
          review,
          diagnostics: [],
        };
        bindings.set(result.projection.bpmnRevision.id, binding);

        json(res, 201, {
          status: result.status,
          sourceArtifactId: result.intake.artifact.id,
          sourceRepresentationId: result.intake.representation.id,
          sourceContentSha256: result.intake.representation.contentHash,
          width: result.intake.coordinateSpace.width,
          height: result.intake.coordinateSpace.height,
          mediaType: 'image/png',
          perceptionDecision: result.perception.admission.decision,
          revision: result.projection.bpmnRevision,
          reconciliation: publicReconciliation(binding),
          projectionDiagnostics: result.projection.diagnostics,
          unprojectableCanonicalRefs: result.projection.unprojectableCanonicalRefs,
          automaticConfirmationAuthorized: false,
          automaticFreezeAuthorized: false,
          automaticExecutionAuthorized: false,
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
        const reconciliation = await nativeReconciler.reconcile({
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
        const currentRevision = workspace.getRevision(revisionId);
        if (!currentRevision) throw new TypeError('one-app BPMN workspace revision not found');
        const binding = bindings.get(revisionId);
        if (!binding) throw new TypeError('one-app canonical reconciliation context not found for this BPMN revision');
        const canonicalProcessRevisionId = text(input.canonicalProcessRevisionId, 'canonicalProcessRevisionId');
        if (canonicalProcessRevisionId !== binding.processRevision.id) {
          throw new TypeError('one-app confirmation must pin the exact reconciled ProcessRevision');
        }
        const confirmedBy = typeof input.confirmedBy === 'string' ? input.confirmedBy : 'one-app-user';
        const authorityRef = text(input.authorityRef, 'authorityRef');
        const rationale = typeof input.rationale === 'string' && input.rationale.trim() ? input.rationale : undefined;

        if (currentRevision.sourceRoute === 'IMAGE_INTERPRETATION') {
          const result = confirmImageInterpretedBusinessProcess(repo, {
            currentBpmnRevision: currentRevision,
            currentProcessRevision: binding.processRevision,
            currentValidation: binding.validation,
            currentReviewContext: binding.review.context,
            confirmedBy,
            authorityRef,
            ...(rationale ? { rationale } : {}),
          });
          const nextContext = result.canonicalConfirmation.nextContext;
          const nextExplanation = result.canonicalConfirmation.explanation;
          if (!nextContext || !nextExplanation) {
            throw new TypeError('one-app image confirmation did not produce a next canonical review baseline');
          }
          const confirmedBinding: ReconciledBinding = {
            ...binding,
            sourceBpmnRevision: currentRevision,
            alignedBpmnRevision: result.confirmedBpmnRevision,
            processRevision: result.confirmedProcessRevision,
            validation: result.confirmedValidation,
            review: { context: nextContext, explanation: nextExplanation },
          };
          bindings.set(result.confirmedBpmnRevision.id, confirmedBinding);
          json(res, 201, {
            revision: result.confirmedBpmnRevision,
            confirmation: result.confirmation,
            reconciliation: publicReconciliation(confirmedBinding),
            canonicalConfirmation: {
              application: result.canonicalConfirmation.application,
              confirmedClaimCount: result.canonicalConfirmation.confirmedClaims.length,
              findingDispositionCount: result.canonicalConfirmation.findingDispositions.length,
            },
            automaticAutomationDesignAuthorized: false,
            automaticExecutionAuthorized: false,
          });
          return;
        }

        const result = workspace.confirm({
          revisionId,
          canonicalProcessRevisionId: binding.processRevision.id,
          confirmedBy,
          authorityRef,
          ...(rationale ? { rationale } : {}),
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
        const commandId = createOpaqueId('review', `i9:automation-design:${revisionId}:${confirmationId}:${approvedBy}:${at}`);
        const payloadId = createOpaqueId('review', `i9:freeze-payload:${commandId}`);
        const requestId = createOpaqueId('review', `i9:freeze-scope:${commandId}:${semanticScopeRef}`);
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
          automaticRuntimePolicyDefaultsAuthorized: false,
          deploymentAuthorized: false,
          executionAuthorized: false,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/automation/runtime-policy') {
        const input = await jsonBody(req);
        const approvalId = text(input.approvalId, 'approvalId');
        const session = approvalSessions.get(approvalId);
        if (!session) throw new TypeError('one-app RuntimePolicy design requires an explicit automation approval');
        const mapping = session.automation.mapping;
        if (!mapping) throw new TypeError('one-app RuntimePolicy design requires an approved Temporal mapping first');
        const temporalMappingRevisionId = text(input.temporalMappingRevisionId, 'temporalMappingRevisionId');
        if (temporalMappingRevisionId !== mapping.revision.id) {
          throw new TypeError('one-app RuntimePolicy design must pin the exact approved TemporalMappingRevision');
        }
        const workflow = input.workflow;
        if (!workflow || typeof workflow !== 'object' || Array.isArray(workflow)) {
          throw new TypeError('workflow must be an explicit RuntimePolicy decision object');
        }
        session.automation = designOneAppExplicitRuntimePolicy(
          repo,
          session.automation,
          array(input.activities, 'activities') as any,
          workflow as any,
          new Date().toISOString(),
        );
        const runtimePolicy = session.automation.runtimePolicy;
        if (!runtimePolicy) throw new TypeError('one-app explicit RuntimePolicy design was not created');
        json(res, 201, {
          runtimePolicy,
          automaticRuntimePolicyDefaultsAuthorized: false,
          deploymentAuthorized: false,
          executionAuthorized: false,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/automation/deployment-design') {
        const input = await jsonBody(req);
        const approvalId = text(input.approvalId, 'approvalId');
        const session = approvalSessions.get(approvalId);
        if (!session) throw new TypeError('one-app Deployment design requires an explicit automation approval');
        const runtimePolicy = session.automation.runtimePolicy;
        if (!runtimePolicy) throw new TypeError('one-app Deployment design requires an explicit RuntimePolicy first');
        const runtimePolicyRevisionId = text(input.runtimePolicyRevisionId, 'runtimePolicyRevisionId');
        if (runtimePolicyRevisionId !== runtimePolicy.revision.id) {
          throw new TypeError('one-app Deployment design must pin the exact RuntimePolicyRevision');
        }
        const environmentClass = text(input.environmentClass, 'environmentClass');
        if (!['DEVELOPMENT', 'TEST', 'STAGING', 'PRODUCTION'].includes(environmentClass)) {
          throw new TypeError('environmentClass must be DEVELOPMENT, TEST, STAGING or PRODUCTION');
        }
        session.automation = designOneAppDeployment(
          repo,
          session.automation,
          {
            environmentKey: text(input.environmentKey, 'environmentKey'),
            environmentClass: environmentClass as any,
            temporalPlatformRef: text(input.temporalPlatformRef, 'temporalPlatformRef'),
            desiredNamespaceKey: text(input.desiredNamespaceKey, 'desiredNamespaceKey'),
            desiredTaskQueueKey: text(input.desiredTaskQueueKey, 'desiredTaskQueueKey'),
            desiredWorkflowTypeName: text(input.desiredWorkflowTypeName, 'desiredWorkflowTypeName'),
            desiredActivityTypeName: text(input.desiredActivityTypeName, 'desiredActivityTypeName'),
            desiredWorkerLogicalName: text(input.desiredWorkerLogicalName, 'desiredWorkerLogicalName'),
            authorityRef: text(input.authorityRef, 'authorityRef'),
            decidedBy: text(input.decidedBy, 'decidedBy'),
            rationale: text(input.rationale, 'rationale'),
          },
          new Date().toISOString(),
        );
        const deploymentDesign = session.automation.deploymentDesign;
        if (!deploymentDesign) throw new TypeError('one-app Deployment design was not created');
        json(res, 201, {
          deploymentDesign,
          deploymentRealizationAuthorized: false,
          deploymentAttemptAuthorized: false,
          deploymentAuthorized: false,
          executionAuthorized: false,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/automation/environment-realization') {
        const input = await jsonBody(req);
        const approvalId = text(input.approvalId, 'approvalId');
        const session = approvalSessions.get(approvalId);
        if (!session) throw new TypeError('one-app environment realization requires an explicit automation approval');
        const deploymentDesign = session.automation.deploymentDesign;
        if (!deploymentDesign) throw new TypeError('one-app environment realization requires Deployment design first');
        const deploymentRevisionId = text(input.deploymentRevisionId, 'deploymentRevisionId');
        if (deploymentRevisionId !== deploymentDesign.revision.id) {
          throw new TypeError('one-app environment realization must pin the exact DeploymentRevision');
        }
        session.automation = realizeOneAppDeploymentEnvironment(
          repo,
          session.automation,
          {
            actualNamespace: text(input.actualNamespace, 'actualNamespace'),
            taskQueue: text(input.taskQueue, 'taskQueue'),
            workflowTypeName: text(input.workflowTypeName, 'workflowTypeName'),
            activityTypeName: text(input.activityTypeName, 'activityTypeName'),
            workerLogicalName: text(input.workerLogicalName, 'workerLogicalName'),
            executableArtifactRef: text(input.executableArtifactRef, 'executableArtifactRef'),
            artifactDigest: text(input.artifactDigest, 'artifactDigest'),
            sdkFamily: text(input.sdkFamily, 'sdkFamily'),
            sdkVersionRef: text(input.sdkVersionRef, 'sdkVersionRef'),
            authorityRef: text(input.authorityRef, 'authorityRef'),
            realizedBy: text(input.realizedBy, 'realizedBy'),
          },
          new Date().toISOString(),
        );
        const deploymentRealization = session.automation.deploymentRealization;
        if (!deploymentRealization) throw new TypeError('one-app environment realization was not created');
        json(res, 201, {
          deploymentRealization,
          deploymentAttemptAuthorized: false,
          deploymentAuthorized: false,
          executionAuthorized: false,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/automation/deployment/approve') {
        const input = await jsonBody(req);
        const automationApprovalId = text(input.automationApprovalId, 'automationApprovalId');
        const session = approvalSessions.get(automationApprovalId);
        if (!session) throw new TypeError('one-app deployment approval requires the explicit automation approval session');
        const deploymentRealization = session.automation.deploymentRealization;
        if (!deploymentRealization) throw new TypeError('one-app deployment approval requires exact environment realization first');
        const deploymentRevisionId = text(input.deploymentRevisionId, 'deploymentRevisionId');
        if (deploymentRevisionId !== deploymentRealization.revision.id) {
          throw new TypeError('one-app deployment approval must pin the exact realized DeploymentRevision');
        }
        session.automation = approveOneAppDeploymentAttempt(repo, session.automation, {
          authorityRef: text(input.authorityRef, 'authorityRef'),
          approvedBy: typeof input.approvedBy === 'string' ? text(input.approvedBy, 'approvedBy') : 'one-app-user',
          rationale: text(input.rationale, 'rationale'),
          approvedAt: new Date().toISOString(),
        });
        const deploymentApproval = session.automation.deploymentApproval;
        if (!deploymentApproval) throw new TypeError('one-app deployment approval was not created');
        deploymentApprovalSessions.set(deploymentApproval.id, session);
        json(res, 201, {
          deploymentApproval,
          deploymentAttemptAuthorized: true,
          authorizedAttemptCount: 1,
          deploymentAuthorized: false,
          executionAuthorized: false,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/automation/deployment/attempt') {
        const input = await jsonBody(req);
        const deploymentApprovalId = text(input.deploymentApprovalId, 'deploymentApprovalId');
        const session = deploymentApprovalSessions.get(deploymentApprovalId);
        if (!session) throw new TypeError('one-app deployment attempt requires an explicit deployment approval');
        if (!options.deploymentAttemptExecutor) throw new TypeError('one-app deployment attempt requires a configured trusted deployment executor');
        const deploymentRealization = session.automation.deploymentRealization;
        const deploymentApproval = session.automation.deploymentApproval;
        if (!deploymentRealization || !deploymentApproval) throw new TypeError('one-app deployment attempt requires realized deployment and approval context');
        const deploymentRevisionId = text(input.deploymentRevisionId, 'deploymentRevisionId');
        if (deploymentRevisionId !== deploymentRealization.revision.id || deploymentApproval.deploymentRevisionRef !== deploymentRevisionId) {
          throw new TypeError('one-app deployment attempt must pin the exact approved realized DeploymentRevision');
        }
        deploymentApprovalSessions.delete(deploymentApprovalId);
        const startedAt = new Date().toISOString();
        const outcome = await options.deploymentAttemptExecutor({
          context: session.automation,
          deploymentApprovalId,
          attemptNumber: 1,
          startedAt,
        });
        session.automation = recordOneAppAuthorizedDeploymentAttempt(repo, session.automation, {
          startedAt,
          completedAt: text(outcome.completedAt, 'completedAt'),
          result: outcome.result,
          diagnosticRefs: array(outcome.diagnosticRefs, 'diagnosticRefs') as string[],
          evidenceRefs: array(outcome.evidenceRefs, 'evidenceRefs') as string[],
          orchestratorRef: text(outcome.orchestratorRef, 'orchestratorRef'),
        });
        const deploymentAttempt = session.automation.deploymentAttempt;
        if (!deploymentAttempt) throw new TypeError('one-app deployment attempt record was not created');
        json(res, 201, {
          deploymentAttempt,
          deploymentAttemptConsumed: true,
          deploymentAttemptSucceeded: deploymentAttempt.result === 'SUCCEEDED',
          deploymentAuthorized: false,
          executionAuthorized: false,
        });
        return;
      }

      json(res, 404, { error: 'not found', code: 'ONE_APP_ROUTE_NOT_FOUND' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const conflict = /not found|requires|must pin|must use|cannot|approval|confirmation|reconciliation|freeze|blocked|already exists|executor/i.test(message);
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
