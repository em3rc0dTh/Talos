import { createHash } from 'node:crypto';
import { Connection, Client } from '@temporalio/client';
import { digestDeterministicJson } from '../../../packages/foundation/src/digest.ts';
import { compileGenericRuntimeProgram } from '../../../workers/reference-temporal-worker/src/generic-compile-runtime-program.ts';
import type { CompiledGenericRuntimeProgram } from '../../../workers/reference-temporal-worker/src/generic-contracts.ts';
import { connectGenericTemporalWorker } from '../../../workers/reference-temporal-worker/src/generic-worker-runtime.ts';
import { TalosGenericWorkflow } from '../../../workers/reference-temporal-worker/src/generic-workflow.ts';
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

const product = await startTalosOneAppProduct({
  host,
  port,
  oneApp: {
    runtimeDir,
    deploymentAttemptExecutor: async ({ context, deploymentApprovalId, startedAt }) => {
      if (!context.executionReview || !context.mapping || !context.runtimePolicy || !context.deploymentDesign || !context.deploymentRealization) {
        throw new TypeError('R1-11 local deployment requires reviewed execution, mapping, RuntimePolicy, deployment design and realization');
      }
      const waitElements = context.executionReview.execution.elements.filter((element) => element.kind === 'WAIT_COORDINATION');
      if (waitElements.length > 0) {
        throw new TypeError('R1-11 local Temporal host does not invent wait durations; materialize wait semantics explicitly or record this trial as BLOCKED_BY_OPERATOR');
      }
      const realizedNamespace = context.deploymentRealization.namespaceBinding.namespaceLocatorRef;
      if (realizedNamespace !== temporalNamespace) {
        throw new TypeError(`R1-11 local Temporal namespace mismatch: realized ${realizedNamespace}, configured ${temporalNamespace}`);
      }
      const taskQueue = context.deploymentRealization.taskQueueBindings[0]?.taskQueueKey;
      if (!taskQueue) throw new TypeError('R1-11 local deployment realization has no task queue binding');
      const workflowType = context.deploymentRealization.workflowTypeBindings[0]?.workflowTypeName;
      if (workflowType !== 'TalosGenericWorkflow') {
        throw new TypeError(`R1-11 local host supports TalosGenericWorkflow; realized ${workflowType ?? 'none'}`);
      }

      const conditionRules = context.process.rules.map((rule) => ({ ref: rule.id, expression: rule.expression }));
      const waits: [] = [];
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
      const result = await handle.result();
      if (result.outcome !== 'COMPLETED') throw new TypeError(`R1-11 local workflow returned ${String(result.outcome)}`);
      const description = await handle.describe();
      const runId = (description as any).runId ?? (handle as any).firstExecutionRunId;
      if (!runId) throw new TypeError('R1-11 local Temporal execution did not expose a run id');
      return {
        completedAt: new Date().toISOString(),
        workflowExecutionRef: `temporal:${workflowId}:${String(runId)}`,
        workflowIdRef: workflowId,
        runIdRef: String(runId),
        executionStatus: 'COMPLETED' as const,
        evidenceRefs: [
          `field-trial:execution-approval:${workflowExecutionApprovalId}`,
          `workflow-id:${workflowId}`,
          `run-id:${String(runId)}`,
          `runtime-program:${runtime.program.programDigest}`,
          `started:${startedAt}`,
        ],
      };
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
