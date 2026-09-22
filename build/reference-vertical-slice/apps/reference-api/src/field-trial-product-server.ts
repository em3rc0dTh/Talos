import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { Connection, Client } from '@temporalio/client';
import { digestDeterministicJson } from '../../../packages/foundation/src/digest.ts';
import { compileGenericRuntimeProgram } from '../../../workers/reference-temporal-worker/src/generic-compile-runtime-program.ts';
import type { CompiledGenericRuntimeProgram } from '../../../workers/reference-temporal-worker/src/generic-contracts.ts';
import { connectGenericTemporalWorker } from '../../../workers/reference-temporal-worker/src/generic-worker-runtime.ts';
import {
  TalosGenericWorkflow,
  completeGenericHumanTask,
  getGenericWorkflowState,
  resolveGenericDecision,
} from '../../../workers/reference-temporal-worker/src/generic-workflow.ts';
import { startTalosOneAppProduct } from './one-app-product-server.ts';

interface DeployedFieldTrialRuntime {
  deploymentRevisionId: string;
  namespace: string;
  taskQueue: string;
  program: CompiledGenericRuntimeProgram;
  workerRuntime: Awaited<ReturnType<typeof connectGenericTemporalWorker>>;
  workerRun: Promise<void>;
}

const host = process.env.HOST?.trim() || '0.0.0.0';
const port = Number(process.env.PORT ?? 8787);
const runtimeDir = process.env.TALOS_RUNTIME_DIR?.trim() || '/data/talos-runtime';
const temporalAddress = process.env.TEMPORAL_ADDRESS?.trim() || 'temporal:7233';
const temporalNamespace = process.env.TEMPORAL_NAMESPACE?.trim() || 'default';
const fieldTrialTaskQueue = process.env.TALOS_FIELD_TRIAL_TASK_QUEUE?.trim() || 'talos-r1-field-trial';
const workerArtifactRef = 'workers/reference-temporal-worker/src/generic-worker-runtime.ts';
const workerArtifactPath = path.resolve(process.cwd(), workerArtifactRef);
const workerSourceDir = path.dirname(workerArtifactPath);
const workerArtifactDigest = (() => {
  const digest = createHash('sha256');
  for (const fileName of readdirSync(workerSourceDir).filter((name) => name.endsWith('.ts')).sort()) {
    digest.update(fileName);
    digest.update('\0');
    digest.update(readFileSync(path.join(workerSourceDir, fileName)));
    digest.update('\0');
  }
  return digest.digest('hex');
})();

async function connectWithRetry<T>(label: string, connect: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      return await connect();
    } catch (error) {
      lastError = error;
      if (attempt < 30) await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
  throw new Error(`${label} was not reachable after 30 attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

const clientConnection = await connectWithRetry(
  `Temporal Client endpoint ${temporalAddress}`,
  () => Connection.connect({ address: temporalAddress }),
);
const temporalClient = new Client({ connection: clientConnection, namespace: temporalNamespace });
const deployed = new Map<string, DeployedFieldTrialRuntime>();

function durationMs(expression: unknown): number {
  if (typeof expression !== 'string') throw new TypeError('R1-11 local runtime requires a textual duration expression');
  const match = /^\s*(\d+(?:[.,]\d+)?)\s*(milliseconds?|ms|seconds?|secs?|segundos?|minutes?|mins?|minutos?|hours?|hrs?|horas?|days?|d[ií]as?)\s*$/i.exec(expression);
  if (!match) throw new TypeError(`R1-11 local runtime cannot safely parse duration: ${expression}`);
  const amount = Number(match[1].replace(',', '.'));
  const unit = match[2].toLowerCase();
  const factor = /^(millisecond|ms)/.test(unit) ? 1
    : /^(second|sec|segundo)/.test(unit) ? 1_000
      : /^(hour|hr|hora)/.test(unit) ? 3_600_000
        : /^(day|d[ií]a)/.test(unit) ? 86_400_000
          : 60_000;
  const value = amount * factor;
  if (!Number.isFinite(value) || value < 0) throw new TypeError(`R1-11 local runtime duration is invalid: ${expression}`);
  return Math.round(value);
}

function executionStatus(description: any): 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' {
  const raw = String(description?.status?.name ?? description?.status ?? '').toUpperCase();
  if (raw.includes('COMPLETED')) return 'COMPLETED';
  if (raw.includes('CANCELLED') || raw.includes('CANCELED') || raw.includes('TERMINATED')) return 'CANCELLED';
  if (raw.includes('FAILED') || raw.includes('TIMED_OUT')) return 'FAILED';
  return 'RUNNING';
}

async function readGenericWorkflowRuntime(workflowIdRef: string, runIdRef: string) {
  const handle = temporalClient.workflow.getHandle(workflowIdRef, runIdRef);
  const [state, description] = await Promise.all([
    handle.query(getGenericWorkflowState),
    handle.describe(),
  ]);
  return {
    executionStatus: executionStatus(description),
    state,
  };
}

function runtimeWaitSnapshot(context: OneAppDeploymentAttemptExecutorInput['context']) {
  if (!context.executionReview) throw new TypeError('R1-11 local runtime requires reviewed execution before wait materialization');
  return context.executionReview.execution.elements
    .filter((element) => element.kind === 'WAIT_COORDINATION')
    .map((element) => {
      const subjectRef = element.semanticSubjectRefs[0];
      const node = context.process.nodes.find((candidate) => candidate.id === subjectRef);
      if (!node || node.kind !== 'WAIT') throw new TypeError('R1-11 local runtime WAIT element lost its exact Canonical semantic subject');
      if (node.details?.waitKind !== 'DURATION') {
        throw new TypeError(`R1-11 local runtime currently requires DURATION waits; ${node.name ?? node.id} is ${String(node.details?.waitKind ?? 'UNRESOLVED')}`);
      }
      return {
        executionElementRef: element.id,
        durationMs: durationMs(node.details?.expression),
        sourceRef: node.id,
      };
    });
}


const product = await startTalosOneAppProduct({
  host,
  port,
  simpleRuntimeTarget: {
    environmentKey: 'talos-local-field-trial',
    environmentClass: 'TEST',
    temporalPlatformRef: 'TEMPORAL_LOCAL_DOCKER',
    namespace: temporalNamespace,
    taskQueue: fieldTrialTaskQueue,
    workflowTypeName: 'TalosGenericWorkflow',
    activityTypeName: 'executeGenericCapability',
    workerLogicalName: 'talos-r1-field-trial-worker',
    executableArtifactRef: workerArtifactRef,
    artifactDigest: workerArtifactDigest,
    sdkFamily: 'TEMPORAL_TYPESCRIPT_SDK',
    sdkVersionRef: '1.22.0',
    temporalWebUi: 'http://localhost:18233',
  },
  oneApp: {
    runtimeDir,
    deploymentAttemptExecutor: async ({ context, deploymentApprovalId, startedAt }) => {
      if (!context.executionReview || !context.mapping || !context.runtimePolicy || !context.deploymentDesign || !context.deploymentRealization) {
        throw new TypeError('R1-11 local deployment requires reviewed execution, mapping, RuntimePolicy, deployment design and realization');
      }
      const waits = runtimeWaitSnapshot(context);
      const realizedNamespaceLocator = context.deploymentRealization.namespaceBinding.namespaceLocatorRef;
      const realizedNamespace = realizedNamespaceLocator.startsWith('temporal-namespace:')
        ? realizedNamespaceLocator.slice('temporal-namespace:'.length)
        : realizedNamespaceLocator;
      if (realizedNamespace !== temporalNamespace) {
        throw new TypeError(`R1-11 local Temporal namespace mismatch: realized ${realizedNamespaceLocator}, configured ${temporalNamespace}`);
      }
      const taskQueue = context.deploymentRealization.taskQueueBindings[0]?.taskQueueKey;
      if (!taskQueue) throw new TypeError('R1-11 local deployment realization has no task queue binding');
      const workflowType = context.deploymentRealization.workflowTypeBindings[0]?.workflowTypeName;
      if (workflowType !== 'TalosGenericWorkflow') {
        throw new TypeError(`R1-11 local host supports TalosGenericWorkflow; realized ${workflowType ?? 'none'}`);
      }

      const conditionRules = context.process.rules.map((rule) => ({ ref: rule.id, expression: rule.expression }));
      const semantics = {
        conditionRules,
        waits,
        snapshotDigest: digestDeterministicJson({ conditionRules, waits }),
      };
      const program = compileGenericRuntimeProgram(
        context.executionReview.execution,
        context.mapping,
        context.runtimePolicy,
        context.deploymentDesign,
        semantics,
        { family: 'TEMPORAL_TYPESCRIPT_SDK', version: '1.22.0' },
      );
      const deploymentRevisionId = context.deploymentRealization.revision.id;
      if (deployed.has(deploymentRevisionId)) {
        throw new TypeError('R1-11 local deployment revision already has a running Worker');
      }
      const workerRuntime = await connectGenericTemporalWorker({
        address: temporalAddress,
        namespace: temporalNamespace,
        taskQueue,
        identity: `talos-r1-11-${createHash('sha256').update(deploymentRevisionId).digest('hex').slice(0, 12)}`,
      });
      const workerRun = workerRuntime.worker.run();
      const startup = await Promise.race([
        workerRun.then(() => 'STOPPED' as const),
        new Promise<'RUNNING'>((resolve) => setTimeout(() => resolve('RUNNING'), 250)),
      ]);
      if (startup !== 'RUNNING') {
        await workerRuntime.connection.close();
        throw new TypeError('R1-11 local Temporal Worker stopped during startup');
      }
      deployed.set(deploymentRevisionId, {
        deploymentRevisionId,
        namespace: temporalNamespace,
        taskQueue,
        program,
        workerRuntime,
        workerRun,
      });
      return {
        completedAt: new Date().toISOString(),
        result: 'SUCCEEDED' as const,
        diagnosticRefs: [],
        evidenceRefs: [
          `field-trial:deployment-approval:${deploymentApprovalId}`,
          `temporal-address:${temporalAddress}`,
          `namespace:${temporalNamespace}`,
          `task-queue:${taskQueue}`,
          `runtime-program:${program.programDigest}`,
          `started:${startedAt}`,
        ],
        orchestratorRef: 'R1_11_LOCAL_DOCKER_TEMPORAL_HOST',
      };
    },
    workflowExecutionExecutor: async ({ context, workflowExecutionApprovalId, executionId, facts, capabilityInputs, startedAt }) => {
      const deploymentRevisionId = context.deploymentRealization?.revision.id;
      if (!deploymentRevisionId) throw new TypeError('R1-11 local workflow execution requires exact deployment realization');
      const runtime = deployed.get(deploymentRevisionId);
      if (!runtime) throw new TypeError('R1-11 local workflow execution requires the approved local Worker deployment to be running');
      const workflowId = `talos-r1-11-${createHash('sha256').update(`${deploymentRevisionId}:${executionId}`).digest('hex').slice(0, 24)}`;
      const handle = await temporalClient.workflow.start(TalosGenericWorkflow, {
        workflowId,
        taskQueue: runtime.taskQueue,
        args: [{
          executionId,
          facts,
          ...(capabilityInputs ? { capabilityInputs } : {}),
          program: runtime.program,
        }],
        retry: { maximumAttempts: runtime.program.workflow.workflowMaximumAttempts },
      });
      const description = await handle.describe();
      const runId = (description as any).runId ?? (handle as any).firstExecutionRunId;
      if (!runId) throw new TypeError('R1-11 local Temporal execution did not expose a run id');
      return {
        workflowExecutionRef: `temporal:${workflowId}:${String(runId)}`,
        workflowIdRef: workflowId,
        runIdRef: String(runId),
        executionStatus: 'RUNNING' as const,
        evidenceRefs: [
          `field-trial:execution-approval:${workflowExecutionApprovalId}`,
          `workflow-id:${workflowId}`,
          `run-id:${String(runId)}`,
          `runtime-program:${runtime.program.programDigest}`,
          `started:${startedAt}`,
        ],
      };
    },
    workflowRuntimeStateReader: async ({ workflowIdRef, runIdRef }) => {
      return readGenericWorkflowRuntime(workflowIdRef, runIdRef);
    },
    humanTaskExecutor: async ({ workflowIdRef, runIdRef, executionElementRef }) => {
      const handle = temporalClient.workflow.getHandle(workflowIdRef, runIdRef);
      const before = await handle.query(getGenericWorkflowState);
      if (before.currentHumanTaskRef !== executionElementRef) {
        throw new TypeError(`R1-11 human task update is stale: workflow expects ${before.currentHumanTaskRef ?? 'no human task'}`);
      }
      await handle.executeUpdate(completeGenericHumanTask, {
        args: [{ executionElementRef, outcome: 'COMPLETED' }],
      });
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const runtime = await readGenericWorkflowRuntime(workflowIdRef, runIdRef);
        if (runtime.executionStatus !== 'RUNNING'
          || runtime.state.currentHumanTaskRef !== executionElementRef) return runtime;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      return readGenericWorkflowRuntime(workflowIdRef, runIdRef);
    },
    businessDecisionExecutor: async ({ workflowIdRef, runIdRef, decisionRef, applies }) => {
      const handle = temporalClient.workflow.getHandle(workflowIdRef, runIdRef);
      const before = await handle.query(getGenericWorkflowState);
      if (before.currentDecisionRef !== decisionRef) {
        throw new TypeError(`R1-11 business decision update is stale: workflow expects ${before.currentDecisionRef ?? 'no runtime decision'}`);
      }
      await handle.executeUpdate(resolveGenericDecision, {
        args: [{ decisionRef, applies }],
      });
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const runtime = await readGenericWorkflowRuntime(workflowIdRef, runIdRef);
        if (runtime.executionStatus !== 'RUNNING'
          || runtime.state.currentDecisionRef !== decisionRef) return runtime;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      return readGenericWorkflowRuntime(workflowIdRef, runIdRef);
    },
  },
});

console.log(`\nTALOS R1-11 local field-trial product is ready: ${product.baseUrl}`);
console.log(`Temporal endpoint: ${temporalAddress} · namespace: ${temporalNamespace}`);
console.log('Local Temporal execution is trusted only for this field-trial host; no external capability transport is enabled automatically.\n');

let stopping = false;
async function stop(): Promise<void> {
  if (stopping) return;
  stopping = true;
  await product.close();
  for (const runtime of deployed.values()) runtime.workerRuntime.worker.shutdown();
  await Promise.allSettled([...deployed.values()].map((runtime) => runtime.workerRun));
  await Promise.allSettled([...deployed.values()].map((runtime) => runtime.workerRuntime.connection.close()));
  await Promise.resolve(clientConnection.close());
}

const onSignal = () => {
  stop().then(() => process.exit(0), (error) => {
    console.error(error);
    process.exit(1);
  });
};
process.on('SIGINT', onSignal);
process.on('SIGTERM', onSignal);
