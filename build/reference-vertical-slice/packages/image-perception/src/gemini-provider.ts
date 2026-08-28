import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { AsyncImagePerceptionTransportEnvelope, AsyncHttpImagePerceptionProviderConfig } from './async-http-provider.ts';
import type {
  ImagePerceptionProviderResult,
  ImageVisibilityState,
  ProviderObservation,
  ProviderOccurrenceCandidate,
  ProviderRelationCandidate,
  ProviderVisualAnchor,
} from './perception-types.ts';
import {
  IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
  type ImagePerceptionResponseCorrelation,
} from './correlated-http-provider.ts';
import {
  IMAGE_PERCEPTION_RUNTIME_CONFIG_VERSION,
  type ImagePerceptionRuntimeBinding,
  type ImagePerceptionRuntimeDescriptor,
  type ImagePerceptionRuntimeResolution,
} from './runtime-provider-config.ts';

export const GEMINI_IMAGE_PERCEPTION_PIPELINE_VERSION = 'talos-gemini-primary-v0.1';
export const GEMINI_IMAGE_PERCEPTION_PROVIDER_ID = 'TALOS_GEMINI_PRIMARY';
export const GEMINI_IMAGE_PERCEPTION_PROVIDER_VERSION = '1.0.0';

export const GEMINI_IMAGE_PERCEPTION_ENV = {
  apiKey: 'GEMINI_API_KEY',
  model: 'TALOS_GEMINI_MODEL',
  apiBaseUrl: 'TALOS_GEMINI_API_BASE_URL',
  timeoutMs: 'TALOS_GEMINI_TIMEOUT_MS',
} as const;

const DEFAULT_MODEL = 'gemini-3.6-flash';
const DEFAULT_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_TIMEOUT_MS = 120_000;

const NODE_KINDS = new Set([
  'EVENT','ACTION','DECISION','PARALLEL_SPLIT','JOIN','WAIT','HUMAN_INTERACTION','SUBPROCESS','STATE','END',
  'ACTOR','DATA_OBJECT','BUSINESS_RULE','UNKNOWN',
]);
const OCCURRENCE_KINDS = new Set(['NODE','PARTICIPANT','OBJECT_NODE','ANNOTATION','EVENT_MARKER','REGION','SOURCE_DEFINED']);
const SOURCE_PLANE_KINDS = new Set([
  'BUSINESS_GRAPH','RESPONSIBILITY_COLLABORATION','OBJECT_DATA','NOTATION_ANNOTATION','AUTHORING_CONTEXT','SOURCE_DEFINED','UNKNOWN',
]);
const RELATION_ROLES = new Set(['CONTROL_FLOW','CONDITIONAL_FLOW','DEFAULT_FLOW','PARALLEL_FLOW','MESSAGE_RELATIONSHIP','UNKNOWN']);
const DIRECTIONS = new Set(['SOURCE_TO_TARGET','TARGET_TO_SOURCE','BIDIRECTIONAL','UNKNOWN']);
const VISIBILITY = new Set(['VISIBLE','PARTIALLY_VISIBLE','LOW_LEGIBILITY','OBSCURED','OUT_OF_FRAME_CANDIDATE','UNKNOWN']);

interface GeminiElement {
  id: string;
  label: string;
  nodeKind: string;
  occurrenceKind: string;
  sourcePlaneKind: string;
  bbox: [number, number, number, number];
  confidence: number;
  visibility: string;
}

interface GeminiConnector {
  id: string;
  sourceElementId: string;
  targetElementId: string;
  direction: string;
  role: string;
  guardText: string;
  bbox: [number, number, number, number];
  confidence: number;
}

interface GeminiUncertainty { code: string; description: string; }

interface GeminiExtraction {
  completeCoverage: boolean;
  artifactType: string;
  elements: GeminiElement[];
  connectors: GeminiConnector[];
  uncertainties: GeminiUncertainty[];
}

export interface GeminiImagePerceptionRuntimeResolution {
  status: 'DISABLED' | 'CONFIGURED';
  reason?: 'GEMINI_API_KEY_NOT_CONFIGURED';
  binding?: ImagePerceptionRuntimeBinding;
  fetchImpl?: typeof fetch;
}

function envValue(env: Readonly<Record<string, string | undefined>>, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

function clampConfidence(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function requiredString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function safeBbox(value: unknown): [number, number, number, number] {
  if (!Array.isArray(value) || value.length !== 4 || value.some((item) => typeof item !== 'number' || !Number.isFinite(item))) return [0, 0, 1000, 1000];
  const [y1, x1, y2, x2] = value.map((item) => Math.max(0, Math.min(1000, Math.round(item)))) as [number, number, number, number];
  return [Math.min(y1, y2), Math.min(x1, x2), Math.max(y1, y2), Math.max(x1, x2)];
}

function pixelBox(bbox: [number, number, number, number], envelope: AsyncImagePerceptionTransportEnvelope): Record<string, number> {
  const [y1, x1, y2, x2] = bbox;
  const left = Math.round((x1 / 1000) * envelope.coordinateSpace.width);
  const top = Math.round((y1 / 1000) * envelope.coordinateSpace.height);
  const right = Math.round((x2 / 1000) * envelope.coordinateSpace.width);
  const bottom = Math.round((y2 / 1000) * envelope.coordinateSpace.height);
  return { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

function responseCorrelation(envelope: AsyncImagePerceptionTransportEnvelope): ImagePerceptionResponseCorrelation {
  return {
    schemaVersion: IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
    sourceRepresentationId: envelope.sourceRepresentationId,
    contentSha256: envelope.contentSha256,
    coordinateSpace: { ...envelope.coordinateSpace },
  };
}

function extractionSchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      completeCoverage: { type: 'boolean' },
      artifactType: { type: 'string' },
      elements: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            nodeKind: { type: 'string', enum: [...NODE_KINDS] },
            occurrenceKind: { type: 'string', enum: [...OCCURRENCE_KINDS] },
            sourcePlaneKind: { type: 'string', enum: [...SOURCE_PLANE_KINDS] },
            bbox: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'number' } },
            confidence: { type: 'number' },
            visibility: { type: 'string', enum: [...VISIBILITY] },
          },
          required: ['id','label','nodeKind','occurrenceKind','sourcePlaneKind','bbox','confidence','visibility'],
        },
      },
      connectors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sourceElementId: { type: 'string' },
            targetElementId: { type: 'string' },
            direction: { type: 'string', enum: [...DIRECTIONS] },
            role: { type: 'string', enum: [...RELATION_ROLES] },
            guardText: { type: 'string' },
            bbox: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'number' } },
            confidence: { type: 'number' },
          },
          required: ['id','sourceElementId','targetElementId','direction','role','guardText','bbox','confidence'],
        },
      },
      uncertainties: {
        type: 'array',
        items: {
          type: 'object',
          properties: { code: { type: 'string' }, description: { type: 'string' } },
          required: ['code','description'],
        },
      },
    },
    required: ['completeCoverage','artifactType','elements','connectors','uncertainties'],
  };
}

const EXTRACTION_PROMPT = `You are Talos' visual perception sensor. Inspect the ENTIRE process-diagram image systematically from top-left to bottom-right only to guarantee coverage. Never infer business execution order from visual position; execution order comes only from visible connectors/arrows and explicit notation.

Return only the requested structured JSON. Extract visible evidence, not a BPMN file and not an automation design.

Rules:
- Copy visible labels literally. Do not rewrite, summarize, translate, or invent text.
- Identify all process-relevant geometric elements, including events, actions/tasks, decisions/gateways, parallel split/join markers, waits, human interactions, subprocess boundaries, states, end events, actors/participants, data objects, business rules and annotations.
- Give each element a stable local id and a bounding box [ymin,xmin,ymax,xmax] normalized to 0..1000.
- Extract every visible connector independently. Identify source, target and arrow direction from visible geometry only.
- For every decision/gateway outgoing connector, inspect visible text immediately adjacent to that connector stroke/arrow. If text is visibly attached to that specific connector, copy it exactly into guardText, including short yes/no labels in any language. Do not emit connector-only guard labels as standalone process nodes. If association is ambiguous, leave guardText empty and report uncertainty.
- A connector label/guard belongs in guardText only when visibly attached to that connector.
- Use UNKNOWN, unresolved ids, lowered confidence, or uncertainties whenever evidence is ambiguous. Never repair a missing arrow or endpoint by guessing.
- Mark completeCoverage=false when any relevant image region is unreadable, obscured, cropped, ambiguous, or not fully accounted for.
- sourcePlaneKind should be BUSINESS_GRAPH for process flow nodes, RESPONSIBILITY_COLLABORATION for pools/lanes/participants, OBJECT_DATA for data objects, NOTATION_ANNOTATION for annotations, and UNKNOWN when unclear.
- nodeKind must use the supplied enum. For ordinary tasks/actions use ACTION; exclusive/inclusive routing decisions use DECISION; start/intermediate events use EVENT; terminal events use END; explicit expanded/collapsed subprocesses use SUBPROCESS.
- Use WAIT when the visible element's primary business meaning is elapsed time, deliberate delay/hold/pause, waiting for a duration, waiting until a date/time, or waiting until a condition/message/event. This includes language equivalent to "wait N minutes", "hold for N time", "leave/let stand for N time", or "wait until X" in any language. Do not classify an ordinary action as WAIT merely because its label mentions a duration as incidental context. If the distinction is ambiguous, report uncertainty instead of guessing.
- occurrenceKind is normally NODE for process nodes, PARTICIPANT for actors/pools/lanes, OBJECT_NODE for data objects, ANNOTATION for annotations.
- Confidence is evidence confidence from 0 to 1, not business truth authority.
- Do not claim certainty merely to avoid an uncertainty entry.`;

function parseGeminiExtraction(payload: unknown): GeminiExtraction {
  const root = payload && typeof payload === 'object' ? payload as any : undefined;
  const parts = root?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((part: any) => typeof part?.text === 'string' ? part.text : '').join('').trim() : '';
  if (!text) throw new TypeError('GEMINI_IMAGE_PERCEPTION_EMPTY_RESPONSE');
  const parsed = JSON.parse(text) as any;
  return {
    completeCoverage: parsed?.completeCoverage === true,
    artifactType: requiredString(parsed?.artifactType) || 'UNKNOWN',
    elements: Array.isArray(parsed?.elements) ? parsed.elements.map((item: any, index: number) => ({
      id: requiredString(item?.id) || `element-${index + 1}`,
      label: requiredString(item?.label),
      nodeKind: NODE_KINDS.has(item?.nodeKind) ? item.nodeKind : 'UNKNOWN',
      occurrenceKind: OCCURRENCE_KINDS.has(item?.occurrenceKind) ? item.occurrenceKind : 'SOURCE_DEFINED',
      sourcePlaneKind: SOURCE_PLANE_KINDS.has(item?.sourcePlaneKind) ? item.sourcePlaneKind : 'UNKNOWN',
      bbox: safeBbox(item?.bbox),
      confidence: clampConfidence(item?.confidence),
      visibility: VISIBILITY.has(item?.visibility) ? item.visibility : 'UNKNOWN',
    })) : [],
    connectors: Array.isArray(parsed?.connectors) ? parsed.connectors.map((item: any, index: number) => ({
      id: requiredString(item?.id) || `connector-${index + 1}`,
      sourceElementId: requiredString(item?.sourceElementId),
      targetElementId: requiredString(item?.targetElementId),
      direction: DIRECTIONS.has(item?.direction) ? item.direction : 'UNKNOWN',
      role: RELATION_ROLES.has(item?.role) ? item.role : 'UNKNOWN',
      guardText: requiredString(item?.guardText),
      bbox: safeBbox(item?.bbox),
      confidence: clampConfidence(item?.confidence),
    })) : [],
    uncertainties: Array.isArray(parsed?.uncertainties) ? parsed.uncertainties.map((item: any, index: number) => ({
      code: requiredString(item?.code) || `GEMINI_UNCERTAINTY_${index + 1}`,
      description: requiredString(item?.description) || 'Gemini reported unresolved visual evidence.',
    })) : [],
  };
}

function toTalosResult(extraction: GeminiExtraction, envelope: AsyncImagePerceptionTransportEnvelope, model: string): ImagePerceptionProviderResult & { requestCorrelation: ImagePerceptionResponseCorrelation } {
  const anchors: ProviderVisualAnchor[] = [];
  const observations: ProviderObservation[] = [];
  const occurrenceCandidates: ProviderOccurrenceCandidate[] = [];
  const relationCandidates: ProviderRelationCandidate[] = [];
  const alternativeSets: ImagePerceptionProviderResult['alternativeSets'] = [];
  const occurrenceByElement = new Map<string, string>();

  for (const [index, element] of extraction.elements.entries()) {
    const anchorKey = `gemini-element-anchor-${index + 1}`;
    const shapeObservationKey = `gemini-element-shape-${index + 1}`;
    const labelObservationKey = element.label ? `gemini-element-label-${index + 1}` : undefined;
    const occurrenceKey = `gemini-element-${index + 1}`;
    occurrenceByElement.set(element.id, occurrenceKey);
    anchors.push({
      providerAnchorKey: anchorKey,
      geometryKind: 'BOX',
      geometry: pixelBox(element.bbox, envelope),
      visibilityState: element.visibility as ImageVisibilityState,
      notes: `Gemini source element id=${element.id}`,
    });
    observations.push({
      providerObservationKey: shapeObservationKey,
      anchorKey,
      observationKind: 'SHAPE_CLASS_CANDIDATE',
      observedValue: element.nodeKind,
      confidence: element.confidence,
    });
    if (labelObservationKey) observations.push({
      providerObservationKey: labelObservationKey,
      anchorKey,
      observationKind: 'TEXT_LITERAL_CANDIDATE',
      observedValue: element.label,
      confidence: element.confidence,
    });
    occurrenceCandidates.push({
      providerOccurrenceKey: occurrenceKey,
      anchorKeys: [anchorKey],
      occurrenceKind: element.occurrenceKind,
      ...(labelObservationKey ? { literalLabelObservationKey: labelObservationKey } : {}),
      ...(element.nodeKind !== 'UNKNOWN' ? { candidateSemanticType: element.nodeKind } : {}),
      sourcePlaneKind: element.sourcePlaneKind as ProviderOccurrenceCandidate['sourcePlaneKind'],
      supportingObservationKeys: [shapeObservationKey, ...(labelObservationKey ? [labelObservationKey] : [])],
      confidence: element.confidence,
      notes: `Gemini visual extraction; artifactType=${extraction.artifactType}`,
    });
  }

  for (const [index, connector] of extraction.connectors.entries()) {
    const anchorKey = `gemini-connector-anchor-${index + 1}`;
    const strokeKey = `gemini-connector-stroke-${index + 1}`;
    const guardKey = connector.guardText ? `gemini-connector-guard-${index + 1}` : undefined;
    const relationKey = `gemini-connector-${index + 1}`;
    anchors.push({
      providerAnchorKey: anchorKey,
      geometryKind: 'BOX',
      geometry: pixelBox(connector.bbox, envelope),
      visibilityState: 'VISIBLE',
      notes: `Gemini source connector id=${connector.id}`,
    });
    observations.push({
      providerObservationKey: strokeKey,
      anchorKey,
      observationKind: 'CONNECTOR_STROKE',
      confidence: connector.confidence,
    });
    if (guardKey) observations.push({
      providerObservationKey: guardKey,
      anchorKey,
      observationKind: 'TEXT_LITERAL_CANDIDATE',
      observedValue: connector.guardText,
      confidence: connector.confidence,
    });

    const roleSetKey = connector.role !== 'UNKNOWN' ? `gemini-connector-role-${index + 1}` : undefined;
    if (roleSetKey) alternativeSets.push({
      providerAlternativeSetKey: roleSetKey,
      propertyPath: 'relationshipRole',
      alternatives: [{
        providerAlternativeKey: `${roleSetKey}-preferred`,
        value: connector.role,
        confidence: connector.confidence,
        anchorKeys: [anchorKey],
        supportingObservationKeys: [strokeKey, ...(guardKey ? [guardKey] : [])],
      }],
      exclusivityMode: 'MUTUALLY_EXCLUSIVE',
      modelPreferredAlternativeKey: `${roleSetKey}-preferred`,
      modelPreferenceConfidence: connector.confidence,
    });

    const sourceOccurrence = occurrenceByElement.get(connector.sourceElementId);
    const targetOccurrence = occurrenceByElement.get(connector.targetElementId);
    relationCandidates.push({
      providerRelationKey: relationKey,
      strokeObservationKeys: [strokeKey],
      anchorKeys: [anchorKey],
      existenceConfidence: connector.confidence,
      sourceEndpointCandidates: [{
        ...(sourceOccurrence ? { occurrenceCandidateKey: sourceOccurrence } : {}),
        endpointState: sourceOccurrence ? 'SET_CANDIDATE' : 'UNRESOLVED',
        confidence: connector.confidence,
      }],
      targetEndpointCandidates: [{
        ...(targetOccurrence ? { occurrenceCandidateKey: targetOccurrence } : {}),
        endpointState: targetOccurrence ? 'SET_CANDIDATE' : 'UNRESOLVED',
        confidence: connector.confidence,
      }],
      directionCandidates: [{ value: connector.direction as ProviderRelationCandidate['directionCandidates'][number]['value'], confidence: connector.confidence }],
      ...(roleSetKey ? { roleAlternativeSetKey: roleSetKey } : {}),
      ...(guardKey ? { guardTextObservationKeys: [guardKey] } : {}),
    });
  }

  const structurallyPartial = !extraction.completeCoverage
    || extraction.uncertainties.length > 0
    || extraction.elements.some((item) => item.nodeKind === 'UNKNOWN' || item.visibility !== 'VISIBLE')
    || extraction.connectors.some((item) => item.direction === 'UNKNOWN' || !occurrenceByElement.has(item.sourceElementId) || !occurrenceByElement.has(item.targetElementId));
  const status: ImagePerceptionProviderResult['status'] = extraction.elements.length === 0
    ? 'NO_RESULT'
    : structurallyPartial ? 'PARTIAL' : 'SUCCEEDED';

  if (status === 'NO_RESULT') {
    return {
      providerId: GEMINI_IMAGE_PERCEPTION_PROVIDER_ID,
      providerVersion: GEMINI_IMAGE_PERCEPTION_PROVIDER_VERSION,
      providerClass: 'MODEL_PROVIDER',
      modelRef: model,
      modelVersion: model,
      pipelineVersion: GEMINI_IMAGE_PERCEPTION_PIPELINE_VERSION,
      evidenceMode: 'MODEL_INFERENCE',
      status,
      requestCorrelation: responseCorrelation(envelope),
      anchors: [], observations: [], occurrenceCandidates: [], alternativeSets: [], relationCandidates: [],
      diagnostics: [{ code: 'GEMINI_NO_PROCESS_EVIDENCE', description: 'Gemini returned no process-relevant visual elements.' }],
    };
  }

  return {
    providerId: GEMINI_IMAGE_PERCEPTION_PROVIDER_ID,
    providerVersion: GEMINI_IMAGE_PERCEPTION_PROVIDER_VERSION,
    providerClass: 'MODEL_PROVIDER',
    modelRef: model,
    modelVersion: model,
    pipelineVersion: GEMINI_IMAGE_PERCEPTION_PIPELINE_VERSION,
    evidenceMode: 'MODEL_INFERENCE',
    status,
    requestCorrelation: responseCorrelation(envelope),
    anchors,
    observations,
    occurrenceCandidates,
    alternativeSets,
    relationCandidates,
    diagnostics: extraction.uncertainties.length
      ? extraction.uncertainties.map((item) => ({ code: `GEMINI_${item.code}`, description: item.description }))
      : [{ code: 'GEMINI_EXHAUSTIVE_VISUAL_EXTRACTION', description: `Gemini inspected the full image for visual evidence; artifactType=${extraction.artifactType}.` }],
  };
}

function talosEnvelope(init?: RequestInit): AsyncImagePerceptionTransportEnvelope {
  if (!init || typeof init.body !== 'string') throw new TypeError('GEMINI_IMAGE_PERCEPTION_INVALID_TALOS_REQUEST');
  const parsed = JSON.parse(init.body) as AsyncImagePerceptionTransportEnvelope;
  if (parsed.schemaVersion !== 'talos-image-perception-request-v0.1') throw new TypeError('GEMINI_IMAGE_PERCEPTION_INVALID_TALOS_SCHEMA');
  return parsed;
}

function geminiFetch(apiKey: string, model: string, apiBaseUrl: string, timeoutMs: number, baseFetch: typeof fetch): typeof fetch {
  return (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const envelope = talosEnvelope(init);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await baseFetch(`${apiBaseUrl.replace(/\/$/, '')}/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [
            { inlineData: { mimeType: envelope.mediaType, data: envelope.imageBase64 } },
            { text: EXTRACTION_PROMPT },
          ] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: extractionSchema(),
            temperature: 0,
          },
        }),
        signal: controller.signal,
      });
      if (!response.ok) return new Response(await response.text(), { status: response.status, statusText: response.statusText, headers: { 'content-type': response.headers.get('content-type') ?? 'text/plain' } });
      const raw = await response.json();
      const extraction = parseGeminiExtraction(raw);
      const mapped = toTalosResult(extraction, envelope, model);
      return new Response(JSON.stringify(mapped), { status: 200, headers: { 'content-type': 'application/json' } });
    } finally {
      clearTimeout(timeout);
    }
  }) as typeof fetch;
}

/**
 * First-class Gemini primary provider. A GEMINI_API_KEY is enough to activate
 * it; no Talos-specific proxy process is required. The key remains closure-held
 * by the fetch adapter and is never placed in Talos persisted descriptors.
 */
export function resolveGeminiImagePerceptionRuntime(
  env: Readonly<Record<string, string | undefined>> = process.env,
  baseFetch: typeof fetch = fetch,
): GeminiImagePerceptionRuntimeResolution {
  const apiKey = envValue(env, GEMINI_IMAGE_PERCEPTION_ENV.apiKey);
  if (!apiKey) return { status: 'DISABLED', reason: 'GEMINI_API_KEY_NOT_CONFIGURED' };
  const model = envValue(env, GEMINI_IMAGE_PERCEPTION_ENV.model) ?? DEFAULT_MODEL;
  const apiBaseUrl = envValue(env, GEMINI_IMAGE_PERCEPTION_ENV.apiBaseUrl) ?? DEFAULT_API_BASE;
  const timeoutRaw = envValue(env, GEMINI_IMAGE_PERCEPTION_ENV.timeoutMs);
  const timeoutMs = timeoutRaw && /^\d+$/.test(timeoutRaw) ? Number(timeoutRaw) : DEFAULT_TIMEOUT_MS;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 120_000) throw new TypeError('GEMINI_IMAGE_PERCEPTION_CONFIG_INVALID: timeout must be between 1000 and 120000 milliseconds');

  const endpoint = `${apiBaseUrl.replace(/\/$/, '')}/${encodeURIComponent(model)}:generateContent`;
  const safeFields = {
    configVersion: IMAGE_PERCEPTION_RUNTIME_CONFIG_VERSION,
    endpoint,
    providerId: GEMINI_IMAGE_PERCEPTION_PROVIDER_ID,
    providerVersion: GEMINI_IMAGE_PERCEPTION_PROVIDER_VERSION,
    modelRef: model,
    modelVersion: model,
    pipelineVersion: GEMINI_IMAGE_PERCEPTION_PIPELINE_VERSION,
    timeoutMs,
    authMode: 'API_KEY' as const,
    authConfigured: true,
    providerClass: 'MODEL_PROVIDER' as const,
    evidenceMode: 'MODEL_INFERENCE' as const,
  };
  const descriptor: ImagePerceptionRuntimeDescriptor = Object.freeze({
    ...safeFields,
    configurationFingerprint: digestDeterministicJson({ kind: 'ImagePerceptionRuntimeDescriptor', ...safeFields }),
  });
  const adapterFetch = geminiFetch(apiKey, model, apiBaseUrl, timeoutMs, baseFetch);
  const binding: ImagePerceptionRuntimeBinding = Object.freeze({
    descriptor,
    createTransportConfig(fetchImpl?: typeof fetch): AsyncHttpImagePerceptionProviderConfig {
      return {
        endpoint: descriptor.endpoint,
        providerId: descriptor.providerId,
        providerVersion: descriptor.providerVersion,
        modelRef: descriptor.modelRef,
        modelVersion: descriptor.modelVersion,
        pipelineVersion: descriptor.pipelineVersion,
        timeoutMs: descriptor.timeoutMs,
        providerClass: descriptor.providerClass,
        evidenceMode: descriptor.evidenceMode,
        fetchImpl: fetchImpl ?? adapterFetch,
      };
    },
  });
  return { status: 'CONFIGURED', binding, fetchImpl: adapterFetch };
}
