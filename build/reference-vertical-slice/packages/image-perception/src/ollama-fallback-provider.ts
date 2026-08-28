import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { AsyncImagePerceptionTransportEnvelope, AsyncHttpImagePerceptionProviderConfig } from './async-http-provider.ts';
import {
  IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
  type ImagePerceptionResponseCorrelation,
} from './correlated-http-provider.ts';
import type {
  ImagePerceptionProviderResult,
  ImageVisibilityState,
  ProviderOccurrenceCandidate,
  ProviderRelationCandidate,
  ProviderVisualAnchor,
} from './perception-types.ts';
import {
  IMAGE_PERCEPTION_RUNTIME_CONFIG_VERSION,
  type ImagePerceptionRuntimeBinding,
  type ImagePerceptionRuntimeDescriptor,
} from './runtime-provider-config.ts';

export const OLLAMA_IMAGE_FALLBACK_PROVIDER_ID = 'TALOS_OLLAMA_LOCAL_FALLBACK';
export const OLLAMA_IMAGE_FALLBACK_PROVIDER_VERSION = '1.0.0';
export const OLLAMA_IMAGE_FALLBACK_PIPELINE_VERSION = 'talos-ollama-qwen3vl-fallback-v0.3';

export const OLLAMA_IMAGE_FALLBACK_ENV = {
  enabled: 'TALOS_OLLAMA_FALLBACK_ENABLED',
  endpoint: 'TALOS_OLLAMA_FALLBACK_URL',
  model: 'TALOS_OLLAMA_FALLBACK_MODEL',
  timeoutMs: 'TALOS_OLLAMA_FALLBACK_TIMEOUT_MS',
} as const;

const DEFAULT_ENDPOINT = 'http://127.0.0.1:11434/api/chat';
const DEFAULT_MODEL = 'qwen3-vl:4b-instruct';
const DEFAULT_TIMEOUT_MS = 300_000;
const MAX_TIMEOUT_MS = 600_000;
const MAX_OUTPUT_TOKENS = 2_048;

const NODE_KINDS = ['EVENT','ACTION','DECISION','PARALLEL_SPLIT','JOIN','WAIT','HUMAN_INTERACTION','SUBPROCESS','STATE','END','ACTOR','DATA_OBJECT','BUSINESS_RULE','UNKNOWN'] as const;
const OCCURRENCE_KINDS = ['NODE','PARTICIPANT','OBJECT_NODE','ANNOTATION','EVENT_MARKER','REGION','SOURCE_DEFINED'] as const;
const SOURCE_PLANES = ['BUSINESS_GRAPH','RESPONSIBILITY_COLLABORATION','OBJECT_DATA','NOTATION_ANNOTATION','AUTHORING_CONTEXT','SOURCE_DEFINED','UNKNOWN'] as const;
const RELATION_ROLES = ['CONTROL_FLOW','CONDITIONAL_FLOW','DEFAULT_FLOW','PARALLEL_FLOW','MESSAGE_RELATIONSHIP','UNKNOWN'] as const;
const DIRECTIONS = ['SOURCE_TO_TARGET','TARGET_TO_SOURCE','BIDIRECTIONAL','UNKNOWN'] as const;
const VISIBILITY = ['VISIBLE','PARTIALLY_VISIBLE','LOW_LEGIBILITY','OBSCURED','OUT_OF_FRAME_CANDIDATE','UNKNOWN'] as const;

interface LocalElement {
  id: string;
  label: string;
  nodeKind: typeof NODE_KINDS[number];
  occurrenceKind: typeof OCCURRENCE_KINDS[number];
  sourcePlaneKind: typeof SOURCE_PLANES[number];
  bbox: [number, number, number, number];
  confidence: number;
  visibility: typeof VISIBILITY[number];
}

interface LocalConnector {
  id: string;
  sourceElementId: string;
  targetElementId: string;
  direction: typeof DIRECTIONS[number];
  role: typeof RELATION_ROLES[number];
  guardText: string;
  bbox: [number, number, number, number];
  confidence: number;
}

interface LocalExtraction {
  completeCoverage: boolean;
  elements: LocalElement[];
  connectors: LocalConnector[];
  uncertainties: Array<{ code: string; description: string }>;
}

export type OllamaImageFallbackRuntimeResolution =
  | { status: 'DISABLED'; reason: 'OLLAMA_FALLBACK_NOT_ENABLED' }
  | { status: 'CONFIGURED'; binding: ImagePerceptionRuntimeBinding; fetchImpl: typeof fetch };

const PROMPT = `You are Talos' LOCAL independent fallback visual sensor. A primary cloud perception attempt was insufficient. Re-inspect the COMPLETE image independently; do not trust or imitate any prior answer.

Your task is VISUAL EXTRACTION, not business interpretation. Inspect top-left to bottom-right only for coverage. Never infer process order from position. Process order comes only from visible arrows/connectors and notation.

Return JSON only with exactly these top-level fields: completeCoverage, elements, connectors, uncertainties. Do not output BPMN. Do not design automation. Do not invent missing arrows, labels, conditions, endpoints or process meaning.

IMPORTANT NON-OMISSION RULE:
- A process-relevant visual element includes any visible task/action box, event/circle, decision/gateway diamond, subprocess or grouped step, wait/state marker, human/system step, actor/lane/pool region, data object attached to process work, or text label visibly belonging to a process node.
- If ANY such process/workflow structure is visible, elements MUST NOT be empty.
- Do not omit a visible element merely because you are uncertain what it means. Use nodeKind=UNKNOWN and an uncertainty entry instead.
- elements may be empty ONLY when the image truly contains no visible process/workflow structure. If you return an empty elements array, add an uncertainty explaining the visual basis for that conclusion.
- For every visible arrow or connector, include a connector. If an endpoint or direction is unclear, keep sourceElementId or targetElementId empty as needed, use direction=UNKNOWN and add an uncertainty instead of dropping the connector.

For every visible process element return: id, literal label, nodeKind, occurrenceKind, sourcePlaneKind, bbox [ymin,xmin,ymax,xmax] normalized 0..1000, confidence 0..1, visibility. For every visible connector return: id, sourceElementId, targetElementId, direction, role, guardText, bbox, confidence. Use UNKNOWN or an uncertainty entry whenever evidence is unclear. completeCoverage must be false if any relevant region is unreadable, cropped, obscured or unresolved.

Allowed enum values:
nodeKind=${NODE_KINDS.join('|')}
occurrenceKind=${OCCURRENCE_KINDS.join('|')}
sourcePlaneKind=${SOURCE_PLANES.join('|')}
direction=${DIRECTIONS.join('|')}
role=${RELATION_ROLES.join('|')}
visibility=${VISIBILITY.join('|')}`;

function envValue(env: Readonly<Record<string, string | undefined>>, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

function enabled(env: Readonly<Record<string, string | undefined>>): boolean {
  return /^(1|true|yes|on)$/i.test(envValue(env, OLLAMA_IMAGE_FALLBACK_ENV.enabled) ?? '');
}

function record(value: unknown, code: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(code);
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, code: string, allowEmpty = true): string {
  if (typeof value !== 'string') throw new TypeError(code);
  const trimmed = value.trim();
  if (!allowEmpty && !trimmed) throw new TypeError(code);
  return trimmed;
}

function requiredBoolean(value: unknown, code: string): boolean {
  if (typeof value !== 'boolean') throw new TypeError(code);
  return value;
}

function requiredConfidence(value: unknown, code: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new TypeError(code);
  return value;
}

function requiredBbox(value: unknown, code: string): [number, number, number, number] {
  if (!Array.isArray(value) || value.length !== 4 || value.some((item) => typeof item !== 'number' || !Number.isFinite(item) || item < 0 || item > 1000)) {
    throw new TypeError(code);
  }
  const numbers = value as [number, number, number, number];
  if (numbers[0] > numbers[2] || numbers[1] > numbers[3]) throw new TypeError(code);
  return [...numbers];
}

function requiredEnum<T extends readonly string[]>(value: unknown, values: T, code: string): T[number] {
  if (typeof value !== 'string' || !values.includes(value)) throw new TypeError(code);
  return value as T[number];
}

function requiredArray(value: unknown, code: string): unknown[] {
  if (!Array.isArray(value)) throw new TypeError(code);
  return value;
}

function parseExtraction(raw: unknown): LocalExtraction {
  const root = record(raw, 'OLLAMA_IMAGE_FALLBACK_INVALID_RESPONSE');
  const message = record(root.message, 'OLLAMA_IMAGE_FALLBACK_MISSING_MESSAGE');
  const content = requiredString(message.content, 'OLLAMA_IMAGE_FALLBACK_EMPTY_RESPONSE', false);
  const parsed = record(JSON.parse(content), 'OLLAMA_IMAGE_FALLBACK_INVALID_JSON_OBJECT');

  const elements = requiredArray(parsed.elements, 'OLLAMA_IMAGE_FALLBACK_INVALID_ELEMENTS').map((value, index): LocalElement => {
    const item = record(value, `OLLAMA_IMAGE_FALLBACK_INVALID_ELEMENT_${index + 1}`);
    return {
      id: requiredString(item.id, `OLLAMA_IMAGE_FALLBACK_INVALID_ELEMENT_ID_${index + 1}`, false),
      label: requiredString(item.label, `OLLAMA_IMAGE_FALLBACK_INVALID_ELEMENT_LABEL_${index + 1}`),
      nodeKind: requiredEnum(item.nodeKind, NODE_KINDS, `OLLAMA_IMAGE_FALLBACK_INVALID_NODE_KIND_${index + 1}`),
      occurrenceKind: requiredEnum(item.occurrenceKind, OCCURRENCE_KINDS, `OLLAMA_IMAGE_FALLBACK_INVALID_OCCURRENCE_KIND_${index + 1}`),
      sourcePlaneKind: requiredEnum(item.sourcePlaneKind, SOURCE_PLANES, `OLLAMA_IMAGE_FALLBACK_INVALID_SOURCE_PLANE_${index + 1}`),
      bbox: requiredBbox(item.bbox, `OLLAMA_IMAGE_FALLBACK_INVALID_ELEMENT_BBOX_${index + 1}`),
      confidence: requiredConfidence(item.confidence, `OLLAMA_IMAGE_FALLBACK_INVALID_ELEMENT_CONFIDENCE_${index + 1}`),
      visibility: requiredEnum(item.visibility, VISIBILITY, `OLLAMA_IMAGE_FALLBACK_INVALID_VISIBILITY_${index + 1}`),
    };
  });

  const connectors = requiredArray(parsed.connectors, 'OLLAMA_IMAGE_FALLBACK_INVALID_CONNECTORS').map((value, index): LocalConnector => {
    const item = record(value, `OLLAMA_IMAGE_FALLBACK_INVALID_CONNECTOR_${index + 1}`);
    return {
      id: requiredString(item.id, `OLLAMA_IMAGE_FALLBACK_INVALID_CONNECTOR_ID_${index + 1}`, false),
      sourceElementId: requiredString(item.sourceElementId, `OLLAMA_IMAGE_FALLBACK_INVALID_CONNECTOR_SOURCE_${index + 1}`),
      targetElementId: requiredString(item.targetElementId, `OLLAMA_IMAGE_FALLBACK_INVALID_CONNECTOR_TARGET_${index + 1}`),
      direction: requiredEnum(item.direction, DIRECTIONS, `OLLAMA_IMAGE_FALLBACK_INVALID_DIRECTION_${index + 1}`),
      role: requiredEnum(item.role, RELATION_ROLES, `OLLAMA_IMAGE_FALLBACK_INVALID_ROLE_${index + 1}`),
      guardText: requiredString(item.guardText, `OLLAMA_IMAGE_FALLBACK_INVALID_GUARD_${index + 1}`),
      bbox: requiredBbox(item.bbox, `OLLAMA_IMAGE_FALLBACK_INVALID_CONNECTOR_BBOX_${index + 1}`),
      confidence: requiredConfidence(item.confidence, `OLLAMA_IMAGE_FALLBACK_INVALID_CONNECTOR_CONFIDENCE_${index + 1}`),
    };
  });

  const uncertainties = requiredArray(parsed.uncertainties, 'OLLAMA_IMAGE_FALLBACK_INVALID_UNCERTAINTIES').map((value, index) => {
    const item = record(value, `OLLAMA_IMAGE_FALLBACK_INVALID_UNCERTAINTY_${index + 1}`);
    return {
      code: requiredString(item.code, `OLLAMA_IMAGE_FALLBACK_INVALID_UNCERTAINTY_CODE_${index + 1}`, false),
      description: requiredString(item.description, `OLLAMA_IMAGE_FALLBACK_INVALID_UNCERTAINTY_DESCRIPTION_${index + 1}`, false),
    };
  });

  return {
    completeCoverage: requiredBoolean(parsed.completeCoverage, 'OLLAMA_IMAGE_FALLBACK_INVALID_COMPLETE_COVERAGE'),
    elements,
    connectors,
    uncertainties,
  };
}

function correlation(envelope: AsyncImagePerceptionTransportEnvelope): ImagePerceptionResponseCorrelation {
  return { schemaVersion: IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION, sourceRepresentationId: envelope.sourceRepresentationId, contentSha256: envelope.contentSha256, coordinateSpace: { ...envelope.coordinateSpace } };
}

function pixelBox(box: [number,number,number,number], envelope: AsyncImagePerceptionTransportEnvelope): Record<string, number> {
  const [y1,x1,y2,x2] = box;
  const left = Math.round(x1 / 1000 * envelope.coordinateSpace.width); const top = Math.round(y1 / 1000 * envelope.coordinateSpace.height);
  const right = Math.round(x2 / 1000 * envelope.coordinateSpace.width); const bottom = Math.round(y2 / 1000 * envelope.coordinateSpace.height);
  return { x:left, y:top, width:Math.max(1,right-left), height:Math.max(1,bottom-top) };
}

function mapResult(extraction: LocalExtraction, envelope: AsyncImagePerceptionTransportEnvelope, model: string): ImagePerceptionProviderResult & { requestCorrelation: ImagePerceptionResponseCorrelation } {
  if (extraction.elements.length === 0) return {
    providerId: OLLAMA_IMAGE_FALLBACK_PROVIDER_ID, providerVersion: OLLAMA_IMAGE_FALLBACK_PROVIDER_VERSION,
    providerClass: 'MODEL_PROVIDER', modelRef: model, modelVersion: model, pipelineVersion: OLLAMA_IMAGE_FALLBACK_PIPELINE_VERSION,
    evidenceMode: 'MODEL_INFERENCE', status: 'NO_RESULT', requestCorrelation: correlation(envelope),
    anchors: [], observations: [], occurrenceCandidates: [], alternativeSets: [], relationCandidates: [],
    diagnostics: [
      { code:'OLLAMA_LOCAL_NO_PROCESS_EVIDENCE', description:'The local fallback returned no process-relevant visual elements.' },
      ...extraction.uncertainties.map(item=>({code:`OLLAMA_${item.code}`,description:item.description})),
    ],
  };

  const anchors: ProviderVisualAnchor[] = [];
  const observations: ImagePerceptionProviderResult['observations'] = [];
  const occurrences: ProviderOccurrenceCandidate[] = [];
  const alternatives: ImagePerceptionProviderResult['alternativeSets'] = [];
  const relations: ProviderRelationCandidate[] = [];
  const occurrenceById = new Map<string,string>();

  extraction.elements.forEach((element,index) => {
    const anchorKey=`local-element-anchor-${index+1}`, shapeKey=`local-element-shape-${index+1}`, labelKey=element.label ? `local-element-label-${index+1}` : undefined, occurrenceKey=`local-element-${index+1}`;
    occurrenceById.set(element.id,occurrenceKey);
    anchors.push({ providerAnchorKey:anchorKey, geometryKind:'BOX', geometry:pixelBox(element.bbox,envelope), visibilityState:element.visibility as ImageVisibilityState, notes:`Ollama/Qwen local element id=${element.id}` });
    observations.push({ providerObservationKey:shapeKey, anchorKey, observationKind:'SHAPE_CLASS_CANDIDATE', observedValue:element.nodeKind, confidence:element.confidence });
    if (labelKey) observations.push({ providerObservationKey:labelKey, anchorKey, observationKind:'TEXT_LITERAL_CANDIDATE', observedValue:element.label, confidence:element.confidence });
    occurrences.push({ providerOccurrenceKey:occurrenceKey, anchorKeys:[anchorKey], occurrenceKind:element.occurrenceKind, ...(labelKey?{literalLabelObservationKey:labelKey}:{}), ...(element.nodeKind!=='UNKNOWN'?{candidateSemanticType:element.nodeKind}:{}), sourcePlaneKind:element.sourcePlaneKind as ProviderOccurrenceCandidate['sourcePlaneKind'], supportingObservationKeys:[shapeKey,...(labelKey?[labelKey]:[])], confidence:element.confidence });
  });

  extraction.connectors.forEach((connector,index) => {
    const anchorKey=`local-connector-anchor-${index+1}`, strokeKey=`local-connector-stroke-${index+1}`, guardKey=connector.guardText?`local-connector-guard-${index+1}`:undefined, relationKey=`local-connector-${index+1}`;
    anchors.push({ providerAnchorKey:anchorKey, geometryKind:'BOX', geometry:pixelBox(connector.bbox,envelope), visibilityState:'VISIBLE', notes:`Ollama/Qwen local connector id=${connector.id}` });
    observations.push({ providerObservationKey:strokeKey, anchorKey, observationKind:'CONNECTOR_STROKE', confidence:connector.confidence });
    if (guardKey) observations.push({ providerObservationKey:guardKey, anchorKey, observationKind:'TEXT_LITERAL_CANDIDATE', observedValue:connector.guardText, confidence:connector.confidence });
    const roleSet=connector.role!=='UNKNOWN'?`local-role-${index+1}`:undefined;
    if (roleSet) alternatives.push({ providerAlternativeSetKey:roleSet, propertyPath:'relationshipRole', alternatives:[{ providerAlternativeKey:`${roleSet}-preferred`, value:connector.role, confidence:connector.confidence, anchorKeys:[anchorKey], supportingObservationKeys:[strokeKey,...(guardKey?[guardKey]:[])] }], exclusivityMode:'MUTUALLY_EXCLUSIVE', modelPreferredAlternativeKey:`${roleSet}-preferred`, modelPreferenceConfidence:connector.confidence });
    const source=occurrenceById.get(connector.sourceElementId), target=occurrenceById.get(connector.targetElementId);
    relations.push({ providerRelationKey:relationKey, strokeObservationKeys:[strokeKey], anchorKeys:[anchorKey], existenceConfidence:connector.confidence,
      sourceEndpointCandidates:[{ ...(source?{occurrenceCandidateKey:source}:{}), endpointState:source?'SET_CANDIDATE':'UNRESOLVED', confidence:connector.confidence }],
      targetEndpointCandidates:[{ ...(target?{occurrenceCandidateKey:target}:{}), endpointState:target?'SET_CANDIDATE':'UNRESOLVED', confidence:connector.confidence }],
      directionCandidates:[{ value:connector.direction, confidence:connector.confidence }], ...(roleSet?{roleAlternativeSetKey:roleSet}:{}), ...(guardKey?{guardTextObservationKeys:[guardKey]}:{}) });
  });

  const partial=!extraction.completeCoverage || extraction.uncertainties.length>0 || extraction.elements.some(e=>e.nodeKind==='UNKNOWN'||e.visibility!=='VISIBLE') || extraction.connectors.some(c=>c.direction==='UNKNOWN'||!occurrenceById.has(c.sourceElementId)||!occurrenceById.has(c.targetElementId));
  return {
    providerId: OLLAMA_IMAGE_FALLBACK_PROVIDER_ID, providerVersion: OLLAMA_IMAGE_FALLBACK_PROVIDER_VERSION,
    providerClass:'MODEL_PROVIDER', modelRef:model, modelVersion:model, pipelineVersion:OLLAMA_IMAGE_FALLBACK_PIPELINE_VERSION, evidenceMode:'MODEL_INFERENCE', status:partial?'PARTIAL':'SUCCEEDED', requestCorrelation:correlation(envelope),
    anchors, observations, occurrenceCandidates:occurrences, alternativeSets:alternatives, relationCandidates:relations,
    diagnostics: extraction.uncertainties.length ? extraction.uncertainties.map(item=>({code:`OLLAMA_${item.code}`,description:item.description})) : [{code:'OLLAMA_LOCAL_INDEPENDENT_RECHECK',description:'Local Qwen3-VL fallback independently re-inspected the process image.'}],
  };
}

function talosEnvelope(init?: RequestInit): AsyncImagePerceptionTransportEnvelope {
  if (!init || typeof init.body!=='string') throw new TypeError('OLLAMA_IMAGE_FALLBACK_INVALID_TALOS_REQUEST');
  const parsed=JSON.parse(init.body) as AsyncImagePerceptionTransportEnvelope;
  if (parsed.schemaVersion!=='talos-image-perception-request-v0.1') throw new TypeError('OLLAMA_IMAGE_FALLBACK_INVALID_TALOS_SCHEMA');
  return parsed;
}

function localFetch(endpoint:string, model:string, timeoutMs:number, baseFetch:typeof fetch): typeof fetch {
  return (async (_input:RequestInfo|URL, init?:RequestInit) => {
    const envelope=talosEnvelope(init); const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),timeoutMs);
    try {
      const response=await baseFetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model,messages:[{role:'user',content:PROMPT,images:[envelope.imageBase64]}],stream:false,think:false,format:'json',options:{temperature:0,num_predict:MAX_OUTPUT_TOKENS}}),signal:controller.signal});
      if(!response.ok) return new Response(await response.text(),{status:response.status,statusText:response.statusText,headers:{'content-type':response.headers.get('content-type')??'text/plain'}});
      const extraction=parseExtraction(await response.json());
      return new Response(JSON.stringify(mapResult(extraction,envelope,model)),{status:200,headers:{'content-type':'application/json'}});
    } finally { clearTimeout(timeout); }
  }) as typeof fetch;
}

/**
 * Optional first-class local fallback. It is deliberately opt-in because Talos
 * must not assume Ollama or a multi-gigabyte vision model is installed. Once
 * enabled, fallback invocation itself is automatic and Talos-owned.
 */
export function resolveOllamaImageFallbackRuntime(
  env: Readonly<Record<string,string|undefined>>=process.env,
  baseFetch:typeof fetch=fetch,
): OllamaImageFallbackRuntimeResolution {
  if(!enabled(env)) return {status:'DISABLED',reason:'OLLAMA_FALLBACK_NOT_ENABLED'};
  const endpoint=envValue(env,OLLAMA_IMAGE_FALLBACK_ENV.endpoint)??DEFAULT_ENDPOINT;
  const url=new URL(endpoint); if(url.protocol!=='http:'&&url.protocol!=='https:') throw new TypeError('OLLAMA_IMAGE_FALLBACK_CONFIG_INVALID: URL must use http or https');
  const model=envValue(env,OLLAMA_IMAGE_FALLBACK_ENV.model)??DEFAULT_MODEL;
  const rawTimeout=envValue(env,OLLAMA_IMAGE_FALLBACK_ENV.timeoutMs); const timeoutMs=rawTimeout&&/^\d+$/.test(rawTimeout)?Number(rawTimeout):DEFAULT_TIMEOUT_MS;
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1000||timeoutMs>MAX_TIMEOUT_MS) throw new TypeError(`OLLAMA_IMAGE_FALLBACK_CONFIG_INVALID: timeout must be between 1000 and ${MAX_TIMEOUT_MS} milliseconds`);
  const safeFields={configVersion:IMAGE_PERCEPTION_RUNTIME_CONFIG_VERSION,endpoint:url.toString(),providerId:OLLAMA_IMAGE_FALLBACK_PROVIDER_ID,providerVersion:OLLAMA_IMAGE_FALLBACK_PROVIDER_VERSION,modelRef:model,modelVersion:model,pipelineVersion:OLLAMA_IMAGE_FALLBACK_PIPELINE_VERSION,timeoutMs,authMode:'NONE' as const,authConfigured:false,providerClass:'MODEL_PROVIDER' as const,evidenceMode:'MODEL_INFERENCE' as const};
  const descriptor:ImagePerceptionRuntimeDescriptor=Object.freeze({...safeFields,configurationFingerprint:digestDeterministicJson({kind:'ImagePerceptionRuntimeDescriptor',...safeFields})});
  const adapterFetch=localFetch(descriptor.endpoint,model,timeoutMs,baseFetch);
  const binding:ImagePerceptionRuntimeBinding=Object.freeze({descriptor,createTransportConfig(fetchImpl?:typeof fetch):AsyncHttpImagePerceptionProviderConfig{return {endpoint:descriptor.endpoint,providerId:descriptor.providerId,providerVersion:descriptor.providerVersion,modelRef:descriptor.modelRef,modelVersion:descriptor.modelVersion,pipelineVersion:descriptor.pipelineVersion,timeoutMs:descriptor.timeoutMs,providerClass:descriptor.providerClass,evidenceMode:descriptor.evidenceMode,fetchImpl:fetchImpl??adapterFetch};}});
  return {status:'CONFIGURED',binding,fetchImpl:adapterFetch};
}
