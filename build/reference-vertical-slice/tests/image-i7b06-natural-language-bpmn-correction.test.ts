import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BpmnWorkspaceService } from '../packages/application/src/bpmn-workspace.ts';
import { NaturalLanguageBpmnCorrectionService } from '../packages/application/src/bpmn-natural-language.ts';
import { LocalImageByteStore } from '../packages/image-perception/src/byte-store.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import {
  AsyncHttpBpmnCorrectionProvider,
  BPMN_CORRECTION_PROVIDER_PROTOCOL,
  type BpmnCorrectionProvider,
  type BpmnCorrectionProviderRequest,
} from '../packages/review/src/index.ts';

const baseXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_NL" targetNamespace="https://talos.local/i7b06">
  <bpmn:process id="Process_NL" isExecutable="false">
    <bpmn:startEvent id="Start_1"><bpmn:outgoing>Flow_1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Task_1" name="Receive Order"><bpmn:incoming>Flow_1</bpmn:incoming><bpmn:outgoing>Flow_2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End_1"><bpmn:incoming>Flow_2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="Start_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="End_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Process_NL">
      <bpmndi:BPMNShape id="Start_1_di" bpmnElement="Start_1"><dc:Bounds x="100" y="120" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1"><dc:Bounds x="190" y="98" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_1_di" bpmnElement="End_1"><dc:Bounds x="350" y="120" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1"><di:waypoint x="136" y="138" /><di:waypoint x="190" y="138" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2"><di:waypoint x="290" y="138" /><di:waypoint x="350" y="138" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const proposedXml = baseXml.replace('Receive Order', 'Validate Order');

function tempHarness(provider: BpmnCorrectionProvider, times = [
  '2026-08-20T22:30:00.000Z',
  '2026-08-20T22:30:01.000Z',
  '2026-08-20T22:30:02.000Z',
  '2026-08-20T22:30:03.000Z',
]) {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-i7b06-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const workspace = new BpmnWorkspaceService(repo, byteStore);
  let index = 0;
  const service = new NaturalLanguageBpmnCorrectionService(repo, provider, () => times[Math.min(index++, times.length - 1)]!);
  return {
    runtimeDir,
    repo,
    workspace,
    service,
    close() {
      repo.close();
      rmSync(runtimeDir, { recursive: true, force: true });
    },
  };
}

function proposalResponse(request: BpmnCorrectionProviderRequest, xml = proposedXml) {
  return {
    protocol: BPMN_CORRECTION_PROVIDER_PROTOCOL,
    status: 'PROPOSED',
    requestId: request.requestId,
    baseBpmnRevisionId: request.baseBpmnRevisionId,
    proposedBpmnXml: xml,
    providerClass: 'MODEL_PROVIDER',
    providerId: 'test-model-gateway',
    modelId: 'test-bpmn-editor',
    modelVersion: '1',
    pipelineVersion: 'i7b06-test',
  } as const;
}

test('I7B-06 valid model output creates a proposal and visible diff but never silently applies it', async () => {
  let captured: BpmnCorrectionProviderRequest | undefined;
  const provider: BpmnCorrectionProvider = {
    async propose(request) {
      captured = request;
      return proposalResponse(request);
    },
  };
  const h = tempHarness(provider);
  try {
    const imported = await h.workspace.importNativeBpmn({
      bpmnXml: baseXml,
      declaredName: 'nl-base.bpmn',
      initiatedBy: 'business-user',
      importedAt: '2026-08-20T22:29:00.000Z',
    });
    const result = await h.service.propose({
      baseBpmnRevisionId: imported.revision.id,
      instruction: 'Rename Receive Order to Validate Order.',
      requestedBy: 'business-user',
      requestedAt: '2026-08-20T22:29:30.000Z',
    });
    assert.equal(result.status, 'PROPOSED_FOR_REVIEW');
    if (result.status !== 'PROPOSED_FOR_REVIEW') throw new Error('proposal expected');
    assert.equal(captured?.baseBpmnRevisionId, imported.revision.id);
    assert.equal(captured?.baseBpmnXmlSha256, imported.revision.bpmnXmlSha256);
    assert.equal(captured?.baseBpmnXml, imported.revision.bpmnXml);
    assert.equal(result.proposal.status, 'PROPOSED');
    assert.equal(result.proposal.automaticApplyAuthorized, false);
    assert.equal(result.proposedRevision.parentBpmnRevisionId, imported.revision.id);
    assert.equal(result.proposedRevision.editMode, 'NATURAL_LANGUAGE_PATCH');
    assert.equal(result.proposedRevision.canonicalAlignmentStatus, 'REQUIRES_CANONICAL_RECONCILIATION');
    assert.notEqual(result.proposedRevision.semanticDigest, imported.revision.semanticDigest);
    assert.match(result.diff.unifiedPreview, /Receive Order/);
    assert.match(result.diff.unifiedPreview, /Validate Order/);
    assert.equal(h.workspace.getRevision(imported.revision.id)?.bpmnXml, baseXml);
    assert.equal(h.repo.listByKind('NaturalLanguageBpmnCorrectionProposal').length, 1);
    assert.equal(h.repo.listByKind('BpmnCorrectionAttemptRecord').length, 1);
    assert.equal(h.repo.listByKind('NaturalLanguageBpmnCorrectionDecisionRecord').length, 0);
  } finally {
    h.close();
  }
});

test('I7B-06 rejects mismatched or malformed provider output before any proposed BPMN revision exists', async () => {
  const provider: BpmnCorrectionProvider = {
    async propose(request) {
      return { ...proposalResponse(request), baseBpmnRevisionId: 'wrong-base' };
    },
  };
  const h = tempHarness(provider);
  try {
    const imported = await h.workspace.importNativeBpmn({ bpmnXml: baseXml, initiatedBy: 'user', importedAt: '2026-08-20T22:29:00.000Z' });
    const result = await h.service.propose({
      baseBpmnRevisionId: imported.revision.id,
      instruction: 'Change the task.',
      requestedBy: 'user',
    });
    assert.equal(result.status, 'SAFE_STOP_PROVIDER_FAILURE');
    assert.match(result.attempt.diagnostic ?? '', /base revision mismatch/);
    assert.equal(h.repo.listByKind('BpmnProcessRevision').length, 1);
    assert.equal(h.repo.listByKind('NaturalLanguageBpmnCorrectionProposal').length, 0);
  } finally {
    h.close();
  }
});

test('I7B-06 provider NO_RESULT, invalid BPMN, and semantic no-op are explicit safe stops', async () => {
  const modes = ['NO_RESULT', 'INVALID', 'NOOP'] as const;
  for (const mode of modes) {
    let requestSeen: BpmnCorrectionProviderRequest | undefined;
    const provider: BpmnCorrectionProvider = {
      async propose(request) {
        requestSeen = request;
        if (mode === 'NO_RESULT') {
          return {
            protocol: BPMN_CORRECTION_PROVIDER_PROTOCOL,
            status: 'NO_RESULT',
            requestId: request.requestId,
            baseBpmnRevisionId: request.baseBpmnRevisionId,
            providerClass: 'MODEL_PROVIDER',
            providerId: 'test-provider',
            modelId: 'test-model',
            modelVersion: '1',
            pipelineVersion: 'test',
            reason: 'Could not produce a defensible edit',
          };
        }
        return proposalResponse(request, mode === 'INVALID' ? '<not-bpmn>' : baseXml);
      },
    };
    const h = tempHarness(provider);
    try {
      const imported = await h.workspace.importNativeBpmn({ bpmnXml: baseXml, initiatedBy: 'user', importedAt: '2026-08-20T22:29:00.000Z' });
      const result = await h.service.propose({ baseBpmnRevisionId: imported.revision.id, instruction: 'Please fix it.', requestedBy: 'user' });
      assert.ok(requestSeen);
      assert.equal(result.status, mode === 'NO_RESULT'
        ? 'SAFE_STOP_PROVIDER_NO_RESULT'
        : mode === 'INVALID'
          ? 'SAFE_STOP_INVALID_PROPOSAL'
          : 'SAFE_STOP_NO_SEMANTIC_CHANGE');
      assert.equal(h.repo.listByKind('BpmnProcessRevision').length, 1);
      assert.equal(h.repo.listByKind('NaturalLanguageBpmnCorrectionProposal').length, 0);
      assert.equal(result.attempt.automaticApplyAuthorized, false);
    } finally {
      h.close();
    }
  }
});

test('I7B-06 accept/reject are append-only decisions; acceptance still grants no canonical, confirmation, or execution authority', async () => {
  const provider: BpmnCorrectionProvider = { async propose(request) { return proposalResponse(request); } };
  const h = tempHarness(provider);
  try {
    const imported = await h.workspace.importNativeBpmn({ bpmnXml: baseXml, initiatedBy: 'user', importedAt: '2026-08-20T22:29:00.000Z' });
    const proposed = await h.service.propose({ baseBpmnRevisionId: imported.revision.id, instruction: 'Validate the order instead.', requestedBy: 'user' });
    assert.equal(proposed.status, 'PROPOSED_FOR_REVIEW');
    if (proposed.status !== 'PROPOSED_FOR_REVIEW') throw new Error('proposal expected');

    assert.throws(() => h.service.decide({ proposalId: proposed.proposal.id, decision: 'ACCEPT', decidedBy: 'user' }), /authorityRef/);
    const accepted = h.service.decide({
      proposalId: proposed.proposal.id,
      decision: 'ACCEPT',
      decidedBy: 'user',
      authorityRef: 'business-process-owner',
      decidedAt: '2026-08-20T22:31:00.000Z',
    });
    assert.equal(accepted.proposal.status, 'ACCEPTED');
    assert.equal(accepted.decision.decision, 'ACCEPTED');
    assert.equal(accepted.decision.automaticCanonicalAlignmentAuthorized, false);
    assert.equal(accepted.decision.automaticConfirmationAuthorized, false);
    assert.equal(accepted.decision.automaticExecutionAuthorized, false);
    assert.equal(accepted.acceptedRevision?.canonicalAlignmentStatus, 'REQUIRES_CANONICAL_RECONCILIATION');
    assert.equal(h.service.getProposal(proposed.proposal.id)?.status, 'PROPOSED');
    assert.equal(h.repo.listByKind('NaturalLanguageBpmnCorrectionDecisionRecord').length, 1);
    assert.throws(() => h.service.decide({ proposalId: proposed.proposal.id, decision: 'REJECT', decidedBy: 'user' }), /already has a decision/);
  } finally {
    h.close();
  }
});

test('I7B-06 vendor-neutral HTTP provider transports exact request and returns untrusted proposal for validation', async () => {
  let received: BpmnCorrectionProviderRequest | undefined;
  const server = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    received = JSON.parse(Buffer.concat(chunks).toString('utf8')) as BpmnCorrectionProviderRequest;
    const body = JSON.stringify(proposalResponse(received));
    res.writeHead(200, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) });
    res.end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('test server failed to bind');

  const provider = new AsyncHttpBpmnCorrectionProvider({ endpoint: `http://127.0.0.1:${address.port}/correct`, timeoutMs: 5_000 });
  const h = tempHarness(provider);
  try {
    const imported = await h.workspace.importNativeBpmn({ bpmnXml: baseXml, initiatedBy: 'user', importedAt: '2026-08-20T22:29:00.000Z' });
    const result = await h.service.propose({ baseBpmnRevisionId: imported.revision.id, instruction: 'Rename the order task.', requestedBy: 'user' });
    assert.equal(result.status, 'PROPOSED_FOR_REVIEW');
    assert.equal(received?.protocol, BPMN_CORRECTION_PROVIDER_PROTOCOL);
    assert.equal(received?.baseBpmnRevisionId, imported.revision.id);
    assert.equal(received?.baseBpmnXml, imported.revision.bpmnXml);
    assert.equal(received?.instruction, 'Rename the order task.');
  } finally {
    h.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
