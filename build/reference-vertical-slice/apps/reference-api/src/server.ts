import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { SqliteDocumentStore } from '../../../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { buildReferenceVerticalSlice } from '../../../packages/application/src/reference-vertical-slice.ts';
import { compileReferenceRuntimeProgram } from '../../../workers/reference-temporal-worker/src/compile-runtime-program.ts';
import { createReferenceTemporalWorker } from '../../../workers/reference-temporal-worker/src/worker-runtime.ts';
import {
  TalosReferenceApprovalWorkflow,
  getReferenceApprovalState,
  submitReferenceReviewDecision,
} from '../../../workers/reference-temporal-worker/src/workflow.ts';
import { deriveReferenceEmailIdempotencyKey } from '../../../packages/reference-email-sink/src/reference-email-sink.ts';
import { referenceDemoHtml } from './ui.ts';

export interface StartReferenceDemoOptions {
  port?: number;
  hostname?: string;
  runtimeDir?: string;
  injectTransientFailure?: boolean;
}

interface RequestRecord {
  referenceRequestId: string;
  workflowId: string;
  recipientEmail: string;
  startedAt: string;
}

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (chunks.length === 0) return {};
  const text = Buffer.concat(chunks).toString('utf8');
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new TypeError('JSON object required');
  return parsed as Record<string, unknown>;
}

function findManager(processRevision: any): string {
  const review = processRevision.nodes.find((node: any) => node.name === 'Review request');
  const actor = processRevision.actors.find((candidate: any) => review?.actorRefs?.includes(candidate.id));
  return actor?.name ?? 'UNKNOWN';
}

function summarizeHistory(history: any) {
  const events = history.events ?? [];
  const started = events.find((event: any) => event.activityTaskStartedEventAttributes);
  return {
    eventCount: events.length,
    activityScheduled: events.some((event: any) => Boolean(event.activityTaskScheduledEventAttributes)),
    activityAttempt: started?.activityTaskStartedEventAttributes?.attempt ?? null,
    activityCompleted: events.some((event: any) => Boolean(event.activityTaskCompletedEventAttributes)),
    workflowCompleted: events.some((event: any) => Boolean(event.workflowExecutionCompletedEventAttributes)),
  };
}

export async function startReferenceDemo(options: StartReferenceDemoOptions = {}) {
  const port = options.port ?? 8787;
  const hostname = options.hostname ?? '127.0.0.1';
  const runtimeDir = options.runtimeDir ?? path.resolve(fileURLToPath(new URL('../../../.runtime/', import.meta.url)));
  mkdirSync(runtimeDir, { recursive: true });

  const talosDbPath = path.join(runtimeDir, 'talos-state.sqlite');
  const providerDbPath = path.join(runtimeDir, 'reference-email-sink.sqlite');
  const talosStore = new SqliteDocumentStore(talosDbPath);
  const slice = buildReferenceVerticalSlice(talosStore);
  const program = compileReferenceRuntimeProgram(
    slice.execution,
    slice.mapping,
    slice.policy,
    slice.deployment,
    { family: 'TEMPORAL_TYPESCRIPT_SDK', version: '1.22.0' },
  );

  const temporal = await TestWorkflowEnvironment.createLocal({
    server: { namespace: program.deploymentIntent.desiredNamespaceKey },
  });
  const workerRuntime = await createReferenceTemporalWorker({
    connection: temporal.nativeConnection,
    namespace: temporal.namespace,
    taskQueue: program.deploymentIntent.desiredTaskQueueKey,
    providerDbPath,
    identity: program.deploymentIntent.desiredWorkerLogicalName,
    failurePlan: {
      transientFailuresBeforeSuccess: options.injectTransientFailure === false ? 0 : 1,
    },
  });
  const workerRun = workerRuntime.worker.run();
  workerRun.catch((error) => {
    console.error('[Talos reference worker failed]', error);
  });

  const requests = new Map<string, RequestRecord>();

  const baseline = () => {
    const initialReviewNode = slice.initial.processRevision.nodes.find((node: any) => node.name === 'Review request');
    const initialFindingCodes = slice.initial.validation.findings.map((finding: any) => finding.code);
    const humanKinds = slice.mapping.units
      .filter((unit: any) => unit.executionSubjectRefs.some((ref: string) =>
        slice.execution.elements.some((element: any) => element.id === ref && element.kind === 'HUMAN_COORDINATION')))
      .map((unit: any) => unit.constructKind)
      .sort();
    return {
      source: {
        canvasRevisionId: slice.source.initialCanvasRevision.id,
        reviewActorPropertyState: (slice.source.initialCanvasRevision.elements.find((item: any) => item.canvasElementId === initialReviewNode?.sourceExtensionRefs?.[0]) as any)?.propertyValues?.actor?.state ?? 'UNKNOWN',
      },
      initial: {
        processRevisionId: slice.initial.processRevision.id,
        readiness: slice.initial.validation.assessment.executionReadiness,
        findingCodes: initialFindingCodes,
        actor: findManager(slice.initial.processRevision),
      },
      corrected: {
        processRevisionId: slice.correction.candidateProcessRevision!.id,
        readiness: slice.correction.candidateValidation!.assessment.executionReadiness,
        actor: findManager(slice.correction.candidateProcessRevision),
      },
      freeze: {
        id: slice.freeze.record.id,
        kind: slice.freeze.record.freezeKind,
        disposition: slice.freeze.scope.disposition,
      },
      capability: {
        designRevisionId: slice.capability.designRevision.id,
        offering: slice.capability.offeringDefinition.canonicalName,
        bindingState: slice.capability.bindingRevision.bindingState,
        runtimeInput: 'recipientEmail',
      },
      execution: {
        revisionId: slice.execution.revision.id,
        readiness: slice.execution.assessment.readiness,
        runtimeInput: 'notificationRecipientEmail',
      },
      temporal: {
        mappingRevisionId: slice.mapping.revision.id,
        humanMapping: humanKinds.join(' + '),
        activityType: program.activity.activityTypeName,
        retryMaximumAttempts: program.activity.retry.maximumAttempts,
        taskQueue: program.deploymentIntent.desiredTaskQueueKey,
        namespace: temporal.namespace ?? program.deploymentIntent.desiredNamespaceKey,
        sdkVersion: program.sdkTarget.version,
        programDigest: program.programDigest,
      },
    };
  };

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? `${hostname}:${port}`}`);
    try {
      if (request.method === 'GET' && url.pathname === '/') {
        response.writeHead(200, {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
        });
        response.end(referenceDemoHtml);
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/health') {
        json(response, 200, {
          status: 'READY',
          temporalSdkVersion: program.sdkTarget.version,
          namespace: temporal.namespace ?? program.deploymentIntent.desiredNamespaceKey,
          taskQueue: program.deploymentIntent.desiredTaskQueueKey,
          workerState: workerRuntime.worker.getState(),
          talosStateDb: path.basename(talosDbPath),
          providerEffectDb: path.basename(providerDbPath),
        });
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/baseline') {
        json(response, 200, baseline());
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/processes') {
        const body = await readJson(request);
        const recipientEmail = typeof body.recipientEmail === 'string' ? body.recipientEmail.trim() : '';
        if (!recipientEmail.includes('@')) {
          json(response, 400, { error: 'A valid runtime recipient email is required.' });
          return;
        }
        const referenceRequestId = `REQ-${randomUUID()}`;
        const workflowId = `talos-reference-${referenceRequestId}`;
        const handle = await temporal.client.workflow.start(TalosReferenceApprovalWorkflow, {
          workflowId,
          taskQueue: program.deploymentIntent.desiredTaskQueueKey,
          args: [{ referenceRequestId, notificationRecipientEmail: recipientEmail, program }],
          retry: { maximumAttempts: program.workflow.workflowMaximumAttempts },
        });
        const record: RequestRecord = {
          referenceRequestId,
          workflowId,
          recipientEmail,
          startedAt: new Date().toISOString(),
        };
        requests.set(referenceRequestId, record);
        const reviewState = await handle.query(getReferenceApprovalState);
        json(response, 201, { ...record, reviewState });
        return;
      }

      const reviewMatch = /^\/api\/processes\/([^/]+)\/review$/.exec(url.pathname);
      if (request.method === 'POST' && reviewMatch) {
        const referenceRequestId = decodeURIComponent(reviewMatch[1]);
        const record = requests.get(referenceRequestId);
        if (!record) {
          json(response, 404, { error: 'Unknown reference request in this app session.' });
          return;
        }
        const body = await readJson(request);
        const outcome = body.outcome === 'APPROVED' || body.outcome === 'REJECTED' ? body.outcome : undefined;
        if (!outcome) {
          json(response, 400, { error: 'outcome must be APPROVED or REJECTED' });
          return;
        }
        const comment = typeof body.comment === 'string' && body.comment.length > 0 ? body.comment : undefined;
        const handle = temporal.client.workflow.getHandle(record.workflowId);
        const reviewState = await handle.executeUpdate(submitReferenceReviewDecision, {
          args: [{ outcome, ...(comment ? { comment } : {}) }],
        });
        const result = await handle.result();
        const description = await handle.describe();
        const history = await handle.fetchHistory();
        const expectedKey = deriveReferenceEmailIdempotencyKey(
          referenceRequestId,
          program.activity.capabilityUseOccurrenceRef,
        );
        const providerEffects = workerRuntime.providerStore.list().filter((effect) => effect.idempotencyKey === expectedKey);
        json(response, 200, {
          referenceRequestId,
          workflowId: record.workflowId,
          reviewState,
          result,
          temporal: {
            firstExecutionRunId: handle.firstExecutionRunId,
            descriptionStatus: (description as any).status?.name ?? (description as any).status ?? 'COMPLETED',
            history: summarizeHistory(history),
          },
          providerEffects,
        });
        return;
      }

      json(response, 404, { error: 'Not found' });
    } catch (error) {
      console.error('[Talos reference API]', error);
      json(response, 500, { error: error instanceof Error ? error.message : String(error) });
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, hostname, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  const baseUrl = `http://${hostname}:${actualPort}`;

  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    workerRuntime.worker.shutdown();
    await workerRun.catch(() => undefined);
    workerRuntime.closeProvider();
    await temporal.teardown();
    talosStore.close();
  };

  return {
    baseUrl,
    port: actualPort,
    baseline: baseline(),
    close,
  };
}

async function main() {
  const demo = await startReferenceDemo();
  console.log(`\nTALOS reference vertical slice is ready: ${demo.baseUrl}\n`);
  const shutdown = async () => {
    process.off('SIGINT', onSignal);
    process.off('SIGTERM', onSignal);
    await demo.close();
  };
  const onSignal = () => {
    shutdown().then(() => process.exit(0), (error) => {
      console.error(error);
      process.exit(1);
    });
  };
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
