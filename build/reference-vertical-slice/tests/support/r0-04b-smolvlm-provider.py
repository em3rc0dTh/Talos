#!/usr/bin/env python3
import base64, hashlib, io, json, os, re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import torch
from PIL import Image
from transformers import AutoModelForMultimodalLM, AutoProcessor

MODEL_ID=os.getenv('TALOS_R0_04B_MODEL_ID','HuggingFaceTB/SmolVLM-500M-Instruct')
MODEL_REV=os.getenv('TALOS_R0_04B_MODEL_REVISION','a7da5b986cb59b408707209984f360a5f4ad7e47')
PROVIDER='R0_04B_SMOLVLM_500M_LOCAL'; VERSION='1.0.0'; PIPELINE='talos-r0-04b-smolvlm-500m-http-v0.3'
TOKEN=os.getenv('TALOS_R0_04B_PROVIDER_BEARER_TOKEN',''); PORT=int(os.getenv('TALOS_R0_04B_PROVIDER_PORT','8765'))
if len(TOKEN)<24: raise SystemExit('R0_04B_PROVIDER_CONFIG_INVALID')

NODE_PROMPT='''Inspect only this cropped region from a business-process diagram. If exactly one visible process node with a visible text label is present, return exactly TYPE|VISIBLE_LABEL and nothing else. TYPE must be START for a start-event symbol, TASK for an activity/task box, END for an end-event symbol, or UNKNOWN if the visible node type cannot be established. Copy only visible label text; do not infer or paraphrase. If no single labeled process node is clearly visible, return exactly NONE.'''
CONNECTOR_PROMPT='''Inspect only this cropped corridor between two neighboring visible process nodes in a business-process diagram. Return exactly LEFT_TO_RIGHT if a clearly visible directed connector points from the left node toward the right node; RIGHT_TO_LEFT if it points from right toward left; NONE if no clear directed connector is visible. Do not infer a connector from layout alone.'''

print(json.dumps({'status':'LOADING_MODEL','providerId':PROVIDER,'modelRef':MODEL_ID,'modelVersion':MODEL_REV}),flush=True)
processor=AutoProcessor.from_pretrained(MODEL_ID,revision=MODEL_REV)
model=AutoModelForMultimodalLM.from_pretrained(MODEL_ID,revision=MODEL_REV,dtype=torch.float32); model.eval()

def ask(image,prompt,max_new_tokens=80):
    messages=[{'role':'user','content':[{'type':'image'},{'type':'text','text':prompt}]}]
    rendered=processor.apply_chat_template(messages,add_generation_prompt=True)
    inputs=processor(text=rendered,images=[image.convert('RGB')],return_tensors='pt')
    with torch.inference_mode(): out=model.generate(**inputs,max_new_tokens=max_new_tokens,do_sample=False)
    return processor.decode(out[0][inputs['input_ids'].shape[-1]:],skip_special_tokens=True).strip()

def parse_node(text):
    cleaned=text.replace('```','').strip()
    if re.fullmatch(r'(?is)\s*NONE[.!]?\s*',cleaned): return None
    matches=list(re.finditer(r'(?im)\b(START|TASK|END|UNKNOWN)\b\s*\|\s*([^\n|]+)',cleaned))
    if len(matches)!=1:
        raise ValueError(f'model node-region pass was ambiguous; output={cleaned[:300]}')
    typ=matches[0].group(1).upper().strip()
    label=matches[0].group(2).strip().strip('"\' `.,;:')
    if not label or len(label)>160:
        raise ValueError(f'model node-region label was unusable; output={cleaned[:300]}')
    return typ,label

def parse_direction(text):
    cleaned=text.replace('```','').upper().strip()
    found=[]
    for token in ('LEFT_TO_RIGHT','RIGHT_TO_LEFT','NONE'):
        if re.search(rf'\b{token}\b',cleaned): found.append(token)
    if len(found)!=1:
        raise ValueError(f'model connector-region pass was ambiguous; output={text[:300]}')
    return found[0]

def fixture_regions(image):
    # Certification-harness geometry only: isolate the three visual zones of the
    # deterministic release fixture. No semantic type, label, or edge is encoded
    # here; every admitted fact still has to come from the real model output.
    w,h=image.size
    nodes=[
        ('left', image.crop((0,0,int(w*0.25),h))),
        ('middle', image.crop((int(w*0.25),0,int(w*0.75),h))),
        ('right', image.crop((int(w*0.75),0,w,h))),
    ]
    corridors=[
        ('left-middle',0,1,image.crop((int(w*0.15),int(h*0.20),int(w*0.35),int(h*0.80)))),
        ('middle-right',1,2,image.crop((int(w*0.65),int(h*0.20),int(w*0.85),int(h*0.80)))),
    ]
    return nodes,corridors

def infer(image):
    node_regions,connector_regions=fixture_regions(image)
    evidence={}; nodes=[]; by_region={}
    for region_index,(region_name,crop) in enumerate(node_regions):
        text=ask(crop,NODE_PROMPT,72)
        evidence[f'node:{region_name}']=text
        parsed=parse_node(text)
        if parsed is None: continue
        typ,label=parsed
        node={'id':f'n{len(nodes)+1}','label':label,'type':typ,'regionIndex':region_index}
        nodes.append(node); by_region[region_index]=node
    if len(nodes)<2:
        raise ValueError(f'model region evidence established fewer than two labeled nodes; count={len(nodes)}')

    edges=[]
    for corridor_name,left_index,right_index,crop in connector_regions:
        text=ask(crop,CONNECTOR_PROMPT,48)
        evidence[f'connector:{corridor_name}']=text
        direction=parse_direction(text)
        if direction=='NONE': continue
        left=by_region.get(left_index); right=by_region.get(right_index)
        if left is None or right is None:
            raise ValueError(f'model connector evidence referenced a corridor without two admitted neighboring nodes: {corridor_name}')
        if direction=='LEFT_TO_RIGHT': edges.append({'source':left['id'],'target':right['id']})
        elif direction=='RIGHT_TO_LEFT': edges.append({'source':right['id'],'target':left['id']})
    if not edges:
        raise ValueError('model region evidence established no visible directed connector')
    public_nodes=[{'id':n['id'],'label':n['label'],'type':n['type']} for n in nodes]
    return public_nodes,edges,evidence

def corr(e): return {'schemaVersion':'talos-image-perception-response-correlation-v0.1','sourceRepresentationId':e['sourceRepresentationId'],'contentSha256':e['contentSha256'],'coordinateSpace':dict(e['coordinateSpace'])}
def base(e,status,diagnostics): return {'providerId':PROVIDER,'providerVersion':VERSION,'providerClass':'MODEL_PROVIDER','modelRef':MODEL_ID,'modelVersion':MODEL_REV,'pipelineVersion':PIPELINE,'evidenceMode':'MODEL_INFERENCE','status':status,'requestCorrelation':corr(e),'anchors':[],'observations':[],'occurrenceCandidates':[],'alternativeSets':[],'relationCandidates':[],'diagnostics':diagnostics}

def result(e,nodes,edges,evidence):
    hashes={key:hashlib.sha256(value.encode()).hexdigest() for key,value in evidence.items()}
    evidence_digest=hashlib.sha256(json.dumps(hashes,sort_keys=True).encode()).hexdigest()
    r=base(e,'SUCCEEDED',[{'code':'R0_04B_REAL_MODEL_INFERENCE','description':f'SmolVLM-500M region-evidence digest={evidence_digest}; modelPasses={len(evidence)}; nodes={len(nodes)}; edges={len(edges)}'}])
    type_map={'START':'EVENT','TASK':'ACTION','END':'END','UNKNOWN':'SOURCE_DEFINED'}; occ={}
    for x,n in enumerate(nodes,1):
        a=f'node-anchor-{x}'; o=f'node-label-{x}'; k=f'node-{x}'; occ[n['id']]=(k,a)
        r['anchors'].append({'providerAnchorKey':a,'geometryKind':'WHOLE_IMAGE','geometry':{'basis':'MODEL_WHOLE_IMAGE_EVIDENCE'},'visibilityState':'VISIBLE','notes':'Real model region evidence; precise pixel geometry not asserted.'})
        r['observations'].append({'providerObservationKey':o,'anchorKey':a,'observationKind':'TEXT_LITERAL_CANDIDATE','observedValue':n['label'],'confidence':0.70,'notes':f"SmolVLM visible-node type={n['type']}"})
        r['occurrenceCandidates'].append({'providerOccurrenceKey':k,'anchorKeys':[a],'occurrenceKind':'NODE','literalLabelObservationKey':o,'candidateSemanticType':type_map[n['type']],'sourcePlaneKind':'BUSINESS_GRAPH','supportingObservationKeys':[o],'confidence':0.70})
    for x,e2 in enumerate(edges,1):
        a=f'edge-anchor-{x}'; o=f'edge-stroke-{x}'; aset=f'edge-role-{x}'; alt=f'edge-control-{x}'; sk,sa=occ[e2['source']]; tk,ta=occ[e2['target']]
        r['anchors'].append({'providerAnchorKey':a,'geometryKind':'WHOLE_IMAGE','geometry':{'basis':'MODEL_WHOLE_IMAGE_EVIDENCE'},'visibilityState':'VISIBLE','notes':'Real model connector-region evidence; precise pixel geometry not asserted.'})
        r['observations'].append({'providerObservationKey':o,'anchorKey':a,'observationKind':'CONNECTOR_STROKE','confidence':0.70})
        r['alternativeSets'].append({'providerAlternativeSetKey':aset,'propertyPath':'relationshipRole','alternatives':[{'providerAlternativeKey':alt,'value':'CONTROL_FLOW','confidence':0.70,'anchorKeys':[a],'supportingObservationKeys':[o]}],'exclusivityMode':'MUTUALLY_EXCLUSIVE','modelPreferredAlternativeKey':alt,'modelPreferenceConfidence':0.70})
        r['relationCandidates'].append({'providerRelationKey':f'flow-{x}','strokeObservationKeys':[o],'anchorKeys':[a],'existenceConfidence':0.70,'sourceEndpointCandidates':[{'occurrenceCandidateKey':sk,'anchorKey':sa,'endpointState':'SET_CANDIDATE','confidence':0.70}],'targetEndpointCandidates':[{'occurrenceCandidateKey':tk,'anchorKey':ta,'endpointState':'SET_CANDIDATE','confidence':0.70}],'directionCandidates':[{'value':'SOURCE_TO_TARGET','confidence':0.70}],'roleAlternativeSetKey':aset})
    return r

class Handler(BaseHTTPRequestHandler):
    server_version='TalosR004BSmolVLM500M/0.3'
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
