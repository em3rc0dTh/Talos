import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import type { ImmutableDocumentRepository } from '../../../packages/foundation/src/repository.ts';
import {
  LocalImageByteStore,
  ReferenceQuarryPerceptionProvider,
  intakePngUpload,
  runImagePerception,
} from '../../../packages/image-perception/src/index.ts';
import { normalizeAndValidateImageResult } from '../../../packages/application/src/image-semantic.ts';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

async function readRawBytes(request: IncomingMessage): Promise<Buffer> {
  const declared = Number(request.headers['content-length'] ?? 0);
  if (Number.isFinite(declared) && declared > MAX_IMAGE_BYTES) {
    throw new TypeError(`IMAGE_UPLOAD_TOO_LARGE: maximum=${MAX_IMAGE_BYTES}`);
  }
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.byteLength;
    if (total > MAX_IMAGE_BYTES) throw new TypeError(`IMAGE_UPLOAD_TOO_LARGE: maximum=${MAX_IMAGE_BYTES}`);
    chunks.push(buffer);
  }
  if (total === 0) throw new TypeError('IMAGE_UPLOAD_EMPTY');
  return Buffer.concat(chunks);
}

function declaredFileName(request: IncomingMessage): string | undefined {
  const raw = request.headers['x-talos-file-name'];
  if (typeof raw !== 'string' || raw.trim().length === 0) return undefined;
  try { return decodeURIComponent(raw).slice(0, 240); }
  catch { return raw.slice(0, 240); }
}

export function createImageApi(repo: ImmutableDocumentRepository, runtimeDir: string) {
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const provider = new ReferenceQuarryPerceptionProvider();

  async function handle(request: IncomingMessage, response: ServerResponse, url: URL): Promise<boolean> {
    if (request.method === 'POST' && url.pathname === '/api/images') {
      const contentType = String(request.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
      if (contentType !== 'image/png') {
        json(response, 415, { error: 'IMAGE_UPLOAD_UNSUPPORTED_MEDIA_TYPE: I4 accepts image/png only.' });
        return true;
      }

      try {
        const bytes = await readRawBytes(request);
        const receivedAt = new Date().toISOString();
        const intake = intakePngUpload(repo, byteStore, bytes, {
          receivedAt,
          initiatedBy: 'reference-browser-user',
          ...(declaredFileName(request) ? { declaredName: declaredFileName(request)! } : {}),
        });
        const perceptionAt = new Date(Date.now() + 1).toISOString();
        const perception = runImagePerception(repo, intake, provider, {
          now: perceptionAt,
          materializeCommonEvidence: true,
        });
        const common = perception.commonEvidence;
        const semantic = common && perception.attempt.result
          ? normalizeAndValidateImageResult(repo, perception.attempt.result.id, {
              normalizedAt: new Date(Date.now() + 2).toISOString(),
              assessedAt: new Date(Date.now() + 3).toISOString(),
            })
          : undefined;
        const stage = semantic
          ? 'CANONICAL_VALIDATION_READY_FOR_REVIEW'
          : common
            ? 'COMMON_EVIDENCE_READY_FOR_REVIEW'
            : 'PRESERVED_SOURCE_ONLY';

        json(response, common ? 201 : 202, {
          stage,
          source: {
            sessionId: intake.session.id,
            originId: intake.origin.id,
            captureId: intake.capture.id,
            artifactId: intake.artifact.id,
            representationId: intake.representation.id,
            sha256: intake.representation.contentHash,
            byteIdentityStatus: intake.representation.byteIdentityStatus,
            byteLength: intake.storage.byteLength,
            width: intake.coordinateSpace.width,
            height: intake.coordinateSpace.height,
            coordinateBasis: intake.coordinateSpace.coordinateBasis,
            imageUrl: `/api/image-bytes/${intake.representation.contentHash}.png`,
          },
          perception: {
            attemptId: perception.attempt.start.id,
            completionStatus: perception.attempt.completion?.status ?? 'STARTED',
            providerId: perception.providerResult.providerId,
            providerVersion: perception.providerResult.providerVersion,
            providerClass: perception.providerResult.providerClass,
            evidenceMode: perception.providerResult.evidenceMode,
            providerStatus: perception.providerResult.status,
            anchorCount: perception.anchors.length,
            observationCount: perception.observations.length,
            occurrenceCandidateCount: perception.providerResult.occurrenceCandidates.length,
            alternativeSetCount: perception.alternativeSets.length,
            relationCandidateCount: perception.relationCandidates.length,
            diagnostics: perception.attempt.diagnostics.map((item) => ({ code: item.code, description: item.description })),
            anchors: perception.anchors,
            observations: perception.observations.map((item) => ({
              id: item.id,
              observationKind: item.observationKind,
              observedValue: item.observedValue,
              confidence: item.confidence,
              anchorId: item.anchorId,
              modelRef: item.modelRef,
              modelVersion: item.modelVersion,
            })),
            alternativeSets: perception.alternativeSets,
            relationCandidates: perception.relationCandidates,
          },
          commonEvidence: common ? {
            classification: {
              artifactClass: common.classification.artifactClass,
              truthClass: common.classification.truthClass,
              confidence: common.classification.confidence,
            },
            scope: {
              id: common.scope.id,
              kind: common.scope.kind,
              truthClass: common.scope.truthClass,
              confidence: common.scope.confidence,
              candidateName: common.scope.candidateName,
              includedOccurrenceCount: common.scope.includedOccurrenceRefs.length,
              excludedOccurrenceCount: common.scope.excludedOccurrenceRefs.length,
            },
            planes: common.planes,
            properties: common.properties,
            occurrences: common.occurrences,
            relationships: common.relationships,
            graphId: common.graph.id,
          } : null,
          canonical: semantic ? {
            created: true,
            gate: 'I4_CLOSED',
            processDefinitionId: semantic.normalization.processDefinition.id,
            processRevisionId: semantic.normalization.processRevision.id,
            semanticStatus: semantic.normalization.processRevision.semanticStatus,
            truthDiscipline: 'INFERRED_FROM_VISUAL_PERCEPTION',
            nodeCount: semantic.normalization.processRevision.nodes.length,
            edgeCount: semantic.normalization.processRevision.edges.length,
            actorCount: semantic.normalization.processRevision.actors.length,
            dataObjectCount: semantic.normalization.processRevision.dataObjects.length,
            nodes: semantic.normalization.processRevision.nodes.map((node) => ({
              id: node.id,
              kind: node.kind,
              name: node.name,
              truthClass: node.truthClass,
              actorRefs: node.actorRefs,
              details: node.details,
            })),
            edges: semantic.normalization.processRevision.edges.map((edge) => ({
              id: edge.id,
              kind: edge.kind,
              sourceNodeId: edge.sourceNodeId,
              targetNodeId: edge.targetNodeId,
              truthClass: edge.truthClass,
            })),
            actors: semantic.normalization.processRevision.actors,
            dataObjects: semantic.normalization.processRevision.dataObjects,
          } : {
            created: false,
            gate: 'I4_AVAILABLE_ONLY_AFTER_COMMON_EVIDENCE',
            note: 'The source is preserved, but no perception/common evidence exists to normalize.',
          },
          validation: semantic ? {
            assessmentId: semantic.validation.assessment.id,
            semanticVerdict: semantic.validation.assessment.semanticVerdict,
            executionReadiness: semantic.validation.assessment.executionReadiness,
            findingCount: semantic.validation.findings.length,
            findings: semantic.validation.findings.map((finding) => ({
              id: finding.id,
              code: finding.code,
              title: finding.title,
              description: finding.description,
              severity: finding.severity,
              blockerClass: finding.blockerClass,
              resolutionRoute: finding.resolutionRoute,
              targetRefs: finding.targetRefs,
            })),
            questions: semantic.validation.questions.map((question) => ({
              id: question.id,
              questionText: question.questionText,
              targetRef: question.targetRef,
              findingRefs: question.findingRefs,
            })),
          } : null,
          executionHandoff: {
            frozenFromImage: false,
            gate: 'I5_CLOSED',
            note: 'I4 exposes inferred Canonical/Validation for review. It does not freeze or authorize execution.',
          },
          temporal: {
            startedFromImage: false,
            gate: 'I6_CLOSED',
          },
        });
      } catch (error) {
        json(response, 400, { error: error instanceof Error ? error.message : String(error) });
      }
      return true;
    }

    const imageMatch = /^\/api\/image-bytes\/([0-9a-f]{64})\.png$/.exec(url.pathname);
    if (request.method === 'GET' && imageMatch) {
      try {
        const bytes = byteStore.readPng(imageMatch[1]);
        response.writeHead(200, {
          'content-type': 'image/png',
          'content-length': String(bytes.byteLength),
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        });
        response.end(bytes);
      } catch {
        json(response, 404, { error: 'Image bytes not found.' });
      }
      return true;
    }

    return false;
  }

  return { handle };
}