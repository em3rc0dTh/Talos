export const R1_11_NATIVE_BPMN_SOURCE_EXTENSION = String.raw`
<style>
  .r111NativeHint{margin-top:12px;padding:10px 11px;border:1px solid #2b3f55;border-radius:11px;background:#09121d;color:#a9bbcf;font-size:11px;line-height:1.45}
  .r111NativeHint strong{color:#78aef7}.r111BpmnName{font-size:12px;color:#98a8bb}
</style>
<script>
(function(){
  'use strict';
  function byId(id){return document.getElementById(id)}
  function esc(value){return String(value==null?'—':value)}
  function step(id,state,text){var node=byId(id);if(!node)return;node.className='truthStep '+state;var tail=node.childNodes[node.childNodes.length-1];if(tail)tail.textContent=text}
  function stage(title,text,kind){var box=byId('sourceStatus');if(!box)return;box.className='stage '+(kind||'');box.innerHTML='';var a=document.createElement('div');a.className='stageTitle';a.textContent=title;var b=document.createElement('div');b.className='stageText';b.textContent=text;box.append(a,b)}
  function metric(key,value){var box=byId('meta');if(!box)return;var d=document.createElement('div');d.className='metric';var k=document.createElement('div');k.className='k';k.textContent=key;var v=document.createElement('div');v.className='v';v.textContent=esc(value);d.append(k,v);box.appendChild(d)}
  function renderList(containerId,items,className,formatter){var box=byId(containerId);if(!box)return;box.innerHTML='';if(!items||!items.length){var empty=document.createElement('div');empty.className=className;empty.textContent='None';box.appendChild(empty);return}items.slice(0,12).forEach(function(item){var d=document.createElement('div');d.className=className;d.textContent=formatter(item);box.appendChild(d)})}
  async function api(path,options){var response=await fetch(path,options);var text=await response.text();var body=text?JSON.parse(text):{};if(!response.ok){var error=new Error(body.error||body.code||('HTTP '+response.status));error.body=body;throw error}return body}
  function readText(file){return new Promise(function(resolve,reject){var reader=new FileReader();reader.onload=function(){resolve(String(reader.result||''))};reader.onerror=reject;reader.readAsText(file)})}
  function renderCandidate(revision,reconciliation){
    var rec=reconciliation||{};var process=rec.processRevision||{};var validation=rec.validation||{};
    var editor=byId('bpmnEditor');if(editor)editor.value=revision&&revision.bpmnXml?revision.bpmnXml:'';
    var save=byId('saveCorrection');if(save)save.disabled=!(revision&&revision.id);
    var meta=byId('meta');if(meta)meta.innerHTML='';
    metric('Source route','NATIVE BPMN');metric('BPMN review revision',revision&&revision.id?revision.id:'—');metric('Canonical revision',process.id||'—');metric('Execution readiness',validation.assessment?validation.assessment.executionReadiness:'NOT AUTHORIZED');
    var nodes=byId('nodes');if(nodes){nodes.innerHTML='';(process.nodes||[]).forEach(function(n){var d=document.createElement('div');d.className='node';var a=document.createElement('strong');a.textContent=n.name||n.kind||n.id;var b=document.createElement('span');b.textContent=(n.kind||'NODE')+' · '+(n.truthClass||'SOURCE_DEFINED');d.append(a,b);nodes.appendChild(d)})}
    renderList('questions',validation.questions||[],'question',function(q){return (q.code?q.code+' · ':'')+(q.question||q.prompt||q.description||'Reviewer input required')});
    renderList('findings',validation.findings||[],'finding',function(f){return (f.code?f.code+' · ':'')+(f.title||f.description||'Validation finding')});
    var badge=byId('reviewBadge');if(badge){badge.textContent='NATIVE BPMN · NOT CONFIRMED';badge.className='badge'}
    var correction=byId('correctionState');if(correction)correction.textContent='Edit BPMN to correct meaning';
    var review=byId('review');if(review)review.className='review open';
  }
  function install(){
    var chooseImage=byId('choose');var inspectImage=byId('inspect');if(!chooseImage||!chooseImage.parentNode||byId('r111ChooseBpmn'))return;
    var input=document.createElement('input');input.id='r111BpmnFile';input.type='file';input.accept='.bpmn,.xml,application/xml,text/xml';input.hidden=true;document.body.appendChild(input);
    var choose=document.createElement('button');choose.id='r111ChooseBpmn';choose.type='button';choose.className='secondary';choose.textContent='Choose BPMN';
    var preserve=document.createElement('button');preserve.id='r111PreserveBpmn';preserve.type='button';preserve.textContent='Preserve BPMN';preserve.disabled=true;
    var name=document.createElement('span');name.id='r111BpmnName';name.className='r111BpmnName';name.textContent='No BPMN selected';
    chooseImage.parentNode.insertBefore(choose,inspectImage.nextSibling);chooseImage.parentNode.insertBefore(preserve,choose.nextSibling);chooseImage.parentNode.insertBefore(name,preserve.nextSibling);
    var hint=document.createElement('div');hint.id='r111NativeHint';hint.className='r111NativeHint';hint.innerHTML='<strong>Native BPMN is available without vision.</strong> PNG still requires a configured perception provider; structured BPMN enters through the same source/review/confirmation authority chain.';
    var status=byId('sourceStatus');if(status&&status.parentNode)status.parentNode.insertBefore(hint,status);
    var selected=null;
    choose.onclick=function(){input.click()};
    input.onchange=function(){selected=input.files&&input.files[0]?input.files[0]:null;name.textContent=selected?selected.name:'No BPMN selected';preserve.disabled=!selected;if(selected)stage('BPMN_SOURCE_SELECTED','The browser selected '+selected.name+'. Talos has not preserved it yet.','')};
    preserve.onclick=async function(){
      if(!selected)return;preserve.disabled=true;stage('PRESERVING_NATIVE_BPMN','Sending exact BPMN XML into the One-App source boundary…','');
      try{
        var bpmnXml=await readText(selected);if(!bpmnXml.trim())throw new Error('BPMN file is empty');
        var data=await api('/api/input/bpmn',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({bpmnXml:bpmnXml,fileName:selected.name,initiatedBy:'one-app-product-user'})});
        var evidence=byId('json');if(evidence)evidence.textContent=JSON.stringify(data,null,2);
        step('truthSource','pass','Native BPMN preserved');step('truthPerception','pass','Not required · structured source');
        if(!data.reconciliation||data.reconciliation.status!=='RECONCILED'){
          step('truthMeaning','blocked','Canonical reconciliation blocked');stage('NATIVE_BPMN_REVIEW_BLOCKED','The BPMN source is preserved, but Talos could not reconcile it into a reviewable Canonical process. No confirmation or automation authority was created.','warn');var review=byId('review');if(review)review.className='review';return;
        }
        renderCandidate(data.revision,data.reconciliation);step('truthMeaning','pass','Native BPMN review candidate');stage('NATIVE_BPMN_READY_FOR_PROCESS_REVIEW','Structured BPMN was preserved and reconciled. Review the business meaning before explicit confirmation.','ok');
        var reviewResult=await api('/api/process-review?revisionId='+encodeURIComponent(data.revision.id));if(evidence)evidence.textContent=JSON.stringify({intake:data,review:reviewResult},null,2);
      }catch(error){stage('NATIVE_BPMN_INTAKE_ERROR',error instanceof Error?error.message:String(error),'bad');if(error&&error.body){var evidence=byId('json');if(evidence)evidence.textContent=JSON.stringify(error.body,null,2)}}finally{preserve.disabled=!selected}
    };
  }
  install();
})();
</script>`;

export function renderR111NativeBpmnSourcePage(basePage: string): string {
  const marker = '</body>';
  if (!basePage.includes(marker)) throw new TypeError('R1-11 native BPMN source extension requires a closing body tag');
  return basePage.replace(marker, `${R1_11_NATIVE_BPMN_SOURCE_EXTENSION}\n${marker}`);
}
