#!/usr/bin/env python3
import base64, hashlib, io, json, os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import torch
from PIL import Image
from transformers import AutoModelForMultimodalLM, AutoProcessor

MODEL_ID=os.getenv('TALOS_R0_04B_MODEL_ID','HuggingFaceTB/SmolVLM-256M-Instruct')
MODEL_REV=os.getenv('TALOS_R0_04B_MODEL_REVISION','cee7dc33d83ff2ddec17238b7aba85145169e631')
PROVIDER='R0_04B_SMOLVLM_LOCAL'; VERSION='1.0.0'; PIPELINE='talos-r0-04b-smolvlm-http-v0.1'
TOKEN=os.getenv('TALOS_R0_04B_PROVIDER_BEARER_TOKEN',''); PORT=int(os.getenv('TALOS_R0_04B_PROVIDER_PORT','8765'))
if len(TOKEN)<24: raise SystemExit('R0_04B_PROVIDER_CONFIG_INVALID')
PROMPT='''Inspect only visible business-process evidence in this image. Do not invent hidden steps, roles, rules, or conditions. Return one JSON object and no markdown: {"nodes":[{"id":"n1","label":"visible label","type":"START|TASK|END|UNKNOWN"}],"edges":[{"source":"n1","target":"n2"}]}. Include only visibly identifiable nodes; preserve visible labels; include an edge only for a visible directed connector; edge ids must reference returned nodes.'''
print(json.dumps({'status':'LOADING_MODEL','providerId':PROVIDER,'modelRef':MODEL_ID,'modelVersion':MODEL_REV}),flush=True)
processor=AutoProcessor.from_pretrained(MODEL_ID,revision=MODEL_REV)
model=AutoModelForMultimodalLM.from_pretrained(MODEL_ID,revision=MODEL_REV,torch_dtype=torch.float32); model.eval()

def infer(image):
    messages=[{'role':'user','content':[{'type':'image'},{'type':'text','text':PROMPT}]}]
    prompt=processor.apply_chat_template(messages,add_generation_prompt=True)
    inputs=processor(text=prompt,images=[image.convert('RGB')],return_tensors='pt')
    with torch.inference_mode(): out=model.generate(**inputs,max_new_tokens=320,do_sample=False)
    text=processor.decode(out[0][inputs['input_ids'].shape[-1]:],skip_special_tokens=True).strip()
    start=text.find('{')
    if start<0: raise ValueError(f'model output contains no JSON; output={text[:240]}')
    raw,_=json.JSONDecoder().raw_decode(text[start:])
    nodes=[]; ids=set()
    for item in raw.get('nodes',[]) if isinstance(raw,dict) else []:
        if not isinstance(item,dict): continue
        i=str(item.get('id','')).strip(); label=str(item.get('label','')).strip(); typ=str(item.get('type','UNKNOWN')).upper().strip()
        if i and label and i not in ids:
            ids.add(i); nodes.append({'id':i,'label':label,'type':typ if typ in {'START','TASK','END','UNKNOWN'} else 'UNKNOWN'})
    edges=[]; seen=set()
    for item in raw.get('edges',[]) if isinstance(raw,dict) else []:
        if not isinstance(item,dict): continue
        s=str(item.get('source','')).strip(); t=str(item.get('target','')).strip()
        if s in ids and t in ids and s!=t and (s,t) not in seen: seen.add((s,t)); edges.append({'source':s,'target':t})
    if len(nodes)<2 or not edges: raise ValueError(f'model did not establish a usable visible directed graph; output={text[:240]}')
    return nodes,edges,text

def corr(e): return {'schemaVersion':'talos-image-perception-response-correlation-v0.1','sourceRepresentationId':e['sourceRepresentationId'],'contentSha256':e['contentSha256'],'coordinateSpace':dict(e['coordinateSpace'])}
def base(e,status,diagnostics): return {'providerId':PROVIDER,'providerVersion':VERSION,'providerClass':'MODEL_PROVIDER','modelRef':MODEL_ID,'modelVersion':MODEL_REV,'pipelineVersion':PIPELINE,'evidenceMode':'MODEL_INFERENCE','status':status,'requestCorrelation':corr(e),'anchors':[],'observations':[],'occurrenceCandidates':[],'alternativeSets':[],'relationCandidates':[],'diagnostics':diagnostics}

def result(e,nodes,edges,text):
    r=base(e,'SUCCEEDED',[{'code':'R0_04B_REAL_MODEL_INFERENCE','description':f"SmolVLM output sha256={hashlib.sha256(text.encode()).hexdigest()}; nodes={len(nodes)}; edges={len(edges)}"}])
    type_map={'START':'EVENT','TASK':'ACTION','END':'END','UNKNOWN':'SOURCE_DEFINED'}; occ={}
    for x,n in enumerate(nodes,1):
        a=f'node-anchor-{x}'; o=f'node-label-{x}'; k=f'node-{x}'; occ[n['id']]=(k,a)
        r['anchors'].append({'providerAnchorKey':a,'geometryKind':'WHOLE_IMAGE','geometry':{'basis':'MODEL_WHOLE_IMAGE_EVIDENCE'},'visibilityState':'VISIBLE','notes':'Real model evidence; precise pixel geometry not asserted.'})
        r['observations'].append({'providerObservationKey':o,'anchorKey':a,'observationKind':'TEXT_LITERAL_CANDIDATE','observedValue':n['label'],'confidence':0.70,'notes':f"SmolVLM visible-node type={n['type']}"})
        r['occurrenceCandidates'].append({'providerOccurrenceKey':k,'anchorKeys':[a],'occurrenceKind':'NODE','literalLabelObservationKey':o,'candidateSemanticType':type_map[n['type']],'sourcePlaneKind':'BUSINESS_GRAPH','supportingObservationKeys':[o],'confidence':0.70})
    for x,e2 in enumerate(edges,1):
        a=f'edge-anchor-{x}'; o=f'edge-stroke-{x}'; aset=f'edge-role-{x}'; alt=f'edge-control-{x}'; sk,sa=occ[e2['source']]; tk,ta=occ[e2['target']]
        r['anchors'].append({'providerAnchorKey':a,'geometryKind':'WHOLE_IMAGE','geometry':{'basis':'MODEL_WHOLE_IMAGE_EVIDENCE'},'visibilityState':'VISIBLE','notes':'Real model connector evidence; precise pixel geometry not asserted.'})
        r['observations'].append({'providerObservationKey':o,'anchorKey':a,'observationKind':'CONNECTOR_STROKE','confidence':0.70})
        r['alternativeSets'].append({'providerAlternativeSetKey':aset,'propertyPath':'relationshipRole','alternatives':[{'providerAlternativeKey':alt,'value':'CONTROL_FLOW','confidence':0.70,'anchorKeys':[a],'supportingObservationKeys':[o]}],'exclusivityMode':'MUTUALLY_EXCLUSIVE','modelPreferredAlternativeKey':alt,'modelPreferenceConfidence':0.70})
        r['relationCandidates'].append({'providerRelationKey':f'flow-{x}','strokeObservationKeys':[o],'anchorKeys':[a],'existenceConfidence':0.70,'sourceEndpointCandidates':[{'occurrenceCandidateKey':sk,'anchorKey':sa,'endpointState':'SET_CANDIDATE','confidence':0.70}],'targetEndpointCandidates':[{'occurrenceCandidateKey':tk,'anchorKey':ta,'endpointState':'SET_CANDIDATE','confidence':0.70}],'directionCandidates':[{'value':'SOURCE_TO_TARGET','confidence':0.70}],'roleAlternativeSetKey':aset})
    return r

class Handler(BaseHTTPRequestHandler):
    server_version='TalosR004BSmolVLM/0.1'
    def log_message(self,*_): pass
    def send_json(self,status,payload):
        b=json.dumps(payload,separators=(',',':')).encode(); self.send_response(status); self.send_header('content-type','application/json'); self.send_header('content-length',str(len(b))); self.send_header('cache-control','no-store'); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        self.send_json(200,{'status':'READY','providerId':PROVIDER,'providerVersion':VERSION,'modelRef':MODEL_ID,'modelVersion':MODEL_REV,'pipelineVersion':PIPELINE,'authConfigured':True}) if self.path=='/health' else self.send_json(404,{'status':'NOT_FOUND'})
    def do_POST(self):
        if self.path!='/vision': return self.send_json(404,{'status':'NOT_FOUND'})
        if self.headers.get('authorization','')!=f'Bearer {TOKEN}': return self.send_json(401,{'status':'UNAUTHORIZED'})
        envelope=None
        try:
            size=int(self.headers.get('content-length','0'))
            if size<1 or size>20*1024*1024: raise ValueError('invalid request length')
            envelope=json.loads(self.rfile.read(size)); img=base64.b64decode(envelope['imageBase64'],validate=True)
            if hashlib.sha256(img).hexdigest()!=envelope['contentSha256']: raise ValueError('content hash mismatch')
            nodes,edges,text=infer(Image.open(io.BytesIO(img)))
            print(json.dumps({'status':'R0_04B_REAL_MODEL_INFERENCE','outputSha256':hashlib.sha256(text.encode()).hexdigest(),'nodes':len(nodes),'edges':len(edges)}),flush=True)
            self.send_json(200,result(envelope,nodes,edges,text))
        except Exception as exc:
            diagnostic=f'{type(exc).__name__}: {exc}'[:500]
            print(json.dumps({'status':'R0_04B_MODEL_NO_USABLE_GRAPH','diagnostic':diagnostic}),flush=True)
            if isinstance(envelope,dict): self.send_json(200,base(envelope,'NO_RESULT',[{'code':'R0_04B_MODEL_NO_USABLE_GRAPH','description':diagnostic}]))
            else: self.send_json(400,{'status':'INVALID_REQUEST'})

print(json.dumps({'status':'READY','providerId':PROVIDER,'providerVersion':VERSION,'modelRef':MODEL_ID,'modelVersion':MODEL_REV,'pipelineVersion':PIPELINE,'host':'127.0.0.1','port':PORT,'secretMaterialExposed':False}),flush=True)
ThreadingHTTPServer(('127.0.0.1',PORT),Handler).serve_forever()
