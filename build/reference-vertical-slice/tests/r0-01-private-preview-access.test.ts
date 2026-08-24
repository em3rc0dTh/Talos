import test from 'node:test';
import assert from 'node:assert/strict';
import { startTalosPrivatePreview } from '../apps/reference-api/src/private-preview-server.ts';

const TOKEN = 'talos-r0-01-private-preview-token-0001';
const WORKSPACE_ID = 'workspace:r0-01-private-preview';
const ACTOR_ID = 'actor:r0-01-private-preview-owner';

const simpleBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R0" targetNamespace="https://talos.local/r0/private-preview">
  <bpmn:process id="Process_R0" name="Private Preview Process" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Review" name="Review request"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Review" />
    <bpmn:sequenceFlow id="F2" sourceRef="Review" targetRef="End" />
  </bpmn:process>
</bpmn:definitions>`;

function accessHeaders(overrides: Record<string, string> = {}) {
  return {
    authorization: `Bearer ${TOKEN}`,
    'x-talos-workspace-id': WORKSPACE_ID,
    'x-talos-actor-id': ACTOR_ID,
    ...overrides,
  };
}

async function read(response: Response) {
  return await response.json() as any;
}

async function post(
  baseUrl: string,
  pathname: string,
  payload: Record<string, unknown>,
  headers: Record<string, string> = accessHeaders(),
) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { response, body: await read(response) };
}

test('R0-01 private preview requires exact bearer, workspace and actor before the I9 engine is reachable', async () => {
  const app = await startTalosPrivatePreview({
    port: 0,
    access: {
      bearerToken: TOKEN,
      workspaceId: WORKSPACE_ID,
      actorId: ACTOR_ID,
    },
  });

  try {
    const health = await fetch(`${app.baseUrl}/health`);
    assert.equal(health.status, 200);
    const healthBody = await read(health);
    assert.equal(healthBody.releaseGate, 'R0-01_PRIVATE_PREVIEW_ACCESS_BOUNDARY');
    assert.equal(healthBody.engineAuthorityStage, 'I9-07_EXPLICIT_WORKFLOW_EXECUTION_AUTHORITY');
    assert.equal(JSON.stringify(healthBody).includes(TOKEN), false);

    const noAuth = await fetch(`${app.baseUrl}/api/status`);
    assert.equal(noAuth.status, 401);
    assert.equal((await read(noAuth)).code, 'R0_AUTHENTICATION_REQUIRED');

    const wrongToken = await fetch(`${app.baseUrl}/api/status`, {
      headers: accessHeaders({ authorization: 'Bearer definitely-not-the-preview-token' }),
    });
    assert.equal(wrongToken.status, 401);

    const wrongWorkspace = await fetch(`${app.baseUrl}/api/status`, {
      headers: accessHeaders({ 'x-talos-workspace-id': 'workspace:other' }),
    });
    assert.equal(wrongWorkspace.status, 403);
    assert.equal((await read(wrongWorkspace)).code, 'R0_WORKSPACE_SCOPE_MISMATCH');

    const wrongActor = await fetch(`${app.baseUrl}/api/status`, {
      headers: accessHeaders({ 'x-talos-actor-id': 'actor:other' }),
    });
    assert.equal(wrongActor.status, 403);
    assert.equal((await read(wrongActor)).code, 'R0_ACTOR_SCOPE_MISMATCH');

    const statusResponse = await fetch(`${app.baseUrl}/api/status`, { headers: accessHeaders() });
    assert.equal(statusResponse.status, 200);
    const status = await read(statusResponse);
    assert.equal(status.releaseGate, 'R0-01_PRIVATE_PREVIEW_ACCESS_BOUNDARY');
    assert.equal(status.engineAuthorityStage, 'I9-07_EXPLICIT_WORKFLOW_EXECUTION_AUTHORITY');
    assert.equal(status.privatePreview.accessBoundaryEnforced, true);
    assert.equal(status.privatePreview.workspaceIsolation, 'SINGLE_WORKSPACE_PROCESS');
    assert.equal(status.privatePreview.actorBinding, 'SINGLE_CONFIGURED_ACTOR');
    assert.equal(status.privatePreview.workspaceId, WORKSPACE_ID);
    assert.equal(status.privatePreview.actorId, ACTOR_ID);
    assert.equal(status.privatePreview.bearerTokenExposed, false);
    assert.equal(JSON.stringify(status).includes(TOKEN), false);
  } finally {
    await app.close();
  }
});

test('R0-01 binds authority actor identity and blocks caller impersonation before domain side effects', async () => {
  const app = await startTalosPrivatePreview({
    port: 0,
    access: {
      bearerToken: TOKEN,
      workspaceId: WORKSPACE_ID,
      actorId: ACTOR_ID,
    },
  });

  try {
    const impersonation = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'r0-private-preview.bpmn',
      bpmnXml: simpleBpmn,
      initiatedBy: 'actor:impersonated-user',
    });
    assert.equal(impersonation.response.status, 403);
    assert.equal(impersonation.body.code, 'R0_ACTOR_IMPERSONATION_FORBIDDEN');

    const imported = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'r0-private-preview.bpmn',
      bpmnXml: simpleBpmn,
    });
    assert.equal(imported.response.status, 201);
    assert.equal(imported.body.reconciliation.status, 'RECONCILED');

    const confirmed = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId: imported.body.revision.id,
      canonicalProcessRevisionId: imported.body.revision.canonicalProcessRevisionId,
      authorityRef: 'authority:r0-private-preview-process-owner',
      rationale: 'Confirm this exact process for the private preview.',
    });
    assert.equal(confirmed.response.status, 201);
    assert.equal(confirmed.body.revision.state, 'CONFIRMED');
    assert.equal(confirmed.body.confirmation.confirmedBy, ACTOR_ID);

    const nestedImpersonation = await post(app.baseUrl, '/api/not-a-real-route', {
      selections: [{ decidedBy: 'actor:impersonated-designer' }],
    });
    assert.equal(nestedImpersonation.response.status, 403);
    assert.equal(nestedImpersonation.body.code, 'R0_ACTOR_IMPERSONATION_FORBIDDEN');

    const businessFact = await post(app.baseUrl, '/api/not-a-real-route', {
      facts: { approvedBy: 'external-business-field-value' },
    });
    assert.equal(businessFact.response.status, 404);
    assert.equal(businessFact.body.code, 'ONE_APP_ROUTE_NOT_FOUND');
  } finally {
    await app.close();
  }
});

test('R0-01 refuses weak or empty private-preview access configuration', async () => {
  await assert.rejects(
    startTalosPrivatePreview({
      access: {
        bearerToken: 'short-token',
        workspaceId: WORKSPACE_ID,
        actorId: ACTOR_ID,
      },
    }),
    /at least 24 characters/,
  );
});
