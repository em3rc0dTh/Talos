export const R1_10_PRODUCT_SHELL_EXTENSION=String.raw`
<style>
  .r110Nav{position:sticky;top:10px;z-index:20;display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px;padding:8px;border:1px solid #27384c;border-radius:13px;background:rgba(7,12,18,.94);backdrop-filter:blur(12px)}.r110Nav button{padding:6px 8px;font-size:9px;background:#172335;color:#b9c9db;border:1px solid #2a3d54}.r110Nav button:hover{border-color:#5c7898;color:#fff}
  .r110Recovery{margin:0 0 16px;border:1px solid #31445b;border-radius:16px;padding:14px;background:linear-gradient(180deg,#0e1721,#080e15)}.r110RecoveryTop{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.r110Recovery h2{margin:0;font-size:14px}.r110Recovery p{margin:4px 0 0;font-size:10px;color:#8fa2b7;line-height:1.5}.r110Actions{display:flex;gap:7px;flex-wrap:wrap}.r110Actions button{font-size:9px;padding:7px 9px}.r110Stats{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:7px;margin-top:11px}.r110Stat{border:1px solid #223348;border-radius:9px;padding:8px;background:#09111a}.r110Stat span{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.09em;color:#73879e}.r110Stat strong{display:block;margin-top:4px;font-size:10px;color:#d9e6f2;overflow-wrap:anywhere}.r110Stat.safe strong{color:#66e4bd}.r110Stat.warn strong{color:#ffca6b}
  .r110History{display:grid;gap:6px;margin-top:10px}.r110HistoryItem{display:grid;grid-template-columns:minmax(150px,.8fr) minmax(0,1.4fr) auto;gap:8px;align-items:center;border-left:2px solid #345270;padding:6px 8px;background:#09121b;border-radius:0 8px 8px 0;font-size:9px}.r110HistoryItem strong{color:#cfe0f0}.r110HistoryItem span{color:#8296ac;overflow-wrap:anywhere}.r110HistoryItem time{color:#71859a;white-space:nowrap}.r110Notice{margin-top:9px;padding:8px 9px;border:1px dashed #65562f;border-radius:9px;color:#d9c58f;font-size:9px;line-height:1.5}.r110Live{margin-top:9px;padding:8px 9px;border:1px solid #285743;border-radius:9px;background:#081610;color:#9fd9bf;font-size:9px;display:none}
  .truth.r110Truth{grid-template-columns:repeat(9,minmax(105px,1fr));overflow-x:auto}.truth.r110Truth .truthStep{min-width:105px}.truthStep.active{border-color:#725c2d;background:#211a0a}.truthStep.active strong{color:#ffca6b}
  @media(max-width:1000px){.r110Stats{grid-template-columns:1fr 1fr}.truth.r110Truth{grid-template-columns:repeat(9,125px)}}
</style>
<script>
(function(){
  'use strict';
  function byId(id){return document.getElementById(id)}
  function safe(v){return v==null?'—':String(v)}
  function setTruth(id,state,text){var n=byId(id);if(!n)return;n.className='truthStep '+state;var nodes=n.childNodes;if(nodes.length)nodes[nodes.length-1].textContent=text}
  function scroll(id){var node=byId(id);if(node)node.scrollIntoView({behavior:'smooth',block:'start'})}
  function navButton(label,id){var b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',function(){scroll(id)});return b}
  function humanKind(kind){return safe(kind).replaceAll('_',' ').replace(/([a-z])([A-Z])/g,'$1 $2')}
  function stat(label,value,kind){var d=document.createElement('div');d.className='r110Stat '+(kind||'');var s=document.createElement('span');s.textContent=label;var strong=document.createElement('strong');strong.textContent=safe(value);d.append(s,strong);return d}

  function expandTruth(){
    var truth=document.querySelector('.truth');if(!truth||byId('truthEvidence'))return;truth.classList.add('r110Truth');
    var existingConfirmation=truth.children[3];if(existingConfirmation)existingConfirmation.id='truthConfirmation';
    var existingExecution=truth.children[4];if(existingExecution){existingExecution.id='truthRuntime';existingExecution.querySelector('strong').textContent='7 · RUNTIME / DEPLOY';existingExecution.childNodes[existingExecution.childNodes.length-1].textContent='Separate authority'}
    var design=document.createElement('div');design.className='truthStep';design.id='truthDesign';design.innerHTML='<strong>5 · AUTOMATION DESIGN</strong>Not reached';
    var plan=document.createElement('div');plan.className='truthStep';plan.id='truthPlan';plan.innerHTML='<strong>6 · EXECUTION PLAN</strong>Not reached';
    truth.insertBefore(design,existingExecution);truth.insertBefore(plan,existingExecution);
    var execution=document.createElement('div');execution.className='truthStep';execution.id='truthExecution';execution.innerHTML='<strong>8 · WORKFLOW</strong>Not reached';truth.appendChild(execution);
    var evidence=document.createElement('div');evidence.className='truthStep';evidence.id='truthEvidence';evidence.innerHTML='<strong>9 · EVIDENCE</strong>Durable history';truth.appendChild(evidence);
  }

  function installNav(){
    var shell=document.querySelector('.shell');var truth=document.querySelector('.truth');if(!shell||!truth||byId('r110Nav'))return;
    var nav=document.createElement('nav');nav.id='r110Nav';nav.className='r110Nav';nav.setAttribute('aria-label','Talos product stages');
    [['Source','drop'],['Review','review'],['Confirm','r104BusinessConfirmation'],['Automation design','r105AutomationDesign'],['ExecutionPlan','r106ExecutionPlan'],['Runtime & deploy','r107RuntimeAuthority'],['Recovery & history','r110Recovery']].forEach(function(item){nav.appendChild(navButton(item[0],item[1]))});
    truth.insertAdjacentElement('afterend',nav);
  }

  function installRecovery(){
    var nav=byId('r110Nav');if(!nav||byId('r110Recovery'))return;
    var panel=document.createElement('section');panel.id='r110Recovery';panel.className='r110Recovery';
    panel.innerHTML='<div class="r110RecoveryTop"><div><h2>Recovery, status & durable history</h2><p>Restart reconstructs evidence, not consumable authority. Talos shows the last durable gate and the next safe explicit action; it never auto-resumes a deployment or workflow start.</p></div><div class="r110Actions"><button id="r110Refresh" type="button">Refresh durable history</button><button id="r110Resume" type="button" class="secondary">Go to next safe gate</button></div></div><div id="r110Stats" class="r110Stats"></div><div class="r110Notice" id="r110Notice">Loading runtime recovery contract…</div><div class="r110Live" id="r110Live"></div><div class="sectionLabel">Latest durable evidence</div><div id="r110History" class="r110History"></div>';
    nav.insertAdjacentElement('afterend',panel);byId('r110Refresh').addEventListener('click',loadRecovery);byId('r110Resume').addEventListener('click',resumeSafe);
  }

  var lastRecovery=null;
  function nextTarget(action){
    if(!action)return'r110Recovery';
    if(action.indexOf('AUTOMATION_DESIGN')>=0)return'r105AutomationDesign';
    if(action.indexOf('EXECUTION_PLAN')>=0||action.indexOf('EXECUTIONPLAN')>=0)return'r106ExecutionPlan';
    if(action.indexOf('TEMPORAL')>=0||action.indexOf('RUNTIME')>=0||action.indexOf('DEPLOY')>=0||action.indexOf('WORKFLOW_EXECUTION')>=0)return'r107RuntimeAuthority';
    if(action.indexOf('SOURCE')>=0)return'drop';
    return'r110Recovery';
  }
  function resumeSafe(){if(!lastRecovery)return;scroll(nextTarget(lastRecovery.nextSafeAction))}

  async function loadRecovery(){
    try{
      var response=await fetch('/api/product/recovery');var body=await response.json();if(!response.ok)throw new Error(body.error||('HTTP '+response.status));lastRecovery=body;
      var stats=byId('r110Stats');stats.innerHTML='';stats.append(stat('Runtime schema',body.runtimeSchemaVersion,'safe'));stats.append(stat('Last durable gate',humanKind(body.lastDurableStage),'safe'));stats.append(stat('Durable documents',body.durableDocumentCount));stats.append(stat('Next safe action',humanKind(body.nextSafeAction),'warn'));stats.append(stat('Auto authority restore',body.automaticAuthorityRehydration?'YES':'NO','safe'));
      byId('r110Notice').textContent=body.inFlightRecovery+' · Recovery mode: '+humanKind(body.recoveryMode)+' · explicit reauthorization: '+(body.explicitReauthorizationRequired?'YES':'NO')+'.';
      var history=byId('r110History');history.innerHTML='';var items=(body.timeline||[]).slice(-16).reverse();if(!items.length){var empty=document.createElement('div');empty.className='r110HistoryItem';empty.innerHTML='<strong>No durable work yet</strong><span>Start with a real source.</span><time>—</time>';history.appendChild(empty)}
      items.forEach(function(item){var row=document.createElement('div');row.className='r110HistoryItem';var kind=document.createElement('strong');kind.textContent=humanKind(item.aggregateKind);var detail=document.createElement('span');var bits=[item.id,item.state,item.readiness,item.result,item.executionStatus,item.workflowIdRef].filter(Boolean);detail.textContent=bits.join(' · ');var time=document.createElement('time');time.textContent=item.createdAt?new Date(item.createdAt).toLocaleString():'—';row.append(kind,detail,time);history.appendChild(row)});
      if(body.durableDocumentCount>0)setTruth('truthEvidence','pass','Durable evidence recovered');
    }catch(error){byId('r110Notice').textContent='Recovery status unavailable: '+(error instanceof Error?error.message:String(error))}
  }

  function live(message){var n=byId('r110Live');if(!n)return;n.textContent=message;n.style.display='block'}

  expandTruth();installNav();installRecovery();loadRecovery();
  window.addEventListener('talos:r1-04-business-process-confirmed',function(){setTruth('truthConfirmation','pass','Exact process confirmed')});
  window.addEventListener('talos:r1-05-automation-design-updated',function(){setTruth('truthDesign','pass','Design workspace active')});
  window.addEventListener('talos:r1-06-automation-approved',function(){setTruth('truthPlan','pass','Exact plan approved');setTruth('truthRuntime','active','Runtime authority pending')});
  window.addEventListener('talos:r1-06-automation-approval-invalidated',function(){setTruth('truthDesign','active','Reconfirmation required');setTruth('truthPlan','','Not reached');setTruth('truthRuntime','','Separate authority');setTruth('truthExecution','','Not reached')});
  window.addEventListener('talos:r1-07-workflow-observed',function(event){var detail=event&&event.detail;setTruth('truthRuntime','pass','Deployment authority complete');setTruth('truthExecution','pass','Workflow observed');setTruth('truthEvidence','pass','Execution evidence durable');if(detail&&detail.executionObservation)live('Observed workflow '+safe(detail.executionObservation.workflowIdRef)+' · run '+safe(detail.executionObservation.runIdRef)+' · '+safe(detail.executionObservation.executionStatus));loadRecovery()});
})();
</script>`;

export function renderR110ProductShellPage(basePage:string):string{
  const marker='</body>';
  if(!basePage.includes(marker))throw new TypeError('R1-10 product shell requires a closing body tag');
  return basePage.replace(marker,`${R1_10_PRODUCT_SHELL_EXTENSION}\n${marker}`);
}
