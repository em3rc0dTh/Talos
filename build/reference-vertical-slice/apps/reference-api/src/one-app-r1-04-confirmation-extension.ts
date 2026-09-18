export const R1_04_BUSINESS_CONFIRMATION_EXTENSION = String.raw`
<style>
  .r104Confirm{margin-top:14px;border:1px solid #2f4660;border-radius:14px;padding:14px;background:linear-gradient(180deg,#0c1520,#091019)}
  .r104Confirm h3{margin:0 0 5px;font-size:13px}.r104Confirm p{margin:0;color:#98a8bb;font-size:11px;line-height:1.5}
  .r104Boundary{margin-top:10px;padding:9px 10px;border:1px dashed #50627a;border-radius:9px;color:#c7d7e8;font-size:11px;line-height:1.45}
  .r104Boundary strong{color:#66e4bd}.r104Confirm textarea{width:100%;min-height:76px;margin-top:10px;resize:vertical;border:1px solid #263548;border-radius:10px;background:#05090e;color:#c7d7e8;padding:10px;font:11px/1.45 Inter,ui-sans-serif,system-ui}
  .r104Actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:10px}.r104State{font-size:11px;color:#ffca6b}.r104State.good{color:#66e4bd}.r104State.bad{color:#ff7f8e}
</style>
<script>
(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var candidate=null;
  var confirmed=false;

  function byId(id){return document.getElementById(id)}
  function authority(){return 'authority:talos-product:r1-04-business-process-confirmation:'+Date.now()}
  function state(message,kind){var node=byId('r104ConfirmationState');if(!node)return;node.textContent=message;node.className='r104State'+(kind?' '+kind:'')}
  function truthStep(index,kind,message){var steps=document.querySelectorAll('.truth .truthStep');var node=steps[index];if(!node)return;node.className='truthStep '+kind;var tail=node.childNodes[node.childNodes.length-1];if(tail)tail.textContent=message}
  function setLocked(locked){var save=byId('saveCorrection');var editor=byId('bpmnEditor');if(save)save.disabled=locked||!candidate;if(editor)editor.readOnly=locked}
  function refresh(){var button=byId('r104ConfirmProcess');if(button)button.disabled=!candidate||confirmed;if(!candidate){state('No exact review revision is available for confirmation.','');return}if(confirmed){state('CONFIRMED · automation design still requires a separate authority.','good');return}state('READY FOR EXPLICIT BUSINESS CONFIRMATION · no later authority implied.','')}
  function capture(body){
    if(!body||!body.revision||!body.reconciliation||!body.reconciliation.processRevision)return;
    if(body.status==='CORRECTION_BLOCKED'||body.reconciliation.status==='BLOCKED')return;
    candidate={revisionId:body.revision.id,canonicalProcessRevisionId:body.reconciliation.processRevision.id};
    confirmed=body.revision.state==='CONFIRMED';
    setLocked(confirmed);
    refresh();
  }
  function publishConfirmation(body){
    if(!body||!body.revision||!body.confirmation)return;
    window.dispatchEvent(new CustomEvent('talos:r1-04-business-process-confirmed',{detail:{
      revisionId:body.revision.id,
      canonicalProcessRevisionId:body.confirmation.canonicalProcessRevisionId,
      confirmationId:body.confirmation.id
    }}));
  }
  function install(){
    var review=byId('review');
    if(!review||byId('r104BusinessConfirmation'))return;
    var box=document.createElement('section');
    box.id='r104BusinessConfirmation';box.className='r104Confirm';
    box.innerHTML='<h3>Business-process confirmation</h3><p>Confirm the exact BPMN review revision and exact Canonical ProcessRevision only after you have reviewed the business meaning.</p><div class="r104Boundary"><strong>Authority boundary:</strong> process confirmation ≠ automation approval ≠ deployment approval ≠ execution approval. This action cannot freeze semantics, deploy, or start a workflow.</div><textarea id="r104ConfirmationRationale">I reviewed this exact process revision and confirm that it represents the business process I intend Talos to use for later automation design.</textarea><div class="r104Actions"><button id="r104ConfirmProcess" disabled>Confirm business process</button><span id="r104ConfirmationState" class="r104State">Waiting for a review candidate.</span></div>';
    var next=review.querySelector('.next');
    if(next&&next.parentNode)next.parentNode.insertBefore(box,next.nextSibling);else review.appendChild(box);
    byId('r104ConfirmProcess').addEventListener('click',confirmProcess);
  }
  async function confirmProcess(){
    if(!candidate||confirmed)return;
    var button=byId('r104ConfirmProcess');if(button)button.disabled=true;
    state('Recording explicit human authority for the exact review revision…','');
    try{
      var response=await nativeFetch('/api/bpmn/confirm',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({revisionId:candidate.revisionId,canonicalProcessRevisionId:candidate.canonicalProcessRevisionId,confirmedBy:'one-app-product-user',authorityRef:authority(),rationale:byId('r104ConfirmationRationale').value})});
      var raw=await response.text();var body=raw?JSON.parse(raw):{};
      if(!response.ok)throw new Error(body.error||body.code||('HTTP '+response.status));
      confirmed=true;
      candidate={revisionId:body.revision.id,canonicalProcessRevisionId:body.confirmation.canonicalProcessRevisionId};
      setLocked(true);
      var badge=byId('reviewBadge');if(badge){badge.textContent='CONFIRMED · AUTOMATION NOT AUTHORIZED';badge.className='badge corrected'}
      truthStep(3,'pass','Exact business process confirmed');
      truthStep(4,'blocked','Separate authority still required');
      state('CONFIRMED · this exact process is locked in this product session. Automation design remains unauthorized.','good');
      var evidence=byId('json');if(evidence)evidence.textContent=JSON.stringify({businessProcessConfirmation:body},null,2);
      publishConfirmation(body);
    }catch(error){
      confirmed=false;state(error instanceof Error?error.message:String(error),'bad');refresh();
    }
  }

  install();
  window.fetch=function(input,init){
    var path=typeof input==='string'?input:(input&&input.url)||'';
    var method=String((init&&init.method)||'GET').toUpperCase();
    var semanticResolution=path.indexOf('/api/semantic-resolution/decide')!==-1&&method==='POST';var reviewResult=(path.indexOf('/api/input/image')!==-1&&method==='POST')||(path.indexOf('/api/input/bpmn')!==-1&&method==='POST')||(path.indexOf('/api/bpmn/edit')!==-1&&method==='POST')||semanticResolution||(path.indexOf('/api/process-review')!==-1&&method==='GET');
    return nativeFetch(input,init).then(function(response){
      if(reviewResult&&response.ok){response.clone().json().then(function(body){
        var normalized=body;
        if(body&&body.status==='PROCESS_REVIEW_REQUIRED')normalized={revision:body.revision,reconciliation:body.reconciliation};
        capture(normalized);
        if((path.indexOf('/api/bpmn/edit')!==-1||semanticResolution)&&body&&body.status!=='CORRECTION_BLOCKED'){confirmed=false;setLocked(false);refresh();truthStep(3,'','Review updated process');}
      }).catch(function(){});}
      return response;
    });
  };
  refresh();
})();
</script>`;

export function renderR104BusinessConfirmationPage(basePage: string): string {
  const marker = '</body>';
  if (!basePage.includes(marker)) throw new TypeError('R1-04 product page requires a closing body tag');
  return basePage.replace(marker, `${R1_04_BUSINESS_CONFIRMATION_EXTENSION}\n${marker}`);
}
