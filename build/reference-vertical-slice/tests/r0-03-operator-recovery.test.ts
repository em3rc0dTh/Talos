import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  TALOS_PRIVATE_PREVIEW_ENV,
} from '../apps/reference-api/src/private-preview-config.ts';
import {
  inspectTalosPrivatePreviewRecovery,
  startTalosPrivatePreviewOperator,
  TALOS_PRIVATE_PREVIEW_OPERATOR_ENV,
  TALOS_PRIVATE_PREVIEW_OPERATOR_VERSION,
} from '../apps/reference-api/src/private-preview-operator.ts';

const TOKEN = 'talos-r0-03-private-preview-token-0001';
const WORKSPACE_ID = 'workspace:r0-03-private-preview';
const ACTOR_ID = 'actor:r0-03-private-preview-owner';

const simpleBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R003" targetNamespace="https://talos.local/r0-03">
  <bpmn:process id="Process_R003" name="R0-03 Recovery Process" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Review" name="Review durable evidence"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Review" />
    <bpmn:sequenceFlow id="F2" sourceRef="Review" targetRef="End" />
  </bpmn:process>
</bpmn:definitions>`;

function operatorEnv(runtimeDir: string, overrides: Record<string, string | undefined> = {}) {
  return {
    [TALOS_PRIVATE_PREVIEW_ENV.workspaceId]: WORKSPACE_ID,
    [TALOS_PRIVATE_PREVIEW_ENV.actorId]: ACTOR_ID,
    [TALOS_PRIVATE_PREVIEW_ENV.bearerToken]: TOKEN,
    [TALOS_PRIVATE_PREVIEW_ENV.bindHost]: '127.0.0.1',
    [TALOS_PRIVATE_PREVIEW_ENV.allowedHostnames]: '127.0.0.1,localhost',
    [TALOS_PRIVATE_PREVIEW_ENV.allowedOrigins]: 'NONE',
    [TALOS_PRIVATE_PREVIEW_ENV.maxJsonBytes]: String(2 * 1024 * 1024),
    [TALOS_PRIVATE_PREVIEW_ENV.maxImageBytes]: String(1024 * 1024),
    [TALOS_PRIVATE_PREVIEW_ENV.imageMode]: 'DISABLED',
    [TALOS_PRIVATE_PREVIEW_ENV.runtimeMode]: 'DESIGN_ONLY',
    [TALOS_PRIVATE_PREVIEW_OPERATOR_ENV.runtimeDir]: runtimeDir,
    ...overrides,
  };
}

function accessHeaders() {
  return {
    authorization: `Bearer ${TOKEN}`,
    'x-talos-workspace-id': WORKSPACE_ID,
    'x-talos-actor-id': ACTOR_ID,
    'content-type': 'application/json',
  };
}

async function post(baseUrl: string, pathname: string, payload: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: accessHeaders(),
    body: JSON.stringify(payload),
  });
  return { response, body: await response.json() as any };
}

test('R0-03 enforces one operator writer per runtime directory and persists no secret in the operator lock', async () => {
  const runtimeDir = path.join(os.tmpdir(), `talos-r0-03-lock-${Date.now()}-${Math.random()}`);
  const env = operatorEnv(runtimeDir);
  const first = await startTalosPrivatePreviewOperator(env, { port: 0 });
  const lockPath = path.join(runtimeDir, '.talos-private-preview.lock.json');

  try {
    assert.equal(existsSync(lockPath), true);
    const lockText = readFileSync(lockPath, 'utf8');
    assert.equal(lockText.includes(TOKEN), false);
    const lock = JSON.parse(lockText) as any;
    assert.equal(lock.operatorVersion, TALOS_PRIVATE_PREVIEW_OPERATOR_VERSION);
    assert.equal(lock.pid, process.pid);
    assert.equal(lock.configurationFingerprint, first.runtimeDescriptor.configurationFingerprint);
    assert.equal(first.operatorLock.secretMaterialPersisted, false);

    await assert.rejects(
      startTalosPrivatePreviewOperator(env, { port: 0 }),
      /R0_OPERATOR_RUNTIME_ALREADY_LOCKED/,
    );
  } finally {
    await first.close();
  }

  assert.equal(existsSync(lockPath), false);
  rmSync(runtimeDir, { recursive: true, force: true });
});

test('R0-03 durable process evidence survives stop/start without authority replay or startup mutation', async () => {
  const runtimeDir = path.join(os.tmpdir(), `talos-r0-03-recovery-${Date.now()}-${Math.random()}`);
  const env = operatorEnv(runtimeDir);
  const first = await startTalosPrivatePreviewOperator(env, { port: 0 });
  let revisionId = '';
  let canonicalProcessRevisionId = '';
  let confirmationId = '';

  try {
    assert.equal(first.recoveryBeforeStart.stage, 'EMPTY');
    assert.equal(first.recoveryBeforeStart.durableDocumentCount, 0);

    const imported = await post(first.baseUrl, '/api/input/bpmn', {
      fileName: 'r0-03-recovery.bpmn',
      bpmnXml: simpleBpmn,
    });
    assert.equal(imported.response.status, 201);
    revisionId = imported.body.revision.id;
    canonicalProcessRevisionId = imported.body.revision.canonicalProcessRevisionId;

    const confirmed = await post(first.baseUrl, '/api/bpmn/confirm', {
      revisionId,
      canonicalProcessRevisionId,
      authorityRef: 'authority:r0-03-process-owner',
      rationale: 'Confirm durable process evidence before operator restart.',
    });
    assert.equal(confirmed.response.status, 201);
    confirmationId = confirmed.body.confirmation.id;

    const duringFirst = inspectTalosPrivatePreviewRecovery(runtimeDir);
    assert.equal(duringFirst.stage, 'PROCESS_EVIDENCE');
    assert.ok(duringFirst.kinds.ProcessRevision.count > 0);
    assert.equal(duringFirst.kinds.BusinessProcessConfirmationRecord.count, 1);
    assert.equal(duringFirst.authorityReplayPerformed, false);
    assert.equal(duringFirst.startupMutationPerformed, false);
    assert.equal(duringFirst.midSessionResumption, 'NOT_SUPPORTED_V0_1');
    assert.equal(duringFirst.recoveryContract, 'DURABLE_EVIDENCE_ONLY');
    assert.equal(JSON.stringify(duringFirst).includes(TOKEN), false);
  } finally {
    await first.close();
  }

  const afterClose = inspectTalosPrivatePreviewRecovery(runtimeDir);
  const countAfterClose = afterClose.durableDocumentCount;
  const digestAfterClose = afterClose.recoveryDigest;
  assert.equal(afterClose.stage, 'PROCESS_EVIDENCE');

  const second = await startTalosPrivatePreviewOperator(env, { port: 0 });
  try {
    assert.equal(second.recoveryBeforeStart.recoveryDigest, digestAfterClose);
    assert.equal(second.recoveryBeforeStart.durableDocumentCount, countAfterClose);
    assert.equal(second.recoveryBeforeStart.stage, 'PROCESS_EVIDENCE');
    assert.equal(second.recoveryBeforeStart.authorityReplayPerformed, false);
    assert.equal(second.recoveryBeforeStart.startupMutationPerformed, false);
    assert.equal(second.recoveryBeforeStart.midSessionResumption, 'NOT_SUPPORTED_V0_1');

    const statusResponse = await fetch(`${second.baseUrl}/api/status`, {
      headers: {
        authorization: `Bearer ${TOKEN}`,
        'x-talos-workspace-id': WORKSPACE_ID,
        'x-talos-actor-id': ACTOR_ID,
      },
    });
    assert.equal(statusResponse.status, 200);
    const status = await statusResponse.json() as any;
    assert.equal(status.releaseGate, 'R0-02_PREVIEW_CONFIGURATION_SECRET_CONTRACT');

    const afterStartup = inspectTalosPrivatePreviewRecovery(runtimeDir);
    assert.equal(afterStartup.durableDocumentCount, countAfterClose, 'restart must not append authority/domain evidence');
    assert.equal(afterStartup.recoveryDigest, digestAfterClose, 'restart must not mutate durable recovery evidence');

    const cannotResumeMidSession = await post(second.baseUrl, '/api/bpmn/automation-design-approval', {
      revisionId,
      confirmationId,
      authorityRef: 'authority:r0-03-freeze-after-restart',
    });
    assert.equal(cannotResumeMidSession.response.status, 409);
    assert.equal(cannotResumeMidSession.body.code, 'ONE_APP_AUTHORITY_ORDER_VIOLATION');

    const afterRejectedResume = inspectTalosPrivatePreviewRecovery(runtimeDir);
    assert.equal(afterRejectedResume.durableDocumentCount, countAfterClose);
    assert.equal(afterRejectedResume.recoveryDigest, digestAfterClose);
  } finally {
    await second.close();
  }

  const finalRecovery = inspectTalosPrivatePreviewRecovery(runtimeDir);
  assert.equal(finalRecovery.durableDocumentCount, countAfterClose);
  assert.equal(finalRecovery.recoveryDigest, digestAfterClose);
  rmSync(runtimeDir, { recursive: true, force: true });
});

test('R0-03 removes a stale operator lock but never steals a live lock', async () => {
  const runtimeDir = path.join(os.tmpdir(), `talos-r0-03-stale-${Date.now()}-${Math.random()}`);
  mkdirSync(runtimeDir, { recursive: true });
  const lockPath = path.join(runtimeDir, '.talos-private-preview.lock.json');
  writeFileSync(lockPath, JSON.stringify({
    operatorVersion: TALOS_PRIVATE_PREVIEW_OPERATOR_VERSION,
    pid: 2_147_483_647,
    startedAt: new Date(0).toISOString(),
    configurationFingerprint: 'stale-fingerprint',
    runtimeDir,
  }), { encoding: 'utf8', mode: 0o600 });

  const app = await startTalosPrivatePreviewOperator(operatorEnv(runtimeDir), { port: 0 });
  try {
    const current = JSON.parse(readFileSync(lockPath, 'utf8')) as any;
    assert.equal(current.pid, process.pid);
    assert.notEqual(current.configurationFingerprint, 'stale-fingerprint');
    assert.equal(JSON.stringify(current).includes(TOKEN), false);
  } finally {
    await app.close();
  }

  assert.equal(existsSync(lockPath), false);
  rmSync(runtimeDir, { recursive: true, force: true });
});
