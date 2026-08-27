import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import {
  startTalosOneAppProduct,
} from '../apps/reference-api/src/one-app-product-server.ts';
import type {
  TalosProductHumanRuntimeControl,
} from '../apps/reference-api/src/private-preview-human-control.ts';

async function startFakeAuthorityBackend() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`);
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const input = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
    let status = 200;
    let payload: any = { status: 'READY' };
    if (req.method === 'POST' && url.pathname === '/api/automation/execution/approve') {
      status = 201;
      payload = {
        workflowExecutionApproval: {
          id: 'deployment:workflow-approval-1',
          deploymentRevisionRef: 'deployment:revision-1',
          executionId: input.executionId,
        },
        workflowStartAuthorized: true,
        authorizedWorkflowStartCount: 1,
      };
    }
    const body = JSON.stringify(payload);
    res.writeHead(status, {
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(body),
    });
    res.end(body);
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('fake authority backend did not bind');
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

test('R1-08H product shell exposes human runtime only after protected execution approval and server-binds actor authority', async () => {
  const upstream = await startFakeAuthorityBackend();
  const calls: any[] = [];
  const control: TalosProductHumanRuntimeControl = {
    async getState(executionId) {
      calls.push({ kind: 'state', executionId });
      return {
        workflowIdRef: `talos-${executionId}`,
        runtimeState: {
          executionId,
          status: 'RUNNING',
          currentElementRef: 'exe_human_1',
          pendingHumanTask: {
            executionElementRef: 'exe_human_1',
            capabilityUseOccurrenceRef: 'exe_use_human_1',
            messageKind: 'UPDATE_HANDLER',
            participantRoleRefs: ['role:manager'],
            outcomes: [{ outcomeRef: 'outcome:approve', outcomeCode: 'APPROVE', businessMeaning: 'Approve' }],
          },
          acceptedHumanSubmissions: [],
        },
      };
    },
    async submitOutcome(input) {
      calls.push({ kind: 'submit', input });
      return {
        workflowIdRef: `talos-${input.executionId}`,
        receipt: {
          submissionId: input.submissionId,
          executionElementRef: input.executionElementRef,
          capabilityUseOccurrenceRef: 'exe_use_human_1',
          outcomeRef: 'outcome:approve',
          outcomeCode: input.outcomeCode,
          actorRef: input.actorRef,
          authorityRef: input.authorityRef,
          accepted: true,
        },
        runtimeState: {
          executionId: input.executionId,
          status: 'RUNNING',
          currentElementRef: 'exe_after_human',
          acceptedHumanSubmissions: [],
        },
      };
    },
    async close() {},
  };

  const product = await startTalosOneAppProduct({
    port: 0,
    upstream: { baseUrl: upstream.baseUrl },
    runtimeProfile: {
      actorId: 'actor:configured-owner',
      runtimeMode: 'TEMPORAL_EXECUTION',
      temporalExecutionAvailable: true,
      secretMaterialExposed: false,
    },
    humanRuntimeControl: control,
    humanRuntimeActorId: 'actor:configured-owner',
  });
  try {
    const profile = await (await fetch(`${product.baseUrl}/api/product/runtime-profile`)).json();
    assert.equal(profile.humanRuntimeAvailable, true);

    const home = await (await fetch(`${product.baseUrl}/`)).text();
    assert.match(home, /talos-product-human-runtime\.js/);
    const enhancement = await (await fetch(`${product.baseUrl}/talos-product-human-runtime.js`)).text();
    assert.match(enhancement, /\/api\/product\/execution\/human-outcome/);
    assert.match(enhancement, /CAPABILITY_INVOCATION/);

    const beforeApproval = await fetch(`${product.baseUrl}/api/product/execution/state?executionId=RUN-001`);
    assert.equal(beforeApproval.status, 409);
    assert.equal(calls.length, 0);

    const approvalResponse = await fetch(`${product.baseUrl}/api/automation/execution/approve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        automationApprovalId: 'automation:approval',
        deploymentRevisionId: 'deployment:revision-1',
        deploymentAttemptId: 'deployment:attempt-1',
        workflowTypeBindingRef: 'deployment:workflow-type-1',
        executionId: 'RUN-001',
        facts: {},
        capabilityInputs: {},
        authorityRef: 'browser-authority',
        approvedBy: 'browser-actor',
        rationale: 'Approve exact start.',
      }),
    });
    assert.equal(approvalResponse.status, 201);

    const stateResponse = await fetch(`${product.baseUrl}/api/product/execution/state?executionId=RUN-001`);
    assert.equal(stateResponse.status, 200);
    const state = await stateResponse.json();
    assert.equal(state.runtimeState.pendingHumanTask.outcomes[0].outcomeCode, 'APPROVE');

    const submitResponse = await fetch(`${product.baseUrl}/api/product/execution/human-outcome`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        executionId: 'RUN-001',
        submissionId: 'submission-001',
        executionElementRef: 'exe_human_1',
        outcomeCode: 'APPROVE',
        actorRef: 'actor:attacker-must-be-ignored',
        authorityRef: 'authority:attacker-must-be-ignored',
        rationale: 'I approve this frozen outcome.',
      }),
    });
    assert.equal(submitResponse.status, 201);
    const submitCall = calls.find((call) => call.kind === 'submit');
    assert(submitCall);
    assert.equal(submitCall.input.actorRef, 'actor:configured-owner');
    assert.notEqual(submitCall.input.authorityRef, 'authority:attacker-must-be-ignored');
    assert.match(submitCall.input.authorityRef, /^authority:talos-product:human-outcome:/);
    assert.equal(submitCall.input.outcomeCode, 'APPROVE');
  } finally {
    await product.close();
    await upstream.close();
  }
});
