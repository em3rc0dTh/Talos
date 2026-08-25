import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildImageBpmnReviewCandidate } from '../packages/application/src/index.ts';
import {
  IMAGE_PERCEPTION_RUNTIME_ENV,
  LocalImageByteStore,
  resolveImagePerceptionRuntimeBinding,
} from '../packages/image-perception/src/index.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

const MODEL_ID = 'HuggingFaceTB/SmolVLM-500M-Instruct';
const MODEL_REVISION = 'a7da5b986cb59b408707209984f360a5f4ad7e47';
const PROVIDER_ID = 'R0_04B_SMOLVLM_500M_LOCAL';
const PIPELINE_VERSION = 'talos-r0-04b-smolvlm-500m-cv-http-v0.6';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`R0-04B live gate requires ${name}`);
  return value;
}

function providerEnv(endpoint: string, bearerToken: string): Record<string, string> {
  return {
    [IMAGE_PERCEPTION_RUNTIME_ENV.endpoint]: endpoint,
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerId]: PROVIDER_ID,
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerVersion]: '1.0.0',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelRef]: MODEL_ID,
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelVersion]: MODEL_REVISION,
    [IMAGE_PERCEPTION_RUNTIME_ENV.pipelineVersion]: PIPELINE_VERSION,
    [IMAGE_PERCEPTION_RUNTIME_ENV.timeoutMs]: '120000',
    [IMAGE_PERCEPTION_RUNTIME_ENV.bearerToken]: bearerToken,
  };
}

function persistedPerceptionJson(repo: SqliteDocumentStore): string {
  const kinds = ['AdapterAttemptStart','AdapterAttemptCompletion','AdapterDiagnostic','AdapterResult','VisualEvidenceAnchor','PerceptionObservation','PerceptionAlternativeSet','PerceptionRelationCandidate','SourceEvidenceGraph','CandidateSemanticScope','ArtifactClassification','ImagePerceptionAdmissionRecord','ProcessRevision','BpmnProcessRevision'];
  return JSON.stringify(kinds.flatMap((kind) => repo.listByKind(kind)));
}

test('R0-04B live SmolVLM plus deterministic visual geometry crosses the exact Talos provider/correlation path into a non-executable BPMN review candidate', { timeout: 240_000 }, async () => {
  const endpoint = requiredEnv('TALOS_R0_04B_PROVIDER_ENDPOINT');
  const bearerToken = requiredEnv('TALOS_R0_04B_PROVIDER_BEARER_TOKEN');
  const sourceImage = requiredEnv('TALOS_R0_04B_SOURCE_IMAGE');
  const expectedPngSha256 = requiredEnv('TALOS_R0_04B_SOURCE_SHA256');
  const png = readFileSync(sourceImage);
  assert.ok(bearerToken.length >= 24);
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'R0-04B source must be a PNG');
  assert.equal(createHash('sha256').update(png).digest('hex'), expectedPngSha256, 'R0-04B must certify the exact PNG rendered and verified by the pinned runtime');

  const health = await fetch(endpoint.replace(/\/vision$/, '/health'));
  assert.equal(health.status, 200);
  const healthBody = await health.json() as any;
  assert.equal(healthBody.status, 'READY');
  assert.equal(healthBody.providerId, PROVIDER_ID);
  assert.equal(healthBody.modelRef, MODEL_ID);
  assert.equal(healthBody.modelVersion, MODEL_REVISION);
  assert.equal(healthBody.pipelineVersion, PIPELINE_VERSION);
  assert.equal(JSON.stringify(healthBody).includes(bearerToken), false);

  const resolution = resolveImagePerceptionRuntimeBinding(providerEnv(endpoint, bearerToken));
  assert.equal(resolution.status, 'CONFIGURED');
  if (resolution.status !== 'CONFIGURED') throw new Error('R0-04B provider was not configured');
  assert.equal(resolution.binding.descriptor.providerId, PROVIDER_ID);
  assert.equal(resolution.binding.descriptor.modelRef, MODEL_ID);
  assert.equal(resolution.binding.descriptor.modelVersion, MODEL_REVISION);
  assert.equal(resolution.binding.descriptor.authConfigured, true);
  assert.equal(JSON.stringify(resolution.binding.descriptor).includes(bearerToken), false);
  assert.equal(JSON.stringify(resolution.binding).includes(bearerToken), false);

  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r0-04b-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  try {
    const result = await buildImageBpmnReviewCandidate(repo, byteStore, png, resolution.binding, {
      declaredName: 'r0-04b-real-model-business-process.png', initiatedBy: 'r0-04b-release-certifier',
      receivedAt: '2026-08-24T18:45:00.000Z', perceivedAt: '2026-08-24T18:45:01.000Z', normalizedAt: '2026-08-24T18:45:02.000Z', assessedAt: '2026-08-24T18:45:03.000Z', projectedAt: '2026-08-24T18:45:04.000Z',
    });

    if (result.status !== 'BPMN_READY_FOR_PROCESS_REVIEW') {
      const diagnostics = result.perception.attempt.diagnostics.map((item: any) => `${item.code}:${item.description}`).join(' | ');
      throw new Error(`R0-04B live vision pipeline did not establish a BPMN review candidate; admission=${result.perception.admission.decision}; providerStatus=${result.perception.admission.providerStatus}; reasons=${result.perception.admission.reasonCodes.join(',')}; diagnostics=${diagnostics}`);
    }
    assert.equal(result.status, 'BPMN_READY_FOR_PROCESS_REVIEW');

    assert.equal(result.intake.representation.contentHash, expectedPngSha256);
    assert.equal(result.perception.admission.decision, 'ADMITTED_FOR_REVIEW');
    assert.ok(result.perception.attempt.result);
    assert.equal(result.perception.attempt.result?.modelRef, MODEL_ID);
    assert.equal(result.perception.attempt.result?.modelVersion, MODEL_REVISION);

    const adapterJson = JSON.stringify(repo.listByKind('AdapterResult'));
    assert.match(adapterJson, /R0_04B_SMOLVLM_500M_LOCAL/);
    assert.match(adapterJson, /HuggingFaceTB\/SmolVLM-500M-Instruct/);
    assert.match(adapterJson, /R0_04B_REAL_MODEL_INFERENCE/);
    assert.match(adapterJson, /REVIEW REQUEST/, 'live model must recover the literal visible task label rather than a generic TASK token');
    assert.equal(adapterJson.includes(bearerToken), false);

    const process = result.semantic.normalization.processRevision;
    const nodeKinds = new Set(process.nodes.map((node) => node.kind));
    assert.equal(nodeKinds.has('EVENT'), true, 'live vision pipeline must recover a visible start event');
    assert.equal(nodeKinds.has('ACTION'), true, 'live vision pipeline must recover the visible REVIEW REQUEST task');
    assert.equal(nodeKinds.has('END'), true, 'live vision pipeline must recover a visible end event');
    assert.ok(process.edges.length >= 2, 'live vision pipeline must recover the visible directed process sequence');
    assert.equal(process.nodes.every((node) => node.truthClass === 'INFERRED'), true);
    assert.equal(process.edges.every((edge) => edge.kind === 'SEQUENCE' && edge.truthClass === 'INFERRED'), true);
    assert.equal(process.semanticClaims.every((claim) => claim.truthClass === 'INFERRED'), true);
    assert.notEqual(result.semantic.validation.assessment.executionReadiness, 'EXECUTABLE');

    assert.equal(result.projection.sourceRoute, 'IMAGE_INTERPRETATION');
    assert.equal(result.projection.bpmnRevision.state, 'DRAFT');
    assert.match(result.projection.bpmnRevision.bpmnXml, /isExecutable="false"/);
    assert.match(result.projection.bpmnRevision.bpmnXml, /bpmn:startEvent/);
    assert.match(result.projection.bpmnRevision.bpmnXml, /bpmn:task/);
    assert.match(result.projection.bpmnRevision.bpmnXml, /bpmn:endEvent/);
    assert.equal(repo.listByKind('BusinessProcessConfirmationRecord').length, 0);
    assert.equal(repo.listByKind('SemanticFreezeRecord').length, 0);
    assert.equal(result.automaticConfirmationAuthorized, false);
    assert.equal(result.automaticFreezeAuthorized, false);
    assert.equal(result.automaticExecutionAuthorized, false);

    const persisted = persistedPerceptionJson(repo);
    assert.equal(persisted.includes(bearerToken), false);
    assert.equal(result.intake.representation.contentHash.length, 64);
  } finally {
    repo.close(); rmSync(runtimeDir, { recursive: true, force: true });
  }
});
