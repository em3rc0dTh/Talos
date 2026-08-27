export const ONE_APP_PRODUCT_CAPABILITY_SELECTION_ENHANCEMENT = String.raw`
(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var nodeById={};
  var actorById={};
  var suggestionFamilyByDecision={};
  var observerScheduled=false;

  var FAMILY_OPTIONS=[
    ['SOURCE_DEFINED','Choose execution family…'],
    ['HUMAN_INTERACTION','Human / manual work'],
    ['SYSTEM_OPERATION','System operation'],
    ['DATA_COLLECTION','Data collection'],
    ['COMMUNICATION','Communication'],
    ['DOCUMENT_FILE','Document / file'],
    ['STORAGE','Storage / database'],
    ['EXTERNAL_WORKFLOW_INVOCATION','External workflow'],
    ['AI_TASK','AI task'],
    ['CUSTOM_INTEGRATION','Custom integration']
  ];
  var IMPLEMENTATION_OPTIONS=[
    ['SOURCE_DEFINED','Choose implementation kind…'],
    ['INTERNAL_SERVICE','Internal service'],
    ['DIRECT_API','Direct API'],
    ['MCP_TOOL','MCP tool'],
    ['N8N_WORKFLOW','n8n workflow'],
    ['AI_SERVICE','AI service'],
    ['DATABASE_ADAPTER','Database adapter'],
    ['WEBHOOK_ENDPOINT','Webhook endpoint'],
    ['HUMAN_SERVICE','Human service']
  ];
  var INTERACTION_OPTIONS=['MANUAL_ACTION','REVIEW','APPROVAL','DECISION','DATA_ENTRY','CORRECTION','CHOICE','ACKNOWLEDGEMENT','SIGNATURE','UPLOAD_PROVISION','OBSERVATION','SOURCE_DEFINED'];
  var RESPONSIBILITY_OPTIONS=['PERFORMER','APPROVER','REVIEWER','DECISION_AUTHORITY','DATA_PROVIDER','SIGNER','OBSERVER','SOURCE_DEFINED'];

  function byId(id){return document.getElementById(id)}
  function grids(){return Array.prototype.slice.call(document.querySelectorAll('#requirements .custom-grid[data-choice]'))}
  function option(select,value,label){var o=document.createElement('option');o.value=value;o.textContent=label;select.appendChild(o)}
  function replaceOptions(select,items){var current=select.value;select.innerHTML='';items.forEach(function(item){option(select,item[0],item[1])});if(items.some(function(item){return item[0]===current}))select.value=current}
  function field(grid,control,label,help){
    if(control.parentElement&&control.parentElement.classList.contains('talos-capability-field'))return control.parentElement;
    var wrap=document.createElement('div');wrap.className='field talos-capability-field';
    var l=document.createElement('label');l.textContent=label;
    wrap.appendChild(l);
    grid.insertBefore(wrap,control);wrap.appendChild(control);
    control.setAttribute('aria-label',label);
    if(help){var s=document.createElement('small');s.style.color='#94a3b8';s.textContent=help;wrap.appendChild(s)}
    return wrap;
  }
  function nodeForGrid(grid){var req=grid._talos&&grid._talos.req;var ref=req&&req.semanticSubjectRefs&&req.semanticSubjectRefs[0];return ref?nodeById[ref]:undefined}
  function rolesForGrid(grid){var node=nodeForGrid(grid);return node&&Array.isArray(node.actorRefs)?node.actorRefs.slice():[]}
  function humanPanel(grid){
    if(grid._talosHuman)return grid._talosHuman;
    var req=grid._talos&&grid._talos.req;
    var host=grid.parentElement;
    var panel=document.createElement('div');panel.className='requirement';panel.style.marginTop='10px';panel.dataset.humanDesign=req&&req.capabilityRequirementRef||'';
    var title=document.createElement('strong');title.textContent='Human coordination contract';
    var intro=document.createElement('small');intro.style.display='block';intro.style.marginTop='4px';intro.style.color='#94a3b8';intro.textContent='Choosing human/manual work is an explicit execution-design decision. Review the participant and accepted outcome before binding.';
    var g=document.createElement('div');g.className='custom-grid';g.style.marginTop='8px';
    var interaction=document.createElement('select');INTERACTION_OPTIONS.forEach(function(v){option(interaction,v,v.replaceAll('_',' '))});interaction.value='MANUAL_ACTION';
    var responsibility=document.createElement('select');RESPONSIBILITY_OPTIONS.forEach(function(v){option(responsibility,v,v.replaceAll('_',' '))});responsibility.value='PERFORMER';
    var outcomeCode=document.createElement('input');outcomeCode.value='COMPLETED';outcomeCode.placeholder='Outcome code';
    var outcomeMeaning=document.createElement('input');outcomeMeaning.value='Human work completed';outcomeMeaning.placeholder='Business meaning';
    g.append(interaction,responsibility,outcomeCode,outcomeMeaning);
    field(g,interaction,'Interaction kind','How Talos waits for the human work.');
    field(g,responsibility,'Responsibility','The participant responsibility for this step.');
    field(g,outcomeCode,'Accepted outcome code','A durable business outcome code.');
    field(g,outcomeMeaning,'Outcome business meaning','What completion means for this human step.');
    var role=document.createElement('div');role.className='status';role.style.marginTop='8px';
    panel.append(title,intro,g,role);host.appendChild(panel);
    grid._talosHuman={panel:panel,interaction:interaction,responsibility:responsibility,outcomeCode:outcomeCode,outcomeMeaning:outcomeMeaning,role:role};
    [interaction,responsibility,outcomeCode,outcomeMeaning].forEach(function(c){c.addEventListener('input',scheduleSync);c.addEventListener('change',scheduleSync)});
    return grid._talosHuman;
  }
  function describeRoles(grid){
    var h=humanPanel(grid);var refs=rolesForGrid(grid);
    if(!refs.length){h.role.textContent='Human/manual work is blocked: the reviewed business step has no participant/actor reference. Correct responsibility in Review or choose another execution family.';h.role.className='status bad';return false}
    var names=refs.map(function(ref){return actorById[ref]&&actorById[ref].name?actorById[ref].name:ref});
    h.role.textContent='Participant authority from reviewed source: '+names.join(', ');h.role.className='status good';return true;
  }
  function setHumanMode(grid,human){
    var c=grid._talos;if(!c)return;
    var h=humanPanel(grid);h.panel.classList.toggle('hidden',!human);
    if(human){
      if(!c.name.value.trim()||c.name.dataset.talosHumanAuto==='true'){c.name.value='Talos Human Coordination';c.name.dataset.talosHumanAuto='true'}
      c.kind.value='HUMAN_SERVICE';c.kind.disabled=true;
      if(!c.ref.value.trim()||c.ref.dataset.talosHumanAuto==='true'){c.ref.value='TALOS_HUMAN_COORDINATION_V1';c.ref.dataset.talosHumanAuto='true'}
      c.name.readOnly=true;c.ref.readOnly=true;describeRoles(grid);
    }else{
      h.panel.classList.add('hidden');
      c.kind.disabled=false;c.name.readOnly=false;c.ref.readOnly=false;
      if(c.name.dataset.talosHumanAuto==='true'){c.name.value='';delete c.name.dataset.talosHumanAuto}
      if(c.ref.dataset.talosHumanAuto==='true'){c.ref.value='';delete c.ref.dataset.talosHumanAuto}
      if(c.kind.value==='HUMAN_SERVICE')c.kind.value='SOURCE_DEFINED';
    }
  }
  function decorate(grid,index){
    if(!grid._talos)return;
    var c=grid._talos;
    if(!grid.dataset.talosCapabilityEnhanced){
      grid.dataset.talosCapabilityEnhanced='true';
      replaceOptions(c.family,FAMILY_OPTIONS);replaceOptions(c.kind,IMPLEMENTATION_OPTIONS);
      c.name.placeholder='e.g. Car-wash payment service';
      c.ref.placeholder='e.g. service:payment-v1 (never a secret)';
      field(grid,c.family,'Execution family','Choose who or what performs this business work. SOURCE_DEFINED means unresolved.');
      field(grid,c.name,'Offering name','A human-readable name for the selected capability.');
      field(grid,c.kind,'Implementation kind','How the selected capability is implemented.');
      field(grid,c.ref,'Implementation reference','Stable adapter/service/workflow reference. Do not enter credentials or secrets.');
      [c.family,c.name,c.kind,c.ref].forEach(function(control){control.addEventListener('input',scheduleSync);control.addEventListener('change',scheduleSync)});
      var reqCard=grid.parentElement;var title=reqCard&&reqCard.querySelector('strong');var node=nodeForGrid(grid);
      if(title&&node)title.textContent='Requirement '+(index+1)+' · '+(node.name||node.kind||'Business work');
      var evidence=document.createElement('small');evidence.style.display='block';evidence.style.marginTop='4px';evidence.style.color='#94a3b8';evidence.textContent='Canonical evidence: '+((c.req.semanticSubjectRefs||[]).join(', ')||'—');
      grid.insertAdjacentElement('beforebegin',evidence);
      var readiness=document.createElement('div');readiness.className='status warn';readiness.style.marginTop='9px';readiness.dataset.capabilityReadiness=c.req.capabilityRequirementRef;grid.insertAdjacentElement('afterend',readiness);grid._talosReadiness=readiness;
    }
    setHumanMode(grid,c.family.value==='HUMAN_INTERACTION');
  }
  function acceptedFamily(grid){
    var c=grid._talos;if(!c||!c.acceptedDecision)return undefined;
    return suggestionFamilyByDecision[c.acceptedDecision]||c.family.value;
  }
  function humanReady(grid){
    var h=humanPanel(grid);return describeRoles(grid)&&h.interaction.value!=='SOURCE_DEFINED'&&h.responsibility.value!=='SOURCE_DEFINED'&&h.outcomeCode.value.trim().length>0&&h.outcomeMeaning.value.trim().length>0;
  }
  function stateFor(grid){
    var c=grid._talos;if(!c)return{ready:false,message:'Capability controls are not ready.'};
    var selectedFamily=acceptedFamily(grid)||c.family.value;
    if(c.acceptedDecision){
      if(selectedFamily==='HUMAN_INTERACTION'&&!humanReady(grid))return{ready:false,message:'Accepted human direction still needs a complete human coordination contract.'};
      return{ready:true,message:'Ready · accepted Talos suggestion will be bound explicitly.'};
    }
    if(c.family.value==='SOURCE_DEFINED')return{ready:false,message:'Choose an execution family. Talos will not infer human/system/integration meaning from the action label.'};
    if(c.kind.value==='SOURCE_DEFINED')return{ready:false,message:'Choose an implementation kind.'};
    if(!c.name.value.trim())return{ready:false,message:'Enter the offering name.'};
    if(!c.ref.value.trim())return{ready:false,message:'Enter a stable implementation reference (not a secret).'};
    if(c.family.value==='HUMAN_INTERACTION'&&!humanReady(grid))return{ready:false,message:'Complete the human coordination contract.'};
    return{ready:true,message:'Ready · explicit offering is complete and still requires the Bind decision.'};
  }
  function sync(){
    observerScheduled=false;var list=grids();if(!list.length)return;
    list.forEach(decorate);var incomplete=0;
    list.forEach(function(grid){var s=stateFor(grid);if(!s.ready)incomplete++;var r=grid._talosReadiness;if(r){r.textContent=s.message;r.className='status '+(s.ready?'good':'warn')}});
    var button=byId('bindCapabilities');var actions=byId('selectionActions');
    if(button){button.disabled=incomplete>0;button.textContent=incomplete>0?'Resolve '+incomplete+' capability requirement'+(incomplete===1?'':'s')+' first':'Bind '+list.length+' explicit capability selection'+(list.length===1?'':'s')}
    if(actions){var pill=actions.querySelector('.pill');if(pill){pill.textContent=incomplete>0?incomplete+' unresolved · binding remains closed':'All capability decisions complete · binding still requires your click';pill.className='pill '+(incomplete>0?'warn':'good')}}
  }
  function scheduleSync(){if(observerScheduled)return;observerScheduled=true;setTimeout(sync,0)}
  function captureReview(body){
    var process=body&&body.reconciliation&&body.reconciliation.processRevision;if(!process)return;
    nodeById={};actorById={};(process.nodes||[]).forEach(function(node){nodeById[node.id]=node});(process.actors||[]).forEach(function(actor){actorById[actor.id]=actor});scheduleSync();
  }
  function captureSuggestion(body){
    if(!body)return;var suggestions={};(body.suggestions||[]).forEach(function(s){suggestions[s.id]=s});
    (body.decisions||[]).forEach(function(d){var s=suggestions[d.suggestionRef];if(s)suggestionFamilyByDecision[d.id]=s.family});scheduleSync();
  }
  function humanContract(grid){
    var h=humanPanel(grid);return{interactionKind:h.interaction.value,responsibilityKind:h.responsibility.value,roleRefs:rolesForGrid(grid),assignmentCardinality:'EXACTLY_ONE',outcomes:[{code:h.outcomeCode.value.trim(),businessMeaning:h.outcomeMeaning.value.trim(),terminal:true}]};
  }
  function gridForRequirement(ref){return grids().find(function(grid){return grid.dataset.choice===ref})}

  window.fetch=function(input,init){
    var path=typeof input==='string'?input:(input&&input.url)||'';
    var method=String((init&&init.method)||'GET').toUpperCase();
    var isReview=path.indexOf('/api/process-review')!==-1&&method==='GET';
    var isSuggestion=path.indexOf('/api/automation/suggestion/decide')!==-1&&method==='POST';
    var isSelection=path.indexOf('/api/automation/capability/select')!==-1&&method==='POST';
    var options=init;
    if(isSelection&&init&&init.body){
      try{
        var request=JSON.parse(String(init.body));
        (request.selections||[]).forEach(function(selection){
          var grid=gridForRequirement(selection.requirementRef);if(!grid)return;
          var family=selection.source==='SUGGESTION_DECISION'?(suggestionFamilyByDecision[selection.suggestionDecisionRef]||grid._talos.family.value):selection.family;
          if(family==='HUMAN_INTERACTION')selection.human=humanContract(grid);
        });
        options=Object.assign({},init,{body:JSON.stringify(request)});
      }catch(_){}
    }
    return nativeFetch(input,options).then(function(response){
      if(isReview&&response.ok)response.clone().json().then(function(body){captureReview(body)}).catch(function(){});
      if(isSuggestion&&response.ok)response.clone().json().then(function(body){captureSuggestion(body)}).catch(function(){});
      return response;
    });
  };

  var target=byId('requirements');
  if(target){new MutationObserver(scheduleSync).observe(target,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});target.addEventListener('input',scheduleSync,true);target.addEventListener('change',scheduleSync,true);target.addEventListener('click',scheduleSync,true)}
  scheduleSync();
})();
`;
