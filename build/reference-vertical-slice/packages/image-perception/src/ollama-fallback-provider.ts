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
export const OLLAMA_IMAGE_FALLBACK_PIPELINE_VERSION = 'talos-ollama-qwen3vl-fallback-v0.1';

export const OLLAMA_IMAGE_FALLBACK_ENV = {
  enabled: 'TALOS_OLLAMA_FALLBACK_ENABLED',
  endpoint: 'TALOS_OLLAMA_FALLBACK_URL',
  model: 'TALOS_OLLAMA_FALLBACK_MODEL',
  timeoutMs: 'TALOS_OLLAMA_FALLBACK_TIMEOUT_MS',
} as const;

const DEFAULT_ENDPOINT = 'http://127.0.0.1:11434/api/chat';
const DEFAULT_MODEL = 'qwen3-vl:4b';
const DEFAULT_TIMEOUT_MS = 120_000;

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

const PROMPT = `You are Talos' LOCAL independent fallback visual sensor. A primary cloud perception attempt was insufficient. Re-inspect the COMPLETE process-diagram image independently; do not trust or imitate any prior answer.

Inspect top-left to bottom-right only for coverage. Never infer process order from position. Process order comes only from visible arrows/connectors and notation.

Extract literal visible text plus process-relevant geometry and relationships. Do not output BPMN. Do not design automation. Do not invent missing arrows, labels, conditions, endpoints or process meaning.

For every visible process element return a stable id, literal label, nodeKind, occurrenceKind, sourcePlaneKind, bounding box [ymin,xmin,ymax,xmax] normalized 0..1000, confidence 0..1 and visibility. For every connector return visible source/target element ids, direction, relationship role, visible guard text, bbox and confidence. Use UNKNOWN or an uncertainty entry whenever evidence is unclear. completeCoverage must be false if any relevant region is unreadable, cropped, obscured or unresolved.`;

function schema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      completeCoverage: { type: 'boolean' },
      elements: { type: 'array', items: { type: 'object', properties: {
        id: { type: 'string' }, label: { type: 'string' }, nodeKind: { type: 'string', enum: NODE_KINDS },
        occurrenceKind: { type: 'string', enum: OCCURRENCE_KINDS }, sourcePlaneKind: { type: 'string', enum: SOURCE_PLANES },
        bbox: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'number' } }, confidence: { type: 'number' },
        visibility: { type: 'string', enum: VISIBILITY },
      }, required: ['id','label','nodeKind','occurrenceKind','sourcePlaneKind','bbox','confidence','visibility'] } },
      connectors: { type: 'array', items: { type: 'object', properties: {
        id: { type: 'string' }, sourceElementId: { type: 'string' }, targetElementId: { type: 'string' },
        direction: { type: 'string', enum: DIRECTIONS }, role: { type: 'string', enum: RELATION_ROLES }, guardText: { type: 'string' },
        bbox: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'number' } }, confidence: { type: 'number' },
      }, required: ['id','sourceElementId','targetElementId','direction','role','guardText','bbox','confidence'] } },
      uncertainties: { type: 'array', items: { type: 'object', properties: { code: { type: 'string' }, description: { type: 'string' } }, required: ['code','description'] } },
    },
    required: ['completeCoverage','elements','connectors','uncertainties'],
  };
}

function envValue(env: Readonly<Record<string, string | undefined>>, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

function enabled(env: Readonly<Record<string, string | undefined>>): boolean {
  return /^(1|true|yes|on)$/i.test(envValue(env, OLLAMA_IMAGE_FALLBACK_ENV.enabled) ?? '');
}

function confidence(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function bbox(value: unknown): [number, number, number, number] {
  if (!Array.isArray(value) || value.length !== 4 || value.some((item) => typeof item !== 'number' || !Number.isFinite(item))) return [0,0,1000,1000];
  const numbers = value.map((item) => Math.max(0, Math.min(1000, Math.round(item)))) as [number,number,number,number];
  return [Math.min(numbers[0],numbers[2]), Math.min(numbers[1],numbers[3]), Math.max(numbers[0],numbers[2]), Math.max(numbers[1],numbers[3])];
}

function stringValue(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }
function oneOf<T extends readonly string[]>(value: unknown, values: T, fallback: T[number]): T[number] { return typeof value === 'string' && values.includes(value) ? value as T[number] : fallback; }

function parseExtraction(raw: unknown): LocalExtraction {
  const root = raw && typeof raw === 'object' ? raw as any : undefined;
  const content = stringValue(root?.message?.content);
  if (!content) throw new TypeError('OLLAMA_IMAGE_FALLBACK_EMPTY_RESPONSE');
  const parsed = JSON.parse(content) as any;
  return {
    completeCoverage: parsed?.completeCoverage === true,
    elements: Array.isArray(parsed?.elements) ? parsed.elements.map((item: any, index: number) => ({
      id: stringValue(item?.id) || `element-${index + 1}`,
      label: stringValue(item?.label),
      nodeKind: oneOf(item?.nodeKind, NODE_KINDS, 'UNKNOWN'),
      occurrenceKind: oneOf(item?.occurrenceKind, OCCURRENCE_KINDS, 'SOURCE_DEFINED'),
      sourcePlaneKind: oneOf(item?.sourcePlaneKind, SOURCE_PLANES, 'UNKNOWN'),
      bbox: bbox(item?.bbox), confidence: confidence(item?.confidence), visibility: oneOf(item?.visibility, VISIBILITY, 'UNKNOWN'),
    })) : [],
    connectors: Array.isArray(parsed?.connectors) ? parsed.connectors.map((item: any, index: number) => ({
      id: stringValue(item?.id) || `connector-${index + 1}`,
      sourceElementId: stringValue(item?.sourceElementId), targetElementId: stringValue(item?.targetElementId),
      direction: oneOf(item?.direction, DIRECTIONS, 'UNKNOWN'), role: oneOf(item?.role, RELATION_ROLES, 'UNKNOWN'),
      guardText: stringValue(item?.guardText), bbox: bbox(item?.bbox), confidence: confidence(item?.confidence),
    })) : [],
    uncertainties: Array.isArray(parsed?.uncertainties) ? parsed.uncertainties.map((item: any, index: number) => ({ code: stringValue(item?.code) || `LOCAL_UNCERTAINTY_${index + 1}`, description: stringValue(item?.description) || 'Local fallback reported unresolved visual evidence.' })) : [],
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
    diagnostics: [{ code:'OLLAMA_LOCAL_NO_PROCESS_EVIDENCE', description:'The local fallback found no process-relevant visual elements.' }],
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
      const response=await baseFetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model,messages:[{role:'user',content:PROMPT,images:[envelope.imageBase64]}],stream:false,format:schema(),options:{temperature:0}}),signal:controller.signal});
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
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1000||timeoutMs>120000) throw new TypeError('OLLAMA_IMAGE_FALLBACK_CONFIG_INVALID: timeout must be between 1000 and 120000 milliseconds');
  const safeFields={configVersion:IMAGE_PERCEPTION_RUNTIME_CONFIG_VERSION,endpoint:url.toString(),providerId:OLLAMA_IMAGE_FALLBACK_PROVIDER_ID,providerVersion:OLLAMA_IMAGE_FALLBACK_PROVIDER_VERSION,modelRef:model,modelVersion:model,pipelineVersion:OLLAMA_IMAGE_FALLBACK_PIPELINE_VERSION,timeoutMs,authMode:'NONE' as const,authConfigured:false,providerClass:'MODEL_PROVIDER' as const,evidenceMode:'MODEL_INFERENCE' as const};
  const descriptor:ImagePerceptionRuntimeDescriptor=Object.freeze({...safeFields,configurationFingerprint:digestDeterministicJson({kind:'ImagePerceptionRuntimeDescriptor',...safeFields})});
  const adapterFetch=localFetch(descriptor.endpoint,model,timeoutMs,baseFetch);
  const binding:ImagePerceptionRuntimeBinding=Object.freeze({descriptor,createTransportConfig(fetchImpl?:typeof fetch):AsyncHttpImagePerceptionProviderConfig{return {endpoint:descriptor.endpoint,providerId:descriptor.providerId,providerVersion:descriptor.providerVersion,modelRef:descriptor.modelRef,modelVersion:descriptor.modelVersion,pipelineVersion:descriptor.pipelineVersion,timeoutMs:descriptor.timeoutMs,providerClass:descriptor.providerClass,evidenceMode:descriptor.evidenceMode,fetchImpl:fetchImpl??adapterFetch};}});
  return {status:'CONFIGURED',binding,fetchImpl:adapterFetch};
}
