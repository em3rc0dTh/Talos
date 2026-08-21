import http from 'node:http';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { startTalosProcessConfirmationProduct } from './workspace-server.ts';

const PROVIDER_ID = 'TALOS_LOCAL_REGISTERED_SOURCE_INTERPRETER';
const PROVIDER_VERSION = '1.0.0-test';
const MODEL_REF = 'fixture:quarry-03-registered-source';
const MODEL_VERSION = 'quarry-03@4f91bc9187089d31ba36c07aff2dfdd376a07e783c60190e911baa891e20fc04';
const PIPELINE_VERSION = 'registered-source-fixture-v0.1';
const QUARRY_03_SHA256 = '4f91bc9187089d31ba36c07aff2dfdd376a07e783c60190e911baa891e20fc04';
const WIDTH = 755;
const HEIGHT = 337;

type Envelope = {
  schemaVersion: string;
  sourceRepresentationId: string;
  contentSha256: string;
  coordinateSpace: { width: number; height: number; basis: string; orientation: string; originConvention: string };
};

const labels = [
  ['order-received','Order Received','EVENT'],
  ['check-availability','Check Availability','ACTION'],
  ['article-available','Article Available?','DECISION'],
  ['procurement','Procurement','SUBPROCESS'],
  ['ship-article','Ship Article','ACTION'],
  ['financial-settlement','Financial Settlement','SUBPROCESS'],
  ['payment-received','Payment Received','END'],
  ['inform-customer-late','Inform Customer','ACTION'],
  ['customer-informed','Customer Informed','END'],
  ['inform-customer-undeliverable','Inform Customer','ACTION'],
  ['remove-article','Remove Article from Catalogue','ACTION'],
  ['article-removed','Article Removed','END'],
] as const;

const relations = [
  ['order-to-check','order-received','check-availability','FLOW_CANDIDATE'],
  ['check-to-decision','check-availability','article-available','FLOW_CANDIDATE'],
  ['available-yes-to-ship','article-available','ship-article','CONDITIONAL_FLOW_CANDIDATE'],
  ['available-no-to-procurement','article-available','procurement','CONDITIONAL_FLOW_CANDIDATE'],
  ['procurement-to-ship','procurement','ship-article','FLOW_CANDIDATE'],
  ['ship-to-settlement','ship-article','financial-settlement','FLOW_CANDIDATE'],
  ['settlement-to-payment','financial-settlement','payment-received','FLOW_CANDIDATE'],
  ['procurement-late-to-inform','procurement','inform-customer-late','BOUNDARY_EVENT_FLOW_CANDIDATE'],
  ['late-inform-to-end','inform-customer-late','customer-informed','FLOW_CANDIDATE'],
  ['procurement-undeliverable-to-inform','procurement','inform-customer-undeliverable','BOUNDARY_EVENT_FLOW_CANDIDATE'],
  ['undeliverable-inform-to-remove','inform-customer-undeliverable','remove-article','FLOW_CANDIDATE'],
  ['remove-to-end','remove-article','article-removed','FLOW_CANDIDATE'],
] as const;

function correlation(envelope: Envelope) {
  return {
    schemaVersion: 'talos-image-perception-correlation-v0.1',
    sourceRepresentationId: envelope.sourceRepresentationId,
    contentSha256: envelope.contentSha256,
    coordinateSpace: envelope.coordinateSpace,
  };
}

function noResult(envelope: Envelope, code: string, description: string) {
  return {
    requestCorrelation: correlation(envelope),
    providerId: PROVIDER_ID, providerVersion: PROVIDER_VERSION,
    providerClass: 'FIXTURE_PROVIDER', modelRef: MODEL_REF, modelVersion: MODEL_VERSION,
    pipelineVersion: PIPELINE_VERSION, evidenceMode: 'FIXTURE_EXPECTATION', status: 'NO_RESULT',
    anchors: [], observations: [], occurrenceCandidates: [], alternativeSets: [], relationCandidates: [],
    diagnostics: [{ code, description }],
  };
}

function quarry03(envelope: Envelope) {
  if (envelope.contentSha256 !== QUARRY_03_SHA256) {
    return noResult(envelope, 'UNREGISTERED_TEST_IMAGE', 'The local test interpreter recognizes only the exact registered Quarry-03 PNG. Configure a real model provider for arbitrary images.');
  }
  if (envelope.coordinateSpace.width !== WIDTH || envelope.coordinateSpace.height !== HEIGHT) {
    return noResult(envelope, 'REGISTERED_SOURCE_DIMENSION_MISMATCH', 'The digest matched Quarry-03 but its coordinate space did not.');
  }
  const textObservations = labels.map(([key,label]) => ({
    providerObservationKey: `text:${key}`, anchorKey: 'whole-image',
    observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: label, confidence: 1,
    notes: 'TEST_ONLY registered-source expectation; not OCR or human confirmation.',
  }));
  const strokeObservations = relations.map(([key]) => ({
    providerObservationKey: `stroke:${key}`, anchorKey: 'whole-image',
    observationKind: 'CONNECTOR_STROKE', observedValue: { fixtureRelationKey: key }, confidence: 1,
    notes: 'TEST_ONLY registered-source connector expectation.',
  }));
  return {
    requestCorrelation: correlation(envelope),
    providerId: PROVIDER_ID, providerVersion: PROVIDER_VERSION,
    providerClass: 'FIXTURE_PROVIDER', modelRef: MODEL_REF, modelVersion: MODEL_VERSION,
    pipelineVersion: PIPELINE_VERSION, evidenceMode: 'FIXTURE_EXPECTATION', status: 'SUCCEEDED',
    anchors: [{ providerAnchorKey: 'whole-image', geometryKind: 'WHOLE_IMAGE',
      geometry: { x: 0, y: 0, width: WIDTH, height: HEIGHT }, visibilityState: 'VISIBLE',
      notes: 'Whole-image evidence only; no region-level coordinates are asserted.' }],
    observations: [
      ...textObservations, ...strokeObservations,
      { providerObservationKey: 'shape:article-available', anchorKey: 'whole-image', observationKind: 'SHAPE_CLASS_CANDIDATE', observedValue: 'GATEWAY_LIKE', confidence: 1 },
      { providerObservationKey: 'shape:procurement', anchorKey: 'whole-image', observationKind: 'SHAPE_CLASS_CANDIDATE', observedValue: 'ACTIVITY_WITH_COLLAPSED_MARKER', confidence: 1 },
      { providerObservationKey: 'shape:financial-settlement', anchorKey: 'whole-image', observationKind: 'SHAPE_CLASS_CANDIDATE', observedValue: 'ACTIVITY_WITH_COLLAPSED_MARKER', confidence: 1 },
    ],
    occurrenceCandidates: labels.map(([key,,semanticType]) => ({
      providerOccurrenceKey: key, anchorKeys: ['whole-image'], occurrenceKind: 'NODE',
      literalLabelObservationKey: `text:${key}`, candidateSemanticType: semanticType,
      sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: [`text:${key}`], confidence: 1,
      notes: 'Fixture semantic candidate remains inferred until user confirmation.',
    })),
    alternativeSets: relations.map(([key,,,role]) => ({
      providerAlternativeSetKey: `role:${key}`, propertyPath: 'relationshipRole',
      exclusivityMode: 'MUTUALLY_EXCLUSIVE',
      alternatives: [
        { providerAlternativeKey: `role:${key}:preferred`, value: role, confidence: .95, anchorKeys: ['whole-image'], supportingObservationKeys: [`stroke:${key}`], interpretationNotes: 'TEST_ONLY documented interpretation.' },
        { providerAlternativeKey: `role:${key}:unknown`, value: 'UNKNOWN_RELATIONSHIP_ROLE', confidence: .05, anchorKeys: ['whole-image'], supportingObservationKeys: [`stroke:${key}`] },
      ],
      modelPreferredAlternativeKey: `role:${key}:preferred`, modelPreferenceConfidence: .95,
    })),
    relationCandidates: relations.map(([key,source,target]) => ({
      providerRelationKey: key, strokeObservationKeys: [`stroke:${key}`], anchorKeys: ['whole-image'], existenceConfidence: 1,
      sourceEndpointCandidates: [{ occurrenceCandidateKey: source, anchorKey: 'whole-image', endpointState: 'SET_CANDIDATE', confidence: 1 }],
      targetEndpointCandidates: [{ occurrenceCandidateKey: target, anchorKey: 'whole-image', endpointState: 'SET_CANDIDATE', confidence: 1 }],
      directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: 1 }], roleAlternativeSetKey: `role:${key}`,
      notes: 'TEST_ONLY relation candidate; not confirmed business truth.',
    })),
    diagnostics: [{ code: 'FIXTURE_PROVIDER_NOT_REAL_VISION', description: 'Exact Quarry-03 registered-source interpreter for local product testing only. It does not claim arbitrary-image perception.' }],
  };
}

async function readJson(req: http.IncomingMessage): Promise<Envelope> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Envelope;
}

async function start() {
  const provider = http.createServer(async (req,res) => {
    try {
      if (req.method !== 'POST' || req.url !== '/perceive') { res.writeHead(404).end(); return; }
      const envelope = await readJson(req);
      const body = JSON.stringify(quarry03(envelope));
      res.writeHead(200, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) });
      res.end(body);
    } catch (error) {
      const body = JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
      res.writeHead(400, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) });
      res.end(body);
    }
  });
  await new Promise<void>((resolve,reject) => {
    provider.once('error',reject);
    provider.listen(0,'127.0.0.1',resolve);
  });
  const address = provider.address();
  if (!address || typeof address === 'string') throw new Error('Local test vision provider did not bind');
  const app = await startTalosProcessConfirmationProduct({
    port: Number(process.env.PORT ?? 4318),
    imagePerceptionEnv: {
      TALOS_IMAGE_PERCEPTION_PROVIDER_URL: `http://127.0.0.1:${address.port}/perceive`,
      TALOS_IMAGE_PERCEPTION_PROVIDER_ID: PROVIDER_ID,
      TALOS_IMAGE_PERCEPTION_PROVIDER_VERSION: PROVIDER_VERSION,
      TALOS_IMAGE_PERCEPTION_MODEL_REF: MODEL_REF,
      TALOS_IMAGE_PERCEPTION_MODEL_VERSION: MODEL_VERSION,
      TALOS_IMAGE_PERCEPTION_PIPELINE_VERSION: PIPELINE_VERSION,
      TALOS_IMAGE_PERCEPTION_PROVIDER_CLASS: 'FIXTURE_PROVIDER',
      TALOS_IMAGE_PERCEPTION_EVIDENCE_MODE: 'FIXTURE_EXPECTATION',
    },
  });
  console.log(`Talos Process Confirmation TEST workspace ready at ${app.baseUrl}`);
  console.log('Vision mode: exact registered Quarry-03 fixture only; arbitrary images require a configured model provider.');
  const stop = async () => {
    await app.close();
    await new Promise<void>((resolve) => provider.close(() => resolve()));
    process.exit(0);
  };
  process.once('SIGINT',stop);
  process.once('SIGTERM',stop);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  start().catch((error) => { console.error(error); process.exit(1); });
}
