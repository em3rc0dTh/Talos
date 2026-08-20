import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startReferenceDemo } from '../apps/reference-api/src/server.ts';
import { QUARRY_02_VERIFIED_SHA256 } from '../packages/image-perception/src/index.ts';

const fixturePath = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png');

test('I3 browser/API exposes recovered image evidence as INFERRED Canonical/Validation and keeps execution closed', { timeout: 120_000 }, async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i3-'));
  const demo = await startReferenceDemo({ port: 0, runtimeDir, injectTransientFailure: false });
  try {
    const health = await fetch(`${demo.baseUrl}/api/health`).then((response) => response.json()) as any;
    assert.equal(health.status, 'READY');
    assert.equal(health.workerState, 'RUNNING');

    const html = await fetch(demo.baseUrl).then((response) => response.text());
    assert.match(html, /Image source/);
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

    assert.equal(data.stage, 'CANONICAL_VALIDATION_READY_FOR_REVIEW');
    assert.equal(data.source.sha256, QUARRY_02_VERIFIED_SHA256);
    assert.equal(data.source.byteIdentityStatus, 'EXACT_VERIFIED');
    assert.equal(data.source.width, 791);
    assert.equal(data.source.height, 451);
    assert.equal(data.perception.providerId, 'REFERENCE_QUARRY_PERCEPTION');
    assert.equal(data.perception.providerClass, 'FIXTURE_PROVIDER');
    assert.equal(data.perception.providerStatus, 'SUCCEEDED');
    assert.equal(data.perception.providerVersion, '1.1.0-reference');
    assert.equal(data.perception.observationCount, 35);
    assert.equal(data.perception.occurrenceCandidateCount, 20);
    assert.equal(data.perception.alternativeSetCount, 10);
    assert.equal(data.perception.relationCandidateCount, 10);
    assert.ok(data.perception.diagnostics.some((item: any) => item.code === 'FIXTURE_SOURCE_RECORD_BYTE_IDENTITY_MISMATCH'));

    assert.equal(data.commonEvidence.classification.artifactClass, 'COLLABORATION_DIAGRAM');
    assert.equal(data.commonEvidence.classification.truthClass, 'INFERRED');
    assert.equal(data.commonEvidence.scope.kind, 'COLLABORATION');
    assert.equal(data.commonEvidence.scope.truthClass, 'INFERRED');
    assert.equal(data.commonEvidence.properties.length, 10);
    assert.equal(data.commonEvidence.occurrences.length, 20);
    assert.equal(data.commonEvidence.relationships.length, 10);
    assert.equal(data.commonEvidence.properties.every((item: any) => !Object.hasOwn(item, 'nativeSourceId')), true);
    assert.equal(data.commonEvidence.properties.every((item: any) => (item.sourceExtensionRefs?.length ?? 0) >= 2), true);

    assert.equal(data.canonical.created, true);
    assert.equal(data.canonical.gate, 'I4_CLOSED');
    assert.equal(data.canonical.truthDiscipline, 'INFERRED_FROM_VISUAL_PERCEPTION');
    assert.equal(data.canonical.nodeCount, 10);
    assert.equal(data.canonical.edgeCount, 10);
    assert.equal(data.canonical.actorCount, 5);
    assert.equal(data.canonical.dataObjectCount, 4);
    assert.equal(data.canonical.nodes.every((node: any) => node.truthClass === 'INFERRED'), true);
    assert.equal(data.canonical.edges.every((edge: any) => edge.truthClass === 'INFERRED'), true);

    const start = data.canonical.nodes.find((node: any) => node.kind === 'EVENT' && node.details?.eventRole === 'START');
    const end = data.canonical.nodes.find((node: any) => node.kind === 'END' && node.details?.eventRole === 'END');
    const wait = data.canonical.nodes.find((node: any) => node.name === 'On Next Wednesday');
    const subprocess = data.canonical.nodes.find((node: any) => node.name === 'Arrange Delivery');
    const delivery = data.canonical.nodes.find((node: any) => node.name === 'Deliver Water');
    const worker = data.canonical.actors.find((actor: any) => actor.name === 'Worker');
    assert.ok(start && end && wait && subprocess && delivery && worker);
    assert.equal(wait.details?.waitKind, 'CALENDAR_TIME');
    assert.equal(subprocess.details?.subprocessMode, 'COLLAPSED_SUBPROCESS');
    assert.deepEqual(delivery.actorRefs, [worker.id]);

    assert.equal(data.validation.semanticVerdict, 'INCOMPLETE');
    assert.equal(data.validation.executionReadiness, 'INSUFFICIENT_DETAIL');
    const findingCodes = data.validation.findings.map((finding: any) => finding.code);
    assert.equal(findingCodes.includes('SV-CMP-001'), false, 'visible END must not be dropped and then re-requested from reviewer');
    assert.equal(findingCodes.includes('SV-STR-001'), false, 'visible collaboration START event establishes collaboration-level entry candidate');
    assert.equal(findingCodes.includes('SV-SUB-002'), false, 'visible collapsed boundary is preserved as inferred candidate');
    assert.ok(findingCodes.includes('SV-EVT-002'), 'exact Next Wednesday expression/timezone is still unresolved');
    assert.ok(findingCodes.includes('SV-SUB-001'), 'collapsed subprocess internals are still unresolved');
    assert.ok(findingCodes.includes('SV-HUM-001'), 'Worker responsibility does not establish physical completion observation');
    assert.ok(findingCodes.includes('SV-COR-001'), 'message interaction still lacks correlation identity');
    assert.equal(findingCodes.filter((code: string) => code === 'SV-CFL-001').length, 2);
    assert.ok(findingCodes.includes('SV-SRC-001'), 'perception-derived semantics still require explicit review confirmation');

    assert.equal(data.executionHandoff.frozenFromImage, false);
    assert.equal(data.executionHandoff.gate, 'I5_CLOSED');
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
    assert.equal(unknown.validation, null);
    assert.equal(unknown.executionHandoff.frozenFromImage, false);
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