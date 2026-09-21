import test from 'node:test';
import assert from 'node:assert/strict';
import { approveGenericDeploymentAttempt } from '../packages/deployment/src/generic-deployment-attempt.ts';

function realizedDeployment(options:{requiresActivity:boolean;withActivityBinding?:boolean}){
  const activityBinding=options.withActivityBinding===false?[]:[{id:'deployment:activity-binding'}];
  return {
    revision:{id:'deployment:human-only-realized'},
    assessment:{readiness:'READY_FOR_DEPLOYMENT_ATTEMPT'},
    namespaceResolution:{resolutionState:'RESOLVED'},
    namingIntent:{bindingState:'REALIZED'},
    environmentRealizations:[{id:'deployment:environment-realization'}],
    taskQueueBindings:[{id:'deployment:task-queue'}],
    workflowTypeBindings:[{id:'deployment:workflow-binding'}],
    activityTypeBindings:options.requiresActivity?activityBinding:[],
    workerArtifactBindings:[{id:'deployment:worker-artifact'}],
    requirements:[
      {
        id:'deployment:type-registration',
        requirementKind:'TYPE_REGISTRATION',
        state:'RESOLVED',
        subjectRefs:options.requiresActivity
          ? ['deployment:workflow-binding','deployment:activity-binding']
          : ['deployment:workflow-binding'],
      },
    ],
    attempts:[],
  } as any;
}

test('I9-06B human-only realized deployment can approve one attempt without fabricating an ActivityTypeBinding',()=>{
  const deployment=realizedDeployment({requiresActivity:false});
  const approval=approveGenericDeploymentAttempt(deployment,{
    authorityRef:'authority:i9-06b-human-only',
    approvedBy:'i9-06b-owner',
    rationale:'Authorize exactly one deployment attempt for a realized human-only Temporal workflow.',
    approvedAt:'2026-09-21T21:55:00.000Z',
  });
  assert.equal(approval.deploymentRevisionRef,deployment.revision.id);
  assert.equal(approval.authorizedAttemptCount,1);
  assert.equal(approval.createsDeploymentAttemptAuthority,true);
  assert.equal(approval.createsExecutionAuthority,false);
});

test('I9-06B still requires ActivityTypeBindings when realized type registration contains Activity mappings',()=>{
  const deployment=realizedDeployment({requiresActivity:true,withActivityBinding:false});
  assert.throws(
    ()=>approveGenericDeploymentAttempt(deployment,{
      authorityRef:'authority:i9-06b-activity',
      approvedBy:'i9-06b-owner',
      rationale:'This malformed realized Activity deployment must remain blocked.',
      approvedAt:'2026-09-21T21:55:00.000Z',
    }),
    /Task Queue, Workflow, Activity and Worker artifact bindings/,
  );
});
