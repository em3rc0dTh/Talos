import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
  IMAGE_PERCEPTION_RUNTIME_ENV,
  type AsyncImagePerceptionTransportEnvelope,
} from '../packages/image-perception/src/index.ts';
import { ONE_APP_PRODUCT_PAGE } from '../apps/reference-api/src/one-app-product-page.ts';
import { startTalosOneAppProduct } from '../apps/reference-api/src/one-app-product-server.ts';

const quarry02Path = path.resolve(
  process.cwd(),
  '../../brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png',
);
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1xkAAAAASUVORK5CYII=',
  'base64',
);

async function readJson(req: any): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function correlatedProcessResponse(envelope: AsyncImagePerceptionTransportEnvelope) {
  return {
    providerId: 'R1_02_PRODUCT_MODEL',
    providerVersion: '1.0.0',
    providerClass: 'MODEL_PROVIDER',
    modelRef: 'model:r1-02-product-image',
    modelVersion: '2026-08-25',
    pipelineVersion: 'talos-r1-02-product-image-v0.1',
    evidenceMode: 'MODEL_INFERENCE',
    status: 'SUCCEEDED',
    requestCorrelation: {
      schemaVersion: IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
      sourceRepresentationId: envelope.sourceRepresentationId,
      contentSha256: envelope.contentSha256,
      coordinateSpace: { ...envelope.coordinateSpace },
    },
    anchors: [
      { providerAnchorKey: 'a-start', geometryKind: 'BOX', geometry: { x: .05, y: .3, width: .1, height: .1 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-task', geometryKind: 'BOX', geometry: { x: .35, y: .25, width: .2, height: .2 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-end', geometryKind: 'BOX', geometry: { x: .8, y: .3, width: .1, height: .1 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-flow-1', geometryKind: 'POLYLINE', geometry: [{ x: .15, y: .35 }, { x: .35, y: .35 }], visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-flow-2', geometryKind: 'POLYLINE', geometry: [{ x: .55, y: .35 }, { x: .8, y: .35 }], visibilityState: 'VISIBLE' },
    ],
    observations: [
      { providerObservationKey: 'o-start', anchorKey: 'a-start', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Start', confidence: .95 },
      { providerObservationKey: 'o-task', anchorKey: 'a-task', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Review request', confidence: .94 },
      { providerObservationKey: 'o-end', anchorKey: 'a-end', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Complete', confidence: .95 },
      { providerObservationKey: 'o-flow-1', anchorKey: 'a-flow-1', observationKind: 'CONNECTOR_STROKE', confidence: .92 },
      { providerObservationKey: 'o-flow-2', anchorKey: 'a-flow-2', observationKind: 'CONNECTOR_STROKE', confidence: .92 },
    ],
    occurrenceCandidates: [
      { providerOccurrenceKey: 'start', anchorKeys: ['a-start'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o-start', candidateSemanticType: 'EVENT', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o-start'], confidence: .94 },
      { providerOccurrenceKey: 'task', anchorKeys: ['a-task'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o-task', candidateSemanticType: 'ACTION', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o-task'], confidence: .93 },
      { providerOccurrenceKey: 'end', anchorKeys: ['a-end'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o-end', candidateSemanticType: 'END', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o-end'], confidence: .94 },
    ],
    alternativeSets: [
      { providerAlternativeSetKey: 'role-1', propertyPath: 'relationshipRole', alternatives: [{ providerAlternativeKey: 'control-1', value: 'CONTROL_FLOW', confidence: .94, anchorKeys: ['a-flow-1'], supportingObservationKeys: ['o-flow-1'] }], exclusivityMode: 'MUTUALLY_EXCLUSIVE', modelPreferredAlternativeKey: 'control-1', modelPreferenceConfidence: .94 },
      { providerAlternativeSetKey: 'role-2', propertyPath: 'relationshipRole', alternatives: [{ providerAlternativeKey: 'control-2', value: 'CONTROL_FLOW', confidence: .94, anchorKeys: ['a-flow-2'], supportingObservationKeys: ['o-flow-2'] }], exclusivityMode: 'MUTUALLY_EXCLUSIVE', modelPreferredAlternativeKey: 'control-2', modelPreferenceConfidence: .94 },
    ],
    relationCandidates: [
      { providerRelationKey: 'flow-1', strokeObservationKeys: ['o-flow-1'], anchorKeys: ['a-flow-1'], existenceConfidence: .94, sourceEndpointCandidates: [{ occurrenceCandidateKey: 'start', anchorKey: 'a-start', endpointState: 'SET_CANDIDATE', confidence: .95 }], targetEndpointCandidates: [{ occurrenceCandidateKey: 'task', anchorKey: 'a-task', endpointState: 'SET_CANDIDATE', confidence: .95 }], directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: .95 }], roleAlternativeSetKey: 'role-1' },
      { providerRelationKey: 'flow-2', strokeObservationKeys: ['o-flow-2'], anchorKeys: ['a-flow-2'], existenceConfidence: .94, sourceEndpointCandidates: [{ occurrenceCandidateKey: 'task', anchorKey: 'a-task', endpointState: 'SET_CANDIDATE', confidence: .95 }], targetEndpointCandidates: [{ occurrenceCandidateKey: 'end', anchorKey: 'a-end', endpointState: 'SET_CANDIDATE', confidence: .95 }], directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: .95 }], roleAlternativeSetKey: 'role-2' },
    ],
    diagnostics: [],
  };
}

async function startModelProvider(): Promise<{ endpoint: string; close(): Promise<void> }> {
  const server = createServer(async (req, res) => {
    const envelope = await readJson(req) as AsyncImagePerceptionTransportEnvelope;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(correlatedProcessResponse(envelope)));
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('R1-02 model provider did not bind');
  return {
    endpoint: `http://127.0.0.1:${address.port}/vision`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

function configuredEnv(endpoint: string): Record<string, string> {
  return {
    [IMAGE_PERCEPTION_RUNTIME_ENV.endpoint]: endpoint,
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerId]: 'R1_02_PRODUCT_MODEL',
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerVersion]: '1.0.0',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelRef]: 'model:r1-02-product-image',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelVersion]: '2026-08-25',
    [IMAGE_PERCEPTION_RUNTIME_ENV.pipelineVersion]: 'talos-r1-02-product-image-v0.1',
    [IMAGE_PERCEPTION_RUNTIME_ENV.timeoutMs]: '5000',
    [IMAGE_PERCEPTION_RUNTIME_ENV.bearerToken]: 'r1-02-secret-must-not-leak',
  };
}

test('R1-02 product page targets the One-App image route without fixture-provider claims', () => {
  assert.match(ONE_APP_PRODUCT_PAGE, /\/api\/status/);
  assert.match(ONE_APP_PRODUCT_PAGE, /\/api\/input\/image/);
  assert.match(ONE_APP_PRODUCT_PAGE, /INFERRED · NOT CONFIRMED/);
  assert.match(ONE_APP_PRODUCT_PAGE, /Never automatic/);
  assert.match(ONE_APP_PRODUCT_PAGE, /Separate authority/);
  assert.doesNotMatch(ONE_APP_PRODUCT_PAGE, /REFERENCE_QUARRY_PERCEPTION/);
  assert.doesNotMatch(ONE_APP_PRODUCT_PAGE, /Quarry-02/);
  assert.doesNotMatch(ONE_APP_PRODUCT_PAGE, /fixture provider/i);
});

test('R1-02 product shell preserves a PNG through One-App and fails closed when live perception is not configured', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-02-product-'));
  const app = await startTalosOneAppProduct({
    port: 0,
    oneApp: {
      runtimeDir,
      imagePerceptionEnv: {},
    },
  });
  try {
    const home = await fetch(`${app.baseUrl}/`);
    assert.equal(home.status, 200);
    assert.match(home.headers.get('content-type') ?? '', /text\/html/);
    assert.match(await home.text(), /Bring the real process\./);

    const statusResponse = await fetch(`${app.baseUrl}/api/status`);
    assert.equal(statusResponse.status, 200);
    const status = await statusResponse.json() as any;
    assert.equal(status.status, 'READY');
    assert.equal(status.inputRoutes.includes('IMAGE_PNG'), false, 'interpreted image route is advertised only when live vision is configured');
    assert.equal(status.image.exactSourceIntake, true, 'exact image preservation remains available without a perception provider');
    assert.equal(status.image.liveVisionInterpretation, false);
    assert.equal(status.image.reason, 'ENDPOINT_NOT_CONFIGURED');
    assert.equal(status.automaticWorkflowExecutionAuthorized, false);

    const pngBytes = readFileSync(quarry02Path);
    const intakeResponse = await fetch(`${app.baseUrl}/api/input/image`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        imageBase64: pngBytes.toString('base64'),
        fileName: 'r1-02-real-input.png',
        initiatedBy: 'r1-02-test-user',
      }),
    });
    assert.equal(intakeResponse.status, 202);
    const intake = await intakeResponse.json() as any;
    assert.equal(intake.interpretation.status, 'NOT_CONFIGURED');
    assert.equal(intake.interpretation.reason, 'ENDPOINT_NOT_CONFIGURED');
    assert.equal(intake.automaticConfirmationAuthorized, false);
    assert.equal(intake.automaticAutomationDesignAuthorized, false);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('R1-02 product status exposes a configured model descriptor without exposing bearer material', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-02-configured-'));
  const app = await startTalosOneAppProduct({
    port: 0,
    oneApp: {
      runtimeDir,
      imagePerceptionEnv: {
        TALOS_IMAGE_PERCEPTION_PROVIDER_URL: 'https://vision.example.test/perceive',
        TALOS_IMAGE_PERCEPTION_PROVIDER_ID: 'R1_MODEL_PROVIDER',
        TALOS_IMAGE_PERCEPTION_PROVIDER_VERSION: '1.0.0',
        TALOS_IMAGE_PERCEPTION_MODEL_REF: 'model:r1-process-vision',
        TALOS_IMAGE_PERCEPTION_MODEL_VERSION: '2026-08-25',
        TALOS_IMAGE_PERCEPTION_PIPELINE_VERSION: 'r1-product-v0.1',
        TALOS_IMAGE_PERCEPTION_BEARER_TOKEN: 'r1-secret-must-not-leak',
      },
    },
  });
  try {
    const response = await fetch(`${app.baseUrl}/api/status`);
    assert.equal(response.status, 200);
    const text = await response.text();
    const status = JSON.parse(text);
    assert.equal(status.image.liveVisionInterpretation, true);
    assert.equal(status.image.provider.providerId, 'R1_MODEL_PROVIDER');
    assert.equal(status.image.provider.modelRef, 'model:r1-process-vision');
    assert.equal(status.image.provider.authConfigured, true);
    assert.equal(text.includes('r1-secret-must-not-leak'), false);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('R1-02 configured product shell carries arbitrary PNG input through One-App to an inferred BPMN review candidate', async () => {
  const provider = await startModelProvider();
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-02-positive-'));
  const app = await startTalosOneAppProduct({
    port: 0,
    oneApp: {
      runtimeDir,
      imagePerceptionEnv: configuredEnv(provider.endpoint),
    },
  });
  try {
    const statusResponse = await fetch(`${app.baseUrl}/api/status`);
    assert.equal(statusResponse.status, 200);
    const statusText = await statusResponse.text();
    const status = JSON.parse(statusText);
    assert.equal(status.image.liveVisionInterpretation, true);
    assert.equal(status.inputRoutes.includes('IMAGE_PNG'), true);
    assert.equal(status.image.provider.providerId, 'R1_02_PRODUCT_MODEL');
    assert.equal(statusText.includes('r1-02-secret-must-not-leak'), false);

    const response = await fetch(`${app.baseUrl}/api/input/image`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fileName: 'r1-02-arbitrary-process.png',
        imageBase64: tinyPng.toString('base64'),
        initiatedBy: 'r1-02-product-user',
      }),
    });
    assert.equal(response.status, 201);
    const body = await response.json() as any;
    assert.equal(body.status, 'BPMN_READY_FOR_PROCESS_REVIEW');
    assert.equal(body.perceptionDecision, 'ADMITTED_FOR_REVIEW');
    assert.equal(body.revision.sourceRoute, 'IMAGE_INTERPRETATION');
    assert.equal(body.revision.state, 'DRAFT');
    assert.equal(body.reconciliation.status, 'RECONCILED');
    assert.equal(body.reconciliation.processRevision.semanticClaims.length > 0, true);
    assert.equal(body.reconciliation.processRevision.semanticClaims.every((claim: any) => claim.truthClass === 'INFERRED'), true);
    assert.equal(body.reconciliation.validation.assessment.executionReadiness, 'NEEDS_CONFIRMATION');
    assert.equal(body.automaticConfirmationAuthorized, false);
    assert.equal(body.automaticFreezeAuthorized, false);
    assert.equal(body.automaticExecutionAuthorized, false);
  } finally {
    await app.close();
    await provider.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
