import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Client, Connection } from '@temporalio/client';
import { NativeConnection } from '@temporalio/worker';
import { digestDeterministicJson } from '../../../packages/foundation/src/digest.ts';
import type { OneAppAutomationContext } from '../../../packages/application/src/one-app-automation.ts';
import { deriveIsoDurationWaitSemantics } from '../../../packages/semantic-core/src/wait-semantics.ts';
import type { TalosPrivatePreviewTemporalTarget } from './private-preview-config.ts';
import type { TalosPrivatePreviewRuntimeAdapters } from './private-preview-runtime.ts';
import type {
  OneAppDeploymentAttemptExecutorInput,
  OneAppDeploymentAttemptExecutorResult,
  OneAppWorkflowExecutionExecutorInput,
  OneAppWorkflowExecutionExecutorResult,
} from './one-app-server.ts';
import { compileGenericRuntimeProgram } from '../../../workers/reference-temporal-worker/src/generic-compile-runtime-program.ts';
import type {
  CompiledGenericRuntimeProgram,
  GenericRuntimeSemanticSnapshot,
} from '../../../workers/reference-temporal-worker/src/generic-contracts.ts';
import {
  createGenericTemporalWorker,
  type GenericWorkerRuntime,
} from '../../../workers/reference-temporal-worker/src/generic-worker-runtime.ts';
import {
  GenericEffectLedger,
  type GenericCapabilityTransport,
  type GenericEffectIdentity,
  type GenericExternalCapabilityEffect,
} from '../../../workers/reference-temporal-worker/src/generic-activities.ts';
import type { GenericCapabilityActivityInput } from '../../../workers/reference-temporal-worker/src/generic-contracts.ts';
import { TalosGenericWorkflow } from '../../../workers/reference-temporal-worker/src/generic-workflow.ts';
import { buildOneAppHumanRuntimeSnapshots } from './private-preview-human-runtime.ts';

export const TALOS_PRODUCT_TEMPORAL_RUNTIME_VERSION = 'talos-product-temporal-runtime-v0.7';
export const TALOS_PRODUCT_WORKFLOW_TYPE = 'TalosGenericWorkflow';
export const TALOS_PRODUCT_ACTIVITY_TYPE = 'executeGenericCapability';
export const TALOS_PRODUCT_SDK_VERSION = '1.22.0';
export const TALOS_PRODUCT_CAPABILITY_DISPATCH_REF = 'TALOS_PRODUCT_CAPABILITY_DISPATCH_V2';

export interface TalosProductCapabilityTransportResolutionInput {
  context?: OneAppAutomationContext;
  capabilityUseOccurrenceRef: string;
  implementationRef: string;
}
export interface TalosProductCapabilityTransportResolver {
  resolve(input: TalosProductCapabilityTransportResolutionInput): GenericCapabilityTransport | undefined;
}
export interface TalosRecoveredRuntimeDeployment {
  realizedDeploymentRevisionId: string;
  program: CompiledGenericRuntimeProgram;
  namespace: string;
  taskQueue: string;
  capabilityBindings: Array<{ capabilityUseOccurrenceRef: string; implementationRef: string }>;
}
export interface TalosProductTemporalRuntimeOptions {
  capabilityTransportResolver?: TalosProductCapabilityTransportResolver;
  client?: Client;
  nativeConnection?: NativeConnection;
}
export interface TalosManagedTemporalRuntimeAdapters extends TalosPrivatePreviewRuntimeAdapters {
  assertReachable(): Promise<{ namespace: string; workerIdentity: string; sdkVersion: string }>;
  recoverDeployment(input: TalosRecoveredRuntimeDeployment): Promise<{
    realizedDeploymentRevisionId: string;
    programDigest: string;
    evidenceRefs: string[];
  }>;
  close(): Promise<void>;
}
interface ActiveDeployment { deploymentRevisionId: string; program: CompiledGenericRuntimeProgram; taskQueue: string; }
interface ResolvedProductCapabilityTransport { capabilityUseOccurrenceRef: string; implementationRef: string; transport: GenericCapabilityTransport; }
interface ActiveQueueWorker { runtime: GenericWorkerRuntime; runPromise: Promise<void>; ledger: GenericEffectLedger; dispatch: ProductCapabilityDispatchTransport; }

class ProductCapabilityDispatchTransport implements GenericCapabilityTransport {
  readonly transportRef = TALOS_PRODUCT_CAPABILITY_DISPATCH_REF;
  readonly #byCapabilityUse = new Map<string, { implementationRef: string; transport: GenericCapabilityTransport }>();
  constructor(resolutions: ResolvedProductCapabilityTransport[] = []) { this.addMany(resolutions); }
  get acceptedExternalTransportRefs(): readonly string[] { return [...new Set([...this.#byCapabilityUse.values()].map((item) => item.transport.transportRef))].sort(); }
  addMany(resolutions: ResolvedProductCapabilityTransport[]): void {
    for (const item of resolutions) {
      const existing = this.#byCapabilityUse.get(item.capabilityUseOccurrenceRef);
      if (existing && (existing.implementationRef !== item.implementationRef || existing.transport.transportRef !== item.transport.transportRef)) {
        throw new TypeError(`TALOS_RUNTIME_CAPABILITY_BINDING_CONFLICT: ${item.capabilityUseOccurrenceRef}`);
      }
    }
    for (const item of resolutions) if (!this.#byCapabilityUse.has(item.capabilityUseOccurrenceRef)) this.#byCapabilityUse.set(item.capabilityUseOccurrenceRef, { implementationRef: item.implementationRef, transport: item.transport });
  }
  async execute(input: GenericCapabilityActivityInput, identity: GenericEffectIdentity): Promise<GenericExternalCapabilityEffect> {
    const resolved = this.#byCapabilityUse.get(input.capabilityUseOccurrenceRef);
    if (!resolved) throw new TypeError(`TALOS_RUNTIME_CAPABILITY_DISPATCH_MISSING: ${input.capabilityUseOccurrenceRef}`);
    return resolved.transport.execute(input, identity);
  }
}

function waitDurationMs(context: OneAppAutomationContext, executionElementId: string): { durationMs: number; sourceRef: string } {
  const execution = context.executionReview?.execution;
  if (!execution) throw new TypeError('TALOS_RUNTIME_EXECUTION_PLAN_REQUIRED: wait resolution requires an approved ExecutionPlan review');
  const element = execution.elements.find((item) => item.id === executionElementId);
  if (!element) throw new TypeError(`TALOS_RUNTIME_WAIT_ELEMENT_MISSING: ${executionElementId}`);
  const semanticNode = context.process.nodes.find((node) => element.semanticSubjectRefs.includes(node.id));
  if (!semanticNode) throw new TypeError(`TALOS_RUNTIME_WAIT_SOURCE_MISSING: ${executionElementId}`);
  const details = semanticNode.details ?? {};

  const rawMs = details.durationMs ?? details.waitDurationMs;
  const legacyDurationMs = typeof rawMs === 'number'
    ? rawMs
    : typeof rawMs === 'string' && rawMs.trim()
      ? Number(rawMs)
      : Number.NaN;
  if (Number.isFinite(legacyDurationMs) && legacyDurationMs >= 0) {
    return { durationMs: legacyDurationMs, sourceRef: semanticNode.id };
  }

  const rawSeconds = details.durationSeconds;
  const durationSeconds = typeof rawSeconds === 'number'
    ? rawSeconds
    : typeof rawSeconds === 'string' && rawSeconds.trim()
      ? Number(rawSeconds)
      : Number.NaN;
  if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
    return { durationMs: durationSeconds * 1000, sourceRef: semanticNode.id };
  }

  const durationExpression = typeof details.durationExpression === 'string'
    ? details.durationExpression.trim()
    : typeof details.expression === 'string'
      ? details.expression.trim()
      : '';
  const parsedDuration = deriveIsoDurationWaitSemantics(durationExpression);
  if (parsedDuration) {
    return { durationMs: parsedDuration.durationSeconds * 1000, sourceRef: semanticNode.id };
  }

  throw new TypeError(`TALOS_RUNTIME_WAIT_DURATION_REQUIRED: ${semanticNode.id} must carry an explicit canonical duration before execution`);
}
export function buildOneAppRuntimeSemanticSnapshot(context: OneAppAutomationContext): GenericRuntimeSemanticSnapshot {
  if (!context.executionReview) throw new TypeError('TALOS_RUNTIME_EXECUTION_PLAN_REQUIRED: runtime semantic snapshot needs an ExecutionPlan');
  const conditionRules = context.process.rules.map((rule) => ({ ref: rule.id, expression: rule.expression }));
  const waits = context.executionReview.execution.elements.filter((element) => element.kind === 'WAIT_COORDINATION').map((element) => ({ executionElementRef: element.id, ...waitDurationMs(context, element.id) }));
  const humans = buildOneAppHumanRuntimeSnapshots(context);
  const material = humans.length > 0 ? { conditionRules, waits, humans } : { conditionRules, waits };
  return { ...material, snapshotDigest: digestDeterministicJson(material) };
}
function workerArtifactDigest(): string {
  const filePath = fileURLToPath(new URL('../../../workers/reference-temporal-worker/src/generic-worker-runtime.ts', import.meta.url));
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}
function assertTargetMatchesRealization(context: OneAppAutomationContext, target: TalosPrivatePreviewTemporalTarget): void {
  const realization = context.deploymentRealization;
  if (!realization) throw new TypeError('TALOS_RUNTIME_REALIZATION_REQUIRED: deployment attempt requires realized environment evidence');
  if (realization.namespaceBinding.namespaceLocatorRef !== `temporal-namespace:${target.namespace}`) throw new TypeError('TALOS_RUNTIME_TARGET_MISMATCH: realized Temporal namespace does not match configured private-preview target');
  const queue = realization.taskQueueBindings[0]?.taskQueueKey;
  if (!queue || queue !== target.taskQueue) throw new TypeError('TALOS_RUNTIME_TARGET_MISMATCH: realized Task Queue does not match configured private-preview target');
  const workflowType = realization.workflowTypeBindings[0]?.workflowTypeName;
  if (workflowType !== TALOS_PRODUCT_WORKFLOW_TYPE) throw new TypeError(`TALOS_RUNTIME_WORKFLOW_TYPE_UNSUPPORTED: product runtime requires ${TALOS_PRODUCT_WORKFLOW_TYPE}`);
  const activityTypes = new Set(realization.activityTypeBindings.map((item) => item.activityTypeName));
  if (activityTypes.size > 0 && (!activityTypes.has(TALOS_PRODUCT_ACTIVITY_TYPE) || activityTypes.size !== 1)) throw new TypeError(`TALOS_RUNTIME_ACTIVITY_TYPE_UNSUPPORTED: product runtime requires ${TALOS_PRODUCT_ACTIVITY_TYPE}`);
}
function compileApprovedProgram(context: OneAppAutomationContext): CompiledGenericRuntimeProgram {
  if (!context.executionReview || !context.mapping || !context.runtimePolicy || !context.deploymentDesign) throw new TypeError('TALOS_RUNTIME_APPROVED_LINEAGE_REQUIRED: ExecutionPlan, Temporal mapping, RuntimePolicy and Deployment design are required');
  return compileGenericRuntimeProgram(context.executionReview.execution, context.mapping, context.runtimePolicy, context.deploymentDesign, buildOneAppRuntimeSemanticSnapshot(context), { family: 'TEMPORAL_TYPESCRIPT_SDK', version: TALOS_PRODUCT_SDK_VERSION });
}
function implementationRefForCapabilityUse(context: OneAppAutomationContext, capabilityUseOccurrenceRef: string): string {
  const execution = context.executionReview?.execution;
  const selection = context.selection;
  if (!execution || !selection) throw new TypeError('TALOS_RUNTIME_CAPABILITY_LINEAGE_REQUIRED: approved execution and capability selection are required');
  const use = execution.capabilityUses.find((item) => item.id === capabilityUseOccurrenceRef);
  if (!use) throw new TypeError(`TALOS_RUNTIME_CAPABILITY_USE_MISSING: ${capabilityUseOccurrenceRef}`);
  const binding = selection.resolution.bindingRevisions.find((item) => item.id === use.capabilityBindingRevisionRef);
  if (!binding) throw new TypeError(`TALOS_RUNTIME_CAPABILITY_BINDING_MISSING: ${use.capabilityBindingRevisionRef}`);
  const offering = selection.resolution.offeringRevisions.find((item) => item.id === binding.capabilityOfferingRevisionId);
  if (!offering?.implementationRef?.trim()) throw new TypeError(`TALOS_RUNTIME_IMPLEMENTATION_REF_MISSING: ${capabilityUseOccurrenceRef}`);
  return offering.implementationRef.trim();
}
function invocationUseRefs(program: CompiledGenericRuntimeProgram): string[] { return [...new Set(program.graph.elements.filter((element) => element.kind === 'CAPABILITY_INVOCATION').flatMap((element) => element.capabilityUseOccurrenceRefs))].sort(); }
function resolveFreshCapabilityTransports(context: OneAppAutomationContext, program: CompiledGenericRuntimeProgram, resolver?: TalosProductCapabilityTransportResolver) {
  const useRefs = invocationUseRefs(program);
  if (useRefs.length === 0) return { resolutions: [] as ResolvedProductCapabilityTransport[], evidenceRefs: [] as string[] };
  if (!resolver) throw new TypeError('TALOS_RUNTIME_CAPABILITY_TRANSPORT_REQUIRED: approved capability work has no configured product runtime adapter');
  const resolutions = useRefs.map((capabilityUseOccurrenceRef) => {
    const implementationRef = implementationRefForCapabilityUse(context, capabilityUseOccurrenceRef);
    const transport = resolver.resolve({ context, capabilityUseOccurrenceRef, implementationRef });
    if (!transport) throw new TypeError(`TALOS_RUNTIME_CAPABILITY_TRANSPORT_UNRESOLVED: no runtime adapter is configured for approved implementation ${implementationRef}`);
    return { capabilityUseOccurrenceRef, implementationRef, transport };
  });
  return { resolutions, evidenceRefs: resolutions.flatMap((item) => [`capability-use:${item.capabilityUseOccurrenceRef}`, `implementation-ref:${item.implementationRef}`, `capability-transport:${item.transport.transportRef}`]) };
}
function verifyProgramDigest(program: CompiledGenericRuntimeProgram): void {
  const { programDigest, ...material } = program;
  if (!programDigest.trim() || digestDeterministicJson(material) !== programDigest) throw new TypeError('TALOS_RUNTIME_RECOVERED_PROGRAM_DIGEST_MISMATCH');
}
function resolveRecoveredCapabilityTransports(input: TalosRecoveredRuntimeDeployment, resolver?: TalosProductCapabilityTransportResolver): ResolvedProductCapabilityTransport[] {
  const useRefs = invocationUseRefs(input.program);
  const byUse = new Map(input.capabilityBindings.map((item) => [item.capabilityUseOccurrenceRef, item.implementationRef]));
  if (byUse.size !== input.capabilityBindings.length) throw new TypeError('TALOS_RUNTIME_RECOVERY_DUPLICATE_CAPABILITY_BINDING');
  if (input.capabilityBindings.some((item) => !useRefs.includes(item.capabilityUseOccurrenceRef))) throw new TypeError('TALOS_RUNTIME_RECOVERY_EXTRA_CAPABILITY_BINDING');
  if (useRefs.length === 0) return [];
  if (!resolver) throw new TypeError('TALOS_RUNTIME_RECOVERY_CAPABILITY_RESOLVER_REQUIRED');
  return useRefs.map((capabilityUseOccurrenceRef) => {
    const implementationRef = byUse.get(capabilityUseOccurrenceRef)?.trim();
    if (!implementationRef) throw new TypeError(`TALOS_RUNTIME_RECOVERY_CAPABILITY_BINDING_MISSING: ${capabilityUseOccurrenceRef}`);
    const transport = resolver.resolve({ capabilityUseOccurrenceRef, implementationRef });
    if (!transport) throw new TypeError(`TALOS_RUNTIME_RECOVERY_TRANSPORT_UNRESOLVED: ${implementationRef}`);
    return { capabilityUseOccurrenceRef, implementationRef, transport };
  });
}
function requiresDetachedLifecycle(program: CompiledGenericRuntimeProgram): boolean { return program.graph.elements.some((element) => element.kind === 'HUMAN_COORDINATION' || element.kind === 'WAIT_COORDINATION' || element.constructKinds.includes('DURABLE_TIMER')); }

export function createTalosProductTemporalRuntimeAdapters(target: TalosPrivatePreviewTemporalTarget, options: TalosProductTemporalRuntimeOptions = {}): TalosManagedTemporalRuntimeAdapters {
  let clientConnection: Connection | undefined;
  let nativeConnection: NativeConnection | undefined = options.nativeConnection;
  let client: Client | undefined = options.client;
  const ownsNativeConnection = !options.nativeConnection;
  const ownsClientConnection = !options.client;
  const deployments = new Map<string, ActiveDeployment>();
  let queueWorker: ActiveQueueWorker | undefined;
  let closing = false;
  async function ensureConnections() {
    if (closing) throw new TypeError('TALOS_RUNTIME_CLOSING: runtime adapter is shutting down');
    if (!client) { clientConnection = await Connection.connect({ address: target.address }); client = new Client({ connection: clientConnection, namespace: target.namespace }); }
    if (!nativeConnection) nativeConnection = await NativeConnection.connect({ address: target.address });
    return { nativeConnection, client };
  }
  async function ensureQueueWorker(resolutions: ResolvedProductCapabilityTransport[], identity: string): Promise<ActiveQueueWorker> {
    if (queueWorker) { queueWorker.dispatch.addMany(resolutions); return queueWorker; }
    const connections = await ensureConnections();
    const ledger = new GenericEffectLedger();
    const dispatch = new ProductCapabilityDispatchTransport(resolutions);
    const runtime = await createGenericTemporalWorker({ connection: connections.nativeConnection, namespace: target.namespace, taskQueue: target.taskQueue, identity, ledger, capabilityTransport: dispatch });
    const runPromise = runtime.worker.run();
    const startupState = await Promise.race([runPromise.then(() => 'STOPPED' as const), new Promise<'RUNNING'>((resolve) => setTimeout(() => resolve('RUNNING'), 150))]);
    if (startupState !== 'RUNNING') throw new TypeError('TALOS_RUNTIME_WORKER_START_FAILED: queue Worker stopped before deployment proof completed');
    queueWorker = { runtime, runPromise, ledger, dispatch };
    return queueWorker;
  }
  async function assertReachable() {
    const connections = await ensureConnections();
    await connections.client.workflowService.describeNamespace({ namespace: target.namespace });
    return { namespace: target.namespace, workerIdentity: `talos-product-runtime@${target.address}`, sdkVersion: TALOS_PRODUCT_SDK_VERSION };
  }
  async function deploymentAttemptExecutor(input: OneAppDeploymentAttemptExecutorInput): Promise<OneAppDeploymentAttemptExecutorResult> {
    const { context, deploymentApprovalId, startedAt } = input;
    if (context.deploymentApproval?.id !== deploymentApprovalId) throw new TypeError('TALOS_RUNTIME_DEPLOYMENT_APPROVAL_MISMATCH: executor requires the exact deployment approval');
    assertTargetMatchesRealization(context, target);
    const realization = context.deploymentRealization!;
    if (deployments.has(realization.revision.id)) throw new TypeError('TALOS_RUNTIME_DEPLOYMENT_ALREADY_ACTIVE: realized deployment already registered on the queue Worker');
    const program = compileApprovedProgram(context);
    if (program.deploymentRevisionRef !== realization.revision.parentDeploymentRevisionRef) throw new TypeError('TALOS_RUNTIME_PROGRAM_DEPLOYMENT_MISMATCH: compiled program is not based on the realized deployment parent');
    const capability = resolveFreshCapabilityTransports(context, program, options.capabilityTransportResolver);
    await ensureQueueWorker(capability.resolutions, `talos-product-worker:${target.taskQueue}`);
    deployments.set(realization.revision.id, { deploymentRevisionId: realization.revision.id, program, taskQueue: target.taskQueue });
    return { completedAt: new Date().toISOString(), result: 'SUCCEEDED', diagnosticRefs: [], evidenceRefs: [`talos-runtime:${TALOS_PRODUCT_TEMPORAL_RUNTIME_VERSION}`, `temporal-address:${target.address}`, `temporal-namespace:${target.namespace}`, `task-queue:${target.taskQueue}`, `runtime-program:${program.programDigest}`, `worker-artifact-sha256:${workerArtifactDigest()}`, ...capability.evidenceRefs, `started:${startedAt}`], orchestratorRef: TALOS_PRODUCT_TEMPORAL_RUNTIME_VERSION };
  }
  async function recoverDeployment(input: TalosRecoveredRuntimeDeployment) {
    const realizedDeploymentRevisionId = input.realizedDeploymentRevisionId.trim();
    if (!realizedDeploymentRevisionId) throw new TypeError('TALOS_RUNTIME_RECOVERY_DEPLOYMENT_ID_REQUIRED');
    if (input.namespace !== target.namespace) throw new TypeError('TALOS_RUNTIME_RECOVERY_NAMESPACE_MISMATCH');
    if (input.taskQueue !== target.taskQueue) throw new TypeError('TALOS_RUNTIME_RECOVERY_TASK_QUEUE_MISMATCH');
    verifyProgramDigest(input.program);
    const existing = deployments.get(realizedDeploymentRevisionId);
    if (existing) {
      if (existing.program.programDigest !== input.program.programDigest) throw new TypeError('TALOS_RUNTIME_RECOVERY_DEPLOYMENT_CONFLICT');
      return { realizedDeploymentRevisionId, programDigest: existing.program.programDigest, evidenceRefs: [`recovered-deployment:${realizedDeploymentRevisionId}`, `runtime-program:${existing.program.programDigest}`] };
    }
    const resolutions = resolveRecoveredCapabilityTransports(input, options.capabilityTransportResolver);
    await ensureQueueWorker(resolutions, `talos-recovered-worker:${target.taskQueue}`);
    deployments.set(realizedDeploymentRevisionId, { deploymentRevisionId: realizedDeploymentRevisionId, program: input.program, taskQueue: target.taskQueue });
    return { realizedDeploymentRevisionId, programDigest: input.program.programDigest, evidenceRefs: [`recovered-deployment:${realizedDeploymentRevisionId}`, `runtime-program:${input.program.programDigest}`, `temporal-namespace:${target.namespace}`, `task-queue:${target.taskQueue}`] };
  }
  async function workflowExecutionExecutor(input: OneAppWorkflowExecutionExecutorInput): Promise<OneAppWorkflowExecutionExecutorResult> {
    const { context, workflowExecutionApprovalId, executionId, facts, capabilityInputs, startedAt } = input;
    if (context.workflowExecutionApproval?.id !== workflowExecutionApprovalId) throw new TypeError('TALOS_RUNTIME_EXECUTION_APPROVAL_MISMATCH: executor requires the exact workflow execution approval');
    assertTargetMatchesRealization(context, target);
    const realization = context.deploymentRealization!;
    const active = deployments.get(realization.revision.id);
    if (!active || !queueWorker) throw new TypeError('TALOS_RUNTIME_WORKER_NOT_ACTIVE: approved deployment is not registered on the queue Worker');
    const connections = await ensureConnections();
    const workflowId = `talos-${executionId}`;
    const handle = await connections.client.workflow.start(TalosGenericWorkflow, { workflowId, taskQueue: active.taskQueue, args: [{ executionId, facts, ...(capabilityInputs ? { capabilityInputs } : {}), program: active.program }], retry: { maximumAttempts: active.program.workflow.workflowMaximumAttempts } });
    const description = await handle.describe();
    const runId = (description as any).runId ?? (handle as any).firstExecutionRunId;
    if (!runId) throw new TypeError('TALOS_RUNTIME_RUN_ID_MISSING: Temporal execution did not expose a concrete run id');
    const commonEvidence = [`workflow-id:${workflowId}`, `run-id:${runId}`, `runtime-program:${active.program.programDigest}`, `started:${startedAt}`];
    if (requiresDetachedLifecycle(active.program)) return { workflowExecutionRef: `temporal:${workflowId}:${runId}`, workflowIdRef: workflowId, runIdRef: String(runId), executionStatus: 'RUNNING', evidenceRefs: [...commonEvidence, 'temporal-status:RUNNING'] };
    const result = await handle.result();
    if (result.outcome !== 'COMPLETED' || result.executionId !== executionId) throw new TypeError('TALOS_RUNTIME_WORKFLOW_RESULT_INVALID: Temporal returned an unexpected terminal result');
    const effectEvidence = result.capabilityResults.flatMap((item) => [...(item.transportRef ? [`transport:${item.transportRef}`] : []), ...(item.externalEffectRef ? [`external-effect:${item.externalEffectRef}`] : []), ...(item.evidenceRefs ?? [])]);
    return { completedAt: new Date().toISOString(), workflowExecutionRef: `temporal:${workflowId}:${runId}`, workflowIdRef: workflowId, runIdRef: String(runId), executionStatus: 'COMPLETED', evidenceRefs: [...commonEvidence, `outcome:${result.outcome}`, ...(result.humanSubmissions ?? []).flatMap((submission) => [`human-submission:${submission.submissionId}`, `human-outcome:${submission.outcomeCode}`, `human-element:${submission.executionElementRef}`]), ...effectEvidence] };
  }
  async function close(): Promise<void> {
    if (closing) return;
    closing = true;
    if (queueWorker) { queueWorker.runtime.worker.shutdown(); await Promise.allSettled([queueWorker.runPromise]); queueWorker = undefined; }
    deployments.clear();
    if (ownsNativeConnection && nativeConnection) await nativeConnection.close();
    if (ownsClientConnection && clientConnection) await clientConnection.close();
    nativeConnection = undefined; clientConnection = undefined; client = undefined;
  }
  return { assertReachable, deploymentAttemptExecutor, workflowExecutionExecutor, recoverDeployment, close };
}
