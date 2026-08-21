import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
  IMAGE_PERCEPTION_RUNTIME_ENV,
  LocalImageByteStore,
  intakePngUpload,
  resolveImagePerceptionRuntimeBinding,
  runCorrelatedConfiguredImagePerceptionAdmission,
  type AsyncImagePerceptionTransportEnvelope,
} from '../packages/image-perception/src/index.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

const UNREGISTERED_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1xkAAAAASUVORK5CYII=', 'base64');
const KNOWN_QUARRY_SHA = new Set([
  '100741f25704d1f311ab1d9f0d51b6aa65255ae2258387d9dd5a853471d20779',
  '8ede24c9f1162ed83c10d8c62063d8d19813c993965378acf1a2e36113218bd9',
]);

async function readJson(req: any) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function withRuntime<T>(fn: (repo: SqliteDocumentStore, bytes: LocalImageByteStore) => Promise<T>) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-i7c03-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const bytes = new LocalImageByteStore(path.join(dir, 'bytes'));
  try { return await fn(repo, bytes); }
  finally { repo.close(); rmSync(dir, { recursive: true, force: true }); }
}

function env(endpoint: string): Record<string, string> {
  return {
    [IMAGE_PERCEPTION_RUNTIME_ENV.endpoint]: endpoint,
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerId]: 'I7C03_HTTP_MODEL',
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerVersion]: '1.0.0',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelRef]: 'model:unregistered-process-image',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelVersion]: '2026-08-20',
    [IMAGE_PERCEPTION_RUNTIME_ENV.pipelineVersion]: 'talos-process-diagram-perception-v0.3',
    [IMAGE_PERCEPTION_RUNTIME_ENV.timeoutMs]: '5000',
  };
}

function response(envelope: AsyncImagePerceptionTransportEnvelope) {
  return {
    providerId: 'I7C03_HTTP_MODEL',
    providerVersion: '1.0.0',
    providerClass: 'MODEL_PROVIDER',
    modelRef: 'model:unregistered-process-image',
    modelVersion: '2026-08-20',
    pipelineVersion: 'talos-process-diagram-perception-v0.3',
    evidenceMode: 'MODEL_INFERENCE',
    status: 'PARTIAL',
    requestCorrelation: {
      schemaVersion: IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
      sourceRepresentationId: envelope.sourceRepresentationId,
      contentSha256: envelope.contentSha256,
      coordinateSpace: { ...envelope.coordinateSpace },
    },
    anchors: [
      { providerAnchorKey: 'node-a', geometryKind: 'BOX', geometry: { x: 0.08, y: 0.2, width: 0.24, height: 0.2 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'node-b', geometryKind: 'BOX', geometry: { x: 0.62, y: 0.2, width: 0.24, height: 0.2 }, visibilityState: 'PARTIALLY_VISIBLE' },
      { providerAnchorKey: 'edge-a-b', geometryKind: 'POLYLINE', geometry: [{ x: 0.32, y: 0.3 }, { x: 0.62, y: 0.3 }], visibilityState: 'LOW_LEGIBILITY' },
    ],
    observations: [
      { providerObservationKey: 'label-a', anchorKey: 'node-a', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Receive request', confidence: 0.88 },
      { providerObservationKey: 'shape-a', anchorKey: 'node-a', observationKind: 'SHAPE_CLASS_CANDIDATE', observedValue: 'rounded-rectangle', confidence: 0.73 },
      { providerObservationKey: 'label-b', anchorKey: 'node-b', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Review request', confidence: 0.64 },
      { providerObservationKey: 'stroke', anchorKey: 'edge-a-b', observationKind: 'CONNECTOR_STROKE', confidence: 0.59 },
    ],
    occurrenceCandidates: [
      { providerOccurrenceKey: 'occ-a', anchorKeys: ['node-a'], occurrenceKind: 'NODE', literalLabelObservationKey: 'label-a', candidateSemanticType: 'ACTION', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['label-a', 'shape-a'], confidence: 0.81 },
      { providerOccurrenceKey: 'occ-b', anchorKeys: ['node-b'], occurrenceKind: 'NODE', literalLabelObservationKey: 'label-b', candidateSemanticType: 'HUMAN_INTERACTION', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['label-b'], confidence: 0.62 },
    ],
    alternativeSets: [{
      providerAlternativeSetKey: 'role-alt',
      propertyPath: 'relationshipRole',
      alternatives: [
        { providerAlternativeKey: 'sequence', value: 'CONTROL_FLOW', confidence: 0.57, anchorKeys: ['edge-a-b'], supportingObservationKeys: ['stroke'] },
        { providerAlternativeKey: 'message', value: 'MESSAGE_RELATIONSHIP', confidence: 0.43, anchorKeys: ['edge-a-b'], supportingObservationKeys: ['stroke'] },
      ],
      exclusivityMode: 'MUTUALLY_EXCLUSIVE',
      modelPreferredAlternativeKey: 'sequence',
      modelPreferenceConfidence: 0.57,
    }],
    relationCandidates: [{
      providerRelationKey: 'rel-a-b',
      strokeObservationKeys: ['stroke'],
      anchorKeys: ['edge-a-b'],
      existenceConfidence: 0.59,
      sourceEndpointCandidates: [{ occurrenceCandidateKey: 'occ-a', anchorKey: 'node-a', endpointState: 'SET_CANDIDATE', confidence: 0.82 }],
      targetEndpointCandidates: [{ endpointState: 'UNRESOLVED', confidence: 0.38 }],
      directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: 0.61 }, { value: 'UNKNOWN', confidence: 0.39 }],
      roleAlternativeSetKey: 'role-alt',
      notes: 'Target is visually near occ-b, but the endpoint is not strong enough to assert attachment.',
    }],
    diagnostics: [{ code: 'UNRESOLVED_TARGET_ENDPOINT', description: 'The target endpoint remains uncertain.' }],
  };
}

test('I7C-03 unregistered PNG produces image-region common evidence with explicit ambiguity and no truth escalation', async () => {
  await withRuntime(async (repo, byteStore) => {
    const intake = intakePngUpload(repo, byteStore, UNREGISTERED_PNG, { receivedAt: '2026-08-20T21:40:00.000Z', declaredName: 'unregistered-user-process.png' });
    assert.equal(KNOWN_QUARRY_SHA.has(intake.representation.contentHash), false);

    const server = createServer(async (req, res) => {
      const envelope = await readJson(req) as AsyncImagePerceptionTransportEnvelope;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(response(envelope)));
    });
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('provider did not bind');

    try {
      const resolution = resolveImagePerceptionRuntimeBinding(env(`http://127.0.0.1:${address.port}/vision`));
      assert.equal(resolution.status, 'CONFIGURED');
      if (resolution.status !== 'CONFIGURED') throw new Error('provider missing');
      const result = await runCorrelatedConfiguredImagePerceptionAdmission(repo, byteStore, intake, resolution.binding, { now: '2026-08-20T21:40:01.000Z' });

      assert.equal(result.admission.decision, 'ADMITTED_FOR_REVIEW');
      assert.equal(result.providerResult.providerClass, 'MODEL_PROVIDER');
      assert.equal(result.providerResult.evidenceMode, 'MODEL_INFERENCE');
      assert.equal(result.commonEvidence?.classification.truthClass, 'INFERRED');
      assert.equal(result.commonEvidence?.scope.truthClass, 'INFERRED');
      assert.equal(result.commonEvidence?.scope.kind, 'PROCESS_CANDIDATE');

      const anchors = repo.listByKind<any>('VisualEvidenceAnchor').map((d) => d.payload);
      assert.equal(anchors.length, 3);
      const first = anchors.find((anchor) => anchor.geometryKind === 'BOX' && anchor.geometry?.x === 0.08);
      assert.ok(first);
      assert.equal(first.sourceRepresentationId, intake.representation.id);
      assert.equal(first.coordinateSpaceId, intake.coordinateSpace.id);

      const observations = repo.listByKind<any>('PerceptionObservation').map((d) => d.payload);
      assert.equal(observations.length, 4);
      assert.equal(observations.every((item) => item.sourceRepresentationId === intake.representation.id), true);
      assert.equal(observations.every((item) => item.modelRef === 'model:unregistered-process-image'), true);

      const relations = repo.listByKind<any>('PerceptionRelationCandidate').map((d) => d.payload);
      assert.equal(relations.length, 1);
      assert.equal(relations[0].targetEndpointCandidates[0].endpointState, 'UNRESOLVED');
      assert.equal(relations[0].roleAlternativeSetRef !== undefined, true);

      const alternatives = repo.listByKind<any>('PerceptionAlternativeSet').map((d) => d.payload);
      assert.equal(alternatives.length, 1);
      assert.equal(alternatives[0].alternatives.length, 2);
      assert.equal(repo.listByKind('PerceptionAlternativeDecision').length, 0, 'model preference must not become a human decision');

      const graphs = repo.listByKind<any>('SourceEvidenceGraph').map((d) => d.payload);
      assert.equal(graphs.length, 1);
      assert.equal(graphs[0].sourceRepresentationId, intake.representation.id);
      assert.equal(graphs[0].occurrenceIds.length, 2);
      assert.equal(graphs[0].relationshipOccurrenceIds.length, 1);
      assert.equal(graphs[0].evidenceFragmentIds.length > 0, true);

      assert.equal(result.admission.semanticAuthority, 'NONE');
      assert.equal(result.admission.automaticFreezeAuthorized, false);
      assert.equal(result.admission.automaticExecutionAuthorized, false);
      for (const kind of ['ProcessRevision','SemanticFreezeRecord','CapabilityDesignRevision','ExecutionPlanRevision','TemporalMappingRevision','DeploymentRevision']) {
        assert.equal(repo.listByKind(kind).length, 0, `${kind} must not exist at I7C-03 evidence handoff`);
      }
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
