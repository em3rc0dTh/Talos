import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  assessImagePerceptionSufficiency,
  intakePngUpload,
  LocalImageByteStore,
  resolveGeminiImagePerceptionRuntime,
  resolveImagePerceptionFallbackRuntimeBinding,
  resolveImagePerceptionRuntimeBinding,
  resolveOllamaImageFallbackRuntime,
  runCorrelatedConfiguredImagePerceptionAdmission,
  runCorrelatedImagePerceptionWithFallback,
  type AsyncImagePerceptionTransportEnvelope,
  type ImagePerceptionProviderResult,
} from '../packages/image-perception/src/index.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

function tinyPng(width = 1000, height = 600): Buffer {
  const bytes = Buffer.alloc(24);
  Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]).copy(bytes,0);
  bytes.writeUInt32BE(13,8);
  bytes.write('IHDR',12,'ascii');
  bytes.writeUInt32BE(width,16);
  bytes.writeUInt32BE(height,20);
  return bytes;
}

function correlation(envelope: AsyncImagePerceptionTransportEnvelope) {
  return {
    schemaVersion: 'talos-image-perception-correlation-v0.1',
    sourceRepresentationId: envelope.sourceRepresentationId,
    contentSha256: envelope.contentSha256,
    coordinateSpace: { ...envelope.coordinateSpace },
  };
}

function providerResult(providerId: string, status: ImagePerceptionProviderResult['status'] = 'SUCCEEDED', confidence = 0.95) {
  if (status === 'NO_RESULT') return {
    providerId, providerVersion:'1.0.0', providerClass:'MODEL_PROVIDER', modelRef:`model:${providerId}`, modelVersion:'1', pipelineVersion:'test-v1', evidenceMode:'MODEL_INFERENCE', status,
    anchors:[], observations:[], occurrenceCandidates:[], alternativeSets:[], relationCandidates:[], diagnostics:[{code:'NO_RESULT',description:'No result'}],
  } as const;
  return {
    providerId, providerVersion:'1.0.0', providerClass:'MODEL_PROVIDER' as const, modelRef:`model:${providerId}`, modelVersion:'1', pipelineVersion:'test-v1', evidenceMode:'MODEL_INFERENCE' as const, status,
    anchors:[
      {providerAnchorKey:'a1',geometryKind:'BOX' as const,geometry:{x:10,y:10,width:100,height:60},visibilityState:'VISIBLE' as const},
      {providerAnchorKey:'a2',geometryKind:'BOX' as const,geometry:{x:300,y:10,width:100,height:60},visibilityState:'VISIBLE' as const},
      {providerAnchorKey:'e1',geometryKind:'BOX' as const,geometry:{x:110,y:20,width:190,height:30},visibilityState:'VISIBLE' as const},
    ],
    observations:[
      {providerObservationKey:'o1',anchorKey:'a1',observationKind:'TEXT_LITERAL_CANDIDATE' as const,observedValue:'Receive request',confidence},
      {providerObservationKey:'o2',anchorKey:'a2',observationKind:'TEXT_LITERAL_CANDIDATE' as const,observedValue:'Approve request',confidence},
      {providerObservationKey:'s1',anchorKey:'e1',observationKind:'CONNECTOR_STROKE' as const,confidence},
    ],
    occurrenceCandidates:[
      {providerOccurrenceKey:'n1',anchorKeys:['a1'],occurrenceKind:'NODE',literalLabelObservationKey:'o1',candidateSemanticType:'ACTION',sourcePlaneKind:'BUSINESS_GRAPH' as const,supportingObservationKeys:['o1'],confidence},
      {providerOccurrenceKey:'n2',anchorKeys:['a2'],occurrenceKind:'NODE',literalLabelObservationKey:'o2',candidateSemanticType:'ACTION',sourcePlaneKind:'BUSINESS_GRAPH' as const,supportingObservationKeys:['o2'],confidence},
    ],
    alternativeSets:[{providerAlternativeSetKey:'role1',propertyPath:'relationshipRole',alternatives:[{providerAlternativeKey:'control',value:'CONTROL_FLOW',confidence,anchorKeys:['e1'],supportingObservationKeys:['s1']}],exclusivityMode:'MUTUALLY_EXCLUSIVE' as const,modelPreferredAlternativeKey:'control',modelPreferenceConfidence:confidence}],
    relationCandidates:[{providerRelationKey:'r1',strokeObservationKeys:['s1'],anchorKeys:['e1'],existenceConfidence:confidence,sourceEndpointCandidates:[{occurrenceCandidateKey:'n1',endpointState:'SET_CANDIDATE' as const,confidence}],targetEndpointCandidates:[{occurrenceCandidateKey:'n2',endpointState:'SET_CANDIDATE' as const,confidence}],directionCandidates:[{value:'SOURCE_TO_TARGET' as const,confidence}],roleAlternativeSetKey:'role1'}],
    diagnostics:[{code:'STRUCTURED_VISUAL_EXTRACTION',description:'Complete structured image evidence.'}],
  } satisfies ImagePerceptionProviderResult;
}

function bindingEnv(prefix: 'primary'|'fallback') {
  if (prefix === 'primary') return {
    TALOS_IMAGE_PERCEPTION_PROVIDER_URL:'http://primary.invalid/vision', TALOS_IMAGE_PERCEPTION_PROVIDER_ID:'PRIMARY', TALOS_IMAGE_PERCEPTION_PROVIDER_VERSION:'1.0.0',
    TALOS_IMAGE_PERCEPTION_MODEL_REF:'model:PRIMARY', TALOS_IMAGE_PERCEPTION_MODEL_VERSION:'1', TALOS_IMAGE_PERCEPTION_PIPELINE_VERSION:'test-v1',
  };
  return {
    TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_URL:'http://fallback.invalid/vision', TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_ID:'FALLBACK', TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_VERSION:'1.0.0',
    TALOS_IMAGE_PERCEPTION_FALLBACK_MODEL_REF:'model:FALLBACK', TALOS_IMAGE_PERCEPTION_FALLBACK_MODEL_VERSION:'1', TALOS_IMAGE_PERCEPTION_FALLBACK_PIPELINE_VERSION:'test-v1',
  };
}

function talosProviderFetch(result: ImagePerceptionProviderResult, calls: {count:number}): typeof fetch {
  return (async (_input: RequestInfo|URL, init?: RequestInit) => {
    calls.count += 1;
    const envelope = JSON.parse(String(init?.body)) as AsyncImagePerceptionTransportEnvelope;
    return new Response(JSON.stringify({...result,requestCorrelation:correlation(envelope)}),{status:200,headers:{'content-type':'application/json'}});
  }) as typeof fetch;
}

function withRuntime<T>(fn:(repo:SqliteDocumentStore,bytes:LocalImageByteStore)=>Promise<T>|T):Promise<T> {
  const dir=mkdtempSync(path.join(os.tmpdir(),'talos-r1-image-fallback-'));
  const repo=new SqliteDocumentStore(path.join(dir,'state.sqlite'));
  const bytes=new LocalImageByteStore(path.join(dir,'source-bytes'));
  return Promise.resolve(fn(repo,bytes)).finally(()=>{repo.close();rmSync(dir,{recursive:true,force:true});});
}

test('Talos sufficiency gate accepts complete evidence and rejects uncertainty without asking the model for authority',()=>{
  assert.equal(assessImagePerceptionSufficiency(providerResult('PRIMARY')).status,'SUFFICIENT');
  const partial=providerResult('PRIMARY','PARTIAL');
  const partialAssessment=assessImagePerceptionSufficiency(partial);
  assert.equal(partialAssessment.status,'INSUFFICIENT');
  assert.ok(partialAssessment.reasonCodes.includes('PRIMARY_PROVIDER_STATUS_PARTIAL'));

  const weak=providerResult('PRIMARY','SUCCEEDED',0.45);
  const weakAssessment=assessImagePerceptionSufficiency(weak);
  assert.equal(weakAssessment.status,'INSUFFICIENT');
  assert.ok(weakAssessment.reasonCodes.includes('BUSINESS_OCCURRENCE_LOW_CONFIDENCE'));
});

test('Talos does not call local fallback when primary perception is sufficient',async()=>withRuntime(async(repo,bytes)=>{
  const primary=resolveImagePerceptionRuntimeBinding(bindingEnv('primary'));
  const fallback=resolveImagePerceptionFallbackRuntimeBinding(bindingEnv('fallback'));
  assert.equal(primary.status,'CONFIGURED'); assert.equal(fallback.status,'CONFIGURED');
  if(primary.status!=='CONFIGURED'||fallback.status!=='CONFIGURED') return;
  const intake=intakePngUpload(repo,bytes,tinyPng(),{initiatedBy:'test'});
  const primaryCalls={count:0}, fallbackCalls={count:0};
  const routed=await runCorrelatedImagePerceptionWithFallback(repo,bytes,intake,primary.binding,fallback.binding,{primaryFetch:talosProviderFetch(providerResult('PRIMARY'),primaryCalls),fallbackFetch:talosProviderFetch(providerResult('FALLBACK'),fallbackCalls)});
  assert.equal(routed.routing.decision,'PRIMARY_ACCEPTED');
  assert.equal(routed.routing.automaticFallbackTriggered,false);
  assert.equal(primaryCalls.count,1); assert.equal(fallbackCalls.count,0);
  assert.equal(routed.selected?.providerResult.providerId,'PRIMARY');
}));

test('Talos automatically invokes local fallback when primary perception is insufficient',async()=>withRuntime(async(repo,bytes)=>{
  const primary=resolveImagePerceptionRuntimeBinding(bindingEnv('primary'));
  const fallback=resolveImagePerceptionFallbackRuntimeBinding(bindingEnv('fallback'));
  assert.equal(primary.status,'CONFIGURED'); assert.equal(fallback.status,'CONFIGURED');
  if(primary.status!=='CONFIGURED'||fallback.status!=='CONFIGURED') return;
  const intake=intakePngUpload(repo,bytes,tinyPng(),{initiatedBy:'test'});
  const primaryCalls={count:0}, fallbackCalls={count:0};
  const routed=await runCorrelatedImagePerceptionWithFallback(repo,bytes,intake,primary.binding,fallback.binding,{primaryFetch:talosProviderFetch(providerResult('PRIMARY','PARTIAL'),primaryCalls),fallbackFetch:talosProviderFetch(providerResult('FALLBACK'),fallbackCalls)});
  assert.equal(routed.routing.decision,'FALLBACK_ACCEPTED');
  assert.equal(routed.routing.automaticFallbackTriggered,true);
  assert.equal(primaryCalls.count,1); assert.equal(fallbackCalls.count,1);
  assert.equal(routed.selected?.providerResult.providerId,'FALLBACK');
}));

test('Talos fails closed when primary and fallback are both insufficient',async()=>withRuntime(async(repo,bytes)=>{
  const primary=resolveImagePerceptionRuntimeBinding(bindingEnv('primary'));
  const fallback=resolveImagePerceptionFallbackRuntimeBinding(bindingEnv('fallback'));
  assert.equal(primary.status,'CONFIGURED'); assert.equal(fallback.status,'CONFIGURED');
  if(primary.status!=='CONFIGURED'||fallback.status!=='CONFIGURED') return;
  const intake=intakePngUpload(repo,bytes,tinyPng(),{initiatedBy:'test'});
  const routed=await runCorrelatedImagePerceptionWithFallback(repo,bytes,intake,primary.binding,fallback.binding,{primaryFetch:talosProviderFetch(providerResult('PRIMARY','PARTIAL'),{count:0}),fallbackFetch:talosProviderFetch(providerResult('FALLBACK','PARTIAL'),{count:0})});
  assert.equal(routed.routing.decision,'UNRESOLVED_AFTER_FALLBACK');
  assert.equal(routed.selected,undefined);
  assert.equal(routed.routing.automaticConfirmationAuthorized,false);
  assert.equal(routed.routing.automaticExecutionAuthorized,false);
}));

test('Gemini API key configures primary visual perception without exposing the key and maps structured image evidence',async()=>withRuntime(async(repo,bytes)=>{
  const secret='test-gemini-key-never-persist-this';
  let observedKey='';
  const fakeGemini=(async(_input:RequestInfo|URL,init?:RequestInit)=>{
    observedKey=new Headers(init?.headers).get('x-goog-api-key')??'';
    const body=JSON.parse(String(init?.body));
    assert.equal(body.contents[0].parts[0].inlineData.mimeType,'image/png');
    assert.equal(body.generationConfig.responseMimeType,'application/json');
    const extraction={completeCoverage:true,artifactType:'PROCESS_DIAGRAM',elements:[
      {id:'a',label:'Receive request',nodeKind:'ACTION',occurrenceKind:'NODE',sourcePlaneKind:'BUSINESS_GRAPH',bbox:[10,10,200,250],confidence:0.96,visibility:'VISIBLE'},
      {id:'b',label:'Approve request',nodeKind:'ACTION',occurrenceKind:'NODE',sourcePlaneKind:'BUSINESS_GRAPH',bbox:[10,600,200,850],confidence:0.96,visibility:'VISIBLE'}],connectors:[{id:'c',sourceElementId:'a',targetElementId:'b',direction:'SOURCE_TO_TARGET',role:'CONTROL_FLOW',guardText:'',bbox:[60,250,140,600],confidence:0.95}],uncertainties:[]};
    return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(extraction)}]}}]}),{status:200,headers:{'content-type':'application/json'}});
  }) as typeof fetch;
  const runtime=resolveGeminiImagePerceptionRuntime({GEMINI_API_KEY:secret,TALOS_GEMINI_MODEL:'gemini-test-model'},fakeGemini);
  assert.equal(runtime.status,'CONFIGURED'); if(runtime.status!=='CONFIGURED') return;
  assert.equal(JSON.stringify(runtime.binding.descriptor).includes(secret),false);
  assert.equal(runtime.binding.descriptor.authMode,'API_KEY');
  const intake=intakePngUpload(repo,bytes,tinyPng(),{initiatedBy:'test'});
  const result=await runCorrelatedConfiguredImagePerceptionAdmission(repo,bytes,intake,runtime.binding,{},runtime.fetchImpl);
  assert.equal(observedKey,secret);
  assert.equal(result.providerResult.status,'SUCCEEDED');
  assert.equal(result.providerResult.providerId,'TALOS_GEMINI_PRIMARY');
  assert.equal(assessImagePerceptionSufficiency(result.providerResult).status,'SUFFICIENT');
  assert.equal(JSON.stringify(repo.listByKind('PerceptionObservation')).includes(secret),false);
}));

test('Ollama Qwen3-VL is opt-in and provides an independent local structured fallback without secrets',async()=>withRuntime(async(repo,bytes)=>{
  assert.equal(resolveOllamaImageFallbackRuntime({}).status,'DISABLED');
  let model=''; let imageSeen=false; let jsonFormatSeen=false;
  const fakeOllama=(async(_input:RequestInfo|URL,init?:RequestInit)=>{
    const body=JSON.parse(String(init?.body)); model=body.model; imageSeen=typeof body.messages?.[0]?.images?.[0]==='string'; jsonFormatSeen=body.format==='json';
    const extraction={completeCoverage:true,elements:[
      {id:'a',label:'Receive request',nodeKind:'ACTION',occurrenceKind:'NODE',sourcePlaneKind:'BUSINESS_GRAPH',bbox:[10,10,200,250],confidence:0.92,visibility:'VISIBLE'},
      {id:'b',label:'Approve request',nodeKind:'ACTION',occurrenceKind:'NODE',sourcePlaneKind:'BUSINESS_GRAPH',bbox:[10,600,200,850],confidence:0.92,visibility:'VISIBLE'}],connectors:[{id:'c',sourceElementId:'a',targetElementId:'b',direction:'SOURCE_TO_TARGET',role:'CONTROL_FLOW',guardText:'',bbox:[60,250,140,600],confidence:0.91}],uncertainties:[]};
    return new Response(JSON.stringify({message:{role:'assistant',content:JSON.stringify(extraction)},done:true}),{status:200,headers:{'content-type':'application/json'}});
  }) as typeof fetch;
  const runtime=resolveOllamaImageFallbackRuntime({TALOS_OLLAMA_FALLBACK_ENABLED:'true'},fakeOllama);
  assert.equal(runtime.status,'CONFIGURED'); if(runtime.status!=='CONFIGURED') return;
  assert.equal(runtime.binding.descriptor.modelRef,'qwen3-vl:4b-instruct');
  assert.equal(runtime.binding.descriptor.authMode,'NONE');
  const intake=intakePngUpload(repo,bytes,tinyPng(),{initiatedBy:'test'});
  const result=await runCorrelatedConfiguredImagePerceptionAdmission(repo,bytes,intake,runtime.binding,{},runtime.fetchImpl);
  assert.equal(model,'qwen3-vl:4b-instruct'); assert.equal(imageSeen,true); assert.equal(jsonFormatSeen,true);
  assert.equal(result.providerResult.status,'SUCCEEDED');
  assert.equal(result.providerResult.providerId,'TALOS_OLLAMA_LOCAL_FALLBACK');
  assert.equal(assessImagePerceptionSufficiency(result.providerResult).status,'SUFFICIENT');
}));
