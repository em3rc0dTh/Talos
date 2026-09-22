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
