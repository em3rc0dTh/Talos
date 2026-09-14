export const R1_07_RUNTIME_AUTHORITY_EXTENSION = String.raw`
<style>
  .r107Panel{margin-top:14px;border:1px solid #4d5e77;border-radius:14px;padding:14px;background:linear-gradient(180deg,#101924,#071019)}
  .r107Panel h3{margin:0 0 5px;font-size:13px}.r107Panel>p{margin:0;color:#96a8bc;font-size:11px;line-height:1.5}
  .r107Boundary{margin-top:10px;padding:9px 10px;border:1px dashed #68768a;border-radius:9px;font-size:10px;color:#cbd8e6;line-height:1.5}.r107Boundary strong{color:#66e4bd}
  .r107State{margin-top:9px;font-size:11px;color:#ffca6b}.r107State.good{color:#66e4bd}.r107State.bad{color:#ff7f8e}.r107State.blocked{color:#ffca6b}
  .r107Steps{display:grid;gap:9px;margin-top:12px}.r107Step{border:1px solid #27394e;border-radius:11px;padding:10px;background:#07101a}.r107Step[data-state="done"]{border-color:#285743}.r107Step[data-state="active"]{border-color:#77622b}.r107Step h4{margin:0 0 6px;font-size:11px;color:#dce8f5}.r107Step p{margin:0 0 7px;font-size:9px;color:#8094aa;line-height:1.45}
  .r107Fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:7px}.r107Fields label{display:grid;gap:4px;font-size:9px;color:#8195aa}.r107Fields input,.r107Fields select,.r107Fields textarea{width:100%;box-sizing:border-box;background:#0b141e;color:#dce7f2;border:1px solid #304359;border-radius:7px;padding:7px;font-size:10px}.r107Fields textarea{min-height:50px;resize:vertical}.r107Actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.r107Actions button{font-size:10px;padding:7px 9px}.r107Actions button:disabled{opacity:.42}
  .r107Policies{display:grid;gap:7px;margin-top:8px}.r107Policy{border:1px solid #26384b;border-radius:8px;padding:8px}.r107Policy strong{font-size:10px;color:#cfe0f0}.r107Receipt{margin-top:7px;border-left:2px solid #2f7659;padding:6px 8px;background:#081610;color:#9fd9bf;font-size:9px;line-height:1.45;overflow-wrap:anywhere}.r107Warn{margin-top:7px;border-left:2px solid #8b6a2d;padding:6px 8px;background:#171207;color:#e4ca8e;font-size:9px;line-height:1.45}
</style>
<script>
(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var capturedReview=null;
  var approval=null;
  var mapping=null;
  var runtimePolicy=null;
  var deploymentDesign=null;
  var realization=null;
  var deploymentApproval=null;
  var deploymentAttempt=null;
  var executionApproval=null;
  var executionObservation=null;

  function byId(id){return document.getElementById(id)}
  function safe(value){return value==null?'—':String(value)}
  function authority(kind){return 'authority:talos-product:r1-07-'+kind+':'+Date.now()}
  function setState(message,kind){var n=byId('r107State');if(!n)return;n.textContent=message;n.className='r107State'+(kind?' '+kind:'')}
  function receipt(step,text){var host=byId('r107Receipt'+step);if(!host)return;host.textContent=text;host.style.display='block';var card=byId('r107Step'+step);if(card)card.dataset.state='done'}
  function enable(id,value){var n=byId(id);if(n)n.disabled=!value}
  function parseJsonArray(id){var raw=byId(id).value.trim();if(!raw)return[];var value=JSON.parse(raw);if(!Array.isArray(value))throw new Error(id+' must be a JSON array');return value}
  function fieldValue(id){var n=byId(id);return n?n.value.trim():''}
  function intValue(id,min){var value=Number(fieldValue(id));if(!Number.isInteger(value)||value<(min||0))throw new Error(id+' must be an integer >= '+(min||0));return value}
  function currentUses(){return capturedReview&&capturedReview.execution&&Array.isArray(capturedReview.execution.capabilityUses)?capturedReview.execution.capabilityUses:[]}

  function reset(reason){approval=null;mapping=null;runtimePolicy=null;deploymentDesign=null;realization=null;deploymentApproval=null;deploymentAttempt=null;executionApproval=null;executionObservation=null;for(var i=1;i<=8;i++){var r=byId('r107Receipt'+i);if(r){r.textContent='';r.style.display='none'}var s=byId('r107Step'+i);if(s)s.dataset.state='locked'}['r107Map','r107Runtime','r107DeploymentDesign','r107Realize','r107ApproveDeployment','r107AttemptDeployment','r107ApproveExecution','r107StartExecution'].forEach(function(id){enable(id,false)});setState(reason||'Exact R1-06 automation approval required.','blocked')}

  function captureReview(response){
    response.clone().json().then(function(body){
      if(body&&body.review&&body.execution){capturedReview=body}
    }).catch(function(){return undefined});
  }

  window.fetch=function(input,init){
    var url=typeof input==='string'?input:(input&&input.url)||'';
    var method=String((init&&init.method)||'GET').toUpperCase();
    return nativeFetch(input,init).then(function(response){
      if(method==='POST'&&url.indexOf('/api/automation/execution-plan/review')!==-1&&response.ok)captureReview(response);
      return response;
    });
  };

  function renderPolicyEditors(){
    var host=byId('r107Policies');if(!host)return;host.innerHTML='';
    var uses=currentUses();
    uses.forEach(function(use,index){
      var card=document.createElement('div');card.className='r107Policy';card.dataset.useRef=use.id;
      card.innerHTML='<strong>Capability use '+(index+1)+'</strong><div class="r107Fields"><label>Occurrence ref<input class="r107UseRef" readonly value="'+safe(use.id).replaceAll('"','&quot;')+'"></label><label>Max retry attempts<input class="r107MaxAttempts" type="number" min="1" value="3"></label><label>Initial retry ms<input class="r107Initial" type="number" min="1" value="100"></label><label>Max retry interval ms<input class="r107MaxInterval" type="number" min="1" value="1000"></label><label>Start-to-close ms<input class="r107StartClose" type="number" min="1" value="5000"></label><label>Schedule-to-close ms<input class="r107ScheduleClose" type="number" min="1" value="10000"></label><label>Idempotency enforcement<input class="r107Enforcement" value="ONE_APP_EFFECT_LEDGER"></label><label>Execution input source<input class="r107InputSource" value="one-app-product-explicit-input"></label></div>';
      host.appendChild(card);
    });
    if(!uses.length){var warn=document.createElement('div');warn.className='r107Warn';warn.textContent='No capability-use occurrence was captured from the reviewed ExecutionPlan. RuntimePolicy cannot be authorized.';host.appendChild(warn)}
  }

  function buildActivityPolicies(){
    var cards=Array.from(byId('r107Policies').querySelectorAll('.r107Policy'));
    if(cards.length===0)throw new Error('RuntimePolicy requires at least one explicit capability-use policy.');
    return cards.map(function(card){
      var occurrence=card.dataset.useRef;
      function number(cls){var v=Number(card.querySelector(cls).value);if(!Number.isInteger(v)||v<1)throw new Error('Runtime policy values must be positive integers.');return v}
      var enforcement=card.querySelector('.r107Enforcement').value.trim();if(!enforcement)throw new Error('Idempotency enforcement ref is required.');
      return{
        capabilityUseOccurrenceRef:occurrence,
        authorityRef:authority('activity-runtime-policy'),
        decidedBy:'one-app-product-user',
        rationale:'Explicit R1-07 runtime policy confirmed by the operator; no implicit Temporal defaults are accepted.',
        policyBasis:'USER_EXPLICIT_DESIGN',
        retry:{initialIntervalMs:number('.r107Initial'),backoffCoefficient:2,maximumIntervalMs:number('.r107MaxInterval'),maximumAttempts:number('.r107MaxAttempts'),nonRetryableFailureTypes:['INVALID_REQUEST','IDEMPOTENCY_CONFLICT']},
        timeout:{startToCloseMs:number('.r107StartClose'),scheduleToCloseMs:number('.r107ScheduleClose')},
        idempotency:{requirement:'REQUIRED',strategyKind:'IDEMPOTENCY_KEY',keyContract:'sha256(executionId + capabilityUseOccurrenceRef)',enforcementRef:enforcement},
        failureClassifications:[{failureType:'TRANSIENT_FAILURE',retryable:true,businessFailure:false},{failureType:'INVALID_REQUEST',retryable:false,businessFailure:false},{failureType:'IDEMPOTENCY_CONFLICT',retryable:false,businessFailure:false}]
      };
    });
  }

  async function post(path,payload){
    var response=await nativeFetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    var raw=await response.text();var body=raw?JSON.parse(raw):{};
    if(!response.ok)throw new Error(body.error||body.code||('HTTP '+response.status));
    return body;
  }

  async function mapTemporal(){
    try{
      if(!approval)throw new Error('Exact automation approval is required.');
      var body=await post('/api/automation/temporal-mapping',{approvalId:approval.approvalId,waits:parseJsonArray('r107Waits'),humans:parseJsonArray('r107Humans')});
      if(body.runtimePolicyAuthorized!==false||body.deploymentAuthorized!==false||body.executionAuthorized!==false)throw new Error('Temporal mapping crossed downstream authority.');
      mapping=body.mapping;receipt(1,'Temporal mapping '+mapping.revision.id+' · readiness '+mapping.assessment.readiness+' · RuntimePolicy authority: NO');enable('r107Runtime',true);byId('r107Step2').dataset.state='active';setState('TEMPORAL MAPPING READY · explicit RuntimePolicy is required next.','good');
    }catch(error){setState(error instanceof Error?error.message:String(error),'bad')}
  }

  async function designRuntime(){
    try{
      if(!mapping)throw new Error('Temporal mapping required.');
      var body=await post('/api/automation/runtime-policy',{approvalId:approval.approvalId,temporalMappingRevisionId:mapping.revision.id,activities:buildActivityPolicies(),workflow:{authorityRef:authority('workflow-runtime-policy'),decidedBy:'one-app-product-user',rationale:'Explicitly limit whole-workflow retries so business execution is not duplicated implicitly.',maximumAttempts:intValue('r107WorkflowAttempts',1),policyBasis:'USER_EXPLICIT_DESIGN'}});
      if(body.automaticRuntimePolicyDefaultsAuthorized!==false||body.deploymentAuthorized!==false||body.executionAuthorized!==false)throw new Error('RuntimePolicy crossed deployment/execution authority.');
      runtimePolicy=body.runtimePolicy;receipt(2,'RuntimePolicy '+runtimePolicy.revision.id+' · activity policies '+runtimePolicy.activityPolicies.length+' · implicit defaults: 0');enable('r107DeploymentDesign',true);byId('r107Step3').dataset.state='active';setState('RUNTIME POLICY EXPLICITLY CONFIRMED · deployment design may begin.','good');
    }catch(error){setState(error instanceof Error?error.message:String(error),'bad')}
  }

  async function designDeployment(){
    try{
      var body=await post('/api/automation/deployment-design',{approvalId:approval.approvalId,runtimePolicyRevisionId:runtimePolicy.revision.id,environmentKey:fieldValue('r107EnvironmentKey'),environmentClass:fieldValue('r107EnvironmentClass'),temporalPlatformRef:fieldValue('r107TemporalPlatform'),desiredNamespaceKey:fieldValue('r107DesiredNamespace'),desiredTaskQueueKey:fieldValue('r107DesiredTaskQueue'),desiredWorkflowTypeName:fieldValue('r107DesiredWorkflow'),desiredActivityTypeName:fieldValue('r107DesiredActivity'),desiredWorkerLogicalName:fieldValue('r107DesiredWorker'),authorityRef:authority('deployment-design'),decidedBy:'one-app-product-user',rationale:'Explicit R1-07 deployment design. Environment realization and deployment remain separately authorized.'});
      if(body.deploymentRealizationAuthorized!==false||body.deploymentAttemptAuthorized!==false||body.executionAuthorized!==false)throw new Error('Deployment design crossed downstream authority.');
      deploymentDesign=body.deploymentDesign;receipt(3,'Deployment design '+deploymentDesign.revision.id+' · environment '+deploymentDesign.revision.environmentKey+' · realization authority: NO');enable('r107Realize',true);byId('r107Step4').dataset.state='active';setState('DEPLOYMENT DESIGN RECORDED · exact environment realization required.','good');
    }catch(error){setState(error instanceof Error?error.message:String(error),'bad')}
  }

  async function realizeEnvironment(){
    try{
      var body=await post('/api/automation/environment-realization',{approvalId:approval.approvalId,deploymentRevisionId:deploymentDesign.revision.id,actualNamespace:fieldValue('r107ActualNamespace'),taskQueue:fieldValue('r107TaskQueue'),workflowTypeName:fieldValue('r107WorkflowType'),activityTypeName:fieldValue('r107ActivityType'),workerLogicalName:fieldValue('r107WorkerName'),executableArtifactRef:fieldValue('r107ArtifactRef'),artifactDigest:fieldValue('r107ArtifactDigest'),sdkFamily:fieldValue('r107SdkFamily'),sdkVersionRef:fieldValue('r107SdkVersion'),authorityRef:authority('environment-realization'),realizedBy:'one-app-product-user'});
      if(body.deploymentAttemptAuthorized!==false||body.deploymentAuthorized!==false||body.executionAuthorized!==false)throw new Error('Environment realization crossed deployment/execution authority.');
      realization=body.deploymentRealization;receipt(4,'Environment realized as '+realization.revision.id+' · namespace '+realization.revision.actualNamespace+' · deployment approval still required');enable('r107ApproveDeployment',true);byId('r107Step5').dataset.state='active';setState('ENVIRONMENT REALIZED · explicit deployment approval required.','good');
    }catch(error){setState(error instanceof Error?error.message:String(error),'bad')}
  }

  async function approveDeployment(){
    try{
      var rationale=fieldValue('r107DeploymentRationale');if(!rationale)throw new Error('Deployment approval rationale is required.');
      var body=await post('/api/automation/deployment/approve',{automationApprovalId:approval.approvalId,deploymentRevisionId:realization.revision.id,authorityRef:authority('deployment-approval'),approvedBy:'one-app-product-user',rationale:rationale});
      if(body.deploymentAttemptAuthorized!==true||body.authorizedAttemptCount!==1||body.executionAuthorized!==false)throw new Error('Deployment approval authority contract mismatch.');
      deploymentApproval=body.deploymentApproval;receipt(5,'Deployment approval '+deploymentApproval.id+' · exactly one deployment attempt authorized');enable('r107AttemptDeployment',true);byId('r107Step6').dataset.state='active';setState('DEPLOYMENT APPROVED ONCE · execute the authorized attempt explicitly.','good');
    }catch(error){setState(error instanceof Error?error.message:String(error),'bad')}
  }

  async function attemptDeployment(){
    try{
      var body=await post('/api/automation/deployment/attempt',{deploymentApprovalId:deploymentApproval.id,deploymentRevisionId:realization.revision.id});
      if(body.deploymentAttemptConsumed!==true||body.workflowExecutionAuthorized!==false||body.executionAuthorized!==false)throw new Error('Deployment attempt authority contract mismatch.');
      deploymentAttempt=body.deploymentAttempt;receipt(6,'Deployment attempt '+deploymentAttempt.id+' · result '+deploymentAttempt.result+' · execution authority: NO');
      if(!body.deploymentAttemptSucceeded)throw new Error('Deployment attempt did not succeed; workflow execution cannot be authorized.');
      enable('r107ApproveExecution',true);byId('r107Step7').dataset.state='active';setState('DEPLOYMENT SUCCEEDED · exact workflow input approval required.','good');
    }catch(error){setState((error instanceof Error?error.message:String(error))+' Trusted deployment executor must be configured by the product host.','bad')}
  }

  function capabilityInputs(){
    var values={};
    Array.from(byId('r107Policies').querySelectorAll('.r107Policy')).forEach(function(card){values[card.dataset.useRef]={source:card.querySelector('.r107InputSource').value.trim()}});
    return values;
  }

  function facts(){return{approved:byId('r107FactApproved').value==='true'}}

  async function approveExecution(){
    try{
      var executionId=fieldValue('r107ExecutionId');if(!executionId)throw new Error('Execution ID is required.');
      if(!realization.workflowTypeBindings||!realization.workflowTypeBindings.length)throw new Error('Environment realization has no workflow-type binding.');
      var body=await post('/api/automation/execution/approve',{automationApprovalId:approval.approvalId,deploymentRevisionId:realization.revision.id,deploymentAttemptId:deploymentAttempt.id,workflowTypeBindingRef:realization.workflowTypeBindings[0].id,executionId:executionId,facts:facts(),capabilityInputs:capabilityInputs(),authorityRef:authority('workflow-execution-approval'),approvedBy:'one-app-product-user',rationale:fieldValue('r107ExecutionRationale')});
      if(body.workflowExecutionAuthorized!==true||body.authorizedWorkflowStartCount!==1)throw new Error('Workflow execution approval must authorize exactly one start.');
      executionApproval=body.workflowExecutionApproval;receipt(7,'Execution approval '+executionApproval.id+' · input digest '+executionApproval.executionInputDigest+' · exactly one workflow start');enable('r107StartExecution',true);byId('r107Step8').dataset.state='active';setState('WORKFLOW INPUT APPROVED ONCE · explicit start remains required.','good');
    }catch(error){setState(error instanceof Error?error.message:String(error),'bad')}
  }

  async function startExecution(){
    try{
      var body=await post('/api/automation/execution/start',{workflowExecutionApprovalId:executionApproval.id,deploymentRevisionId:realization.revision.id,executionId:fieldValue('r107ExecutionId'),facts:facts(),capabilityInputs:capabilityInputs()});
      if(body.workflowExecutionApprovalConsumed!==true||body.additionalWorkflowStartAuthorized!==false)throw new Error('Workflow start did not consume single-use execution authority.');
      executionObservation=body.workflowExecutionObservation;receipt(8,'Workflow '+executionObservation.workflowIdRef+' · run '+executionObservation.runIdRef+' · '+executionObservation.executionStatus+' · additional starts: NO');setState('WORKFLOW EXECUTION OBSERVED · durable evidence recorded.','good');
      window.dispatchEvent(new CustomEvent('talos:r1-07-workflow-observed',{detail:{automationApprovalId:approval.approvalId,deploymentRevisionId:realization.revision.id,deploymentAttemptId:deploymentAttempt.id,executionApprovalId:executionApproval.id,executionObservation:executionObservation}}));
    }catch(error){setState((error instanceof Error?error.message:String(error))+' Trusted workflow execution executor must be configured by the product host.','bad')}
  }

  function install(){
    var review=byId('review');if(!review||byId('r107RuntimeAuthority'))return;
    var panel=document.createElement('section');panel.id='r107RuntimeAuthority';panel.className='r107Panel';
    panel.innerHTML='<h3>Runtime, Deployment & Execution Authority</h3><p>Advance the exact approved ExecutionPlan through eight independent authority gates. No step automatically approves the next.</p><div class="r107Boundary"><strong>One gate ≠ the next gate.</strong> Temporal mapping is not RuntimePolicy. RuntimePolicy is not deployment. Deployment approval is not workflow execution approval. Workflow execution approval authorizes exactly one start.</div><div id="r107State" class="r107State blocked">Exact R1-06 automation approval required.</div><div class="r107Steps">'
      +'<section id="r107Step1" class="r107Step" data-state="locked"><h4>1 · Temporal mapping</h4><p>Map only the exact approved ExecutionPlan. Optional wait/human resolutions are explicit advanced inputs.</p><div class="r107Fields"><label>Wait resolutions (JSON array)<textarea id="r107Waits">[]</textarea></label><label>Human resolutions (JSON array)<textarea id="r107Humans">[]</textarea></label></div><div class="r107Actions"><button id="r107Map" disabled>Map exact plan to Temporal</button></div><div id="r107Receipt1" class="r107Receipt" style="display:none"></div></section>'
      +'<section id="r107Step2" class="r107Step" data-state="locked"><h4>2 · Explicit RuntimePolicy</h4><p>Retry, timeout, idempotency and failure classification must be actively confirmed; UI starting values are editable proposals with zero authority until submit.</p><div id="r107Policies" class="r107Policies"></div><div class="r107Fields"><label>Whole-workflow max attempts<input id="r107WorkflowAttempts" type="number" min="1" value="1"></label></div><div class="r107Actions"><button id="r107Runtime" disabled>Confirm explicit RuntimePolicy</button></div><div id="r107Receipt2" class="r107Receipt" style="display:none"></div></section>'
      +'<section id="r107Step3" class="r107Step" data-state="locked"><h4>3 · Deployment design</h4><p>Design the intended environment. These values are intent, not evidence that anything is deployed.</p><div class="r107Fields"><label>Environment key<input id="r107EnvironmentKey" value="talos-local"></label><label>Environment class<select id="r107EnvironmentClass"><option>DEVELOPMENT</option><option selected>TEST</option><option>STAGING</option><option>PRODUCTION</option></select></label><label>Temporal platform ref<input id="r107TemporalPlatform" value="temporal:self-hosted"></label><label>Desired namespace<input id="r107DesiredNamespace" value="default"></label><label>Desired task queue<input id="r107DesiredTaskQueue" value="talos-r1"></label><label>Workflow type<input id="r107DesiredWorkflow" value="TalosGenericWorkflow"></label><label>Activity type<input id="r107DesiredActivity" value="executeGenericCapability"></label><label>Worker logical name<input id="r107DesiredWorker" value="talos-r1-worker"></label></div><div class="r107Actions"><button id="r107DeploymentDesign" disabled>Record deployment design</button></div><div id="r107Receipt3" class="r107Receipt" style="display:none"></div></section>'
      +'<section id="r107Step4" class="r107Step" data-state="locked"><h4>4 · Environment realization</h4><p>Record observed, exact worker/runtime facts separately from deployment intent.</p><div class="r107Fields"><label>Actual namespace<input id="r107ActualNamespace" value="default"></label><label>Task queue<input id="r107TaskQueue" value="talos-r1"></label><label>Workflow type<input id="r107WorkflowType" value="TalosGenericWorkflow"></label><label>Activity type<input id="r107ActivityType" value="executeGenericCapability"></label><label>Worker name<input id="r107WorkerName" value="talos-r1-worker"></label><label>Executable artifact ref<input id="r107ArtifactRef" value="talos:r1-product"></label><label>Artifact digest<input id="r107ArtifactDigest" value="sha256:operator-must-replace"></label><label>SDK family<input id="r107SdkFamily" value="TEMPORAL_TYPESCRIPT_SDK"></label><label>SDK version<input id="r107SdkVersion" value="1.22.0"></label></div><div class="r107Warn">Replace placeholder artifact digest with the exact realized artifact digest before production use.</div><div class="r107Actions"><button id="r107Realize" disabled>Record exact environment realization</button></div><div id="r107Receipt4" class="r107Receipt" style="display:none"></div></section>'
      +'<section id="r107Step5" class="r107Step" data-state="locked"><h4>5 · Explicit deployment approval</h4><p>Authorize one deployment attempt for the exact realized DeploymentRevision.</p><div class="r107Fields"><label>Rationale<textarea id="r107DeploymentRationale">Approve exactly one deployment attempt for this exact realized revision.</textarea></label></div><div class="r107Actions"><button id="r107ApproveDeployment" disabled>Approve one deployment attempt</button></div><div id="r107Receipt5" class="r107Receipt" style="display:none"></div></section>'
      +'<section id="r107Step6" class="r107Step" data-state="locked"><h4>6 · Deployment attempt</h4><p>Invoke the host-configured trusted deployment executor. Approval is consumed even though workflow execution remains unauthorized.</p><div class="r107Actions"><button id="r107AttemptDeployment" disabled>Execute authorized deployment attempt</button></div><div id="r107Receipt6" class="r107Receipt" style="display:none"></div></section>'
      +'<section id="r107Step7" class="r107Step" data-state="locked"><h4>7 · Explicit workflow execution approval</h4><p>Pin the exact deployment, execution ID, facts and capability inputs. This authorizes one start only.</p><div class="r107Fields"><label>Execution ID<input id="r107ExecutionId" value="TALOS-R1-EXEC-001"></label><label>Business fact: approved<select id="r107FactApproved"><option value="true" selected>true</option><option value="false">false</option></select></label><label>Rationale<textarea id="r107ExecutionRationale">Authorize exactly one workflow start with these exact facts and capability inputs.</textarea></label></div><div class="r107Actions"><button id="r107ApproveExecution" disabled>Approve exact workflow input once</button></div><div id="r107Receipt7" class="r107Receipt" style="display:none"></div></section>'
      +'<section id="r107Step8" class="r107Step" data-state="locked"><h4>8 · Workflow execution</h4><p>Invoke the trusted workflow executor. Starting consumes the single-use execution authority.</p><div class="r107Actions"><button id="r107StartExecution" disabled>Start authorized workflow once</button></div><div id="r107Receipt8" class="r107Receipt" style="display:none"></div></section>'
      +'</div>';
    review.appendChild(panel);
    byId('r107Map').addEventListener('click',mapTemporal);byId('r107Runtime').addEventListener('click',designRuntime);byId('r107DeploymentDesign').addEventListener('click',designDeployment);byId('r107Realize').addEventListener('click',realizeEnvironment);byId('r107ApproveDeployment').addEventListener('click',approveDeployment);byId('r107AttemptDeployment').addEventListener('click',attemptDeployment);byId('r107ApproveExecution').addEventListener('click',approveExecution);byId('r107StartExecution').addEventListener('click',startExecution);
    reset('Exact R1-06 automation approval required.');
  }

  window.addEventListener('talos:r1-06-automation-approved',function(event){
    var detail=event&&event.detail;if(!detail||!detail.approvalId)return;
    if(!capturedReview||!capturedReview.execution||capturedReview.execution.revision.id!==detail.executionPlanRevisionId){setState('R1-07 refused handoff: exact reviewed ExecutionPlan context was not captured.','bad');return}
    approval=detail;mapping=null;runtimePolicy=null;deploymentDesign=null;realization=null;deploymentApproval=null;deploymentAttempt=null;executionApproval=null;executionObservation=null;renderPolicyEditors();enable('r107Map',true);var step=byId('r107Step1');if(step)step.dataset.state='active';setState('EXACT AUTOMATION APPROVAL READY · begin Temporal mapping explicitly.','good');
  });
  window.addEventListener('talos:r1-06-automation-approval-invalidated',function(event){capturedReview=null;reset((event&&event.detail&&event.detail.reason)||'R1-06 approval invalidated.')});
  setTimeout(install,0);
})();
</script>`;

export function renderR107RuntimeAuthorityPage(basePage: string): string {
  const marker = '</body>';
  if (!basePage.includes(marker)) throw new TypeError('R1-07 product page requires a closing body tag');
  return basePage.replace(marker, `${R1_07_RUNTIME_AUTHORITY_EXTENSION}\n${marker}`);
}
