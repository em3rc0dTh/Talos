import assert from 'node:assert/strict';
import vm from 'node:vm';
import test from 'node:test';
import { ONE_APP_PRODUCT_RUNTIME_POLICY_ACTIVITY_BOUNDARY_ENHANCEMENT } from '../apps/reference-api/src/one-app-product-runtime-policy-page.ts';

interface Harness {
  fetch: (input: string, init?: RequestInit) => Promise<Response>;
  preview: { className: string; textContent: string };
  runtimePolicyBodies: any[];
  flush(): Promise<void>;
}

function makeHarness(mappingUnits: any[]): Harness {
  const runtimePolicyBodies: any[] = [];
  const preview = { className: '', textContent: '' };

  const nativeFetch = async (input: string, init?: RequestInit): Promise<Response> => {
    if (input.includes('/api/automation/temporal-mapping')) {
      return new Response(JSON.stringify({
        mapping: {
          revision: { id: 'tmp_generic_mapping' },
          units: mappingUnits,
        },
      }), { status: 201, headers: { 'content-type': 'application/json' } });
    }
    if (input.includes('/api/automation/runtime-policy')) {
      runtimePolicyBodies.push(JSON.parse(String(init?.body ?? '{}')));
      return new Response(JSON.stringify({ runtimePolicy: { revision: { id: 'rpl_generic' } } }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  };

  const windowObject: any = { fetch: nativeFetch };
  const context = vm.createContext({
    window: windowObject,
    document: {
      getElementById(id: string) {
        return id === 'runtimePolicyPreview' ? preview : null;
      },
    },
    Response,
    Headers,
    Request,
    URL,
    Set,
    Map,
    Array,
    Promise,
    JSON,
    String,
    Error,
    setTimeout,
    clearTimeout,
  });
  vm.runInContext(ONE_APP_PRODUCT_RUNTIME_POLICY_ACTIVITY_BOUNDARY_ENHANCEMENT, context);

  return {
    fetch: windowObject.fetch,
    preview,
    runtimePolicyBodies,
    flush: () => new Promise<void>((resolve) => setTimeout(resolve, 5)),
  };
}

function policy(ref: string) {
  return {
    capabilityUseOccurrenceRef: ref,
    authorityRef: `authority:${ref}`,
    decidedBy: 'actor:test',
    rationale: 'Explicit generic runtime policy.',
    policyBasis: 'R1_PRODUCT_REVIEWED_POLICY',
    retry: {
      initialIntervalMs: 250,
      backoffCoefficient: 2,
      maximumIntervalMs: 5000,
      maximumAttempts: 3,
      nonRetryableFailureTypes: ['INVALID_REQUEST'],
    },
    timeout: { startToCloseMs: 15000, scheduleToCloseMs: 45000 },
    idempotency: {
      requirement: 'REQUIRED',
      strategyKind: 'IDEMPOTENCY_KEY',
      keyContract: 'sha256(executionId + capabilityUseOccurrenceRef)',
      enforcementRef: 'ONE_APP_EFFECT_LEDGER',
    },
    failureClassifications: [
      { failureType: 'TRANSIENT_FAILURE', retryable: true, businessFailure: false },
    ],
  };
}

async function map(harness: Harness): Promise<void> {
  const response = await harness.fetch('/api/automation/temporal-mapping', {
    method: 'POST',
    body: '{}',
  });
  assert.equal(response.status, 201);
  await harness.flush();
}

test('R1-11 runtime-policy UI gives human-only mappings zero Activity policies', async () => {
  const harness = makeHarness([
    {
      id: 'tmp_human_1',
      constructKind: 'HUMAN_COORDINATION',
      executionSubjectRefs: ['use_human_1'],
    },
    {
      id: 'tmp_human_2',
      constructKind: 'HUMAN_COORDINATION',
      executionSubjectRefs: ['use_human_2'],
    },
  ]);

  await map(harness);
  assert.match(harness.preview.textContent, /No Temporal Activity policies are required/);
  assert.match(harness.preview.textContent, /Human\/wait coordination remains Workflow-native/);

  const response = await harness.fetch('/api/automation/runtime-policy', {
    method: 'POST',
    body: JSON.stringify({
      activities: [policy('use_human_1'), policy('use_human_2')],
      workflow: { maximumAttempts: 1 },
    }),
  });
  assert.equal(response.status, 201);
  assert.equal(harness.runtimePolicyBodies.length, 1);
  assert.deepEqual(harness.runtimePolicyBodies[0].activities, []);
});

test('R1-11 runtime-policy UI keeps only mapped Activity capability uses in a mixed process', async () => {
  const harness = makeHarness([
    {
      id: 'tmp_activity_1',
      constructKind: 'ACTIVITY',
      executionSubjectRefs: ['use_external_api'],
    },
    {
      id: 'tmp_human_1',
      constructKind: 'HUMAN_COORDINATION',
      executionSubjectRefs: ['use_manager_approval'],
    },
    {
      id: 'tmp_wait_1',
      constructKind: 'DURABLE_TIMER',
      executionSubjectRefs: ['exe_wait_1'],
    },
  ]);

  await map(harness);
  assert.match(harness.preview.textContent, /1 Temporal Activity use\(s\)/);
  assert.match(harness.preview.textContent, /Human\/wait coordination does not receive Activity retry\/timeout\/idempotency policy/);

  const response = await harness.fetch('/api/automation/runtime-policy', {
    method: 'POST',
    body: JSON.stringify({
      activities: [policy('use_external_api'), policy('use_manager_approval')],
      workflow: { maximumAttempts: 1 },
    }),
  });
  assert.equal(response.status, 201);
  assert.deepEqual(
    harness.runtimePolicyBodies[0].activities.map((item: any) => item.capabilityUseOccurrenceRef),
    ['use_external_api'],
  );
});

test('R1-11 runtime-policy UI fails closed when a mapped Activity lacks an explicit policy', async () => {
  const harness = makeHarness([
    {
      id: 'tmp_activity_1',
      constructKind: 'ACTIVITY',
      executionSubjectRefs: ['use_required_activity'],
    },
    {
      id: 'tmp_human_1',
      constructKind: 'HUMAN_COORDINATION',
      executionSubjectRefs: ['use_human_only'],
    },
  ]);

  await map(harness);
  await assert.rejects(
    () => harness.fetch('/api/automation/runtime-policy', {
      method: 'POST',
      body: JSON.stringify({
        activities: [policy('use_human_only')],
        workflow: { maximumAttempts: 1 },
      }),
    }),
    /TALOS_RUNTIME_POLICY_ACTIVITY_RESOLUTION_MISSING: use_required_activity/,
  );
  assert.equal(harness.runtimePolicyBodies.length, 0);
});
