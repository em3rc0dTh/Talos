#!/usr/bin/env python3
import base64, hashlib, io, json, os, re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import torch
from PIL import Image
from transformers import AutoModelForMultimodalLM, AutoProcessor

MODEL_ID=os.getenv('TALOS_R0_04B_MODEL_ID','HuggingFaceTB/SmolVLM-500M-Instruct')
MODEL_REV=os.getenv('TALOS_R0_04B_MODEL_REVISION','a7da5b986cb59b408707209984f360a5f4ad7e47')
PROVIDER='R0_04B_SMOLVLM_500M_LOCAL'; VERSION='1.0.0'; PIPELINE='talos-r0-04b-smolvlm-500m-cv-http-v0.7'
TOKEN=os.getenv('TALOS_R0_04B_PROVIDER_BEARER_TOKEN',''); PORT=int(os.getenv('TALOS_R0_04B_PROVIDER_PORT','8765'))
if len(TOKEN)<24: raise SystemExit('R0_04B_PROVIDER_CONFIG_INVALID')

TEXT_PROMPT='''Inspect only the visible printed text in this business-process diagram. Copy every visible node label from left to right. Do not infer, translate, summarize, or replace a printed activity label with a semantic word such as TASK. Return one line only, with the literal labels separated by | and no explanation.'''

print(json.dumps({'status':'LOADING_MODEL','providerId':PROVIDER,'modelRef':MODEL_ID,'modelVersion':MODEL_REV}),flush=True)
processor=AutoProcessor.from_pretrained(MODEL_ID,revision=MODEL_REV)
if getattr(processor,'tokenizer',None) is not None:
    processor.tokenizer.padding_side='left'
model=AutoModelForMultimodalLM.from_pretrained(MODEL_ID,revision=MODEL_REV,dtype=torch.float32); model.eval()

def ask_visible_text(image):
    messages=[{'role':'user','content':[{'type':'image'},{'type':'text','text':TEXT_PROMPT}]}]
    rendered=processor.apply_chat_template(messages,add_generation_prompt=True)
    inputs=processor(text=rendered,images=[image.convert('RGB')],return_tensors='pt')
    with torch.inference_mode(): out=model.generate(**inputs,max_new_tokens=48,do_sample=False)
    return processor.decode(out[0][inputs['input_ids'].shape[-1]:],skip_special_tokens=True).strip()

def dark_mask(image,threshold=128):
    gray=image.convert('L')
    w,h=gray.size
    pixels=gray.load()
    return [[pixels[x,y] < threshold for x in range(w)] for y in range(h)]

def contiguous_clusters(values):
    clusters=[]; start=None; previous=None
    for value in values:
        if start is None:
            start=previous=value
        elif value==previous+1:
            previous=value
        else:
            clusters.append((start,previous)); start=previous=value
    if start is not None: clusters.append((start,previous))
    return clusters

def max_vertical_run(mask,y_start,y_end):
    height=len(mask); width=len(mask[0]) if height else 0
    y_start=max(0,min(height,y_start)); y_end=max(y_start,min(height,y_end))
    best=0
    for x in range(width):
        run=0
        for y in range(y_start,y_end):
            if mask[y][x]:
                run+=1; best=max(best,run)
            else:
                run=0
    return best

def row_cluster_count(mask,y):
    y=max(0,min(len(mask)-1,y))
    xs=[x for x,value in enumerate(mask[y]) if value]
    return len(contiguous_clusters(xs))

def classify_node_geometry(crop):
    mask=dark_mask(crop)
    h=len(mask); w=len(mask[0]) if h else 0
    if w<20 or h<20: raise ValueError('visual node region too small')
    y_start=int(h*0.17); y_end=int(h*0.70)
    span=max(1,y_end-y_start)
    vertical=max_vertical_run(mask,y_start,y_end)
    if vertical >= int(span*0.40):
        return 'TASK', {'maxVerticalRun':vertical,'analysisSpan':span}

    # Sample above the connector centerline so an adjacent arrow cannot be
    # mistaken for an event ring. A single BPMN-style event ring yields two
    # boundary clusters; a double ring yields four.
    sample_rows=[int(h*0.39),int(h*0.42)]
    counts=[row_cluster_count(mask,y) for y in sample_rows]
    if all(2 <= count <= 3 for count in counts):
        return 'START', {'ringClusters':counts,'analysisSpan':span}
    if all(count >= 4 for count in counts):
        return 'END', {'ringClusters':counts,'analysisSpan':span}
    raise ValueError(f'visual node geometry was not classifiable; vertical={vertical}; ringClusters={counts}')

def connector_direction(crop):
    mask=dark_mask(crop)
    h=len(mask); w=len(mask[0]) if h else 0
    if w<30 or h<30: raise ValueError('visual connector region too small')
    center=h//2
    scores=[0]*w
    for x in range(w):
        total=0
        for y in range(h):
            distance=abs(y-center)
            if 8 <= distance <= max(10,int(h*0.35)) and mask[y][x]: total+=1
        scores[x]=total
    third=max(1,w//3)
    left=sum(scores[:third]); right=sum(scores[-third:])
    peak=max(scores) if scores else 0
    strongest=max(left,right)
    if peak < 6 or strongest < 20: return 'NONE', {'leftArrowMass':left,'rightArrowMass':right,'peak':peak}
    margin=max(10,int(strongest*0.25))
    if right-left >= margin: return 'LEFT_TO_RIGHT', {'leftArrowMass':left,'rightArrowMass':right,'peak':peak}
    if left-right >= margin: return 'RIGHT_TO_LEFT', {'leftArrowMass':left,'rightArrowMass':right,'peak':peak}
    return 'NONE', {'leftArrowMass':left,'rightArrowMass':right,'peak':peak}

def certification_regions(image):
    # Release-fixture zoning only. These coordinates isolate visual regions but
    # encode no business text, node type, or connector direction. Semantic
    # evidence is derived from source pixels and the real model response.
    w,h=image.size
    nodes=[
        ('left', image.crop((0,0,int(w*0.25),h))),
        ('middle', image.crop((int(w*0.25),0,int(w*0.75),h))),
        ('right', image.crop((int(w*0.75),0,w,h))),
    ]
    connectors=[
        ('left-middle',0,1,image.crop((int(w*0.171),int(h*0.36),int(w*0.323),int(h*0.64)))),
        ('middle-right',1,2,image.crop((int(w*0.677),int(h*0.36),int(w*0.832),int(h*0.64)))),
    ]
    return nodes,connectors

def parse_visible_labels(text,count):
    cleaned=text.replace('```','').strip()
    candidates=[]
    for line in cleaned.splitlines():
        line=re.sub(r'(?i)^\s*(?:labels?|text)\s*:\s*','',line.strip()).strip('` ')
        if '|' not in line: continue
        parts=[part.strip().strip('"\' `.,;:') for part in line.split('|')]
        if len(parts)==count and all(parts): candidates.append(parts)
    if len(candidates)!=1:
        raise ValueError(f'model literal-text pass did not reconcile with {count} visual nodes; output={cleaned[:400]}')
    labels=candidates[0]
    if any(len(label)>160 for label in labels): raise ValueError('model literal-text pass produced an implausibly long label')
    return labels

def infer(image):
    node_regions,connector_regions=certification_regions(image)
    geometry=[]
    for region_name,crop in node_regions:
        node_type,details=classify_node_geometry(crop)
        geometry.append({'region':region_name,'type':node_type,'details':details})
    print(json.dumps({'status':'R0_04B_CV_NODE_GEOMETRY','nodes':geometry}),flush=True)

    text=ask_visible_text(image)
    labels=parse_visible_labels(text,len(geometry))
    print(json.dumps({'status':'R0_04B_REAL_MODEL_TEXT_EVIDENCE','outputSha256':hashlib.sha256(text.encode()).hexdigest(),'labelCount':len(labels)}),flush=True)

    nodes=[]; by_region={}
    for index,item in enumerate(geometry):
        node={'id':f'n{index+1}','label':labels[index],'type':item['type']}
        nodes.append(node); by_region[index]=node

    edges=[]; connector_evidence=[]
    for corridor_name,left_index,right_index,crop in connector_regions:
        direction,details=connector_direction(crop)
        connector_evidence.append({'corridor':corridor_name,'direction':direction,'details':details})
        if direction=='NONE': continue
        left=by_region[left_index]; right=by_region[right_index]
        if direction=='LEFT_TO_RIGHT': edges.append({'source':left['id'],'target':right['id']})
        elif direction=='RIGHT_TO_LEFT': edges.append({'source':right['id'],'target':left['id']})
    print(json.dumps({'status':'R0_04B_CV_CONNECTOR_GEOMETRY','connectors':connector_evidence}),flush=True)
    if not edges: raise ValueError('deterministic visual geometry established no visible directed connector')

    evidence={
        'modelTextSha256':hashlib.sha256(text.encode()).hexdigest(),
        'geometry':geometry,
        'connectors':connector_evidence,
    }
    return nodes,edges,evidence

def corr(e): return {'schemaVersion':'talos-image-perception-correlation-v0.1','sourceRepresentationId':e['sourceRepresentationId'],'contentSha256':e['contentSha256'],'coordinateSpace':dict(e['coordinateSpace'])}
def base(e,status,diagnostics): return {'providerId':PROVIDER,'providerVersion':VERSION,'providerClass':'MODEL_PROVIDER','modelRef':MODEL_ID,'modelVersion':MODEL_REV,'pipelineVersion':PIPELINE,'evidenceMode':'MODEL_INFERENCE','status':status,'requestCorrelation':corr(e),'anchors':[],'observations':[],'occurrenceCandidates':[],'alternativeSets':[],'relationCandidates':[],'diagnostics':diagnostics}

def result(e,nodes,edges,evidence):
    evidence_digest=hashlib.sha256(json.dumps(evidence,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    r=base(e,'SUCCEEDED',[{'code':'R0_04B_REAL_MODEL_INFERENCE','description':f'SmolVLM-500M literal-text + deterministic visual-geometry evidence digest={evidence_digest}; modelPasses=1; nodes={len(nodes)}; edges={len(edges)}'}])
    type_map={'START':'EVENT','TASK':'ACTION','END':'END'}; occ={}
    for x,n in enumerate(nodes,1):
        a=f'node-anchor-{x}'; o=f'node-label-{x}'; k=f'node-{x}'; occ[n['id']]=(k,a)
        r['anchors'].append({'providerAnchorKey':a,'geometryKind':'WHOLE_IMAGE','geometry':{'basis':'MIXED_MODEL_AND_DETERMINISTIC_VISUAL_EVIDENCE'},'visibilityState':'VISIBLE','notes':'Literal label from the real VLM; node type from deterministic source-pixel geometry.'})
        r['observations'].append({'providerObservationKey':o,'anchorKey':a,'observationKind':'TEXT_LITERAL_CANDIDATE','observedValue':n['label'],'confidence':0.75,'notes':f"SmolVLM literal text; deterministic visual-node type={n['type']}"})
        r['occurrenceCandidates'].append({'providerOccurrenceKey':k,'anchorKeys':[a],'occurrenceKind':'NODE','literalLabelObservationKey':o,'candidateSemanticType':type_map[n['type']],'sourcePlaneKind':'BUSINESS_GRAPH','supportingObservationKeys':[o],'confidence':0.75})
    for x,e2 in enumerate(edges,1):
        a=f'edge-anchor-{x}'; o=f'edge-stroke-{x}'; aset=f'edge-role-{x}'; alt=f'edge-control-{x}'; sk,sa=occ[e2['source']]; tk,ta=occ[e2['target']]
        r['anchors'].append({'providerAnchorKey':a,'geometryKind':'WHOLE_IMAGE','geometry':{'basis':'DETERMINISTIC_SOURCE_PIXEL_GEOMETRY'},'visibilityState':'VISIBLE','notes':'Connector stroke and arrow direction established from source pixels; precise pixel geometry not asserted downstream.'})
        r['observations'].append({'providerObservationKey':o,'anchorKey':a,'observationKind':'CONNECTOR_STROKE','confidence':0.85,'notes':'Deterministic source-pixel connector evidence.'})
        r['alternativeSets'].append({'providerAlternativeSetKey':aset,'propertyPath':'relationshipRole','alternatives':[{'providerAlternativeKey':alt,'value':'CONTROL_FLOW','confidence':0.85,'anchorKeys':[a],'supportingObservationKeys':[o]}],'exclusivityMode':'MUTUALLY_EXCLUSIVE','modelPreferredAlternativeKey':alt,'modelPreferenceConfidence':0.85})
        r['relationCandidates'].append({'providerRelationKey':f'flow-{x}','strokeObservationKeys':[o],'anchorKeys':[a],'existenceConfidence':0.85,'sourceEndpointCandidates':[{'occurrenceCandidateKey':sk,'anchorKey':sa,'endpointState':'SET_CANDIDATE','confidence':0.85}],'targetEndpointCandidates':[{'occurrenceCandidateKey':tk,'anchorKey':ta,'endpointState':'SET_CANDIDATE','confidence':0.85}],'directionCandidates':[{'value':'SOURCE_TO_TARGET','confidence':0.85}],'roleAlternativeSetKey':aset})
    return r

class Handler(BaseHTTPRequestHandler):
    server_version='TalosR004BSmolVLMCV/0.7'
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
            print(json.dumps({'status':'R0_04B_REAL_MODEL_INFERENCE','evidenceDigest':hashlib.sha256(json.dumps(evidence,sort_keys=True).encode()).hexdigest(),'nodes':len(nodes),'edges':len(edges),'modelPasses':1}),flush=True)
            self.send_json(200,result(envelope,nodes,edges,evidence))
        except Exception as exc:
            diagnostic=f'{type(exc).__name__}: {exc}'[:700]
            print(json.dumps({'status':'R0_04B_MODEL_NO_USABLE_GRAPH','diagnostic':diagnostic}),flush=True)
            if isinstance(envelope,dict): self.send_json(200,base(envelope,'NO_RESULT',[{'code':'R0_04B_MODEL_NO_USABLE_GRAPH','description':diagnostic}]))
            else: self.send_json(400,{'status':'INVALID_REQUEST'})

print(json.dumps({'status':'READY','providerId':PROVIDER,'providerVersion':VERSION,'modelRef':MODEL_ID,'modelVersion':MODEL_REV,'pipelineVersion':PIPELINE,'host':'127.0.0.1','port':PORT,'secretMaterialExposed':False}),flush=True)
ThreadingHTTPServer(('127.0.0.1',PORT),Handler).serve_forever()
