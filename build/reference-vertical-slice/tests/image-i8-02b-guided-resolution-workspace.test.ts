import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BpmnWorkspaceService } from '../packages/application/src/bpmn-workspace.ts';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { LocalImageByteStore } from '../packages/image-perception/src/byte-store.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { PROCESS_CONFIRMATION_PAGE } from '../apps/reference-api/src/process-confirmation-page.ts';

const BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_1" targetNamespace="https://talos.dev/test">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="Start_1"/>
    <bpmn:task id="Task_1" name="Review order"/>
    <bpmn:endEvent id="End_1"/>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="Start_1" targetRef="Task_1"/>
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="End_1"/>
  </bpmn:process>
</bpmn:definitions>`;

test('I8-02B canvas exposes guided proposal and explicit decision controls', () => {
  assert.match(PROCESS_CONFIRMATION_PAGE, /Resolve what Talos cannot safely infer/);
  assert.match(PROCESS_CONFIRMATION_PAGE, /\/api\/semantic-resolution\/propose/);
  assert.match(PROCESS_CONFIRMATION_PAGE, /\/api\/semantic-resolution\/decide/);
  assert.match(PROCESS_CONFIRMATION_PAGE, /Proposal ready\. No canonical revision has been created/);
  assert.match(PROCESS_CONFIRMATION_PAGE, /Reconfirm the process before automation design/);
});

test('I8-02B accepted meaning derives a new draft even from a confirmed BPMN', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-i8-02b-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'workspace.sqlite'));
  try {
    const workspace = new BpmnWorkspaceService(repo, new LocalImageByteStore(path.join(runtimeDir, 'bytes')));
    const imported = await workspace.importNativeBpmn({
      bpmnXml: BPMN,
      declaredName: 'guided-resolution.bpmn',
      initiatedBy: 'i8-02b-test',
      importedAt: '2026-08-21T18:30:00.000Z',
    });
    const originalCanonical = createOpaqueId('canonical', 'i8-02b-original');
    const aligned = workspace.realignToCanonical({
      revisionId: imported.revision.id,
      canonicalProcessRevisionId: originalCanonical,
      alignedBy: 'i8-02b-test',
      authorityRef: 'test:initial-alignment',
      alignedAt: '2026-08-21T18:31:00.000Z',
    });
    workspace.confirm({
      revisionId: aligned.id,
      canonicalProcessRevisionId: originalCanonical,
      confirmedBy: 'i8-02b-test',
      authorityRef: 'test:confirmation',
      confirmedAt: '2026-08-21T18:32:00.000Z',
    });
    assert.equal(workspace.getRevision(aligned.id)?.state, 'CONFIRMED');

    const resolvedCanonical = createOpaqueId('canonical', 'i8-02b-resolved');
    const reconfirmationDraft = workspace.realignToCanonical({
      revisionId: aligned.id,
      canonicalProcessRevisionId: resolvedCanonical,
      alignedBy: 'i8-02b-test',
      authorityRef: 'test:guided-resolution-acceptance',
      alignedAt: '2026-08-21T18:33:00.000Z',
    });
    assert.equal(reconfirmationDraft.state, 'DRAFT');
    assert.equal(reconfirmationDraft.parentBpmnRevisionId, aligned.id);
    assert.equal(reconfirmationDraft.canonicalProcessRevisionId, resolvedCanonical);
    assert.equal(reconfirmationDraft.canonicalAlignmentStatus, 'ALIGNED_TO_CANONICAL');
  } finally {
    repo.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
