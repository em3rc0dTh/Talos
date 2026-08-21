import http from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  BpmnWorkspaceService,
  NativeBpmnCanonicalReconciliationService,
  NaturalLanguageBpmnCorrectionService,
  applyConfirmedBpmnFreezeHandoff,
  createHttpBpmnCorrectionService,
  type NativeBpmnCanonicalReconciliationResult,
} from '../../../packages/application/src/index.ts';
import { createOpaqueId, type OpaqueId } from '../../../packages/foundation/src/ids.ts';
import { LocalImageByteStore } from '../../../packages/image-perception/src/byte-store.ts';
import { SqliteDocumentStore } from '../../../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { PROCESS_CONFIRMATION_PAGE } from './process-confirmation-page.ts';

export interface WorkspaceServerOptions {
  port?: number;
  host?: string;
  runtimeDir?: string;
  bpmnCorrectionEndpoint?: string;
  bpmnCorrectionTimeoutMs?: number;
  bpmnCorrectionHeaders?: Readonly<Record<string, string>>;
}

const MAX_JSON_BYTES = 20 * 1024 * 1024;
type ReconciledBinding = Extract<NativeBpmnCanonicalReconciliationResult, { status: 'RECONCILED' }>;

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
    if (total > MAX_JSON_BYTES) throw new TypeError('Request payload exceeds the Talos workspace limit');
    chunks.push(buffer);
  }
  if (!chunks.length) return {};
  const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new TypeError('Expected a JSON object');
  return parsed as Record<string, unknown>;
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${field} must be a non-empty string`);
  return value;
}

function mimeType(filePath: string): string {
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.woff2')) return 'font/woff2';
  if (filePath.endsWith('.woff')) return 'font/woff';
  if (filePath.endsWith('.ttf')) return 'font/ttf';
  if (filePath.endsWith('.eot')) return 'application/vnd.ms-fontobject';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function serveBpmnJs(pathname: string, res: http.ServerResponse): boolean {
  const prefix = '/vendor/bpmn-js/';
  if (!pathname.startsWith(prefix)) return false;
  const distRoot = path.resolve(process.cwd(), 'node_modules/bpmn-js/dist');
  const relative = decodeURIComponent(pathname.slice(prefix.length));
  const filePath = path.resolve(distRoot, relative);
  if (filePath !== distRoot && !filePath.startsWith(`${distRoot}${path.sep}`)) {
    json(res, 403, { error: 'invalid vendor path' });
    return true;
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    json(res, 404, { error: 'vendor asset not found' });
    return true;
  }
  const bytes = readFileSync(filePath);
  res.writeHead(200, {
    'content-type': mimeType(filePath),
    'content-length': bytes.byteLength,
    'cache-control': 'public, max-age=3600',
  });
  res.end(bytes);
  return true;
}

function publicReconciliation(result: NativeBpmnCanonicalReconciliationResult | undefined): unknown {
  if (!result) return undefined;
  if (result.status === 'BLOCKED') {
    return {
      status: result.status,
      diagnostics: result.diagnostics,
    };
  }
  return {
    status: result.status,
    processDefinition: result.processDefinition,
    processRevision: result.processRevision,
    validation: result.validation,
    diagnostics: result.diagnostics,
  };
}

function publicBinding(binding: ReconciledBinding | undefined): unknown {
  return binding ? publicReconciliation(binding) : undefined;
}

export async function startProcessConfirmationWorkspace(options: WorkspaceServerOptions = {}) {
  const host = options.host ?? '127.0.0.1';
  const runtimeDir = options.runtimeDir ?? mkdtempSync(path.join(os.tmpdir(), 'talos-bpmn-workspace-'));
  const ownsDir = !options.runtimeDir;
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-workspace.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const workspace = new BpmnWorkspaceService(repo, byteStore);
  const reconciler = new NativeBpmnCanonicalReconciliationService(repo);
  const bindings = new Map<string, ReconciledBinding>();

  const correctionEndpoint = options.bpmnCorrectionEndpoint ?? process.env.TALOS_BPMN_CORRECTION_PROVIDER_URL;
  const correctionService: NaturalLanguageBpmnCorrectionService | undefined = correctionEndpoint
    ? createHttpBpmnCorrectionService(repo, {
        endpoint: correctionEndpoint,
        ...(options.bpmnCorrectionTimeoutMs ? { timeoutMs: options.bpmnCorrectionTimeoutMs } : {}),
        ...(options.bpmnCorrectionHeaders ? { headers: options.bpmnCorrectionHeaders } : {}),
      })
    : undefined;

  const reconcileRevision = async (revisionId: string, reconciledBy: string) => {
    const result = await reconciler.reconcile({ bpmnRevisionId: revisionId, reconciledBy });
    if (result.status === 'RECONCILED') bindings.set(result.alignedBpmnRevision.id, result);
    return result;
  };

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? host}`);
      if (serveBpmnJs(url.pathname, res)) return;

      if (req.method === 'GET' && url.pathname === '/') {
        res.writeHead(200, {
          'content-type': 'text/html; charset=utf-8',
          'content-length': Buffer.byteLength(PROCESS_CONFIRMATION_PAGE),
          'cache-control': 'no-store',
        });
        res.end(PROCESS_CONFIRMATION_PAGE);
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/workspace/status') {
        json(res, 200, {
          status: 'READY_FOR_PROCESS_INPUT',
          inputRoutes: ['IMAGE_PNG', 'NATIVE_BPMN'],
          nativeBpmn: {
            parse: true,
            render: true,
            graphEdit: true,
            xmlEdit: true,
            deterministicCanonicalReconciliation: true,
          },
          image: {
            exactSourceIntake: true,
            liveVisionInterpretation: false,
            reason: 'I7C_REAL_ARBITRARY_IMAGE_VISION_NOT_CONFIGURED',
          },
          naturalLanguageCorrection: {
            configured: Boolean(correctionService),
            proposalOnly: true,
            automaticApplyAuthorized: false,
          },
          confirmation: {
            automatic: false,
            requiresCanonicalAlignment: true,
          },
          automationDesign: {
            semanticFreezeGate: true,
            requiresIndependentAuthority: true,
            deploymentAuthorized: false,
            executionAuthorized: false,
          },
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/input/image') {
        const input = await jsonBody(req);
        const result = workspace.intakeImage({
          pngBytes: Buffer.from(text(input.imageBase64, 'imageBase64'), 'base64'),
          declaredName: typeof input.fileName === 'string' ? input.fileName : 'uploaded-process.png',
          initiatedBy: typeof input.initiatedBy === 'string' ? input.initiatedBy : 'browser-user',
        });
        json(res, 201, result);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/input/bpmn') {
        const input = await jsonBody(req);
        const initiatedBy = typeof input.initiatedBy === 'string' ? input.initiatedBy : 'browser-user';
        const imported = await workspace.importNativeBpmn({
          bpmnXml: text(input.bpmnXml, 'bpmnXml'),
          declaredName: typeof input.fileName === 'string' ? input.fileName : 'uploaded-process.bpmn',
          initiatedBy,
        });
        const reconciliation = await reconcileRevision(imported.revision.id, initiatedBy);
        const revision = reconciliation.status === 'RECONCILED'
          ? reconciliation.alignedBpmnRevision
          : imported.revision;
        json(res, 201, {
          ...imported,
          revision,
          reconciliation: publicReconciliation(reconciliation),
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/bpmn/edit') {
        const input = await jsonBody(req);
        const editMode = text(input.editMode, 'editMode');
        if (editMode !== 'GRAPH_EDIT' && editMode !== 'XML_EDIT') throw new TypeError('editMode must be GRAPH_EDIT or XML_EDIT');
        const baseRevisionId = text(input.baseRevisionId, 'baseRevisionId');
        const editedBy = typeof input.editedBy === 'string' ? input.editedBy : 'browser-user';
        const baseBinding = bindings.get(baseRevisionId);
        const edited = await workspace.edit({
          baseRevisionId,
          editedBpmnXml: text(input.bpmnXml, 'bpmnXml'),
          editMode,
          editedBy,
        });

        let revision = edited.revision;
        let reconciliation: unknown = publicBinding(baseBinding);
        if (edited.requiresCanonicalReconciliation) {
          const reconciled = await reconcileRevision(edited.revision.id, editedBy);
          revision = reconciled.status === 'RECONCILED' ? reconciled.alignedBpmnRevision : edited.revision;
          reconciliation = publicReconciliation(reconciled);
        } else if (baseBinding && revision.canonicalProcessRevisionId === baseBinding.processRevision.id) {
          bindings.set(revision.id, baseBinding);
        }

        json(res, 201, {
          ...edited,
          revision,
          reconciliation,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/bpmn/confirm') {
        const input = await jsonBody(req);
        const result = workspace.confirm({
          revisionId: text(input.revisionId, 'revisionId'),
          canonicalProcessRevisionId: text(input.canonicalProcessRevisionId, 'canonicalProcessRevisionId') as never,
          confirmedBy: typeof input.confirmedBy === 'string' ? input.confirmedBy : 'browser-user',
          authorityRef: text(input.authorityRef, 'authorityRef'),
          ...(typeof input.rationale === 'string' ? { rationale: input.rationale } : {}),
        });
        json(res, 201, result);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/bpmn/correction/propose') {
        if (!correctionService) {
          json(res, 409, {
            error: 'Natural-language BPMN correction provider is not configured',
            code: 'BPMN_CORRECTION_PROVIDER_NOT_CONFIGURED',
          });
          return;
        }
        const input = await jsonBody(req);
        const result = await correctionService.propose({
          baseBpmnRevisionId: text(input.baseRevisionId, 'baseRevisionId'),
          instruction: text(input.instruction, 'instruction'),
          requestedBy: typeof input.requestedBy === 'string' ? input.requestedBy : 'browser-user',
        });
        if (result.status === 'PROPOSED_FOR_REVIEW') {
          json(res, 201, {
            ...result,
            status: 'PROPOSED',
            serviceStatus: result.status,
            diff: {
              ...result.diff,
              unifiedDiff: result.diff.unifiedPreview,
            },
          });
        } else {
          json(res, 200, result);
        }
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/bpmn/correction/decide') {
        if (!correctionService) {
          json(res, 409, {
            error: 'Natural-language BPMN correction provider is not configured',
            code: 'BPMN_CORRECTION_PROVIDER_NOT_CONFIGURED',
          });
          return;
        }
        const input = await jsonBody(req);
        const decision = text(input.decision, 'decision');
        if (decision !== 'ACCEPT' && decision !== 'REJECT') throw new TypeError('decision must be ACCEPT or REJECT');
        const decidedBy = typeof input.decidedBy === 'string' ? input.decidedBy : 'browser-user';
        const result = correctionService.decide({
          proposalId: text(input.proposalId, 'proposalId'),
          decision,
          decidedBy,
          ...(typeof input.authorityRef === 'string' && input.authorityRef.trim()
            ? { authorityRef: input.authorityRef }
            : {}),
        });

        if (result.decision.decision === 'ACCEPTED' && result.acceptedRevision) {
          const reconciliation = await reconcileRevision(result.acceptedRevision.id, decidedBy);
          const revision = reconciliation.status === 'RECONCILED'
            ? reconciliation.alignedBpmnRevision
            : result.acceptedRevision;
          json(res, 201, {
            ...result,
            revision,
            reconciliation: publicReconciliation(reconciliation),
          });
        } else {
          json(res, 200, result);
        }
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/bpmn/automation-design-approval') {
        const input = await jsonBody(req);
        const revisionId = text(input.revisionId, 'revisionId');
        const confirmationId = text(input.confirmationId, 'confirmationId');
        const approvedBy = typeof input.approvedBy === 'string' ? input.approvedBy : 'browser-user';
        const authorityRef = text(input.authorityRef, 'authorityRef');
        const currentRevision = workspace.getRevision(revisionId);
        if (!currentRevision) throw new TypeError('BPMN workspace revision not found');
        const binding = bindings.get(revisionId);
        if (!binding) throw new TypeError('Canonical reconciliation context not found for this BPMN revision');
        const confirmationDocument = repo.get(confirmationId as OpaqueId);
        if (!confirmationDocument || confirmationDocument.aggregateKind !== 'BusinessProcessConfirmationRecord') {
          throw new TypeError('Business-process confirmation record not found');
        }
        const confirmation = confirmationDocument.payload as any;
        const at = new Date().toISOString();
        const context = binding.review.context;
        const assessment = binding.validation.assessment;
        const scope = context.scopeBinding.semanticScopeRef;
        const commandId = createOpaqueId('review', `i7b08:automation-design:${revisionId}:${confirmationId}:${approvedBy}:${at}`);
        const payloadId = createOpaqueId('review', `i7b08:freeze-payload:${commandId}`);
        const requestId = createOpaqueId('review', `i7b08:freeze-scope:${commandId}:${scope}`);
        const freezeCommand = {
          id: commandId,
          reviewWorkspaceDefinitionId: context.workspaceDefinition.id,
          expectedReviewWorkspaceRevisionId: context.workspaceRevision.id,
          expectedReviewBaselineBundleId: context.baselineBundle.id,
          primarySemanticScopeRef: scope,
          targetSemanticScopeRefs: [scope],
          actionKind: 'REQUEST_FREEZE' as const,
          targetSubjectRefs: [],
          actionPayloadRef: payloadId,
          rationale: 'Approve the exact confirmed business process for automation design only.',
          authorityRef,
          requestedBy: approvedBy,
          requestedAt: at,
        };
        const freezePayload = {
          id: payloadId,
          reviewCommandId: commandId,
          freezeKind: 'AUTOMATION_DESIGN_HANDOFF' as const,
          scopeRequestRefs: [requestId],
          requestedAt: at,
        };
        const scopeRequest = {
          id: requestId,
          freezeRequestPayloadId: payloadId,
          semanticScopeRef: scope,
          requestedDisposition: 'ACCEPTED' as const,
          referencedValidationAssessmentRefs: [assessment.id],
        };
        const result = applyConfirmedBpmnFreezeHandoff(repo, {
          currentBpmnRevision: currentRevision,
          confirmation,
          canonicalProcessRevision: binding.processRevision,
          reviewContext: context,
          freezeCommand,
          freezePayload,
          scopeRequests: [scopeRequest],
          assessments: [assessment],
          evaluatedAt: at,
        });
        json(res, result.handoff.result === 'FROZEN' ? 201 : 200, {
          ...result,
          deploymentAuthorized: false,
          executionAuthorized: false,
        });
        return;
      }

      json(res, 404, { error: 'not found' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const conflict = /canonical|confirm|reconciliation|DRAFT|revision not found|confirmation record|correction provider/i.test(message);
      json(res, conflict ? 409 : 400, {
        error: message,
        code: conflict ? 'PROCESS_CONFIRMATION_BLOCKED' : 'WORKSPACE_REQUEST_REJECTED',
      });
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port ?? 4318, host, () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Talos Process Confirmation workspace did not bind a TCP address');
  const baseUrl = `http://${host}:${address.port}`;
  let closed = false;
  return {
    baseUrl,
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

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startProcessConfirmationWorkspace({ port: Number(process.env.PORT ?? 4318) })
    .then((app) => {
      console.log(`Talos Process Confirmation workspace ready at ${app.baseUrl}`);
      const stop = async () => { await app.close(); process.exit(0); };
      process.once('SIGINT', stop);
      process.once('SIGTERM', stop);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
