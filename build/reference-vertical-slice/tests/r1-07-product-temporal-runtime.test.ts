import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';
import {
  createTalosProductTemporalRuntimeAdapters,
  TALOS_PRODUCT_ACTIVITY_TYPE,
  TALOS_PRODUCT_WORKFLOW_TYPE,
} from '../apps/reference-api/src/private-preview-temporal-runtime.ts';
import type { GenericCapabilityActivityInput } from '../workers/reference-temporal-worker/src/generic-contracts.ts';
import type {
  GenericCapabilityTransport,
  GenericEffectIdentity,
  GenericExternalCapabilityEffect,
} from '../workers/reference-temporal-worker/src/generic-activities.ts';

const TEST_TRANSPORT_REF = 'R1_07_EXPLICIT_PRODUCT_TEST_TRANSPORT';

class R1ProductTestTransport implements GenericCapabilityTransport {
  readonly transportRef = TEST_TRANSPORT_REF;
  readonly calls: Array<{ capabilityUseOccurrenceRef: string; executionId: string }> = [];

  async execute(input: GenericCapabilityActivityInput, identity: GenericEffectIdentity): Promise<GenericExternalCapabilityEffect> {
    this.calls.push({
      capabilityUseOccurrenceRef: input.capabilityUseOccurrenceRef,
      executionId: input.executionId,
    });
    return {
      effectStatus: 'INSERTED',
      transportRef: this.transportRef,
      externalEffectRef: `r1-07:test-effect:${identity.effectKey}`,
      evidenceRefs: [
        `r1-07:test-transport:${this.transportRef}`,
        `talos:effect-key:${identity.effectKey}`,
        `talos:input-digest:${identity.inputDigest}`,
      ],
    };
  }
}

const BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R107" targetNamespace="https://talos.local/r1-07">
  <bpmn:process id="Process_R107" name="R1 Product Runtime" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="DoWork" name="Perform approved work"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="DoWork" />
    <bpmn:sequenceFlow id="F2" sourceRef="DoWork" targetRef="End" />
  </bpmn:process>
</bpmn:definitions>`;

async function post(baseUrl: string, pathname: string, payload: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json() as any;
  return { response, body };
}

async function buildApprovedRuntime(baseUrl: string, namespace: string, taskQueue: string) {
  const imported = await post(baseUrl, '/api/input/bpmn', {
    fileName: 'r1-07-product.bpmn',
    bpmnXml: BPMN,
    initiatedBy: 'r1-07-owner',
  });
  assert.equal(imported.response.status, 201);

  const confirmed = await post(baseUrl, '/api/bpmn/confirm', {
    revisionId: imported.body.revision.id,
    canonicalProcessRevisionId: imported.body.revision.canonicalProcessRevisionId,
    confirmedBy: 'r1-07-owner',
    authorityRef: 'authority:r1-07-process-owner',
    rationale: 'Confirm exact simple process for product runtime proof.',
  });
  assert.equal(confirmed.response.status, 201);

  const frozen = await post(baseUrl, '/api/bpmn/automation-design-approval', {
    revisionId: confirmed.body.revision.id,
    confirmationId: confirmed.body.confirmation.id,
    approvedBy: 'r1-07-owner',
    authorityRef: 'authority:r1-07-automation-handoff',
  });
  assert.equal(frozen.response.status, 201);
  const workspace = frozen.body.automationDesign.workspace;
  assert.ok(workspace);

  const selections = workspace.requirements.map((requirement: any, index: number) => ({
    source: 'EXPLICIT_OFFERING',
    requirementRef: requirement.capabilityRequirementRef,
    family: 'SYSTEM_OPERATION',
    offeringCanonicalName: `R1 Product Operation ${index + 1}`,
    offeringLifecycleStatus: 'TEST_ONLY',
    implementationKind: 'INTERNAL_SERVICE',
    implementationRef: `r1-07:operation:${index + 1}`,
    decidedBy: 'r1-07-owner',
    authorityRef: 'authority:r1-07-capability-selection',
    rationale: 'Explicitly bind this business work to the product runtime test operation.',
  }));
  const selected = await post(baseUrl, '/api/automation/capability/select', {
    workspaceId: workspace.id,
    selections,
  });
  assert.equal(selected.response.status, 201);

  const reviewed = await post(baseUrl, '/api/automation/execution-plan/review', {
    workspaceId: workspace.id,
    decisions: {},
  });
  assert.equal(reviewed.response.status, 201);
  assert.equal(reviewed.body.review.state, 'READY_FOR_AUTOMATION_APPROVAL');

  const automationApproval = await post(baseUrl, '/api/automation/approve', {
    reviewId: reviewed.body.review.id,
    approvedBy: 'r1-07-owner',
    authorityRef: 'authority:r1-07-automation-approval',
    rationale: 'Approve the exact reviewed ExecutionPlan for Temporal design only.',
  });
  assert.equal(automationApproval.response.status, 201);

  const mapped = await post(baseUrl, '/api/automation/temporal-mapping', {
    approvalId: automationApproval.body.id,
    waits: [],
    humans: [],
  });
  assert.equal(mapped.response.status, 201);

  const activities = reviewed.body.execution.capabilityUses.map((use: any) => ({
    capabilityUseOccurrenceRef: use.id,
    authorityRef: 'authority:r1-07-runtime-policy',
    decidedBy: 'r1-07-owner',
    rationale: 'Explicit bounded retry, timeout and idempotency policy for the approved product capability use.',
    policyBasis: 'R1_PRODUCT_TEST',
    retry: {
      initialIntervalMs: 100,
      backoffCoefficient: 2,
      maximumIntervalMs: 1000,
      maximumAttempts: 3,
      nonRetryableFailureTypes: ['INVALID_REQUEST', 'IDEMPOTENCY_CONFLICT'],
    },
    timeout: { startToCloseMs: 5000, scheduleToCloseMs: 10000 },
    idempotency: {
      requirement: 'REQUIRED',
      strategyKind: 'IDEMPOTENCY_KEY',
      keyContract: 'sha256(executionId + capabilityUseOccurrenceRef)',
      enforcementRef: TEST_TRANSPORT_REF,
    },
    failureClassifications: [
      { failureType: 'TRANSIENT_FAILURE', retryable: true, businessFailure: false },
      { failureType: 'INVALID_REQUEST', retryable: false, businessFailure: false },
      { failureType: 'IDEMPOTENCY_CONFLICT', retryable: false, businessFailure: false },
    ],
  }));
  const runtimePolicy = await post(baseUrl, '/api/automation/runtime-policy', {
    approvalId: automationApproval.body.id,
    temporalMappingRevisionId: mapped.body.mapping.revision.id,
    activities,
    workflow: {
      authorityRef: 'authority:r1-07-workflow-policy',
      decidedBy: 'r1-07-owner',
      rationale: 'No implicit whole-workflow retries.',
      maximumAttempts: 1,
      policyBasis: 'R1_PRODUCT_TEST',
    },
  });
  assert.equal(runtimePolicy.response.status, 201);

  const deploymentDesign = await post(baseUrl, '/api/automation/deployment-design', {
    approvalId: automationApproval.body.id,
    runtimePolicyRevisionId: runtimePolicy.body.runtimePolicy.revision.id,
    environmentKey: 'r1-07-product-test',
    environmentClass: 'TEST',
    temporalPlatformRef: 'TEMPORAL_LOCAL_TEST',
    desiredNamespaceKey: namespace,
    desiredTaskQueueKey: taskQueue,
    desiredWorkflowTypeName: TALOS_PRODUCT_WORKFLOW_TYPE,
    desiredActivityTypeName: TALOS_PRODUCT_ACTIVITY_TYPE,
    desiredWorkerLogicalName: 'talos-product-worker',
    authorityRef: 'authority:r1-07-deployment-design',
    decidedBy: 'r1-07-owner',
    rationale: 'Design the exact product Worker target before realization.',
  });
  assert.equal(deploymentDesign.response.status, 201);

  const realized = await post(baseUrl, '/api/automation/environment-realization', {
    approvalId: automationApproval.body.id,
    deploymentRevisionId: deploymentDesign.body.deploymentDesign.revision.id,
    actualNamespace: namespace,
    taskQueue,
    workflowTypeName: TALOS_PRODUCT_WORKFLOW_TYPE,
    activityTypeName: TALOS_PRODUCT_ACTIVITY_TYPE,
    workerLogicalName: 'talos-product-worker',
    executableArtifactRef: 'workers/reference-temporal-worker/src/generic-worker-runtime.ts',
    artifactDigest: 'r1-07-product-runtime-artifact-digest',
    sdkFamily: 'TEMPORAL_TYPESCRIPT_SDK',
    sdkVersionRef: '1.22.0',
    authorityRef: 'authority:r1-07-environment-realization',
    realizedBy: 'r1-07-owner',
  });
  assert.equal(realized.response.status, 201);

  return {
    automationApproval: automationApproval.body,
    execution: reviewed.body.execution,
    realized: realized.body.deploymentRealization,
  };
}

test('R1-07 trusted product runtime deploys only with an explicitly resolved capability transport, then consumes one exact workflow-start approval', { timeout: 120_000 }, async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-07-temporal-'));
  const temporal = await TestWorkflowEnvironment.createLocal({ server: { namespace: 'talos-r1-07' } });
  const taskQueue = 'talos-r1-07-product-runtime';
  const target = {
    address: 'injected-test-connection:7233',
    namespace: temporal.namespace,
    taskQueue,
  };
  const transport = new R1ProductTestTransport();
  const runtime = createTalosProductTemporalRuntimeAdapters(target, {
    client: temporal.client,
    nativeConnection: temporal.nativeConnection,
    capabilityTransportResolver: {
      resolve({ implementationRef }) {
        return implementationRef.startsWith('r1-07:operation:') ? transport : undefined;
      },
    },
  });
  const app = await startTalosOneApp({
    port: 0,
    runtimeDir,
    imagePerceptionEnv: {},
    deploymentAttemptExecutor: runtime.deploymentAttemptExecutor,
    workflowExecutionExecutor: runtime.workflowExecutionExecutor,
  });

  try {
    const reachability = await runtime.assertReachable();
    assert.equal(reachability.namespace, temporal.namespace);
    assert.equal(reachability.sdkVersion, '1.22.0');

    const built = await buildApprovedRuntime(app.baseUrl, temporal.namespace, taskQueue);

    const deploymentApproval = await post(app.baseUrl, '/api/automation/deployment/approve', {
      automationApprovalId: built.automationApproval.id,
      deploymentRevisionId: built.realized.revision.id,
      authorityRef: 'authority:r1-07-deployment-approval',
      approvedBy: 'r1-07-owner',
      rationale: 'Authorize exactly one product Worker deployment attempt.',
    });
    assert.equal(deploymentApproval.response.status, 201);

    const deploymentAttempt = await post(app.baseUrl, '/api/automation/deployment/attempt', {
      deploymentApprovalId: deploymentApproval.body.deploymentApproval.id,
      deploymentRevisionId: built.realized.revision.id,
    });
    assert.equal(deploymentAttempt.response.status, 201);
    assert.equal(deploymentAttempt.body.deploymentAttempt.result, 'SUCCEEDED');
    assert.equal(deploymentAttempt.body.workflowExecutionAuthorized, false, 'Worker deployment must not create business workflow authority');
    assert.ok(deploymentAttempt.body.deploymentAttempt.evidenceRefs.some((ref: string) => ref.startsWith('runtime-program:')));
    assert.ok(deploymentAttempt.body.deploymentAttempt.evidenceRefs.includes(`capability-transport:${TEST_TRANSPORT_REF}`));
    assert.equal(transport.calls.length, 0, 'Worker deployment must not execute the selected business capability');

    const executionId = 'R1-07-PRODUCT-RUN-001';
    const facts = { approved: true };
    const capabilityInputs = Object.fromEntries(
      built.execution.capabilityUses.map((use: any) => [use.id, { value: 'explicit-r1-product-input' }]),
    );

    const executionApproval = await post(app.baseUrl, '/api/automation/execution/approve', {
      automationApprovalId: built.automationApproval.id,
      deploymentRevisionId: built.realized.revision.id,
      deploymentAttemptId: deploymentAttempt.body.deploymentAttempt.id,
      workflowTypeBindingRef: built.realized.workflowTypeBindings[0].id,
      executionId,
      facts,
      capabilityInputs,
      authorityRef: 'authority:r1-07-workflow-start',
      approvedBy: 'r1-07-owner',
      rationale: 'Authorize one exact Workflow start with this input digest.',
    });
    assert.equal(executionApproval.response.status, 201);
    assert.equal(executionApproval.body.authorizedWorkflowStartCount, 1);

    const driftedStart = await post(app.baseUrl, '/api/automation/execution/start', {
      workflowExecutionApprovalId: executionApproval.body.workflowExecutionApproval.id,
      deploymentRevisionId: built.realized.revision.id,
      executionId,
      facts: { approved: false },
      capabilityInputs,
    });
    assert.equal(driftedStart.response.status, 409, 'input drift must be rejected before Temporal workflow.start');
    assert.equal(transport.calls.length, 0, 'drifted approved input must be rejected before the capability transport is invoked');

    const started = await post(app.baseUrl, '/api/automation/execution/start', {
      workflowExecutionApprovalId: executionApproval.body.workflowExecutionApproval.id,
      deploymentRevisionId: built.realized.revision.id,
      executionId,
      facts,
      capabilityInputs,
    });
    assert.equal(started.response.status, 201);
    const observation = started.body.workflowExecutionObservation;
    assert.equal(observation.executionStatus, 'COMPLETED');
    assert.ok(observation.workflowIdRef.startsWith('talos-R1-07-PRODUCT-RUN-001'));
    assert.ok(observation.runIdRef);
    assert.equal(observation.executionApprovalRef, executionApproval.body.workflowExecutionApproval.id);
    assert.equal(observation.startingDeploymentRevisionRef, built.realized.revision.id);
    assert.ok(observation.evidenceRefs.some((ref: string) => ref.startsWith('runtime-program:')));
    assert.ok(observation.evidenceRefs.includes(`transport:${TEST_TRANSPORT_REF}`));
    assert.ok(observation.evidenceRefs.some((ref: string) => ref.startsWith('external-effect:r1-07:test-effect:')));
    assert.equal(transport.calls.length, built.execution.capabilityUses.length, 'every approved capability invocation must pass through the concrete runtime transport');

    const duplicateStart = await post(app.baseUrl, '/api/automation/execution/start', {
      workflowExecutionApprovalId: executionApproval.body.workflowExecutionApproval.id,
      deploymentRevisionId: built.realized.revision.id,
      executionId,
      facts,
      capabilityInputs,
    });
    assert.equal(duplicateStart.response.status, 409, 'one-start authority must be consumed after the successful start');
  } finally {
    await app.close();
    await runtime.close();
    await temporal.teardown();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
