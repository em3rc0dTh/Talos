export const R1_13_CONTRACT_WORKSPACE_EXTENSION=String.raw`
<style>
  .r113Workspace{display:none;margin:18px auto 0;max-width:1120px;border:1px solid #2e465e;border-radius:20px;background:linear-gradient(180deg,#0b141e,#071019);padding:16px}
  .r113Workspace.open{display:block}.r113Head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.r113Head h2{margin:0;font-size:21px}.r113Head p{margin:5px 0 0;color:#9eb0c2;font-size:11px;line-height:1.55;max-width:720px}
  .r113Status{font-size:10px;color:#66e4bd;border:1px solid #315b4a;border-radius:999px;padding:6px 9px;white-space:nowrap}
  .r113Tabs{display:flex;gap:7px;margin-top:15px;border-bottom:1px solid #24364a;padding-bottom:8px}.r113Tab{background:#121e2b!important;color:#9fb1c4!important;border:1px solid #2e4258!important;padding:8px 12px!important;font-size:10px!important}.r113Tab.active{border-color:#66e4bd!important;color:#e9fff7!important;background:#0b201a!important}
  .r113Panel{display:none;padding-top:14px}.r113Panel.active{display:block}.r113PanelTop{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}.r113PanelTop strong{font-size:13px}.r113PanelTop span{font-size:10px;color:#91a5b8}
  .r113Actions{display:flex;gap:7px;flex-wrap:wrap}.r113Actions button,.r113Actions a{display:inline-flex;align-items:center;justify-content:center;border:1px solid #35516c;border-radius:8px;padding:7px 10px;background:#172638;color:#dce9f5;text-decoration:none;font-size:10px;cursor:pointer}.r113Actions .primary{background:#1a5f4c;border-color:#2a8c70;color:#effff9}.r113Actions button:disabled{opacity:.45;cursor:not-allowed}
  .r113Graph{position:relative;min-height:320px;border:1px solid #263c52;border-radius:14px;background:radial-gradient(circle at 1px 1px,#1e3143 1px,transparent 1px);background-size:22px 22px;overflow:auto;padding:20px}.r113GraphInner{position:relative;min-width:880px;min-height:280px}.r113Edges{position:absolute;inset:0;pointer-events:none;overflow:visible}.r113Node{position:absolute;width:150px;min-height:58px;border:1px solid #3b526a;border-radius:12px;background:#101c28;color:#eaf3fb;padding:10px;box-sizing:border-box;font-size:10px;line-height:1.35;box-shadow:0 8px 24px rgba(0,0,0,.18)}.r113Node strong{display:block;font-size:11px}.r113Node small{display:block;color:#8fa4b8;margin-top:4px}.r113Node.decision{border-color:#8a6fd1;background:#17142b}.r113Node.wait{border-color:#b08742;background:#211a0d}.r113Node.human{border-color:#4b8c76;background:#0f2019}.r113Node.capability{border-color:#4b73a3;background:#0c1825}.r113Node.start,.r113Node.end{width:82px;min-height:82px;border-radius:50%;display:flex;flex-direction:column;justify-content:center;text-align:center}.r113EdgeLabel{font-size:9px;fill:#a7b8c8}
  .r113BpmnSvg{width:100%;min-width:760px;min-height:300px;display:block}.r113BpmnShape{fill:#101c28;stroke:#60788f;stroke-width:1.5}.r113BpmnEvent{fill:#0b151f;stroke:#66e4bd;stroke-width:2}.r113BpmnEnd{stroke-width:4}.r113BpmnGateway{fill:#17142b;stroke:#8a6fd1;stroke-width:1.7}.r113BpmnFlow{fill:none;stroke:#70869a;stroke-width:1.5}.r113BpmnLabel{fill:#dce8f3;font:11px system-ui,sans-serif}.r113BpmnMeta{fill:#91a5b8;font:9px system-ui,sans-serif}.r113Xml{margin-top:10px;border:1px solid #263a4d;border-radius:12px;background:#050a0f;color:#c7d8e7;padding:12px;max-height:310px;overflow:auto;font:10px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre}.r113Empty{padding:22px;border:1px dashed #354b61;border-radius:12px;color:#91a5b8;font-size:11px;line-height:1.55;text-align:center}
  .r113Readiness{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.r113Ready{border:1px solid #2e465b;border-radius:10px;padding:9px;background:#0b151f;font-size:10px}.r113Ready strong{display:block;margin-bottom:3px}.r113Ready.yes strong{color:#66e4bd}.r113Ready.no strong{color:#ffca6b}.r113Blockers{margin:8px 0;padding:10px;border:1px solid #5a472b;border-radius:10px;background:#1c160c;color:#e7c98f;font-size:10px;line-height:1.5}
  body:not(.r113ImplementationChosen) #r111dRun{display:none!important}body.r113ImplementationChosen #r113Workspace{margin-bottom:18px}
  body.r111dSimple.r113ImplementationChosen #r111dRun .r111gRunSummary{display:none!important}
  body.r111dSimple.r113ImplementationChosen #r111dPrepareTemporal{display:none!important}
  .r113SourceVisual{margin-top:12px;border:1px solid #2d465d;border-radius:14px;background:#071019;padding:12px}.r113SourceVisualTop{display:flex;justify-content:space-between;align-items:center;gap:10px}.r113SourceVisualTop strong{font-size:12px}.r113SourceTools{display:flex;gap:6px;flex-wrap:wrap}.r113SourceTools button{font-size:9px;padding:6px 8px;background:#18283a;color:#dce9f4;border:1px solid #344b63}.r113SourceBoard{position:relative;height:360px;margin-top:10px;border:1px solid #203448;border-radius:12px;background:radial-gradient(circle at 1px 1px,#1c2c3c 1px,transparent 1px);background-size:20px 20px;overflow:auto}.r113SourceEdges{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.r113SourceNode{position:absolute;width:140px;min-height:52px;border:1px solid #3b536c;border-radius:11px;background:#111e2b;padding:9px;color:#edf6ff;font-size:10px;cursor:move;user-select:none;box-sizing:border-box}.r113SourceNode.selected{outline:2px solid #66e4bd}.r113SourceNode[data-kind=DECISION]{border-color:#8b70d0}.r113SourceNode[data-kind=WAIT]{border-color:#b08742}.r113SourceNode[data-kind=START],.r113SourceNode[data-kind=END]{border-radius:999px;text-align:center;width:92px}.r113Inspector{display:grid;grid-template-columns:110px 1fr;gap:8px;align-items:center;margin-top:10px;padding:10px;border:1px solid #263d52;border-radius:10px;background:#0a151f}.r113Inspector label{font-size:10px;color:#9db0c2}.r113Inspector input,.r113Inspector select{width:100%;background:#0e1823;color:#eef5fb;border:1px solid #334a63;border-radius:8px;padding:8px}.r113InspectorHint{grid-column:1/-1;font-size:9px;color:#7f93a7}.r113Advanced{margin-top:9px;border:1px solid #24384c;border-radius:9px;padding:8px}.r113Advanced summary{cursor:pointer;font-size:10px;color:#98acc0}
  body.r111dSimple .r113Advanced .r111dCanvasRows,body.r111dSimple .r113Advanced .r111dConnections{display:grid!important}
  @media(max-width:800px){.r113Head{display:block}.r113Status{display:inline-block;margin-top:8px}.r113Readiness{grid-template-columns:1fr}.r113GraphInner{min-width:720px}}
</style>
<script>
(function(){
  'use strict';
  var priorFetch=window.fetch.bind(window);
  var latestRevision=null,latestProcess=null,latestMapping=null,latestApprovalId=null,latestTemporalExport=null,latestCanvasRevision=null,latestSourceKind=null;
  var sourcePositions={},sourceSelected=null,sourceConnectFrom=null,dragOffset=null;

  function byId(id){return document.getElementById(id)}
  function esc(value){return String(value==null?'':value).replace(/[&<>"]/g,function(ch){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch]})}
  function downloadText(name,text,type){var blob=new Blob([text],{type:type||'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}
  async function copyText(text,stateId){var state=byId(stateId);try{await navigator.clipboard.writeText(text);if(state)state.textContent='Copied.'}catch(error){if(state)state.textContent='Copy failed. Select the text manually.'}}

  function installWorkspace(){
    if(byId('r113Workspace'))return;
    var run=byId('r111dRun'),host=run&&run.parentNode?run.parentNode:document.body;
    var box=document.createElement('section');box.id='r113Workspace';box.className='r113Workspace';
    box.innerHTML='<div class="r113Head"><div><h2>Process translation workspace</h2><p>One confirmed business process, three useful representations. Export BPMN or Temporal and stop whenever you want. Implementation is optional.</p></div><span id="r113Status" class="r113Status">Waiting for process</span></div>'+
      '<div class="r113Tabs"><button class="r113Tab active" data-view="canvas">Business Canvas</button><button class="r113Tab" data-view="bpmn">BPMN</button><button class="r113Tab" data-view="temporal">Temporal</button></div>'+
      '<section id="r113CanvasPanel" class="r113Panel active"><div class="r113PanelTop"><div><strong>Business Canvas</strong><span> · confirmed business meaning</span></div><div class="r113Actions"><button id="r113EditVisual" disabled>Edit visually</button><button id="r113CopyCanvas" disabled>Copy Canvas JSON</button><button id="r113DownloadCanvas" disabled>Download .talos.json</button></div></div><div id="r113CanvasGraph" class="r113Graph"><div class="r113Empty">Bring a process into Talos to see the visual business model.</div></div><div id="r113CanvasState" style="font-size:10px;color:#91a5b8;margin-top:7px"></div></section>'+
      '<section id="r113BpmnPanel" class="r113Panel"><div class="r113PanelTop"><div><strong>BPMN</strong><span> · standards-based representation</span></div><div class="r113Actions"><button id="r113CopyBpmn" disabled>Copy XML</button><button id="r113DownloadBpmn" disabled>Download .bpmn</button></div></div><div id="r113BpmnGraph" class="r113Graph"><div class="r113Empty">BPMN becomes available from the reviewed process lineage.</div></div><pre id="r113BpmnXml" class="r113Xml">No BPMN XML yet.</pre><div id="r113BpmnState" style="font-size:10px;color:#91a5b8;margin-top:7px"></div></section>'+
      '<section id="r113TemporalPanel" class="r113Panel"><div class="r113PanelTop"><div><strong>Temporal Workflow</strong><span> · exportable before implementation</span></div><div class="r113Actions"><button id="r113PrepareTemporal" disabled>Prepare Temporal design</button><button id="r113CopyWorkflow" disabled>Copy workflow</button><button id="r113DownloadTemporal" disabled>Download package</button><button id="r113Implement" class="primary" disabled>Implement with Temporal</button></div></div><div id="r113TemporalReadiness" class="r113Readiness"></div><div id="r113TemporalGraph" class="r113Graph"><div class="r113Empty">Approve the automation design, then prepare a Temporal translation. Nothing is deployed by preparing or exporting it.</div></div><pre id="r113WorkflowSource" class="r113Xml">No Temporal workflow source yet.</pre><div id="r113TemporalState" style="font-size:10px;color:#91a5b8;margin-top:7px"></div></section>';
    if(run&&run.parentNode)run.parentNode.insertBefore(box,run);else host.appendChild(box);
    Array.from(box.querySelectorAll('.r113Tab')).forEach(function(button){button.addEventListener('click',function(){selectTab(this.dataset.view)})});
    byId('r113EditVisual').onclick=function(){seedEditableCanvasFromProcess()};
    byId('r113CopyCanvas').onclick=function(){loadCanvasExport().then(function(value){if(value)copyText(JSON.stringify(value,null,2)+'\\n','r113CanvasState')})};
    byId('r113DownloadCanvas').onclick=function(){
      if(!latestCanvasRevision)return;var a=document.createElement('a');a.href='/api/process/canvas/export?revisionId='+encodeURIComponent(latestCanvasRevision.id);a.download='talos-process.talos.json';document.body.appendChild(a);a.click();a.remove();
    };
    byId('r113CopyBpmn').onclick=function(){if(latestRevision)copyText(latestRevision.bpmnXml||'', 'r113BpmnState')};
    byId('r113DownloadBpmn').onclick=function(){if(latestRevision)downloadText('talos-process.bpmn',latestRevision.bpmnXml||'','application/xml')};
    byId('r113PrepareTemporal').onclick=function(){var original=byId('r111dPrepareTemporal');if(original)original.click()};
    byId('r113CopyWorkflow').onclick=function(){var f=temporalFile('workflow.ts');if(f)copyText(f.content,'r113TemporalState')};
    byId('r113DownloadTemporal').onclick=function(){
      if(!latestApprovalId||!latestMapping)return;
      var a=document.createElement('a');a.href='/api/automation/temporal-export/package?approvalId='+encodeURIComponent(latestApprovalId)+'&temporalMappingRevisionId='+encodeURIComponent(latestMapping.revision.id);a.download='talos-temporal-workflow.tar.gz';document.body.appendChild(a);a.click();a.remove();
    };
    byId('r113Implement').onclick=function(){document.body.classList.add('r113ImplementationChosen');var state=byId('r113TemporalState');if(state)state.textContent='Implementation selected. Export remains available and no deployment or process start happens until you explicitly authorize those steps.';var runPanel=byId('r111dRun');if(runPanel){runPanel.classList.add('open');runPanel.scrollIntoView({behavior:'smooth',block:'start'})}};
    var steps=Array.from(document.querySelectorAll('.r111dStep'));if(steps[3])steps[3].innerHTML='<strong>4 · Translate</strong>Prepare outputs';if(steps[4])steps[4].innerHTML='<strong>5 · Implement</strong>Optional';
  }

  function selectTab(view){
    Array.from(document.querySelectorAll('.r113Tab')).forEach(function(button){button.classList.toggle('active',button.dataset.view===view)});
    ['canvas','bpmn','temporal'].forEach(function(name){var panel=byId('r113'+name.charAt(0).toUpperCase()+name.slice(1)+'Panel');if(panel)panel.classList.toggle('active',name===view)});
  }

  function layoutGraph(process){
    var nodes=(process&&process.nodes)||[],edges=(process&&process.edges)||[],incoming={};nodes.forEach(function(n){incoming[n.id]=0});edges.forEach(function(e){incoming[e.targetNodeId]=(incoming[e.targetNodeId]||0)+1});
    var starts=nodes.filter(function(n){return !incoming[n.id]||n.kind==='START'}),level={},queue=starts.map(function(n){level[n.id]=0;return n.id});
    while(queue.length){var id=queue.shift(),base=level[id]||0;edges.filter(function(e){return e.sourceNodeId===id}).forEach(function(e){var next=base+1;if(level[e.targetNodeId]===undefined||level[e.targetNodeId]<next){level[e.targetNodeId]=next;queue.push(e.targetNodeId)}})}
    var groups={};nodes.forEach(function(n){var l=level[n.id]===undefined?0:Math.min(level[n.id],8);(groups[l]||(groups[l]=[])).push(n)});
    var positions={};Object.keys(groups).forEach(function(key){var l=Number(key);groups[key].forEach(function(n,index){positions[n.id]={x:35+l*185,y:30+index*105}})});
    return{nodes:nodes,edges:edges,positions:positions,width:Math.max(880,80+(Math.max(0,...Object.values(level).map(Number))+1)*185),height:Math.max(280,80+Math.max(1,...Object.values(groups).map(function(g){return g.length}))*105)};
  }

  function graphNodeClass(kind){
    if(kind==='DECISION')return'decision';if(kind==='WAIT')return'wait';if(kind==='START'||kind==='EVENT')return'start';if(kind==='END')return'end';if(kind==='HUMAN_INTERACTION'||kind==='APPROVAL')return'human';return'';
  }

  function renderGraph(targetId,process,mode){
    var host=byId(targetId);if(!host||!process)return;var layout=layoutGraph(process),inner=document.createElement('div');inner.className='r113GraphInner';inner.style.width=layout.width+'px';inner.style.height=layout.height+'px';
    var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','r113Edges');svg.setAttribute('width',String(layout.width));svg.setAttribute('height',String(layout.height));svg.innerHTML='<defs><marker id="r113arrow-'+mode+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#66819a"/></marker></defs>';
    layout.edges.forEach(function(edge){var a=layout.positions[edge.sourceNodeId],b=layout.positions[edge.targetNodeId];if(!a||!b)return;var x1=a.x+150,y1=a.y+30,x2=b.x,y2=b.y+30;if(((process.nodes||[]).find(function(n){return n.id===edge.sourceNodeId})||{}).kind==='START')x1=a.x+82;var line=document.createElementNS('http://www.w3.org/2000/svg','path');var mid=(x1+x2)/2;line.setAttribute('d','M '+x1+' '+y1+' C '+mid+' '+y1+', '+mid+' '+y2+', '+x2+' '+y2);line.setAttribute('fill','none');line.setAttribute('stroke','#66819a');line.setAttribute('stroke-width','1.5');line.setAttribute('marker-end','url(#r113arrow-'+mode+')');svg.appendChild(line);if(edge.label){var t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',String(mid));t.setAttribute('y',String((y1+y2)/2-5));t.setAttribute('class','r113EdgeLabel');t.textContent=edge.label;svg.appendChild(t)}});
    inner.appendChild(svg);
    layout.nodes.forEach(function(node){var p=layout.positions[node.id],div=document.createElement('div');div.className='r113Node '+graphNodeClass(node.kind);div.style.left=p.x+'px';div.style.top=p.y+'px';div.innerHTML='<strong>'+esc(node.name||node.kind)+'</strong><small>'+esc(mode==='bpmn'?bpmnLabel(node.kind):node.kind)+'</small>';inner.appendChild(div)});
    host.innerHTML='';host.appendChild(inner);
  }

  function bpmnLabel(kind){var map={START:'Start event',END:'End event',DECISION:'Exclusive gateway',WAIT:'Intermediate wait',SUBPROCESS:'Sub-process',HUMAN_INTERACTION:'User task',APPROVAL:'User task',ACTION:'Task',EVENT:'Event'};return map[kind]||'Task'}

  function renderBpmnXmlDiagram(xml,fallbackProcess){
    var host=byId('r113BpmnGraph');if(!host||!xml)return;
    try{
      var doc=new DOMParser().parseFromString(xml,'application/xml');
      if(doc.getElementsByTagName('parsererror').length)throw new Error('Invalid BPMN XML');
      var semantic=Array.from(doc.getElementsByTagName('*'));
      function semanticById(id){return semantic.find(function(node){return node.getAttribute&&node.getAttribute('id')===id})}
      var shapes=Array.from(doc.getElementsByTagNameNS('*','BPMNShape')).map(function(shape){
        var bounds=Array.from(shape.children).find(function(child){return child.localName==='Bounds'});if(!bounds)return null;
        var ref=shape.getAttribute('bpmnElement')||'',node=semanticById(ref);
        return{ref:ref,type:node&&node.localName||'task',name:node&&node.getAttribute('name')||'',x:Number(bounds.getAttribute('x')||0),y:Number(bounds.getAttribute('y')||0),w:Number(bounds.getAttribute('width')||100),h:Number(bounds.getAttribute('height')||60)}
      }).filter(Boolean);
      var edges=Array.from(doc.getElementsByTagNameNS('*','BPMNEdge')).map(function(edge){
        var ref=edge.getAttribute('bpmnElement')||'',node=semanticById(ref);
        var points=Array.from(edge.children).filter(function(child){return child.localName==='waypoint'}).map(function(point){return{x:Number(point.getAttribute('x')||0),y:Number(point.getAttribute('y')||0)}});
        return{ref:ref,name:node&&node.getAttribute('name')||'',points:points}
      }).filter(function(edge){return edge.points.length>=2});
      if(!shapes.length){renderGraph('r113BpmnGraph',fallbackProcess,'bpmn');return}
      var xs=shapes.flatMap(function(item){return[item.x,item.x+item.w]}).concat(edges.flatMap(function(edge){return edge.points.map(function(point){return point.x})}));
      var ys=shapes.flatMap(function(item){return[item.y,item.y+item.h]}).concat(edges.flatMap(function(edge){return edge.points.map(function(point){return point.y})}));
      var minX=Math.min.apply(null,xs)-45,minY=Math.min.apply(null,ys)-45,maxX=Math.max.apply(null,xs)+45,maxY=Math.max.apply(null,ys)+65;
      var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','r113BpmnSvg');svg.setAttribute('viewBox',[minX,minY,maxX-minX,maxY-minY].join(' '));
      var defs=document.createElementNS('http://www.w3.org/2000/svg','defs');defs.innerHTML='<marker id="r113BpmnArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#70869a"/></marker>';svg.appendChild(defs);
      edges.forEach(function(edge){var path=document.createElementNS('http://www.w3.org/2000/svg','path'),d='M '+edge.points[0].x+' '+edge.points[0].y;for(var i=1;i<edge.points.length;i+=1)d+=' L '+edge.points[i].x+' '+edge.points[i].y;path.setAttribute('d',d);path.setAttribute('class','r113BpmnFlow');path.setAttribute('marker-end','url(#r113BpmnArrow)');svg.appendChild(path);if(edge.name){var mid=edge.points[Math.floor(edge.points.length/2)],label=document.createElementNS('http://www.w3.org/2000/svg','text');label.setAttribute('x',String(mid.x+5));label.setAttribute('y',String(mid.y-6));label.setAttribute('class','r113BpmnMeta');label.textContent=edge.name;svg.appendChild(label)}});
      shapes.forEach(function(item){var group=document.createElementNS('http://www.w3.org/2000/svg','g'),cx=item.x+item.w/2,cy=item.y+item.h/2,type=item.type;
        if(type==='startEvent'||type==='endEvent'||type==='intermediateCatchEvent'||type==='intermediateThrowEvent'||type==='boundaryEvent'){var circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('cx',String(cx));circle.setAttribute('cy',String(cy));circle.setAttribute('r',String(Math.min(item.w,item.h)/2-3));circle.setAttribute('class','r113BpmnEvent'+(type==='endEvent'?' r113BpmnEnd':''));group.appendChild(circle);if(type.indexOf('intermediate')===0){var inner=circle.cloneNode();inner.setAttribute('r',String(Math.min(item.w,item.h)/2-7));inner.setAttribute('class','r113BpmnEvent');group.appendChild(inner)}}
        else if(type.toLowerCase().includes('gateway')){var diamond=document.createElementNS('http://www.w3.org/2000/svg','path');diamond.setAttribute('d','M '+cx+' '+item.y+' L '+(item.x+item.w)+' '+cy+' L '+cx+' '+(item.y+item.h)+' L '+item.x+' '+cy+' Z');diamond.setAttribute('class','r113BpmnGateway');group.appendChild(diamond);var symbol=document.createElementNS('http://www.w3.org/2000/svg','text');symbol.setAttribute('x',String(cx));symbol.setAttribute('y',String(cy+5));symbol.setAttribute('text-anchor','middle');symbol.setAttribute('class','r113BpmnLabel');symbol.textContent=type==='parallelGateway'?'+':'×';group.appendChild(symbol)}
        else{var rect=document.createElementNS('http://www.w3.org/2000/svg','rect');rect.setAttribute('x',String(item.x));rect.setAttribute('y',String(item.y));rect.setAttribute('width',String(item.w));rect.setAttribute('height',String(item.h));rect.setAttribute('rx',type==='subProcess'?'5':'10');rect.setAttribute('class','r113BpmnShape');group.appendChild(rect)}
        if(item.name){var label=document.createElementNS('http://www.w3.org/2000/svg','text');label.setAttribute('x',String(cx));label.setAttribute('y',String(type==='startEvent'||type==='endEvent'?item.y+item.h+16:cy+4));label.setAttribute('text-anchor','middle');label.setAttribute('class','r113BpmnLabel');label.textContent=item.name;group.appendChild(label)}
        svg.appendChild(group)
      });
      host.innerHTML='';host.appendChild(svg);
    }catch(error){renderGraph('r113BpmnGraph',fallbackProcess,'bpmn')}
  }

  function updateProcess(body){
    if(body&&body.revision&&typeof body.revision.bpmnXml==='string')latestRevision=body.revision;
    if(body&&body.sourceKind)latestSourceKind=body.sourceKind;
    if(body&&body.canvasRevision){
      latestCanvasRevision=body.canvasRevision;latestSourceKind='TALOS_CANVAS';
      var layouts=body.canvasRevision.presentationSnapshot&&body.canvasRevision.presentationSnapshot.nodeLayouts;
      if(Array.isArray(layouts))layouts.forEach(function(layout){if(layout&&layout.clientElementId&&Number.isFinite(layout.x)&&Number.isFinite(layout.y))sourcePositions[layout.clientElementId]={x:layout.x,y:layout.y}});
    }
    var reconciliation=body&&body.reconciliation;if(reconciliation&&reconciliation.processRevision)latestProcess=reconciliation.processRevision;
    if(!latestProcess)return;
    installWorkspace();var ws=byId('r113Workspace');if(ws)ws.classList.add('open');var status=byId('r113Status');if(status)status.textContent=(latestProcess.semanticStatus||'PROCESS')+' · '+(body&&body.revision&&body.revision.state==='CONFIRMED'?'CONFIRMED':'REVIEW');
    renderGraph('r113CanvasGraph',latestProcess,'canvas');if(latestRevision&&latestRevision.bpmnXml)renderBpmnXmlDiagram(latestRevision.bpmnXml,latestProcess);else renderGraph('r113BpmnGraph',latestProcess,'bpmn');
    var edit=byId('r113EditVisual');if(edit)edit.disabled=false;
    var portable=Boolean(latestCanvasRevision);var copyCanvas=byId('r113CopyCanvas'),downloadCanvas=byId('r113DownloadCanvas');if(copyCanvas)copyCanvas.disabled=!portable;if(downloadCanvas)downloadCanvas.disabled=!portable;
    if(latestRevision){var xml=byId('r113BpmnXml');if(xml)xml.textContent=latestRevision.bpmnXml||'';byId('r113CopyBpmn').disabled=false;byId('r113DownloadBpmn').disabled=false}
  }

  async function loadCanvasExport(){
    if(!latestCanvasRevision)return null;var state=byId('r113CanvasState');if(state)state.textContent='Preparing portable Canvas JSON…';
    try{var response=await priorFetch('/api/process/canvas/export?revisionId='+encodeURIComponent(latestCanvasRevision.id));var body=await response.json();if(!response.ok)throw new Error(body.userMessage||body.error||('HTTP '+response.status));if(state)state.textContent='Portable Canvas source ready.';return body}catch(error){if(state)state.textContent=error instanceof Error?error.message:String(error);return null}
  }

  function editableCanvasProblem(process){
    var incoming={};(process.nodes||[]).forEach(function(node){incoming[node.id]=0});(process.edges||[]).forEach(function(edge){incoming[edge.targetNodeId]=(incoming[edge.targetNodeId]||0)+1});
    var unsupportedNode=(process.nodes||[]).find(function(node){
      if(['ACTION','DECISION','WAIT','HUMAN_INTERACTION','SUBPROCESS','END'].includes(node.kind))return false;
      if(node.kind==='EVENT'&&(incoming[node.id]||0)===0)return false;
      return true;
    });
    if(unsupportedNode)return 'The simple Canvas cannot safely edit '+unsupportedNode.kind+' yet without losing meaning.';
    var unsupportedEdge=(process.edges||[]).find(function(edge){return !['SEQUENCE','CONDITIONAL','DEFAULT','PARALLEL'].includes(edge.kind)});
    if(unsupportedEdge)return 'The simple Canvas cannot safely edit '+unsupportedEdge.kind+' flow yet without losing meaning.';
    return null;
  }

  function seedEditableCanvasFromProcess(){
    if(!latestProcess||!window.talosProductCanvas||!window.talosProductJourney)return;
    var state=byId('r113CanvasState'),problem=editableCanvasProblem(latestProcess);
    if(problem){if(state)state.textContent=problem+' Your confirmed BPMN remains unchanged.';return}
    window.talosProductJourney.setStage('process');window.talosProductJourney.selectMode('canvas');window.talosProductCanvas.show();window.talosProductCanvas.reset();
    sourcePositions={};sourceSelected=null;sourceConnectFrom=null;
    var title=byId('r111dCanvasTitle');if(title)title.value='Editable copy';
    var incoming={};(latestProcess.nodes||[]).forEach(function(node){incoming[node.id]=0});(latestProcess.edges||[]).forEach(function(edge){incoming[edge.targetNodeId]=(incoming[edge.targetNodeId]||0)+1});
    var ids={},layout=layoutGraph(latestProcess);
    (latestProcess.nodes||[]).forEach(function(node){
      var kind=node.kind==='END'?'END':node.kind==='DECISION'?'DECISION':node.kind==='WAIT'?'WAIT':node.kind==='HUMAN_INTERACTION'?'APPROVAL':node.kind==='SUBPROCESS'?'SUBPROCESS':node.kind==='EVENT'&&(incoming[node.id]||0)===0?'START':'STEP';
      var row=window.talosProductCanvas.addStep(kind,node.name||node.kind);ids[node.id]=row.dataset.id;
      if(kind==='WAIT'){row.dataset.waitKind=typeof node.details?.waitKind==='string'?node.details.waitKind:'';row.dataset.expression=typeof node.details?.expression==='string'?node.details.expression:''}
      var pos=layout.positions[node.id];if(pos)sourcePositions[row.dataset.id]={x:pos.x,y:pos.y};
    });
    (latestProcess.edges||[]).forEach(function(edge){
      var row=window.talosProductCanvas.addConnection();row.querySelector('.r111dFrom').value=ids[edge.sourceNodeId];row.querySelector('.r111dTo').value=ids[edge.targetNodeId];
      var kind=edge.kind==='CONDITIONAL'?'CONDITION':edge.kind==='DEFAULT'?'DEFAULT':edge.kind==='PARALLEL'?'PARALLEL':'FLOW';row.querySelector('.r111dConnKind').value=kind;
      if(kind==='CONDITION'&&edge.conditionRuleRef){var rule=(latestProcess.rules||[]).find(function(candidate){return candidate.id===edge.conditionRuleRef});row.querySelector('.r111dCondition').value=rule&&rule.naturalLanguage||edge.label||'Condition requires review'}
    });
    window.talosProductCanvas.refresh();renderSourceCanvas();var canvas=byId('r111dCanvas');if(canvas)canvas.scrollIntoView({behavior:'smooth',block:'start'});
    if(state)state.textContent='Editable Canvas copy created. Your confirmed process is unchanged until you review and confirm a new revision.';
  }

    function temporalFile(path){return latestTemporalExport&&latestTemporalExport.files&&latestTemporalExport.files.find(function(file){return file.path===path})}

  async function loadTemporalExport(){
    if(!latestApprovalId||!latestMapping)return;var state=byId('r113TemporalState');if(state)state.textContent='Preparing portable Temporal artifacts…';
    try{
      var response=await priorFetch('/api/automation/temporal-export',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({approvalId:latestApprovalId,temporalMappingRevisionId:latestMapping.revision.id,allowDurableRecovery:true})});
      var body=await response.json();if(!response.ok)throw new Error(body.error||('HTTP '+response.status));latestTemporalExport=body;renderTemporalExport(body);if(state)state.textContent='Temporal design and export are ready. Nothing has been deployed or started.';
    }catch(error){if(state)state.textContent=error instanceof Error?error.message:String(error)}
  }

  async function recoverDurableWorkspace(){
    try{
      var response=await priorFetch('/api/product/workspace-snapshot'),snapshot=await response.json();
      if(!response.ok||!snapshot||snapshot.status!=='RECOVERED'||!snapshot.processRevision||!snapshot.bpmnRevision)return;
      latestApprovalId=snapshot.automationApproval&&snapshot.automationApproval.id||null;
      latestMapping=snapshot.temporalMapping?{revision:{id:snapshot.temporalMapping.revisionId,mappingDigest:snapshot.temporalMapping.mappingDigest,executionPlanRevisionRef:snapshot.temporalMapping.executionPlanRevisionRef}}:null;
      updateProcess({
        sourceKind:snapshot.bpmnRevision.sourceRoute,
        revision:snapshot.bpmnRevision,
        canvasRevision:snapshot.canvas&&snapshot.canvas.revision||undefined,
        reconciliation:{processRevision:snapshot.processRevision},
      });
      var status=byId('r113Status');if(status)status.textContent=(snapshot.confirmation?'RECOVERED · CONFIRMED':'RECOVERED · REVIEW');
      var canvasState=byId('r113CanvasState');if(canvasState)canvasState.textContent='Recovered from durable Talos history. No execution authority was restored.';
      if(latestApprovalId){
        var prepare=byId('r113PrepareTemporal');if(prepare)prepare.disabled=false;
      }
      if(latestApprovalId&&latestMapping){
        await loadTemporalExport();
        var temporalState=byId('r113TemporalState');if(temporalState)temporalState.textContent='Temporal design recovered from durable approved evidence. Nothing was deployed or started.';
      }
    }catch(error){
      var state=byId('r113CanvasState');if(state)state.textContent='Talos could not restore the visual workspace automatically. Durable evidence remains available in Technical details.';
    }
  }

  function renderTemporalExport(bundle){
    var manifestFile=(bundle.files||[]).find(function(file){return file.path==='workflow.manifest.json'}),manifest=manifestFile?JSON.parse(manifestFile.content):null;if(!manifest)return;
    var readiness=byId('r113TemporalReadiness');if(readiness)readiness.innerHTML='<div class="r113Ready yes"><strong>Design ready</strong>Temporal mapping exists.</div><div class="r113Ready yes"><strong>Export ready</strong>Portable package can be copied or downloaded.</div><div class="r113Ready '+(bundle.readiness.temporalExecutionReady?'yes':'no')+'"><strong>Execution '+(bundle.readiness.temporalExecutionReady?'ready':'not ready')+'</strong>'+(bundle.readiness.temporalExecutionReady?'No portable blockers detected.':'Resolve implementation blockers only if you want to run it.')+'</div>';
    var graphProcess={nodes:manifest.graph.elements.map(function(e){return{id:e.id,kind:e.kind==='HUMAN_COORDINATION'?'HUMAN_INTERACTION':e.kind==='DECISION_COORDINATION'?'DECISION':e.kind==='WAIT_COORDINATION'?'WAIT':e.kind==='COMPLETION_COORDINATION'?'END':e.kind==='CAPABILITY_INVOCATION'?'ACTION':'ACTION',name:e.businessName}}),edges:manifest.graph.relations.map(function(r){return{sourceNodeId:r.sourceElementRef,targetNodeId:r.targetElementRef,label:r.conditionLabel||((r.relationKind==='DEFAULT')?'Otherwise':'')}})};renderGraph('r113TemporalGraph',graphProcess,'temporal');
    var blockers=bundle.readiness.blockers||[];var host=byId('r113TemporalGraph');if(host&&blockers.length){var box=document.createElement('div');box.className='r113Blockers';box.textContent='Implementation blockers: '+blockers.join(' · ');host.appendChild(box)}
    var workflow=temporalFile('workflow.ts');var source=byId('r113WorkflowSource');if(source&&workflow)source.textContent=workflow.content;byId('r113CopyWorkflow').disabled=!workflow;byId('r113DownloadTemporal').disabled=false;var implement=byId('r113Implement');if(implement){implement.disabled=false;implement.textContent=bundle.readiness.temporalExecutionReady?'Implement with Temporal':'Implement & resolve requirements'};
  }

  function installVisualSourceCanvas(){
    var canvas=byId('r111dCanvas');if(!canvas||byId('r113SourceVisual'))return;
    var visual=document.createElement('section');visual.id='r113SourceVisual';visual.className='r113SourceVisual';visual.innerHTML='<div class="r113SourceVisualTop"><strong>Visual Canvas</strong><div class="r113SourceTools"><button id="r113ImportCanvas" type="button">Import saved Canvas</button><input id="r113ImportCanvasFile" type="file" accept=".json,.talos.json,application/json" hidden><button id="r113Connect" type="button">Connect selected</button><button id="r113AutoLayout" type="button">Auto layout</button></div></div><div id="r113SourceBoard" class="r113SourceBoard"><svg id="r113SourceEdges" class="r113SourceEdges"></svg></div><div class="r113Inspector"><label>Selected step</label><input id="r113InspectorLabel" placeholder="Select a block"><label id="r113WaitKindLabel" style="display:none">Wait type</label><select id="r113InspectorWaitKind" style="display:none"><option value="DURATION">Duration</option><option value="CONDITION">Until condition</option><option value="SCHEDULE">Schedule</option><option value="DEADLINE">Deadline</option></select><label id="r113WaitExpressionLabel" style="display:none">Wait value</label><input id="r113InspectorWaitExpression" style="display:none" placeholder="e.g. 30 seconds"><div class="r113InspectorHint">Drag blocks to arrange them. Select a block, choose “Connect selected”, then click the target block. Detailed conditions remain available below.</div></div>';
    var rows=canvas.querySelector('.r111dCanvasRows');canvas.insertBefore(visual,rows);
    var advanced=document.createElement('details');advanced.className='r113Advanced';advanced.innerHTML='<summary>Advanced structure & connection conditions</summary>';canvas.insertBefore(advanced,rows);advanced.appendChild(rows);var connections=canvas.querySelector('.r111dConnections');if(connections)advanced.appendChild(connections);
    byId('r113ImportCanvas').onclick=function(){var input=byId('r113ImportCanvasFile');if(input)input.click()};
    byId('r113ImportCanvasFile').addEventListener('change',async function(){
      var file=this.files&&this.files[0],state=byId('r111dCanvasState');if(!file)return;
      try{
        if(state){state.className='r111dCanvasState';state.textContent='Verifying saved Canvas…'}
        var nativeSource=JSON.parse(await file.text());
        var response=await window.fetch('/api/input/canvas-native',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({nativeSource:nativeSource,initiatedBy:'one-app-product-user'})});
        var body=await response.json();if(!response.ok)throw new Error(body.userMessage||body.error||('HTTP '+response.status));
        if(body.status!=='BPMN_READY_FOR_PROCESS_REVIEW')throw new Error(body.userMessage||'Talos imported the Canvas but cannot review it yet.');
        if(window.talosProductCanvas&&window.talosProductCanvas.acceptInputResult)window.talosProductCanvas.acceptInputResult(body);
        if(state){state.className='r111dCanvasState good';state.textContent='Saved Canvas imported and ready for review.'}
      }catch(error){if(state){state.className='r111dCanvasState bad';state.textContent=error instanceof Error?error.message:String(error)}}
      finally{this.value=''}
    });
    byId('r113Connect').onclick=function(){if(!sourceSelected)return;sourceConnectFrom=sourceSelected;this.textContent='Choose target…'};
    byId('r113AutoLayout').onclick=function(){sourcePositions={};renderSourceCanvas()};
    byId('r113InspectorLabel').addEventListener('input',function(){if(!sourceSelected)return;var row=document.querySelector('.r111dCanvasRow[data-id="'+CSS.escape(sourceSelected)+'"]');if(row){var input=row.querySelector('.r111dLabel');input.value=this.value;input.dispatchEvent(new Event('input',{bubbles:true}));renderSourceCanvas()}});
    byId('r113InspectorWaitKind').addEventListener('change',function(){if(!sourceSelected)return;var row=document.querySelector('.r111dCanvasRow[data-id="'+CSS.escape(sourceSelected)+'"]');if(row)row.dataset.waitKind=this.value});
    byId('r113InspectorWaitExpression').addEventListener('input',function(){if(!sourceSelected)return;var row=document.querySelector('.r111dCanvasRow[data-id="'+CSS.escape(sourceSelected)+'"]');if(row)row.dataset.expression=this.value});

    var observer=new MutationObserver(function(){scheduleSourceRender()});
    observer.observe(rows,{childList:true});
    if(connections)observer.observe(connections,{childList:true});
    canvas.addEventListener('input',function(event){if(event.target&&event.target.classList&&event.target.classList.contains('r111dLabel'))scheduleSourceRender()});
    canvas.addEventListener('change',function(event){if(event.target&&event.target.closest&&event.target.closest('.r111dConnection'))scheduleSourceRender()});
    renderSourceCanvas();
  }

  var sourceRenderFrame=0;
  function scheduleSourceRender(){
    if(sourceRenderFrame)return;
    sourceRenderFrame=requestAnimationFrame(function(){sourceRenderFrame=0;renderSourceCanvas()});
  }
  function sourceRows(){return Array.from(document.querySelectorAll('.r111dCanvasRow'))}
  function sourceConnections(){return Array.from(document.querySelectorAll('.r111dConnection'))}
  function ensureSourcePositions(){
    sourceRows().forEach(function(row,index){if(!sourcePositions[row.dataset.id])sourcePositions[row.dataset.id]={x:30+(index%4)*175,y:30+Math.floor(index/4)*105}})
  }
  function createVisualConnection(from,to){
    var add=byId('r111dAddConnection');if(!add)return;add.click();var rows=sourceConnections(),row=rows[rows.length-1];if(!row)return;row.querySelector('.r111dFrom').value=from;row.querySelector('.r111dTo').value=to;row.querySelector('.r111dConnKind').value='FLOW';row.querySelector('.r111dFrom').dispatchEvent(new Event('change',{bubbles:true}));renderSourceCanvas()
  }
  function renderSourceCanvas(){
    var board=byId('r113SourceBoard');if(!board)return;ensureSourcePositions();Array.from(board.querySelectorAll('.r113SourceNode')).forEach(function(node){node.remove()});var svg=byId('r113SourceEdges');if(svg)svg.innerHTML='<defs><marker id="r113SourceArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#68829b"/></marker></defs>';
    sourceRows().forEach(function(row){var id=row.dataset.id,pos=sourcePositions[id],kind=row.dataset.kind,label=row.querySelector('.r111dLabel').value||kind,node=document.createElement('div');node.className='r113SourceNode'+(sourceSelected===id?' selected':'');node.dataset.id=id;node.dataset.kind=kind;node.style.left=pos.x+'px';node.style.top=pos.y+'px';node.innerHTML='<strong>'+esc(label)+'</strong><small>'+esc(kind.replaceAll('_',' '))+'</small>';node.addEventListener('click',function(e){e.stopPropagation();if(sourceConnectFrom&&sourceConnectFrom!==id){createVisualConnection(sourceConnectFrom,id);sourceConnectFrom=null;var button=byId('r113Connect');if(button)button.textContent='Connect selected'}sourceSelected=id;var inspector=byId('r113InspectorLabel');if(inspector)inspector.value=row.querySelector('.r111dLabel').value||'';var isWait=kind==='WAIT',waitKind=byId('r113InspectorWaitKind'),waitExpression=byId('r113InspectorWaitExpression'),waitKindLabel=byId('r113WaitKindLabel'),waitExpressionLabel=byId('r113WaitExpressionLabel');[waitKind,waitExpression,waitKindLabel,waitExpressionLabel].forEach(function(item){if(item)item.style.display=isWait?'':'none'});if(isWait){waitKind.value=row.dataset.waitKind||'DURATION';waitExpression.value=row.dataset.expression||''}renderSourceCanvas()});node.addEventListener('pointerdown',function(e){if(e.button!==0)return;var rect=board.getBoundingClientRect();dragOffset={id:id,dx:e.clientX-rect.left+board.scrollLeft-pos.x,dy:e.clientY-rect.top+board.scrollTop-pos.y};node.setPointerCapture(e.pointerId)});node.addEventListener('pointermove',function(e){if(!dragOffset||dragOffset.id!==id)return;var rect=board.getBoundingClientRect(),next={x:Math.max(8,e.clientX-rect.left+board.scrollLeft-dragOffset.dx),y:Math.max(8,e.clientY-rect.top+board.scrollTop-dragOffset.dy)};sourcePositions[id]=next;node.style.left=next.x+'px';node.style.top=next.y+'px'});node.addEventListener('pointerup',function(){dragOffset=null;scheduleSourceRender()});board.appendChild(node)});
    if(svg)sourceConnections().forEach(function(row){var from=row.querySelector('.r111dFrom').value,to=row.querySelector('.r111dTo').value,a=sourcePositions[from],b=sourcePositions[to];if(!a||!b)return;var path=document.createElementNS('http://www.w3.org/2000/svg','path'),x1=a.x+140,y1=a.y+26,x2=b.x,y2=b.y+26,mid=(x1+x2)/2;path.setAttribute('d','M '+x1+' '+y1+' C '+mid+' '+y1+', '+mid+' '+y2+', '+x2+' '+y2);path.setAttribute('fill','none');path.setAttribute('stroke','#68829b');path.setAttribute('stroke-width','1.5');path.setAttribute('marker-end','url(#r113SourceArrow)');svg.appendChild(path)});
  }

  window.talosCanvasPresentationSnapshot=function(){
    ensureSourcePositions();
    return{nodeLayouts:sourceRows().map(function(row){var pos=sourcePositions[row.dataset.id]||{x:0,y:0};return{clientElementId:row.dataset.id,x:Math.round(pos.x),y:Math.round(pos.y)}}),viewport:{mode:'BUSINESS_CANVAS'},zoom:1};
  };
  async function recoverTranslationWorkspace(){
    try{
      var response=await priorFetch('/api/product/workspace-state');if(!response.ok)return;var body=await response.json();if(!body.available)return;
      updateProcess({revision:body.bpmnRevision,reconciliation:{processRevision:body.process},sourceKind:body.sourceKind,canvasRevision:body.canvasRevision});
      var state=byId('r113CanvasState');if(state)state.textContent='Recovered from durable Talos history. No deployment or execution authority was restored.';
      if(body.automation&&body.automation.approvalId&&body.automation.temporalMappingRevisionId){
        latestApprovalId=body.automation.approvalId;latestMapping={revision:{id:body.automation.temporalMappingRevisionId}};
        var prepare=byId('r113PrepareTemporal');if(prepare)prepare.disabled=false;await loadTemporalExport();
      }
    }catch(error){var state=byId('r113CanvasState');if(state)state.textContent='Talos could not reconstruct the previous workspace view. Durable records were not changed.'}
  }

  installWorkspace();setTimeout(function(){installVisualSourceCanvas();recoverTranslationWorkspace()},0);setTimeout(recoverDurableWorkspace,0);
  window.addEventListener('talos:r1-04-business-process-confirmed',function(){var ws=byId('r113Workspace');if(ws)ws.classList.add('open')});
  window.addEventListener('talos:r1-06-automation-approved',function(event){latestApprovalId=event&&event.detail&&event.detail.approvalId||latestApprovalId;var button=byId('r113PrepareTemporal');if(button)button.disabled=!latestApprovalId;var ws=byId('r113Workspace');if(ws){ws.classList.add('open');ws.scrollIntoView({behavior:'smooth',block:'start'})}selectTab('temporal')});
  window.addEventListener('talos:r1-11d-temporal-ready',function(event){latestMapping=event&&event.detail&&event.detail.mapping||null;if(latestMapping)loadTemporalExport()});

  window.fetch=function(input,init){
    var path=typeof input==='string'?input:(input&&input.url)||'',method=String((init&&init.method)||'GET').toUpperCase();
    return priorFetch(input,init).then(function(response){
      if(response.ok&&method==='POST'&&(path.indexOf('/api/input/')!==-1||path.indexOf('/api/semantic-resolution/decide')!==-1||path.indexOf('/api/bpmn/confirm')!==-1)){
        response.clone().json().then(updateProcess).catch(function(){});
      }
      return response;
    });
  };
})();
</script>`;

export function renderR113ContractWorkspacePage(basePage:string):string{
  const marker='</body>';
  if(!basePage.includes(marker))throw new TypeError('R1-13 contract workspace requires a closing body tag');
  return basePage.replace(marker,`${R1_13_CONTRACT_WORKSPACE_EXTENSION}\n${marker}`);
}
