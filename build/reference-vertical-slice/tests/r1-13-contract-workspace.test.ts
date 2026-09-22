import test from 'node:test';
import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startTalosOneAppProduct } from '../apps/reference-api/src/one-app-product-server.ts';
import {
  buildTemporalWorkflowExport,
  buildTemporalWorkflowPackageTarGz,
} from '../apps/reference-api/src/temporal-workflow-export.ts';

const bpmn = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R113" targetNamespace="https://talos.local/r1-13">',
  '  <bpmn:process id="Process_R113" name="R1-13 Contract Process" isExecutable="false">',
  '    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>',
  '    <bpmn:task id="Review" name="Review request"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>',
  '    <bpmn:endEvent id="End"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>',
  '    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Review" />',
  '    <bpmn:sequenceFlow id="F2" sourceRef="Review" targetRef="End" />',
  '  </bpmn:process>',
  '</bpmn:definitions>',
].join('\n');

test('R1-13 contract is frozen and the product surface exposes the three-view workspace plus optional implementation', async () => {
  const contract = readFileSync(path.resolve(process.cwd(), '../../design/45-TALOS-PRODUCT-CONTRACT-v1.0.md'), 'utf8');
  for (const marker of [
    'Execution is optional',
    '[ Business Canvas ] [ BPMN ] [ Temporal ]',
    'TEMPORAL EXPORT READY',
    'Implement with Temporal',
    'Generate Temporal      != deploy',
    'A. CANVAS',
    'B. BPMN',
    'C. TEMPORAL EXPORT',
    'D. LIVE TEMPORAL',
  ]) assert.ok(contract.includes(marker), marker);

  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-13-ui-'));
  const app = await startTalosOneAppProduct({ port: 0, oneApp: { runtimeDir, imagePerceptionEnv: {} } });
  try {
    const html = await fetch(app.baseUrl).then((response) => response.text());
    for (const marker of [
      'Process translation workspace',
      'Business Canvas',
      'Copy XML',
      'Download .bpmn',
      'Copy workflow',
      'Download package',
      'Implement with Temporal',
      'Visual Canvas',
      'Connect selected',
      'r113ImplementationChosen',
    ]) assert.ok(html.includes(marker), marker);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('R1-13 BPMN export returns exact workspace XML without execution authority', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-13-bpmn-'));
  const app = await startTalosOneAppProduct({ port: 0, oneApp: { runtimeDir, imagePerceptionEnv: {} } });
  try {
    const imported = await fetch(app.baseUrl + '/api/input/bpmn', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fileName: 'r1-13.bpmn', bpmnXml: bpmn, initiatedBy: 'r1-13-user' }),
    });
    assert.equal(imported.status, 201);
    const body = await imported.json() as any;
    const exported = await fetch(app.baseUrl + '/api/process/bpmn/export?revisionId=' + encodeURIComponent(body.revision.id));
    assert.equal(exported.status, 200);
    assert.match(exported.headers.get('content-type') ?? '', /application\/xml/);
    assert.match(exported.headers.get('content-disposition') ?? '', /talos-process\.bpmn/);
    assert.equal(await exported.text(), bpmn);
    const status = await fetch(app.baseUrl + '/api/status').then((response) => response.json()) as any;
    assert.equal(status.deploymentAuthorized, false);
    assert.equal(status.executionAuthorized, false);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('R1-13 portable Temporal export emits portable artifacts and never grants deployment authority', () => {
  const process: any = {
    id: 'process:r1-13',
    semanticStatus: 'CONFIRMED',
    rules: [
      { id: 'rule:yes', naturalLanguage: 'Customer accepts', inputs: [], truthClass: 'CONFIRMED', unresolvedTerms: [], provenanceRefs: [] },
    ],
    nodes: [
      { id: 'node:start', kind: 'START', name: 'Start', details: {}, actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], truthClass: 'CONFIRMED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: 'node:human', kind: 'HUMAN_INTERACTION', name: 'Receive request', details: {}, actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], truthClass: 'CONFIRMED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: 'node:decision', kind: 'DECISION', name: 'Customer accepts?', details: {}, actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: ['rule:yes'], truthClass: 'CONFIRMED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: 'node:activity', kind: 'ACTION', name: 'Create booking', details: {}, actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], truthClass: 'CONFIRMED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: 'node:wait', kind: 'WAIT', name: 'Wait 30 seconds', details: { waitKind: 'DURATION', expression: '30 seconds' }, actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], truthClass: 'CONFIRMED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: 'node:end', kind: 'END', name: 'End', details: {}, actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], truthClass: 'CONFIRMED', provenanceRefs: [], sourceExtensionRefs: [] },
    ],
  };
  const execution: any = {
    revision: { id: 'execution:r1-13' },
    elements: [
      { id: 'e-start', kind: 'COORDINATION_STEP', semanticSubjectRefs: ['node:start'], capabilityUseRefs: [] },
      { id: 'e-human', kind: 'HUMAN_COORDINATION', semanticSubjectRefs: ['node:human'], capabilityUseRefs: [] },
      { id: 'e-decision', kind: 'DECISION_COORDINATION', semanticSubjectRefs: ['node:decision'], capabilityUseRefs: [] },
      { id: 'e-activity', kind: 'CAPABILITY_INVOCATION', semanticSubjectRefs: ['node:activity'], capabilityUseRefs: ['use:booking'] },
      { id: 'e-wait', kind: 'WAIT_COORDINATION', semanticSubjectRefs: ['node:wait'], capabilityUseRefs: [] },
      { id: 'e-end', kind: 'COMPLETION_COORDINATION', semanticSubjectRefs: ['node:end'], capabilityUseRefs: [] },
    ],
    relations: [
      { id: 'r1', sourceElementRef: 'e-start', targetElementRef: 'e-human', relationKind: 'SEQUENCE' },
      { id: 'r2', sourceElementRef: 'e-human', targetElementRef: 'e-decision', relationKind: 'SEQUENCE' },
      { id: 'r3', sourceElementRef: 'e-decision', targetElementRef: 'e-activity', relationKind: 'CONDITIONAL', conditionRef: 'rule:yes' },
      { id: 'r4', sourceElementRef: 'e-decision', targetElementRef: 'e-end', relationKind: 'DEFAULT' },
      { id: 'r5', sourceElementRef: 'e-activity', targetElementRef: 'e-wait', relationKind: 'SEQUENCE' },
      { id: 'r6', sourceElementRef: 'e-wait', targetElementRef: 'e-end', relationKind: 'SEQUENCE' },
    ],
    capabilityUses: [
      { id: 'use:booking', executionElementRef: 'e-activity', semanticSubjectRefs: ['node:activity'] },
    ],
  };
  const mapping: any = {
    revision: { id: 'mapping:r1-13', executionPlanRevisionRef: 'execution:r1-13', mappingDigest: 'mapping-digest-r1-13' },
    units: [
      { constructKind: 'WORKFLOW_LOGIC', executionSubjectRefs: ['e-start'] },
      { constructKind: 'UPDATE_HANDLER', executionSubjectRefs: ['e-human'] },
      { constructKind: 'WORKFLOW_CONDITION', executionSubjectRefs: ['e-human'] },
      { constructKind: 'WORKFLOW_LOGIC', executionSubjectRefs: ['e-decision'] },
      { constructKind: 'ACTIVITY', executionSubjectRefs: ['e-activity', 'use:booking'] },
      { constructKind: 'DURABLE_TIMER', executionSubjectRefs: ['e-wait'] },
      { constructKind: 'WORKFLOW_LOGIC', executionSubjectRefs: ['e-end'] },
    ],
  };
  const context: any = { process, approval: { id: 'approval:r1-13' }, executionReview: { execution }, mapping };

  const bundle = buildTemporalWorkflowExport(context, bpmn);
  assert.equal(bundle.schemaVersion, 'talos.temporal-export.v1');
  assert.equal(bundle.processRevisionId, 'process:r1-13');
  assert.equal(bundle.executionPlanRevisionId, 'execution:r1-13');
  assert.equal(bundle.temporalMappingRevisionId, 'mapping:r1-13');
  assert.equal(bundle.readiness.temporalDesignReady, true);
  assert.equal(bundle.readiness.temporalExportReady, true);
  assert.equal(bundle.readiness.temporalExecutionReady, false);
  assert.ok(bundle.readiness.blockers.includes('ACTIVITY_ADAPTER_REQUIRED:use:booking'));
  assert.deepEqual(bundle.authority, { deploymentAuthorized: false, executionAuthorized: false, automaticAuthorityGranted: false });

  const names = bundle.files.map((file) => file.path).sort();
  assert.deepEqual(names, ['README.md', 'activities.ts', 'process.bpmn', 'workflow.manifest.json', 'workflow.ts']);
  const workflow = bundle.files.find((file) => file.path === 'workflow.ts')!;
  assert.match(workflow.content, /TalosPortableWorkflow/);
  assert.match(workflow.content, /selectDecisionBranch/);
  assert.match(workflow.content, /await sleep\(element\.wait\.durationMs\)/);
  assert.match(workflow.content, /Customer accepts/);
  const activity = bundle.files.find((file) => file.path === 'activities.ts')!;
  assert.match(activity.content, /INTEGRATION_REQUIRED/);
  assert.equal(bundle.files.find((file) => file.path === 'process.bpmn')!.content, bpmn);

  const archive = gunzipSync(buildTemporalWorkflowPackageTarGz(bundle));
  const archiveText = archive.toString('utf8');
  for (const name of names) assert.ok(archiveText.includes('talos-temporal-workflow/' + name));
  assert.ok(archiveText.includes('TalosPortableWorkflow'));
  assert.ok(archiveText.includes('Exporting this package does **not** deploy a Worker'));
});


test('R1-13B Talos Canvas persists visual presentation and exports an exact portable native source', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-13b-canvas-'));
  const app = await startTalosOneAppProduct({ port: 0, oneApp: { runtimeDir, imagePerceptionEnv: {} } });
  try {
    const presentation = {
      nodeLayouts: [
        { clientElementId: 'start', x: 30, y: 40 },
        { clientElementId: 'wait', x: 220, y: 40 },
        { clientElementId: 'end', x: 410, y: 40 },
      ],
      viewport: { mode: 'BUSINESS_CANVAS' },
      zoom: 1,
    };
    const response = await fetch(app.baseUrl + '/api/input/canvas', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Portable visual Canvas',
        initiatedBy: 'r1-13b-user',
        elements: [
          { id: 'start', kind: 'START', label: 'Start' },
          { id: 'wait', kind: 'WAIT', label: 'Wait 30 seconds', waitKind: 'DURATION', expression: '30 seconds' },
          { id: 'end', kind: 'END', label: 'End' },
        ],
        connections: [
          { id: 'c1', from: 'start', to: 'wait', kind: 'FLOW' },
          { id: 'c2', from: 'wait', to: 'end', kind: 'FLOW' },
        ],
        presentation,
      }),
    });
    assert.equal(response.status, 201);
    const body = await response.json() as any;
    assert.equal(body.sourceKind, 'TALOS_CANVAS');
    assert.deepEqual(body.canvasRevision.presentationSnapshot.viewport, presentation.viewport);
    assert.equal(body.canvasRevision.presentationSnapshot.zoom, 1);
    assert.equal(body.canvasRevision.presentationSnapshot.nodeLayouts.length, 3);
    for (const layout of body.canvasRevision.presentationSnapshot.nodeLayouts) {
      assert.equal(typeof layout.clientElementId, 'string');
      assert.equal(typeof layout.canvasElementId, 'string');
      assert.ok(body.canvasRevision.elementSnapshots.some((element:any) => element.canvasElementId === layout.canvasElementId));
    }

    const exported = await fetch(
      app.baseUrl + '/api/process/canvas/export?revisionId=' + encodeURIComponent(body.canvasRevision.id),
    );
    assert.equal(exported.status, 200);
    assert.match(exported.headers.get('content-type') ?? '', /application\/json/);
    assert.match(exported.headers.get('content-disposition') ?? '', /talos-process\.talos\.json/);
    const native = await exported.json() as any;
    assert.equal(native.schemaVersion, 'talos-canvas-native-v0.2');
    assert.equal(native.canvasRevision.id, body.canvasRevision.id);
    assert.equal(native.canvasDefinition.id, body.canvasDefinition.id);
    assert.deepEqual(native.canvasRevision.presentationSnapshot, body.canvasRevision.presentationSnapshot);
    assert.equal(native.elements.length, 3);
    assert.equal(native.relationships.length, 2);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('R1-13B product errors are human-readable while technical evidence stays available', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-13b-errors-'));
  const app = await startTalosOneAppProduct({ port: 0, oneApp: { runtimeDir, imagePerceptionEnv: {} } });
  try {
    const response = await fetch(app.baseUrl + '/api/automation/temporal-export', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        approvalId: 'missing-approval',
        temporalMappingRevisionId: 'missing-mapping',
      }),
    });
    assert.ok(response.status >= 400);
    const body = await response.json() as any;
    assert.match(body.userMessage, /could not safely prepare the Temporal translation/i);
    assert.match(body.userMessage, /Nothing was deployed or started/i);
    assert.equal(body.safeState.confirmedProcessChanged, false);
    assert.equal(body.safeState.deploymentAutomaticallyAuthorized, false);
    assert.equal(body.safeState.workflowAutomaticallyStarted, false);
    assert.equal(typeof body.error, 'string');
    assert.ok(body.error.length > 0);
    assert.doesNotMatch(body.userMessage, /ExecutionPlanRevision|TemporalMappingRevision|undefined is not deterministic JSON/i);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('R1-13B HTML exposes safe visual correction, wait inspector and Canvas portability controls', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-13b-html-'));
  const app = await startTalosOneAppProduct({ port: 0, oneApp: { runtimeDir, imagePerceptionEnv: {} } });
  try {
    const html = await fetch(app.baseUrl).then((response) => response.text());
    for (const marker of [
      'Edit visually',
      'Copy Canvas JSON',
      'Download .talos.json',
      'Wait type',
      'Wait value',
      'talosCanvasPresentationSnapshot',
      'talosProductCanvas',
      'Your confirmed process is unchanged until you review and confirm a new revision.',
    ]) assert.ok(html.includes(marker), marker);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});


test('R1-13C Simple Mode keeps implementation business-facing and infrastructure details collapsible', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-13c-implementation-'));
  const app = await startTalosOneAppProduct({ port: 0, oneApp: { runtimeDir, imagePerceptionEnv: {} } });
  try {
    const html = await fetch(app.baseUrl).then((response) => response.text());
    for (const marker of [
      'Make this process live',
      '1 · Prepare execution',
      'Prepare execution',
      '2 · Prepare this environment',
      '3 · Make workflow available',
      '4 · Start this process',
      'Execution settings are ready. Nothing has been deployed.',
      'Workflow is available. The business process has not started.',
      'body.r111dSimple.r113ImplementationChosen #r111dRun .r111gRunSummary{display:none!important}',
      'Implementation selected. Export remains available and no deployment or process start happens until you explicitly authorize those steps.',
      'Implement & resolve requirements',
    ]) assert.ok(html.includes(marker), marker);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('R1-13C product journey exposes contract readiness independently from execution authority', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-13c-readiness-'));
  const app = await startTalosOneAppProduct({ port: 0, oneApp: { runtimeDir, imagePerceptionEnv: {} } });
  try {
    const initial = await fetch(app.baseUrl + '/api/product/journey').then((response) => response.json()) as any;
    assert.deepEqual(initial.readiness, {
      processReady: false,
      bpmnReady: false,
      temporalDesignReady: false,
      temporalExportReady: false,
      temporalExecutionReady: false,
      deployed: false,
      executionObserved: false,
    });
    assert.equal(initial.automaticAuthorityGranted, false);

    const imported = await fetch(app.baseUrl + '/api/input/bpmn', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fileName: 'readiness.bpmn', bpmnXml: bpmn, initiatedBy: 'r1-13c-user' }),
    });
    assert.equal(imported.status, 201);

    const afterImport = await fetch(app.baseUrl + '/api/product/journey').then((response) => response.json()) as any;
    assert.equal(afterImport.readiness.bpmnReady, true);
    assert.equal(afterImport.readiness.processReady, false);
    assert.equal(afterImport.readiness.temporalDesignReady, false);
    assert.equal(afterImport.readiness.temporalExportReady, false);
    assert.equal(afterImport.readiness.temporalExecutionReady, false);
    assert.equal(afterImport.readiness.deployed, false);
    assert.equal(afterImport.readiness.executionObserved, false);
    assert.equal(afterImport.automaticAuthorityGranted, false);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});


test('R1-13D confirmed translation workspace survives restart without rehydrating authority', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-13d-recovery-'));
  let app = await startTalosOneAppProduct({ port: 0, oneApp: { runtimeDir, imagePerceptionEnv: {} } });
  let canvasBody:any;
  try {
    const response = await fetch(app.baseUrl + '/api/input/canvas', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Durable translation workspace',
        initiatedBy: 'r1-13d-user',
        elements: [
          { id: 'start', kind: 'START', label: 'Start' },
          { id: 'step', kind: 'STEP', label: 'Receive request' },
          { id: 'end', kind: 'END', label: 'End' },
        ],
        connections: [
          { id: 'c1', from: 'start', to: 'step', kind: 'FLOW' },
          { id: 'c2', from: 'step', to: 'end', kind: 'FLOW' },
        ],
        presentation: {
          nodeLayouts: [
            { clientElementId: 'start', x: 25, y: 35 },
            { clientElementId: 'step', x: 215, y: 35 },
            { clientElementId: 'end', x: 405, y: 35 },
          ],
          viewport: { mode: 'BUSINESS_CANVAS' },
          zoom: 1,
        },
      }),
    });
    assert.equal(response.status, 201);
    canvasBody = await response.json() as any;
    const confirmation = await fetch(app.baseUrl + '/api/bpmn/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        revisionId: canvasBody.revision.id,
        canonicalProcessRevisionId: canvasBody.reconciliation.processRevision.id,
        confirmedBy: 'r1-13d-user',
        authorityRef: 'authority:r1-13d-confirm',
      }),
    });
    assert.equal(confirmation.status, 201);
  } finally {
    await app.close();
  }

  app = await startTalosOneAppProduct({ port: 0, oneApp: { runtimeDir, imagePerceptionEnv: {} } });
  try {
    const snapshot = await fetch(app.baseUrl + '/api/product/workspace-snapshot').then((response) => response.json()) as any;
    assert.equal(snapshot.version, 'talos.contract-workspace-recovery.v1');
    assert.equal(snapshot.status, 'RECOVERED');
    assert.equal(snapshot.recoveredFromDurableEvidence, true);
    assert.equal(snapshot.automaticAuthorityRehydration, false);
    assert.equal(snapshot.consumableAuthorityRecovered, false);
    assert.equal(snapshot.confirmation.status, 'CONFIRMED');
    assert.equal(snapshot.processRevision.id, canvasBody.reconciliation.processRevision.id);
    assert.equal(snapshot.bpmnRevision.state, 'CONFIRMED');
    assert.equal(snapshot.bpmnRevision.sourceRoute, 'TALOS_CANVAS');
    assert.equal(snapshot.canvas.revision.id, canvasBody.canvasRevision.id);
    assert.deepEqual(
      snapshot.canvas.revision.presentationSnapshot,
      canvasBody.canvasRevision.presentationSnapshot,
    );
    assert.equal(snapshot.automationApproval, null);
    assert.equal(snapshot.temporalMapping, null);
    assert.equal(snapshot.journey.readiness.processReady, true);
    assert.equal(snapshot.journey.readiness.bpmnReady, true);
    assert.equal(snapshot.journey.readiness.temporalDesignReady, false);

    const html = await fetch(app.baseUrl).then((response) => response.text());
    assert.ok(html.includes('/api/product/workspace-snapshot'));
    assert.ok(html.includes('recoverDurableWorkspace'));
    assert.ok(html.includes('Recovered from durable Talos history. No execution authority was restored.'));
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('R1-13D an unconfirmed BPMN draft also restores for review after restart', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-13d-draft-'));
  let app = await startTalosOneAppProduct({ port: 0, oneApp: { runtimeDir, imagePerceptionEnv: {} } });
  let imported:any;
  try {
    const response = await fetch(app.baseUrl + '/api/input/bpmn', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fileName: 'draft-recovery.bpmn', bpmnXml: bpmn, initiatedBy: 'r1-13d-user' }),
    });
    assert.equal(response.status, 201);
    imported = await response.json() as any;
  } finally {
    await app.close();
  }

  app = await startTalosOneAppProduct({ port: 0, oneApp: { runtimeDir, imagePerceptionEnv: {} } });
  try {
    const snapshot = await fetch(app.baseUrl + '/api/product/workspace-snapshot').then((response) => response.json()) as any;
    assert.equal(snapshot.status, 'RECOVERED');
    assert.equal(snapshot.confirmation, null);
    assert.equal(snapshot.bpmnRevision.id, imported.revision.id);
    assert.equal(snapshot.bpmnRevision.state, 'DRAFT');
    assert.equal(snapshot.processRevision.id, imported.reconciliation.processRevision.id);
    assert.equal(snapshot.automaticAuthorityRehydration, false);
    assert.equal(snapshot.consumableAuthorityRecovered, false);
    assert.equal(snapshot.journey.readiness.bpmnReady, true);
    assert.equal(snapshot.journey.readiness.processReady, false);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
