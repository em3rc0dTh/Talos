import {
  startTalosPrivatePreview,
} from './private-preview-server.ts';
import {
  resolveTalosPrivatePreviewRuntimeBinding,
  type TalosPrivatePreviewRuntimeDescriptor,
} from './private-preview-config.ts';
import type {
  OneAppDeploymentAttemptExecutorInput,
  OneAppDeploymentAttemptExecutorResult,
  OneAppWorkflowExecutionExecutorInput,
  OneAppWorkflowExecutionExecutorResult,
} from './one-app-server.ts';

type Environment = Readonly<Record<string, string | undefined>>;

export interface TalosPrivatePreviewRuntimeAdapters {
  deploymentAttemptExecutor: (
    input: OneAppDeploymentAttemptExecutorInput,
  ) => Promise<OneAppDeploymentAttemptExecutorResult>;
  workflowExecutionExecutor: (
    input: OneAppWorkflowExecutionExecutorInput,
  ) => Promise<OneAppWorkflowExecutionExecutorResult>;
}

export interface TalosPrivatePreviewFromEnvOptions {
  port?: number;
  runtimeDir?: string;
  imagePerceptionFetchImpl?: typeof fetch;
  runtimeAdapters?: TalosPrivatePreviewRuntimeAdapters;
}

export async function startTalosPrivatePreviewFromEnv(
  env: Environment = process.env,
  options: TalosPrivatePreviewFromEnvOptions = {},
) {
  const binding = resolveTalosPrivatePreviewRuntimeBinding(env);
  const start = binding.createStartConfiguration();
  const runtimeMode = binding.descriptor.runtimeMode;

  if (runtimeMode === 'DESIGN_ONLY' && options.runtimeAdapters) {
    throw new TypeError('R0_PREVIEW_CONFIG_CONFLICT: runtime adapters are forbidden in DESIGN_ONLY mode');
  }
  if (runtimeMode === 'TEMPORAL_EXECUTION' && !options.runtimeAdapters) {
    throw new TypeError('R0_PREVIEW_RUNTIME_ADAPTERS_REQUIRED: TEMPORAL_EXECUTION mode requires deployment and workflow execution adapters');
  }

  const app = await startTalosPrivatePreview({
    port: options.port,
    host: start.host,
    access: start.access,
    requestPolicy: start.requestPolicy,
    releaseGate: 'R0-02_PREVIEW_CONFIGURATION_SECRET_CONTRACT',
    oneApp: {
      ...(options.runtimeDir ? { runtimeDir: options.runtimeDir } : {}),
      imagePerceptionEnv: start.imagePerceptionEnv,
      ...(options.imagePerceptionFetchImpl ? { imagePerceptionFetchImpl: options.imagePerceptionFetchImpl } : {}),
      ...(options.runtimeAdapters ?? {}),
    },
  });

  return {
    ...app,
    runtimeDescriptor: binding.descriptor as Readonly<TalosPrivatePreviewRuntimeDescriptor>,
  };
}
