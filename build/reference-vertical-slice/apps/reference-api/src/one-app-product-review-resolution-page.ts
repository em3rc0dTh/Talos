export const ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT = String.raw`
(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var latestReview=null;

  function byId(id){return document.getElementById(id)}
  function text(value){return typeof value==='string'?value:''}
  function responseWithJson(response,body,status){
    var headers=new Headers(response.headers);
    headers.set('content-type','application/json; charset=utf-8');
    return new Response(JSON.stringify(body),{status:status||response.status,statusText:response.statusText,headers:headers});
  }
  function findNode(process,id){return (process.nodes||[]).find(function(node){return node.id===id})}
  function projectedBpmnNodeId(node){
    var explicit=node&&node.details?text(node.details.bpmnElementId):'';
    if(explicit)return explicit;
    var canonicalId=node?text(node.id):'';
    return canonicalId?'Node_'+canonicalId:'';
  }
  function ensurePanel(){
    var panel=byId('branchConditionResolution');
    if(panel)return panel;
    var findings=byId('findings');
    if(!findings)return null;
    panel=document.createElement('div');
    panel.id='branchConditionResolution';
    panel.className='requirement hidden';
    panel.style.marginTop='12px';
    findings.insertAdjacentElement('afterend',panel);
    return panel;
  }
  function setConfirmationBlocked(count){
    var confirm=byId('confirmProcess');
    var state=byId('confirmationState');
    if(!confirm||!state)return;
    if(count>0){
      confirm.disabled=true;
      state.textContent='Resolve '+count+' branch condition'+(count===1?'':'s')+' first';
      state.className='pill warn';
    }
  }
  function render(review){
    latestReview=review;
    var panel=ensurePanel();
    if(!panel||!review||!review.reconciliation)return;
    var validation=review.reconciliation.validation||{};
    var process=review.reconciliation.processRevision||{};
    var findings=(validation.findings||[]).filter(function(item){return item&&item.code==='SV-CFL-001'});
    panel.innerHTML='';
    if(!findings.length){panel.classList.add('hidden');return}
    panel.classList.remove('hidden');
    setConfirmationBlocked(findings.length);

    var title=document.createElement('strong');
    title.textContent='Branch conditions require business meaning';
    var intro=document.createElement('small');
    intro.style.display='block';intro.style.marginTop='4px';
    intro.textContent='Talos will not invent decision logic. Confirm or replace each source branch label, then Talos will update the BPMN correction internally before business confirmation.';
    panel.append(title,intro);

    var list=document.createElement('div');list.className='list';list.style.marginTop='10px';
    var rows=[];
    findings.forEach(function(finding,index){
      var edge=(process.edges||[]).find(function(candidate){return (finding.targetRefs||[]).indexOf(candidate.id)>=0});
      if(!edge)return;
      var source=findNode(process,edge.sourceNodeId)||{};
      var target=findNode(process,edge.targetNodeId)||{};
      var row=document.createElement('div');row.className='item question';
      var heading=document.createElement('strong');heading.textContent=(source.name||'Decision')+' → '+(target.name||'Branch '+(index+1));
      var sourceText=document.createElement('small');sourceText.textContent=edge.label?'Source branch label: '+edge.label:'No confirmed branch label is available; business owner input is required.';
      var input=document.createElement('input');input.style.marginTop='8px';input.value=text(edge.label);input.placeholder='Exact business condition for this branch';
      row.append(heading,sourceText,input);list.appendChild(row);
      rows.push({edge:edge,source:source,target:target,input:input});
    });
    panel.appendChild(list);

    var actions=document.createElement('div');actions.className='row';actions.style.marginTop='10px';
    var apply=document.createElement('button');apply.className='primary';apply.textContent='Apply branch conditions';
    var state=document.createElement('span');state.className='pill warn';state.textContent='No correction created automatically';
    actions.append(apply,state);panel.appendChild(actions);

    function ready(){return rows.length===findings.length&&rows.every(function(row){return row.input.value.trim().length>0})}
    function sync(){apply.disabled=!ready()}
    rows.forEach(function(row){row.input.addEventListener('input',sync)});sync();

    apply.addEventListener('click',function(){
      if(!ready())return;
      var editor=byId('bpmnEditor');
      if(!editor)return;
      var parser=new DOMParser();
      var doc=parser.parseFromString(editor.value,'application/xml');
      if(doc.querySelector('parsererror')){state.textContent='Talos could not prepare the internal BPMN correction';state.className='pill bad';return}
      var xsi='http://www.w3.org/2001/XMLSchema-instance';
      var xmlns='http://www.w3.org/2000/xmlns/';
      if(!doc.documentElement.getAttributeNS(xmlns,'xsi'))doc.documentElement.setAttributeNS(xmlns,'xmlns:xsi',xsi);
      var changed=0;
      rows.forEach(function(row){
        var sourceId=projectedBpmnNodeId(row.source);
        var targetId=projectedBpmnNodeId(row.target);
        if(!sourceId||!targetId)return;
        var flows=Array.prototype.filter.call(doc.getElementsByTagNameNS('*','sequenceFlow'),function(flow){return flow.getAttribute('sourceRef')===sourceId&&flow.getAttribute('targetRef')===targetId});
        if(flows.length!==1)return;
        var flow=flows[0];
        Array.prototype.slice.call(flow.getElementsByTagNameNS('*','conditionExpression')).forEach(function(node){if(node.parentNode===flow)flow.removeChild(node)});
        var prefix=flow.prefix||doc.documentElement.prefix||'bpmn';
        var ns=flow.namespaceURI||'http://www.omg.org/spec/BPMN/20100524/MODEL';
        if(!doc.documentElement.lookupNamespaceURI(prefix))doc.documentElement.setAttributeNS(xmlns,'xmlns:'+prefix,ns);
        var condition=doc.createElementNS(ns,prefix+':conditionExpression');
        condition.setAttributeNS(xsi,'xsi:type',prefix+':tFormalExpression');
        condition.setAttribute('language','urn:talos:natural-language-condition');
        condition.textContent=row.input.value.trim();
        flow.appendChild(condition);changed++;
      });
      if(changed!==rows.length){state.textContent='Talos could not match one or more branches uniquely; no partial correction was applied';state.className='pill bad';return}
      editor.value=new XMLSerializer().serializeToString(doc);
      editor.dispatchEvent(new Event('input',{bubbles:true}));
      state.textContent='Prepared · Save correction to create the new immutable review';state.className='pill good';
    });
  }

  window.fetch=function(input,init){
    var path=typeof input==='string'?input:(input&&input.url)||'';
    var method=String((init&&init.method)||'GET').toUpperCase();
    var isReview=path.indexOf('/api/process-review')!==-1&&method==='GET';
    var isDesign=path.indexOf('/api/bpmn/automation-design-approval')!==-1&&method==='POST';
    return nativeFetch(input,init).then(function(response){
      if(isReview&&response.ok){
        response.clone().json().then(function(body){setTimeout(function(){render(body)},0)}).catch(function(){});
      }
      if(isDesign&&response.ok){
        return response.clone().json().then(function(body){
          if(body&&body.automationDesignOpened===false){
            var result=body.handoff&&body.handoff.result?String(body.handoff.result):'SEMANTIC_READINESS_BLOCKED';
            var diagnostics=(body.handoff&&body.handoff.diagnosticRefs)||[];
            var message='Automation Design remains blocked because the confirmed process is not ready for automation design ('+result+'). Resolve the Review findings and reconfirm the corrected revision.';
            var designState=byId('designState');if(designState){designState.textContent=message;designState.className='pill warn'}
            return responseWithJson(response,{error:message,code:'R1_AUTOMATION_DESIGN_SEMANTIC_BLOCK',diagnosticRefs:diagnostics,backendResult:body},409);
          }
          return response;
        }).catch(function(){return response});
      }
      return response;
    });
  };
})();

(function(){
  'use strict';
  var scheduled=false;
  function byId(id){return document.getElementById(id)}
  function button(label){var b=document.createElement('button');b.type='button';b.textContent=label;return b}
  function countChildren(node){return node?node.children.length:0}
  function toggleTarget(control,target,openLabel,closedLabel){
    var open=target.dataset.talosOpen==='true';
    target.dataset.talosOpen=open?'false':'true';
    target.style.display=open?'none':'';
    control.textContent=open?closedLabel:openLabel;
  }
  function disclosureForList(id,label){
    var target=byId(id);if(!target||target.dataset.talosDisclosure==='true')return;
    target.dataset.talosDisclosure='true';target.dataset.talosOpen='false';target.style.display='none';
    var heading=target.previousElementSibling;
    var control=button('Show '+label+' ('+countChildren(target)+')');control.style.margin='6px 0 8px';
    if(heading)heading.insertAdjacentElement('afterend',control);else target.insertAdjacentElement('beforebegin',control);
    function refresh(){
      var n=countChildren(target);var open=target.dataset.talosOpen==='true';
      control.textContent=(open?'Hide ':'Show ')+label+' ('+n+')';
      control.disabled=n===0;
    }
    control.addEventListener('click',function(){toggleTarget(control,target,'Hide '+label+' ('+countChildren(target)+')','Show '+label+' ('+countChildren(target)+')')});
    new MutationObserver(refresh).observe(target,{childList:true,subtree:false});refresh();
  }
  function disclosureForField(controlId,label){
    var controlNode=byId(controlId);if(!controlNode)return;
    var field=controlNode.closest?controlNode.closest('.field'):controlNode.parentElement;
    if(!field||field.dataset.talosDisclosure==='true')return;
    field.dataset.talosDisclosure='true';field.dataset.talosOpen='false';field.style.display='none';
    var toggle=button('Show '+label);toggle.style.margin='10px 0';field.insertAdjacentElement('beforebegin',toggle);
    toggle.addEventListener('click',function(){toggleTarget(toggle,field,'Hide '+label,'Show '+label)});
  }
  function disclosureForEvidence(id,label){
    var target=byId(id);if(!target||target.dataset.talosDisclosure==='true')return;
    target.dataset.talosDisclosure='true';target.dataset.talosOpen='false';target.style.display='none';
    var toggle=button('Show '+label);toggle.style.margin='8px 0';target.insertAdjacentElement('beforebegin',toggle);
    toggle.addEventListener('click',function(){toggleTarget(toggle,target,'Hide '+label,'Show '+label)});
  }
  function compactProcessNodes(){
    var nodes=byId('processNodes');if(!nodes||nodes.dataset.talosCompact==='true')return;
    nodes.dataset.talosCompact='true';nodes.style.maxHeight='290px';nodes.style.overflow='auto';nodes.style.paddingRight='3px';
  }
  function compactRequirementCards(){
    var host=byId('requirements');if(!host)return;
    Array.prototype.forEach.call(host.children,function(card,index){
      if(!card.classList.contains('requirement')||card.dataset.talosCompact==='true')return;
      card.dataset.talosCompact='true';card.dataset.talosOpen='false';
      var toggle=button('Review technical details');toggle.className='talos-requirement-toggle';toggle.style.marginTop='8px';
      var keep=[];if(card.children[0])keep.push(card.children[0]);if(card.children[1])keep.push(card.children[1]);keep.push(toggle);
      card.appendChild(toggle);
      function apply(){
        var open=card.dataset.talosOpen==='true';
        Array.prototype.forEach.call(card.children,function(child){
          if(keep.indexOf(child)>=0)return;
          child.style.display=open?'':'none';
        });
        toggle.textContent=open?'Hide technical details':'Review technical details';
      }
      toggle.addEventListener('click',function(){card.dataset.talosOpen=card.dataset.talosOpen==='true'?'false':'true';apply()});
      new MutationObserver(apply).observe(card,{childList:true});apply();
    });
  }
  function install(){
    scheduled=false;
    disclosureForList('questions','review questions');
    disclosureForList('findings','validation findings');
    disclosureForField('bpmnEditor','advanced BPMN/XML');
    disclosureForEvidence('evidenceTrace','evidence trace');
    disclosureForEvidence('executionEvidence','runtime evidence');
    compactProcessNodes();
    compactRequirementCards();
  }
  function schedule(){if(scheduled)return;scheduled=true;setTimeout(install,0)}
  if(document.body)new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  schedule();
})();
`;
