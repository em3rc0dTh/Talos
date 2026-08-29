import {
  IMAGE_PERCEPTION_FALLBACK_RUNTIME_ENV,
  resolveImagePerceptionFallbackRuntimeBinding,
  resolveOllamaImageFallbackRuntime,
} from '../../../packages/image-perception/src/index.ts';
import type { AutomationProposalOfferingCandidate } from '../../../packages/capability/src/index.ts';
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
  imagePerceptionFallbackFetchImpl?: typeof fetch;
  geminiBaseFetchImpl?: typeof fetch;
  ollamaBaseFetchImpl?: typeof fetch;
  automationDesignFetchImpl?: typeof fetch;
  automationDesignFallbackFetchImpl?: typeof fetch;
  automationOfferings?: readonly AutomationProposalOfferingCandidate[];
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

  const imagePerceptionEnv: Record<string, string | undefined> = { ...start.imagePerceptionEnv };
  let fallbackFetchImpl = options.imagePerceptionFallbackFetchImpl;
  if (binding.descriptor.imageMode === 'REQUIRED') {
    const explicitFallback = resolveImagePerceptionFallbackRuntimeBinding(imagePerceptionEnv);
    if (explicitFallback.status !== 'CONFIGURED') {
      const ollama = resolveOllamaImageFallbackRuntime(env, options.ollamaBaseFetchImpl ?? fetch);
      if (ollama.status === 'CONFIGURED') {
        const descriptor = ollama.binding.descriptor;
        imagePerceptionEnv[IMAGE_PERCEPTION_FALLBACK_RUNTIME_ENV.endpoint] = descriptor.endpoint;
        imagePerceptionEnv[IMAGE_PERCEPTION_FALLBACK_RUNTIME_ENV.providerId] = descriptor.providerId;
        imagePerceptionEnv[IMAGE_PERCEPTION_FALLBACK_RUNTIME_ENV.providerVersion] = descriptor.providerVersion;
        imagePerceptionEnv[IMAGE_PERCEPTION_FALLBACK_RUNTIME_ENV.modelRef] = descriptor.modelRef;
        imagePerceptionEnv[IMAGE_PERCEPTION_FALLBACK_RUNTIME_ENV.modelVersion] = descriptor.modelVersion;
        imagePerceptionEnv[IMAGE_PERCEPTION_FALLBACK_RUNTIME_ENV.pipelineVersion] = descriptor.pipelineVersion;
        imagePerceptionEnv[IMAGE_PERCEPTION_FALLBACK_RUNTIME_ENV.timeoutMs] = String(descriptor.timeoutMs);
        imagePerceptionEnv[IMAGE_PERCEPTION_FALLBACK_RUNTIME_ENV.providerClass] = descriptor.providerClass;
        imagePerceptionEnv[IMAGE_PERCEPTION_FALLBACK_RUNTIME_ENV.evidenceMode] = descriptor.evidenceMode;
        fallbackFetchImpl = ollama.fetchImpl;
      }
    }
  }

  const app = await startTalosPrivatePreview({
    port: options.port,
    host: start.host,
    access: start.access,
    requestPolicy: start.requestPolicy,
    releaseGate: 'R0-02_PREVIEW_CONFIGURATION_SECRET_CONTRACT',
    oneApp: {
      ...(options.runtimeDir ? { runtimeDir: options.runtimeDir } : {}),
      imagePerceptionEnv,
      automationDesignEnv: env,
      automationOfferings: [...(options.automationOfferings ?? [])],
      ...(options.geminiBaseFetchImpl ? { geminiBaseFetchImpl: options.geminiBaseFetchImpl } : {}),
      ...(options.imagePerceptionFetchImpl ? { imagePerceptionFetchImpl: options.imagePerceptionFetchImpl } : {}),
      ...(fallbackFetchImpl ? { imagePerceptionFallbackFetchImpl: fallbackFetchImpl } : {}),
      ...(options.automationDesignFetchImpl ? { automationDesignFetchImpl: options.automationDesignFetchImpl } : {}),
      ...(options.automationDesignFallbackFetchImpl ? { automationDesignFallbackFetchImpl: options.automationDesignFallbackFetchImpl } : {}),
      ...(options.runtimeAdapters ?? {}),
    },
  });

  return {
    ...app,
    runtimeDescriptor: binding.descriptor as Readonly<TalosPrivatePreviewRuntimeDescriptor>,
  };
}
