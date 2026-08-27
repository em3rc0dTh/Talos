import { ONE_APP_PRODUCT_JOURNEY_PAGE } from './one-app-product-journey-page.ts';

// Keep the R1-02 product truth language visible while the product grows into
// later authority stages. Interpretation is never automatic business truth and
// each later authority remains separate.
const R1_02_TRUTH_FOOTER = '<footer style="max-width:1460px;margin:0 auto;padding:0 28px 28px;color:#94a3b8;font:12px/1.5 Inter,ui-sans-serif,system-ui">Bring the real process. Never automatic. Separate authority.</footer>';

// R1-06 closes the first arbitrary-process product dead-end without changing
// the semantic or execution engines. The backend already models these as
// explicit authority-bearing ExecutionPlan decisions; this product-shell layer
// merely renders those decisions and injects them into the existing review
// request. Unknown blocker kinds remain blocked rather than guessed.
const PLAN_BLOCKER_MARKER = '<div id="planBlockers" class="list"></div>';
const PLAN_DECISION_UI = String.raw`
<div id="planDecisionUi" class="requirement hidden" style="margin-top:12px">
  <strong>Execution-design decisions required</strong>
  <small style="display:block;color:#94a3b8;margin-top:4px">Talos will not invent subprocess boundaries or ambiguous relation behavior. Choose each material treatment explicitly, then rebuild the ExecutionPlan.</small>
  <div id="planDecisionChoices" class="list" style="margin-top:10px"></div>
  <div class="row" style="margin-top:10px"><button id="rebuildPlanDecisions" class="primary" disabled>Rebuild ExecutionPlan with decisions</button><span id="planDecisionState" class="pill warn">No execution-design authority inferred</span></div>
</div>`;

const PLAN_DECISION_SCRIPT = String.raw`<script>
(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var actorId='one-app-product-user';
  var decisions={subprocessResolutions:[],relationResolutions:[]};
  var actionableCount=0;

  function authority(kind,ref){return 'authority:talos-product:execution-design:'+kind+':'+ref+':'+Date.now()}
  function byId(id){return document.getElementById(id)}
  function upsert(list,key,value){
    var index=list.findIndex(function(item){return item[key]===value[key]});
    if(index>=0)list[index]=value;else list.push(value);
  }
  function remove(list,key,value){
    var index=list.findIndex(function(item){return item[key]===value});
    if(index>=0)list.splice(index,1);
  }
  function selectedCount(){return decisions.subprocessResolutions.length+decisions.relationResolutions.length}
  function updateReady(){
    var button=byId('rebuildPlanDecisions');
    var state=byId('planDecisionState');
    if(!button||!state)return;
    var ready=actionableCount>0&&selectedCount()===actionableCount;
    button.disabled=!ready;
    state.textContent=ready?'DECISIONS COMPLETE · REBUILD REQUIRED':selectedCount()+' / '+actionableCount+' explicit decisions recorded';
    state.className='pill '+(ready?'good':'warn');
  }
  function option(select,value,label){var item=document.createElement('option');item.value=value;item.textContent=label;select.appendChild(item)}
  function decisionRow(title,description,values,current,onChange){
    var row=document.createElement('div');row.className='item';
    var strong=document.createElement('strong');strong.textContent=title;
    var small=document.createElement('small');small.textContent=description;
    var select=document.createElement('select');select.style.marginTop='8px';option(select,'','Choose explicit treatment…');
    values.forEach(function(item){option(select,item[0],item[1])});
    select.value=current||'';
    select.addEventListener('change',function(){onChange(select.value);updateReady()});
    row.append(strong,small,select);return row;
  }
  function renderPlanDecisions(body){
    if(!body||!body.review||!body.execution)return;
    var panel=byId('planDecisionUi');var choices=byId('planDecisionChoices');var build=byId('buildPlan');
    if(!panel||!choices||!build)return;
    var unresolved=(body.execution.requirements||[]).filter(function(item){return item.resolutionState==='UNRESOLVED'});
    choices.innerHTML='';actionableCount=0;
    if(!unresolved.length){
      panel.classList.add('hidden');
      build.textContent='Build ExecutionPlan review';
      return;
    }
    panel.classList.remove('hidden');
    unresolved.forEach(function(requirement){
      var description=String(requirement.description||'Execution design remains unresolved.');
      var element=(body.execution.elements||[]).find(function(item){return item.id===requirement.targetRef});
      var relation=(body.execution.relations||[]).find(function(item){return item.id===requirement.targetRef});
      if(element&&/Subprocess business boundary/i.test(description)){
        var semanticSubjectRef=(element.semanticSubjectRefs||[])[0]||(requirement.evidenceRefs||[])[0];
        if(!semanticSubjectRef)return;
        actionableCount++;
        var existing=decisions.subprocessResolutions.find(function(item){return item.semanticSubjectRef===semanticSubjectRef});
        choices.appendChild(decisionRow(
          'Subprocess boundary · '+semanticSubjectRef,
          description,
          [['INLINE_COORDINATION','Inline coordination — keep it inside this workflow'],['SEPARATE_EXECUTION_BOUNDARY','Separate execution boundary — preserve it as its own execution boundary']],
          existing&&existing.boundaryKind,
          function(value){
            remove(decisions.subprocessResolutions,'semanticSubjectRef',semanticSubjectRef);
            if(value)upsert(decisions.subprocessResolutions,'semanticSubjectRef',{
              semanticSubjectRef:semanticSubjectRef,
              boundaryKind:value,
              authorityRef:authority('subprocess',semanticSubjectRef),
              decidedBy:actorId,
              rationale:'I explicitly choose this subprocess execution-boundary treatment for the reviewed ExecutionPlan.'
            });
          }
        ));
        return;
      }
      if(relation){
        var semanticRelationRef=(relation.semanticRelationRefs||[])[0]||(requirement.evidenceRefs||[])[0];
        if(!semanticRelationRef)return;
        actionableCount++;
        var existingRelation=decisions.relationResolutions.find(function(item){return item.semanticRelationRef===semanticRelationRef});
        choices.appendChild(decisionRow(
          'Ambiguous relation · '+semanticRelationRef,
          description,
          [['SEQUENCE','Sequence — continue directly'],['WAIT_RESUME','Wait / resume — preserve an explicit coordination boundary']],
          existingRelation&&existingRelation.executionRelationKind,
          function(value){
            remove(decisions.relationResolutions,'semanticRelationRef',semanticRelationRef);
            if(value)upsert(decisions.relationResolutions,'semanticRelationRef',{
              semanticRelationRef:semanticRelationRef,
              executionRelationKind:value,
              authorityRef:authority('relation',semanticRelationRef),
              decidedBy:actorId,
              rationale:'I explicitly choose this execution relation treatment for the reviewed ExecutionPlan.'
            });
          }
        ));
        return;
      }
      var blocked=document.createElement('div');blocked.className='item finding';
      var blockedTitle=document.createElement('strong');blockedTitle.textContent='Semantic correction required';
      var blockedText=document.createElement('small');blockedText.textContent=description+' This blocker has no safe execution-only decision and must be corrected upstream.';
      blocked.append(blockedTitle,blockedText);choices.appendChild(blocked);
    });
    build.disabled=false;
    build.textContent='Rebuild ExecutionPlan review';
    updateReady();
  }

  nativeFetch('/api/product/runtime-profile').then(function(response){return response.ok?response.json():null}).then(function(profile){if(profile&&profile.actorId)actorId=profile.actorId}).catch(function(){});

  window.fetch=function(input,init){
    var path=typeof input==='string'?input:(input&&input.url)||'';
    var options=init;
    var isPlan=path.indexOf('/api/automation/execution-plan/review')!==-1&&options&&String(options.method||'GET').toUpperCase()==='POST';
    if(isPlan&&options.body){
      try{
        var body=JSON.parse(String(options.body));
        body.decisions={
          subprocessResolutions:decisions.subprocessResolutions.slice(),
          relationResolutions:decisions.relationResolutions.slice()
        };
        options=Object.assign({},options,{body:JSON.stringify(body)});
      }catch(_){}
    }
    return nativeFetch(input,options).then(function(response){
      if(isPlan&&response.ok){
        response.clone().json().then(function(body){setTimeout(function(){renderPlanDecisions(body)},0)}).catch(function(){});
      }
      return response;
    });
  };

  var rebuild=byId('rebuildPlanDecisions');
  if(rebuild)rebuild.addEventListener('click',function(){
    if(rebuild.disabled)return;
    var build=byId('buildPlan');
    if(build){build.disabled=false;build.click()}
  });
})();
</script>`;

// R1-10 truthful blocked-source UX. A valid BPMN upload may still be preserved
// while Canonical reconciliation is blocked by an unsupported or ambiguous BPMN
// construct. That state is not an authority-order failure. The product exposes
// exact diagnostics and keeps the source XML editable without granting Canonical
// review/confirmation authority until a corrected revision reconciles.
const SOURCE_RECONCILIATION_GUARD_SCRIPT = String.raw`<script>
(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var blockedByRevision={};

  function byId(id){return document.getElementById(id)}
  function setText(id,value){var node=byId(id);if(node)node.textContent=value}
  function renderDiagnostics(box,diagnostics){
    if(!box)return;box.innerHTML='';
    if(!diagnostics||!diagnostics.length){var none=document.createElement('div');none.className='item';none.textContent='No diagnostic detail was returned.';box.appendChild(none);return}
    diagnostics.forEach(function(item){
      var row=document.createElement('div');row.className='item finding';
      var strong=document.createElement('strong');strong.textContent=item.code||'BPMN_RECONCILIATION_BLOCKED';
      var small=document.createElement('small');
      var location=item.bpmnElementId?(' · element '+item.bpmnElementId+(item.bpmnType?' ('+item.bpmnType+')':'')):'';
      small.textContent=(item.message||'Canonical reconciliation is blocked.')+location;
      row.append(strong,small);box.appendChild(row);
    });
  }
  function renderBlocked(body){
    var diagnostics=(body.reconciliation&&body.reconciliation.diagnostics)||[];
    var reviewCard=byId('reviewCard');if(reviewCard)reviewCard.classList.remove('closed');
    var sourceStep=byId('psource');if(sourceStep)sourceStep.className='pstep done';
    var reviewStep=byId('preview');if(reviewStep)reviewStep.className='pstep blocked';
    var badge=byId('reviewBadge');if(badge){badge.textContent='RECONCILIATION BLOCKED · SOURCE PRESERVED';badge.className='pill warn'}
    setText('reviewState','Canonical review has not been created. Correct the BPMN source and retry reconciliation.');
    setText('truthInferred','Blocked · no Canonical ProcessRevision created');
    setText('correctionState','Source correction available · no business authority exists');
    var editor=byId('bpmnEditor');if(editor&&body.revision&&body.revision.bpmnXml)editor.value=body.revision.bpmnXml;
    var save=byId('saveCorrection');if(save)save.disabled=false;
    var confirm=byId('confirmProcess');if(confirm)confirm.disabled=true;
    renderDiagnostics(byId('findings'),diagnostics);
    var questions=byId('questions');if(questions){questions.innerHTML='';var q=document.createElement('div');q.className='item question';q.textContent='Resolve the BPMN reconciliation diagnostic(s) before business confirmation.';questions.appendChild(q)}
    var nodes=byId('processNodes');if(nodes){nodes.innerHTML='';var n=document.createElement('div');n.className='item';n.textContent='No Canonical nodes admitted yet.';nodes.appendChild(n)}
    var sourceStatus=byId('sourceStatus');if(sourceStatus){sourceStatus.textContent='BPMN source preserved. Canonical reconciliation is blocked by '+diagnostics.length+' diagnostic(s). No business meaning or authority was created.';sourceStatus.className='status warn'}
  }
  function updateRuntimeCopy(profile){
    var node=byId('runtimeLimit');if(!node||!profile)return;
    if(profile.runtimeMode==='DESIGN_ONLY'){
      node.textContent='Design mode: execution is disabled. Human UPDATE/SIGNAL runtime is implemented and becomes available when TEMPORAL_EXECUTION is configured.';
      node.className='status warn';return;
    }
    if(profile.humanRuntimeAvailable){
      node.textContent='Temporal execution and governed human UPDATE/SIGNAL runtime are enabled.';
      node.className='status good';return;
    }
    node.textContent='Temporal execution is configured, but human runtime control is unavailable in this launcher.';
    node.className='status warn';
  }

  window.fetch=function(input,init){
    var path=typeof input==='string'?input:(input&&input.url)||'';
    var method=String((init&&init.method)||'GET').toUpperCase();
    var isNativeImport=path.indexOf('/api/input/bpmn')!==-1&&method==='POST';
    var isReview=path.indexOf('/api/process-review')!==-1&&method==='GET';
    var isRuntimeProfile=path.indexOf('/api/product/runtime-profile')!==-1&&method==='GET';
    var isEdit=path.indexOf('/api/bpmn/edit')!==-1&&method==='POST';

    if(isReview){
      try{
        var url=new URL(path,window.location.href);
        var revisionId=url.searchParams.get('revisionId');
        var blocked=revisionId&&blockedByRevision[revisionId];
        if(blocked){
          setTimeout(function(){renderBlocked(blocked)},0);
          var diagnostics=(blocked.reconciliation&&blocked.reconciliation.diagnostics)||[];
          return Promise.resolve(new Response(JSON.stringify({
            error:'BPMN source was preserved, but Canonical reconciliation is blocked. Review the diagnostics and correct the BPMN source.',
            code:'R1_BPMN_RECONCILIATION_BLOCKED',
            sourcePreserved:true,
            revisionId:revisionId,
            diagnostics:diagnostics
          }),{status:409,headers:{'content-type':'application/json'}}));
        }
      }catch(_){}
    }

    return nativeFetch(input,init).then(function(response){
      if(isNativeImport&&response.ok){
        return response.clone().json().then(function(body){
          if(body&&body.reconciliation&&body.reconciliation.status==='BLOCKED'&&body.revision&&body.revision.id){
            blockedByRevision[body.revision.id]=body;
          }
          return response;
        }).catch(function(){return response});
      }
      if(isRuntimeProfile&&response.ok){
        response.clone().json().then(function(profile){setTimeout(function(){updateRuntimeCopy(profile)},0)}).catch(function(){});
      }
      if(isEdit&&response.ok){
        response.clone().json().then(function(body){
          if(body&&body.status==='CORRECTION_BLOCKED'&&body.hasActiveCanonicalReview===false){
            var attempted=body.attemptedRevision;
            var blocked={revision:attempted,reconciliation:body.reconciliation};
            setTimeout(function(){renderBlocked(blocked)},0);
          }
        }).catch(function(){});
      }
      return response;
    });
  };

  nativeFetch('/api/product/runtime-profile').then(function(response){return response.ok?response.json():null}).then(function(profile){setTimeout(function(){updateRuntimeCopy(profile)},0)}).catch(function(){});
})();
</script>`;

const withPlanDecisionUi = ONE_APP_PRODUCT_JOURNEY_PAGE.replace(
  PLAN_BLOCKER_MARKER,
  `${PLAN_BLOCKER_MARKER}${PLAN_DECISION_UI}`,
);

export const ONE_APP_PRODUCT_PAGE = withPlanDecisionUi.replace(
  '</body>',
  `${PLAN_DECISION_SCRIPT}${SOURCE_RECONCILIATION_GUARD_SCRIPT}${R1_02_TRUTH_FOOTER}</body>`,
);