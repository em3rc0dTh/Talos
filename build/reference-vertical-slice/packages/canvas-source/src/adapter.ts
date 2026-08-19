import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import { appendRecord, findSuccessfulResultByFingerprint, getAttemptView } from '../../source-intake/src/store.ts';
import type { AdapterAttemptCompletion,AdapterAttemptStart,AdapterAttemptView,AdapterDiagnostic,AdapterResult,ArtifactClassification,CandidateSemanticScope,PreservedCanvasSource,SourceEvidenceGraph,SourceId,SourceOccurrenceDescriptor,SourcePlaneDescriptor,SourcePropertyEvidenceDescriptor,SourceRelationshipDescriptor } from '../../source-intake/src/types.ts';
import type { CanvasElementSnapshot,CanvasRelationshipSnapshot,TalosCanvasNativeSource } from './types.ts';

export interface TalosCanvasAdapterConfig { adapterId:string;adapterVersion:string;mappingRegistryVersion:string;canonicalModelVersion:string;configurationDigest?:string; }
export const DEFAULT_CANVAS_ADAPTER_CONFIG:TalosCanvasAdapterConfig={adapterId:'talos-canvas-adapter',adapterVersion:'0.1.0-reference',mappingRegistryVersion:'canvas-mapping-v0.1',canonicalModelVersion:'v0.1'};
export interface AdaptCanvasOptions { retryOfAttemptId?:SourceId; failStage?:'SOURCE_EXTRACTION'|'CLASSIFICATION'|'RELATIONSHIP_EXTRACTION'|'SCOPE_DISCOVERY'|'RESULT_MATERIALIZATION'; partialDiagnostic?:{code:string;description:string}; now?:string; allowResultReuse?:boolean; }

export function canvasAdapterInputFingerprint(source:PreservedCanvasSource<TalosCanvasNativeSource>,config:TalosCanvasAdapterConfig):string{
  return digestDeterministicJson({sourceRepresentationDigest:source.nativeRepresentation.contentHash,adapterId:config.adapterId,adapterVersion:config.adapterVersion,mappingRegistryVersion:config.mappingRegistryVersion,canonicalModelVersion:config.canonicalModelVersion,configurationDigest:config.configurationDigest??null});
}
function planeKindForElement(element:CanvasElementSnapshot):SourcePlaneDescriptor['kind']{if(element.kind==='ACTOR')return'RESPONSIBILITY_COLLABORATION';if(element.kind==='DATA_OBJECT')return'OBJECT_DATA';if(element.kind==='ANNOTATION')return'NOTATION_ANNOTATION';if(element.kind==='GROUP')return'AUTHORING_CONTEXT';return'BUSINESS_GRAPH';}
function planeKindForRelationship(rel:CanvasRelationshipSnapshot):SourcePlaneDescriptor['kind']{if(rel.kind==='DATA_ASSOCIATION')return'OBJECT_DATA';if(rel.kind==='RESPONSIBILITY_RELATIONSHIP')return'RESPONSIBILITY_COLLABORATION';if(rel.kind==='ANNOTATION_RELATIONSHIP')return'NOTATION_ANNOTATION';return'BUSINESS_GRAPH';}
function candidateElementType(kind:CanvasElementSnapshot['kind']):string|undefined{const map:Partial<Record<CanvasElementSnapshot['kind'],string>>={TRIGGER:'EVENT',ACTION:'ACTION',DECISION:'DECISION',PARALLEL_SPLIT:'PARALLEL_SPLIT',JOIN:'JOIN',WAIT:'WAIT',HUMAN_INTERACTION:'HUMAN_INTERACTION',SUBPROCESS:'SUBPROCESS',STATE:'STATE',END:'END',ACTOR:'ACTOR',DATA_OBJECT:'DATA_OBJECT',BUSINESS_RULE:'BUSINESS_RULE'};return map[kind];}
function occurrenceKind(kind:CanvasElementSnapshot['kind']):string{if(kind==='ACTOR')return'PARTICIPANT';if(kind==='DATA_OBJECT')return'OBJECT_NODE';if(kind==='ANNOTATION')return'ANNOTATION';if(kind==='GROUP')return'REGION';return'NODE';}
function candidateRelationshipRole(kind:CanvasRelationshipSnapshot['kind']):string|undefined{const map:Partial<Record<CanvasRelationshipSnapshot['kind'],string>>={CONTROL_FLOW:'SEQUENCE_CANDIDATE',CONDITIONAL_FLOW:'CONTROL_FLOW_CANDIDATE',DEFAULT_FLOW:'CONTROL_FLOW_CANDIDATE',PARALLEL_FLOW:'CONTROL_FLOW_CANDIDATE',MESSAGE_RELATIONSHIP:'MESSAGE_CANDIDATE',DATA_ASSOCIATION:'OBJECT_DATA_FLOW',ANNOTATION_RELATIONSHIP:'ANNOTATION_RELATIONSHIP'};return map[kind];}
function completionId(attemptId:SourceId,status:string):SourceId{return createOpaqueId('source',`attempt-completion:${attemptId}:${status}`);}

export function adaptPreservedCanvas(repo:ImmutableDocumentRepository,source:PreservedCanvasSource<TalosCanvasNativeSource>,config:TalosCanvasAdapterConfig=DEFAULT_CANVAS_ADAPTER_CONFIG,options:AdaptCanvasOptions={}):AdapterAttemptView{
  const now=options.now??new Date().toISOString();
  const inputFingerprint=canvasAdapterInputFingerprint(source,config);
  const attemptId=createOpaqueId('source');
  const start:AdapterAttemptStart={id:attemptId,sourceIntakeSessionId:source.session.id,sourceOriginId:source.origin.id,sourceArtifactId:source.artifact.id,sourceRepresentationId:source.nativeRepresentation.id,adapterId:config.adapterId,adapterVersion:config.adapterVersion,mappingRegistryVersion:config.mappingRegistryVersion,canonicalModelVersion:config.canonicalModelVersion,extractionMode:'NATIVE_STRUCTURED',inputFingerprint,status:'STARTED',startedAt:now,...(options.retryOfAttemptId?{retryOfAttemptId:options.retryOfAttemptId}:{}),...(config.configurationDigest?{configurationDigest:config.configurationDigest}: {})};
  appendRecord(repo,'AdapterAttemptStart',start,now,createOpaqueId('source',`attempt-start:${attemptId}`));

  const fail=(stage:NonNullable<AdaptCanvasOptions['failStage']>,code:string,description:string):AdapterAttemptView=>{
    const diagnostic:AdapterDiagnostic={id:createOpaqueId('source',`diagnostic:${attemptId}:${code}`),adapterAttemptId:attemptId,code,severity:'ERROR',description,impact:'Adapter result unavailable; preserved source remains valid.',recoverability:'Retry against the same preserved SourceRepresentation after the adapter issue is corrected.'};
    appendRecord(repo,'AdapterDiagnostic',diagnostic,now,diagnostic.id);
    const completion:AdapterAttemptCompletion={id:completionId(attemptId,'FAILED'),adapterAttemptId:attemptId,status:'FAILED',completedAt:now,failureStage:stage,diagnosticIds:[diagnostic.id]};
    appendRecord(repo,'AdapterAttemptCompletion',completion,now,completion.id);
    return getAttemptView(repo,attemptId)!;
  };
  if(options.failStage)return fail(options.failStage,'CANVAS_ADAPTER_INJECTED_FAILURE',`Injected reference failure at ${options.failStage}`);

  const existing=(options.allowResultReuse??true)?findSuccessfulResultByFingerprint(repo,inputFingerprint):undefined;
  if(existing){const completion:AdapterAttemptCompletion={id:completionId(attemptId,'SUCCEEDED'),adapterAttemptId:attemptId,status:'SUCCEEDED',completedAt:now,diagnosticIds:[],resultId:existing.id,reusedResult:true};appendRecord(repo,'AdapterAttemptCompletion',completion,now,completion.id);return getAttemptView(repo,attemptId)!;}

  const native=source.nativeRepresentation.nativeValue!;
  const sourceEvidenceCreatedAt=source.nativeRepresentation.createdAt??source.capture.capturedAt;
  const planeKinds=new Set<SourcePlaneDescriptor['kind']>();
  for(const e of native.elements)planeKinds.add(planeKindForElement(e));
  for(const r of native.relationships)planeKinds.add(planeKindForRelationship(r));
  const planes=new Map<SourcePlaneDescriptor['kind'],SourcePlaneDescriptor>();
  for(const kind of [...planeKinds].sort()){const plane:SourcePlaneDescriptor={id:createOpaqueId('source',`plane:${source.nativeRepresentation.id}:${kind}`),sourceArtifactId:source.artifact.id,kind};planes.set(kind,plane);appendRecord(repo,'SourcePlaneDescriptor',plane,sourceEvidenceCreatedAt,plane.id);}

  const evidenceFragmentIds:SourceId[]=[];
  const writeEvidence=(nativeSourceId:string,propertyPath:string,literalValue:unknown,sourceState?:string):SourceId=>{const id=createOpaqueId('source',`property-evidence:${source.nativeRepresentation.id}:${nativeSourceId}:${propertyPath}`);const descriptor:SourcePropertyEvidenceDescriptor={id,sourceRepresentationId:source.nativeRepresentation.id,nativeSourceId,propertyPath,...(sourceState?{sourceState}:{}),literalValue};appendRecord(repo,'SourcePropertyEvidenceDescriptor',descriptor,sourceEvidenceCreatedAt,id);evidenceFragmentIds.push(id);return id;};

  const occurrenceByNative=new Map<string,SourceId>();
  const occurrenceIds:SourceId[]=[];
  for(const element of native.elements){
    const id=createOpaqueId('source',`occurrence:${source.nativeRepresentation.id}:element:${element.canvasElementId}`);
    occurrenceByNative.set(element.canvasElementId,id);
    const propertyEvidenceRefs=[writeEvidence(element.canvasElementId,'kind',element.kind,'SET'),writeEvidence(element.canvasElementId,'label',element.label,'SET')];
    for(const [key,value] of Object.entries(element.propertyValues))propertyEvidenceRefs.push(writeEvidence(element.canvasElementId,`propertyValues.${key}`,value,value.state));
    if(element.actorRefs.length)propertyEvidenceRefs.push(writeEvidence(element.canvasElementId,'actorRefs',element.actorRefs,'SET'));
    if(element.dataRefs.length)propertyEvidenceRefs.push(writeEvidence(element.canvasElementId,'dataRefs',element.dataRefs,'SET'));
    if(element.ruleRefs.length)propertyEvidenceRefs.push(writeEvidence(element.canvasElementId,'ruleRefs',element.ruleRefs,'SET'));
    const descriptor:SourceOccurrenceDescriptor={sourceOccurrenceId:id,nativeSourceId:element.canvasElementId,occurrenceKind:occurrenceKind(element.kind),literalLabel:element.label,sourceAssertedType:element.kind,...(candidateElementType(element.kind)?{candidateSemanticType:candidateElementType(element.kind)}:{}),sourcePlaneRef:planes.get(planeKindForElement(element))!.id,propertyEvidenceRefs,sourceExtensionRefs:[]};
    appendRecord(repo,'SourceOccurrenceDescriptor',descriptor,sourceEvidenceCreatedAt,id);
    occurrenceIds.push(id);
  }

  const relationshipOccurrenceIds:SourceId[]=[];
  for(const rel of native.relationships){
    const id=createOpaqueId('source',`occurrence:${source.nativeRepresentation.id}:relationship:${rel.canvasRelationshipId}`);
    const propertyEvidenceRefs=[writeEvidence(rel.canvasRelationshipId,'kind',rel.kind,'SET'),writeEvidence(rel.canvasRelationshipId,'sourceEndpoint',rel.sourceEndpoint,rel.sourceEndpoint.state),writeEvidence(rel.canvasRelationshipId,'targetEndpoint',rel.targetEndpoint,rel.targetEndpoint.state)];
    if(rel.guard)propertyEvidenceRefs.push(writeEvidence(rel.canvasRelationshipId,'guard',rel.guard,rel.guard.semanticState));
    if(rel.label)propertyEvidenceRefs.push(writeEvidence(rel.canvasRelationshipId,'label',rel.label,'SET'));
    const descriptor:SourceRelationshipDescriptor={sourceOccurrenceId:id,nativeSourceId:rel.canvasRelationshipId,...(rel.sourceEndpoint.state==='SET'?{sourceRef:occurrenceByNative.get(rel.sourceEndpoint.elementId)}:{}),...(rel.targetEndpoint.state==='SET'?{targetRef:occurrenceByNative.get(rel.targetEndpoint.elementId)}:{}),sourceEndpointState:rel.sourceEndpoint.state,targetEndpointState:rel.targetEndpoint.state,sourceAssertedRole:rel.kind,...(candidateRelationshipRole(rel.kind)?{candidateRelationshipRole:candidateRelationshipRole(rel.kind)}:{}),directionEvidence:{sourceEndpoint:rel.sourceEndpoint,targetEndpoint:rel.targetEndpoint},...(rel.guard?{conditionEvidence:rel.guard}:{}),propertyEvidenceRefs,sourceExtensionRefs:[]};
    appendRecord(repo,'SourceRelationshipDescriptor',descriptor,sourceEvidenceCreatedAt,id);
    relationshipOccurrenceIds.push(id);
  }

  const classification:ArtifactClassification={id:createOpaqueId('source',`classification:${attemptId}`),sourceArtifactId:source.artifact.id,artifactClass:'TALOS_CANVAS',truthClass:'SOURCE_TRUTH',confidence:1,evidenceFragmentRefs:[],classifierRef:'talos-canvas-adapter',classifierVersion:config.adapterVersion};
  appendRecord(repo,'ArtifactClassification',classification,now,classification.id);
  const graph:SourceEvidenceGraph={id:createOpaqueId('source',`evidence-graph:${attemptId}`),sourceArtifactId:source.artifact.id,sourceRepresentationId:source.nativeRepresentation.id,adapterAttemptId:attemptId,occurrenceIds,relationshipOccurrenceIds,sourcePlaneIds:[...planes.values()].map(p=>p.id),evidenceFragmentIds,sourceExtensionRefs:[],extractionDigest:digestDeterministicJson({occurrenceIds,relationshipOccurrenceIds,sourcePlaneIds:[...planes.keys()].sort()})};
  appendRecord(repo,'SourceEvidenceGraph',graph,now,graph.id);

  const excludedElementIds=new Set(native.elements.filter(e=>e.kind==='ANNOTATION'||e.kind==='GROUP').map(e=>occurrenceByNative.get(e.canvasElementId)!));
  const excludedRelationshipIds=new Set(native.relationships.filter(r=>r.kind==='ANNOTATION_RELATIONSHIP').map(r=>createOpaqueId('source',`occurrence:${source.nativeRepresentation.id}:relationship:${r.canvasRelationshipId}`)));
  const scope:CandidateSemanticScope={id:createOpaqueId('source',`scope:${attemptId}:process`),sourceArtifactId:source.artifact.id,sourceEvidenceGraphId:graph.id,kind:'PROCESS_CANDIDATE',includedOccurrenceRefs:[...occurrenceIds,...relationshipOccurrenceIds].filter(id=>!excludedElementIds.has(id)&&!excludedRelationshipIds.has(id)),excludedOccurrenceRefs:[...excludedElementIds,...excludedRelationshipIds],...(native.canvasDefinition.title?{candidateName:native.canvasDefinition.title}:{}),purpose:'Native TALOS Canvas process candidate',truthClass:'SOURCE_TRUTH',confidence:1,evidenceRefs:[graph.id]};
  appendRecord(repo,'CandidateSemanticScope',scope,now,scope.id);

  const result:AdapterResult={id:createOpaqueId('source',`adapter-result:${attemptId}`),adapterAttemptId:attemptId,sourceOriginIds:[source.origin.id],sourceArtifactIds:[source.artifact.id],sourceRepresentationIds:[source.nativeRepresentation.id],artifactClassificationIds:[classification.id],sourceEvidenceGraphIds:[graph.id],candidateScopeIds:[scope.id],interpretationClaimSetIds:[],completedAt:now,inputFingerprint};
  appendRecord(repo,'AdapterResult',result,now,result.id);

  const partial=options.partialDiagnostic;
  const diagnosticIds:SourceId[]=[];
  if(partial){const diagnostic:AdapterDiagnostic={id:createOpaqueId('source',`diagnostic:${attemptId}:${partial.code}`),adapterAttemptId:attemptId,code:partial.code,severity:'WARNING',description:partial.description,impact:'AdapterResult is partial but source evidence remains usable.',recoverability:'Retry with improved adapter/configuration or continue with diagnostics.'};appendRecord(repo,'AdapterDiagnostic',diagnostic,now,diagnostic.id);diagnosticIds.push(diagnostic.id);}
  const status=partial?'PARTIAL':'SUCCEEDED';
  const completion:AdapterAttemptCompletion={id:completionId(attemptId,status),adapterAttemptId:attemptId,status,completedAt:now,diagnosticIds,resultId:result.id};
  appendRecord(repo,'AdapterAttemptCompletion',completion,now,completion.id);
  return getAttemptView(repo,attemptId)!;
}
