import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { buildBpmnCanonicalSourceView } from '../packages/review/src/bpmn-canonical-source-view.ts';
import { projectCanonicalProcessToBpmn } from '../packages/review/src/bpmn-projector.ts';
import { validateProcessRevision } from '../packages/semantic-core/src/validation.ts';
import {
  deriveExplicitDurationWaitSemantics,
  deriveIsoDurationWaitSemantics,
} from '../packages/semantic-core/src/wait-semantics.ts';
import type { ProcessNode, ProcessRevision } from '../packages/semantic-core/src/types.ts';

const cid = (seed: string) => createOpaqueId('canonical', seed);
const sid = (seed: string) => createOpaqueId('source', seed);

function node(seed: string, kind: ProcessNode['kind'], name: string, details?: Record<string, unknown>): ProcessNode {
  return {
    id: cid(seed),
    kind,
    name,
    actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [],
    ...(details ? { details } : {}),
    truthClass: 'CONFIRMED', provenanceRefs: [], sourceExtensionRefs: [],
  };
}

function durationProcess(waitName: string, details?: Record<string, unknown>): ProcessRevision {
  const start = node('duration-start', 'EVENT', 'Start');
  const wait = node('duration-wait', 'WAIT', waitName, details);
  const end = node('duration-end', 'END', 'Complete');
  return {
    id: cid(`duration-process:${waitName}:${JSON.stringify(details ?? {})}`),
    processDefinitionId: cid('duration-definition'),
    revision: 1,
    createdAt: '2026-08-28T23:20:00.000Z',
    parentRevisionIds: [],
    derivationKind: 'HUMAN_CONFIRMATION',
    sourceArtifactIds: [sid('duration-source')],
    nodes: [start, wait, end],
    edges: [
      { id: cid('duration-e1'), sourceNodeId: start.id, targetNodeId: wait.id, kind: 'SEQUENCE', truthClass: 'CONFIRMED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: cid('duration-e2'), sourceNodeId: wait.id, targetNodeId: end.id, kind: 'SEQUENCE', truthClass: 'CONFIRMED', provenanceRefs: [], sourceExtensionRefs: [] },
    ],
    actors: [], variables: [], dataObjects: [], rules: [], semanticClaims: [], conflictRecords: [], annotations: [], provenanceLinks: [], sourceExtensions: [],
    semanticStatus: 'VALIDATED', executionReadiness: 'NOT_ASSESSED', validationFindingRefs: [],
  };
}

async function post(baseUrl: string, pathname: string, payload: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  });
  return { response, body: await response.json() as any };
}

test('explicit elapsed durations are derived generically across English and Spanish without process-specific matching', () => {
  assert.deepEqual(deriveExplicitDurationWaitSemantics('Hold for 5 minutes'), {
    waitKind: 'DURATION', durationExpression: 'PT5M', durationSeconds: 300, matchedText: '5 minutes',
  });
  assert.deepEqual(deriveExplicitDurationWaitSemantics('Dejar reposar 10 minutos'), {
    waitKind: 'DURATION', durationExpression: 'PT10M', durationSeconds: 600, matchedText: '10 minutos',
  });
  assert.deepEqual(deriveExplicitDurationWaitSemantics('Wait 2 hours 30 minutes'), {
    waitKind: 'DURATION', durationExpression: 'PT2H30M', durationSeconds: 9000, matchedText: '2 hours + 30 minutes',
  });
  assert.equal(deriveExplicitDurationWaitSemantics('Inspect 5 items'), undefined);
  assert.equal(deriveExplicitDurationWaitSemantics('Wait until approval arrives'), undefined);
});

test('standard BPMN ISO elapsed durations are parsed only for fixed deterministic units', () => {
  assert.deepEqual(deriveIsoDurationWaitSemantics('PT5M'), {
    waitKind: 'DURATION', durationExpression: 'PT5M', durationSeconds: 300, matchedText: 'PT5M',
  });
  assert.equal(deriveIsoDurationWaitSemantics('P1M'), undefined, 'calendar months are not fixed elapsed durations');
  assert.equal(deriveIsoDurationWaitSemantics('PT0S'), undefined);
});

test('validator does not emit unresolved-wait blockers when a WAIT label contains an explicit duration', () => {
  const validation = validateProcessRevision(durationProcess('Hold for 5 minutes'), 'AUTOMATION_DESIGN_READINESS', {
    assessedAt: '2026-08-28T23:21:00.000Z',
  });
  assert.equal(validation.findings.some((finding) => finding.code === 'SV-EVT-003'), false);
  assert.equal(validation.findings.some((finding) => finding.code === 'SV-EVT-004'), false);
  assert.equal(validation.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');
});

test('DURATION without an actual duration remains fail-closed', () => {
  const validation = validateProcessRevision(durationProcess('Wait for treatment', { waitKind: 'DURATION' }), 'AUTOMATION_DESIGN_READINESS', {
    assessedAt: '2026-08-28T23:22:00.000Z',
  });
  assert.equal(validation.findings.some((finding) => finding.code === 'SV-EVT-004'), true);
  assert.equal(validation.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');
});

test('Talos projects a materialized duration as BPMN timeDuration and source view reads it back exactly', async () => {
  const process = durationProcess('Hold for treatment', {
    waitKind: 'DURATION', durationExpression: 'PT5M', durationSeconds: 300,
  });
  const projection = projectCanonicalProcessToBpmn({
    processRevision: process,
    sourceRoute: 'IMAGE_INTERPRETATION',
    createdAt: '2026-08-28T23:23:00.000Z',
    createdBy: 'duration-roundtrip-test',
  });
  assert.match(projection.bpmnRevision.bpmnXml, /<bpmn:timeDuration[^>]*>PT5M<\/bpmn:timeDuration>/);
  assert.equal(projection.diagnostics.some((item) => item.code === 'WAIT_EXECUTION_TIMING_NOT_MATERIALIZED'), false);

  const view = await buildBpmnCanonicalSourceView(projection.bpmnRevision.bpmnXml);
  const timer = view.processes[0]?.nodes.find((item) => item.name === 'Hold for treatment');
  assert.equal(timer?.type, 'bpmn:IntermediateCatchEvent');
  assert.deepEqual(timer?.eventDefinitionTypes, ['bpmn:TimerEventDefinition']);
  assert.equal(timer?.timerDurationBody, 'PT5M');
});

test('BPMN reconciliation preserves DURATION details and clears the false wait-kind gate', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-duration-roundtrip-'));
  const app = await startTalosOneApp({ runtimeDir });
  try {
    const process = durationProcess('Hold for treatment', {
      waitKind: 'DURATION', durationExpression: 'PT5M', durationSeconds: 300,
    });
    const projection = projectCanonicalProcessToBpmn({
      processRevision: process,
      sourceRoute: 'IMAGE_INTERPRETATION',
      createdAt: '2026-08-28T23:24:00.000Z',
      createdBy: 'duration-roundtrip-test',
    });
    const imported = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'duration-wait.bpmn',
      bpmnXml: projection.bpmnRevision.bpmnXml,
      initiatedBy: 'r1-11-field-user',
    });
    assert.equal(imported.response.status, 201);
    assert.equal(imported.body.reconciliation.status, 'RECONCILED');
    const importedWait = imported.body.reconciliation.processRevision.nodes.find((item: any) => item.kind === 'WAIT');
    assert.equal(importedWait?.details?.waitKind, 'DURATION');
    assert.equal(importedWait?.details?.durationExpression, 'PT5M');
    assert.equal(importedWait?.details?.durationSeconds, 300);
    assert.equal(imported.body.reconciliation.validation.findings.some((item: any) => item.code === 'SV-EVT-003'), false);
    assert.equal(imported.body.reconciliation.validation.findings.some((item: any) => item.code === 'SV-EVT-004'), false);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('legacy empty timer BPMN can recover an explicit numeric duration from its label without inventing timing', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-duration-legacy-'));
  const app = await startTalosOneApp({ runtimeDir });
  try {
    const process = durationProcess('Hold for 7 minutes');
    const projection = projectCanonicalProcessToBpmn({
      processRevision: process,
      sourceRoute: 'IMAGE_INTERPRETATION',
      createdAt: '2026-08-28T23:25:00.000Z',
      createdBy: 'duration-legacy-test',
    });
    assert.match(projection.bpmnRevision.bpmnXml, /<bpmn:timerEventDefinition\s*\/>/);
    const imported = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'legacy-duration-wait.bpmn',
      bpmnXml: projection.bpmnRevision.bpmnXml,
      initiatedBy: 'r1-11-field-user',
    });
    assert.equal(imported.response.status, 201);
    const importedWait = imported.body.reconciliation.processRevision.nodes.find((item: any) => item.kind === 'WAIT');
    assert.equal(importedWait?.details?.waitKind, 'DURATION');
    assert.equal(importedWait?.details?.durationExpression, 'PT7M');
    assert.equal(importedWait?.details?.durationSeconds, 420);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
