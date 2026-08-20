import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startReferenceDemo } from '../apps/reference-api/src/server.ts';
import { QUARRY_02_VERIFIED_SHA256 } from '../packages/image-perception/src/index.ts';

const fixturePath = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png');

test('I3 browser/API preserves Quarry PNG, returns image evidence, and never claims Canonical/Temporal support', { timeout: 120_000 }, async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i3-'));
  const demo = await startReferenceDemo({ port: 0, runtimeDir, injectTransientFailure: false });
  try {
    const health = await fetch(`${demo.baseUrl}/api/health`).then((response) => response.json()) as any;
    assert.equal(health.status, 'READY');
    assert.equal(health.workerState, 'RUNNING');

    const html = await fetch(demo.baseUrl).then((response) => response.text());
    assert.match(html, /Image source → perception evidence/);
    assert.match(html, /REFERENCE_QUARRY_PERCEPTION/);
    assert.match(html, /I4 Canonical/);
    assert.match(html, /I6 image → Temporal/);

    const bytes = readFileSync(fixturePath);
    const response = await fetch(`${demo.baseUrl}/api/images`, {
      method: 'POST',
      headers: {
        'content-type': 'image/png',
        'x-talos-file-name': encodeURIComponent('quarry-02.png'),
      },
      body: bytes,
    });
    assert.equal(response.status, 201);
    const data = await response.json() as any;

    assert.equal(data.stage, 'COMMON_EVIDENCE_READY_FOR_REVIEW');
    assert.equal(data.source.sha256, QUARRY_02_VERIFIED_SHA256);
    assert.equal(data.source.byteIdentityStatus, 'EXACT_VERIFIED');
    assert.equal(data.source.width, 791);
    assert.equal(data.source.height, 451);
    assert.equal(data.perception.providerId, 'REFERENCE_QUARRY_PERCEPTION');
    assert.equal(data.perception.providerClass, 'FIXTURE_PROVIDER');
    assert.equal(data.perception.providerStatus, 'SUCCEEDED');
    assert.equal(data.perception.observationCount, 30);
    assert.equal(data.perception.occurrenceCandidateCount, 18);
    assert.equal(data.perception.relationCandidateCount, 8);
    assert.equal(data.commonEvidence.classification.artifactClass, 'COLLABORATION_DIAGRAM');
    assert.equal(data.commonEvidence.classification.truthClass, 'INFERRED');
    assert.equal(data.commonEvidence.scope.kind, 'COLLABORATION');
    assert.equal(data.commonEvidence.scope.truthClass, 'INFERRED');
    assert.equal(data.commonEvidence.occurrences.length, 18);
    assert.equal(data.commonEvidence.relationships.length, 8);
    assert.equal(data.canonical.created, false);
    assert.equal(data.canonical.gate, 'I4_CLOSED');
    assert.equal(data.temporal.startedFromImage, false);
    assert.equal(data.temporal.gate, 'I6_CLOSED');

    const exactBytes = Buffer.from(await fetch(`${demo.baseUrl}${data.source.imageUrl}`).then((item) => item.arrayBuffer()));
    assert.ok(exactBytes.equals(bytes), 'browser evidence endpoint must return exact preserved source bytes');

    const modified = Buffer.from(bytes);
    modified[modified.length - 1] ^= 0x01;
    const unknownResponse = await fetch(`${demo.baseUrl}/api/images`, {
      method: 'POST',
      headers: { 'content-type': 'image/png', 'x-talos-file-name': encodeURIComponent('unknown.png') },
      body: modified,
    });
    assert.equal(unknownResponse.status, 202);
    const unknown = await unknownResponse.json() as any;
    assert.equal(unknown.stage, 'PRESERVED_SOURCE_ONLY');
    assert.equal(unknown.source.byteIdentityStatus, 'EXACT_VERIFIED');
    assert.equal(unknown.perception.providerStatus, 'NO_RESULT');
    assert.equal(unknown.perception.observationCount, 0);
    assert.equal(unknown.commonEvidence, null);
    assert.equal(unknown.canonical.created, false);
    assert.equal(unknown.temporal.startedFromImage, false);

    const invalid = await fetch(`${demo.baseUrl}/api/images`, {
      method: 'POST',
      headers: { 'content-type': 'image/png' },
      body: Buffer.from('not a png'),
    });
    assert.equal(invalid.status, 400);
    const invalidBody = await invalid.json() as any;
    assert.match(invalidBody.error, /IMAGE_INTAKE_INVALID_PNG/);
  } finally {
    await demo.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
