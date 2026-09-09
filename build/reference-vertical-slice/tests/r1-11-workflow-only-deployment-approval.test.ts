import test from 'node:test';
import assert from 'node:assert/strict';
import { approveGenericDeploymentAttempt } from '../packages/deployment/src/generic-deployment-attempt.ts';

function realizedDeployment(activityTypeBindings: any[], supportedActivityTypeBindingRefs: string[]) {
  return {
    assessment: { readiness: 'READY_FOR_DEPLOYMENT_ATTEMPT' },
    namespaceResolution: { resolutionState: 'RESOLVED' },
    namingIntent: { bindingState: 'REALIZED' },
    environmentRealizations: [{ id: 'env_1' }],
    taskQueueBindings: [{ id: 'queue_1' }],
    workflowTypeBindings: [{ id: 'workflow_1' }],
    activityTypeBindings,
    workerArtifactBindings: [{ id: 'worker_1', supportedActivityTypeBindingRefs }],
    requirements: [{ id: 'requirement_1', state: 'RESOLVED' }],
    attempts: [],
    revision: { id: 'deployment_realized_1' },
  } as any;
}

const approvalInput = {
  authorityRef: 'authority:r1-11:workflow-only-deployment',
  approvedBy: 'actor:r1-11-field',
  rationale: 'Approve the exact realized Temporal Worker revision for one deployment attempt.',
  approvedAt: '2026-09-07T22:45:00.000Z',
};

test('R1-11 workflow-native human/wait deployment does not require a fake ActivityTypeBinding', () => {
  const deployment = realizedDeployment([], []);
  const approval = approveGenericDeploymentAttempt(deployment, approvalInput);

  assert.equal(approval.deploymentRevisionRef, deployment.revision.id);
  assert.equal(approval.decision, 'APPROVED');
  assert.equal(approval.authorizedAttemptCount, 1);
  assert.equal(approval.createsDeploymentAttemptAuthority, true);
  assert.equal(approval.createsExecutionAuthority, false);
});

test('R1-11 deployment approval still fails closed when Worker Activity support does not match realized Activity bindings', () => {
  const deployment = realizedDeployment(
    [{ id: 'activity_binding_1' }],
    [],
  );

  assert.throws(
    () => approveGenericDeploymentAttempt(deployment, approvalInput),
    /Worker Activity support to match the realized Activity bindings exactly/,
  );
});

test('R1-11 deployment approval accepts exact Activity support when Activity work exists', () => {
  const deployment = realizedDeployment(
    [{ id: 'activity_binding_1' }],
    ['activity_binding_1'],
  );

  assert.doesNotThrow(() => approveGenericDeploymentAttempt(deployment, approvalInput));
});
