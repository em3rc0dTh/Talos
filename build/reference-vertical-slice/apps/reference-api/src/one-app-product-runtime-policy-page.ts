// R1-11 field-trial hardening.
//
// RuntimePolicy Activity decisions belong only to Temporal ACTIVITY mapping
// units. Human and wait coordination are Workflow-native constructs and must
// never receive Activity retry/timeout/idempotency policy merely because they
// also have capability-use identity.
//
// Keep this presentation guard generic: it derives the exact Activity set from
// the approved Temporal mapping returned by the authority engine. No process
// names, domain labels or fixture identities participate in the decision.
export const ONE_APP_PRODUCT_RUNTIME_POLICY_ACTIVITY_BOUNDARY_ENHANCEMENT = String.raw`
(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var activityUseRefs=[];

  function byId(id){return document.getElementById(id)}
  function unique(values){return Array.from(new Set(values))}
  function activityRefsFromMapping(body){
    var mapping=body&&body.mapping;
    var units=mapping&&Array.isArray(mapping.units)?mapping.units:[];
    return unique(units.filter(function(unit){return unit&&unit.constructKind==='ACTIVITY'}).flatMap(function(unit){
      return Array.isArray(unit.executionSubjectRefs)?unit.executionSubjectRefs:[];
    }).filter(function(ref){return typeof ref==='string'&&ref.length>0}));
  }
  function renderTruthfulPreview(){
    var node=byId('runtimePolicyPreview');
    if(!node)return;
    node.className='status warn';
    if(activityUseRefs.length===0){
      node.textContent='No Temporal Activity policies are required for this execution design. Human/wait coordination remains Workflow-native and is governed by the accepted Temporal mapping. Workflow maximum attempts: 1. Nothing is recorded until you accept.';
      return;
    }
    node.textContent='Proposed visible policy for '+activityUseRefs.length+' Temporal Activity use(s): max 3 Activity attempts, 15s start-to-close, 45s schedule-to-close, deterministic idempotency key. Human/wait coordination does not receive Activity retry/timeout/idempotency policy. Workflow maximum attempts: 1. Nothing is recorded until you accept.';
  }
  function exactActivityPolicies(raw){
    var supplied=Array.isArray(raw)?raw:[];
    var byRef=new Map();
    supplied.forEach(function(item){
      if(item&&typeof item.capabilityUseOccurrenceRef==='string')byRef.set(item.capabilityUseOccurrenceRef,item);
    });
    return activityUseRefs.map(function(ref){
      var policy=byRef.get(ref);
      if(!policy)throw new Error('TALOS_RUNTIME_POLICY_ACTIVITY_RESOLUTION_MISSING: '+ref);
      return policy;
    });
  }

  window.fetch=function(input,init){
    var path=typeof input==='string'?input:(input&&input.url)||'';
    var method=String((init&&init.method)||'GET').toUpperCase();
    var isMapping=path.indexOf('/api/automation/temporal-mapping')!==-1&&method==='POST';
    var isRuntimePolicy=path.indexOf('/api/automation/runtime-policy')!==-1&&method==='POST';
    var options=init;

    if(isRuntimePolicy&&options&&options.body){
      try{
        var body=JSON.parse(String(options.body));
        body.activities=exactActivityPolicies(body.activities);
        options=Object.assign({},options,{body:JSON.stringify(body)});
      }catch(error){
        return Promise.reject(error);
      }
    }

    return nativeFetch(input,options).then(function(response){
      if(isMapping&&response.ok){
        response.clone().json().then(function(body){
          activityUseRefs=activityRefsFromMapping(body);
          setTimeout(renderTruthfulPreview,0);
        }).catch(function(){});
      }
      return response;
    });
  };
})();
`;
