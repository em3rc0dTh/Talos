#!/usr/bin/env python3
import base64, hashlib, io, json, os, re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import torch
from PIL import Image
from transformers import AutoModelForMultimodalLM, AutoProcessor

MODEL_ID=os.getenv('TALOS_R0_04B_MODEL_ID','HuggingFaceTB/SmolVLM-500M-Instruct')
MODEL_REV=os.getenv('TALOS_R0_04B_MODEL_REVISION','a7da5b986cb59b408707209984f360a5f4ad7e47')
PROVIDER='R0_04B_SMOLVLM_500M_LOCAL'; VERSION='1.0.0'; PIPELINE='talos-r0-04b-smolvlm-500m-http-v0.2'
TOKEN=os.getenv('TALOS_R0_04B_PROVIDER_BEARER_TOKEN',''); PORT=int(os.getenv('TALOS_R0_04B_PROVIDER_PORT','8765'))
if len(TOKEN)<24: raise SystemExit('R0_04B_PROVIDER_CONFIG_INVALID')

TYPE_PROMPT='''Inspect only the visible business-process diagram. Identify every visible process node from left to right. Do not invent hidden nodes. Return only the node types separated by | using START, TASK, END, or UNKNOWN. Example format: START|TASK|END.'''
LABEL_PROMPT='''Inspect only the visible business-process diagram. Read the visible text label associated with each visible process node from left to right. Do not invent or paraphrase labels. Return only the labels separated by |, preserving visible wording. Include visible START and END labels when present. Example format: START|REVIEW REQUEST|END.'''
EDGE_PROMPT='''Inspect only the visible directed connectors in the business-process diagram. Number the visible process nodes from left to right starting at 1. Return only directed source>target pairs separated by |. Include a pair only when a directed connector is visibly present. Example format: 1>2|2>3.'''

print(json.dumps({'status':'LOADING_MODEL','providerId':PROVIDER,'modelRef':MODEL_ID,'modelVersion':MODEL_REV}),flush=True)
processor=AutoProcessor.from_pretrained(MODEL_ID,revision=MODEL_REV)
model=AutoModelForMultimodalLM.from_pretrained(MODEL_ID,revision=MODEL_REV,dtype=torch.float32); model.eval()

def ask(image,prompt,max_new_tokens=96):
    messages=[{'role':'user','content':[{'type':'image'},{'type':'text','text':prompt}]}]
    rendered=processor.apply_chat_template(messages,add_generation_prompt=True)
    inputs=processor(text=rendered,images=[image.convert('RGB')],return_tensors='pt')
    with torch.inference_mode(): out=model.generate(**inputs,max_new_tokens=max_new_tokens,do_sample=False)
    return processor.decode(out[0][inputs['input_ids'].shape[-1]:],skip_special_tokens=True).strip()

def parse_types(text):
    types=re.findall(r'(?i)\b(START|TASK|END|UNKNOWN)\b',text)
    types=[item.upper() for item in types]
    if len(types)<2 or len(types)>20:
        raise ValueError(f'model type pass did not establish a bounded visible node sequence; output={text[:300]}')
    return types

def parse_labels(text,count):
    cleaned=text.replace('```','').strip()
    candidates=[]
    for line in cleaned.splitlines():
        line=line.strip().strip('`')
        if '|' in line:
            parts=[part.strip().strip('"\' ') for part in line.split('|')]
            if len(parts)==count and all(parts): candidates.append(parts)
    whole=[part.strip().strip('"\' ') for part in cleaned.split('|')]
    if len(whole)==count and all(whole): candidates.append(whole)
    if not candidates:
        lines=[]
        for line in cleaned.splitlines():
            item=re.sub(r'^\s*(?:[-*]|\d+[.)])\s*','',line).strip().strip('"\' `')
            if item: lines.append(item)
        if len(lines)==count: candidates.append(lines)
    if not candidates:
        raise ValueError(f'model label pass did not reconcile with {count} visible nodes; output={text[:300]}')
    labels=candidates[0]
    if any(len(label)>160 for label in labels):
        raise ValueError('model label pass produced an implausibly long visible label')
    return labels

def parse_edges(text,count):
    pairs=[]; seen=set()
    for source,target in re.findall(r'(\d+)\s*(?:->|>|→)\s*(\d+)',text):
        s=int(source); t=int(target)
        if s<1 or t<1 or s>count or t>count or s==t: continue
        pair=(s,t)
        if pair not in seen:
            seen.add(pair); pairs.append(pair)
    if not pairs:
        raise ValueError(f'model connector pass did not establish a visible directed edge; output={text[:300]}')
    return pairs

def infer(image):
    type_text=ask(image,TYPE_PROMPT,64)
    types=parse_types(type_text)
    label_text=ask(image,LABEL_PROMPT,128)
    labels=parse_labels(label_text,len(types))
    edge_text=ask(image,EDGE_PROMPT,96)
    pairs=parse_edges(edge_text,len(types))
    nodes=[{'id':f'n{index+1}','label':labels[index],'type':types[index]} for index in range(len(types))]
    edges=[{'source':f'n{source}','target':f'n{target}'} for source,target in pairs]
    evidence={'types':type_text,'labels':label_text,'edges':edge_text}
    return nodes,edges,evidence

def corr(e): return {'schemaVersion':'talos-image-perception-response-correlation-v0.1','sourceRepresentationId':e['sourceRepresentationId'],'contentSha256':e['contentSha256'],'coordinateSpace':dict(e['coordinateSpace'])}
def base(e,status,diagnostics): return {'providerId':PROVIDER,'providerVersion':VERSION,'providerClass':'MODEL_PROVIDER','modelRef':MODEL_ID,'modelVersion':MODEL_REV,'pipelineVersion':PIPELINE,'evidenceMode':'MODEL_INFERENCE','status':status,'requestCorrelation':corr(e),'anchors':[],'observations':[],'occurrenceCandidates':[],'alternativeSets':[],'relationCandidates':[],'diagnostics':diagnostics}

def result(e,nodes,edges,evidence):
    hashes={key:hashlib.sha256(value.encode()).hexdigest() for key,value in evidence.items()}
    r=base(e,'SUCCEEDED',[{'code':'R0_04B_REAL_MODEL_INFERENCE','description':f"SmolVLM-500M reconciled evidence hashes types={hashes['types']}, labels={hashes['labels']}, edges={hashes['edges']}; nodes={len(nodes)}; edges={len(edges)}"}])
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
    server_version='TalosR004BSmolVLM500M/0.2'
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
            received_sha=hashlib.sha256(img).hexdigest()
            if received_sha!=envelope['contentSha256']: raise ValueError('content hash mismatch')
            image=Image.open(io.BytesIO(img))
            print(json.dumps({'status':'R0_04B_IMAGE_OPENED','byteLength':len(img),'sha256':received_sha,'signatureHex':img[:8].hex(),'format':image.format,'size':list(image.size),'mode':image.mode}),flush=True)
            image.load()
            print(json.dumps({'status':'R0_04B_IMAGE_PIXELS_LOADED','sha256':received_sha,'size':list(image.size),'mode':image.mode}),flush=True)
            nodes,edges,evidence=infer(image)
            evidence_hashes={key:hashlib.sha256(value.encode()).hexdigest() for key,value in evidence.items()}
            print(json.dumps({'status':'R0_04B_REAL_MODEL_INFERENCE','evidenceHashes':evidence_hashes,'nodes':len(nodes),'edges':len(edges)}),flush=True)
            self.send_json(200,result(envelope,nodes,edges,evidence))
        except Exception as exc:
            diagnostic=f'{type(exc).__name__}: {exc}'[:700]
            print(json.dumps({'status':'R0_04B_MODEL_NO_USABLE_GRAPH','diagnostic':diagnostic}),flush=True)
            if isinstance(envelope,dict): self.send_json(200,base(envelope,'NO_RESULT',[{'code':'R0_04B_MODEL_NO_USABLE_GRAPH','description':diagnostic}]))
            else: self.send_json(400,{'status':'INVALID_REQUEST'})

print(json.dumps({'status':'READY','providerId':PROVIDER,'providerVersion':VERSION,'modelRef':MODEL_ID,'modelVersion':MODEL_REV,'pipelineVersion':PIPELINE,'host':'127.0.0.1','port':PORT,'secretMaterialExposed':False}),flush=True)
ThreadingHTTPServer(('127.0.0.1',PORT),Handler).serve_forever()
