import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  BpmnWorkspaceService,
  decideGuidedSemanticResolution,
  initializeReview,
  proposeGuidedSemanticResolution,
  type GuidedResolutionAnswer,
} from '../packages/application/src/index.ts';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { LocalImageByteStore } from '../packages/image-perception/src/byte-store.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { validateProcessRevision } from '../packages/semantic-core/src/validation.ts';
import type { ProcessRevision } from '../packages/semantic-core/src/types.ts';
import { createOneAppSemanticResolutionRouter } from '../apps/reference-api/src/one-app-r1-11c-semantic-resolution-router.ts';

const BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R111C" targetNamespace="https://talos.local/r1-11c">
  <bpmn:process id="Process_R111C" isExecutable="false">
    <bpmn:startEvent id="Start"/>
    <bpmn:task id="Task" name="Wash vehicle"/>
    <bpmn:endEvent id="End"/>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Task"/>
    <bpmn:sequenceFlow id="F2" sourceRef="Task" targetRef="End"/>
  </bpmn:process>
</bpmn:definitions>`;

function unresolvedRevision(): ProcessRevision {
  const processId = createOpaqueId('canonical', 'r1-11c:process');
  const start = createOpaqueId('canonical', 'r1-11c:start');
  const wait = createOpaqueId('canonical', 'r1-11c:wait');
  const decision = createOpaqueId('canonical', 'r1-11c:decision');
  const yesTask = createOpaqueId('canonical', 'r1-11c:yes-task');
  const noTask = createOpaqueId('canonical', 'r1-11c:no-task');
  const end = createOpaqueId('canonical', 'r1-11c:end');
  const yesEdge = createOpaqueId('canonical', 'r1-11c:yes-edge');
  const noEdge = createOpaqueId('canonical', 'r1-11c:no-edge');
  const inferredClaim = createOpaqueId('provenance', 'r1-11c:inferred-claim');
  return {
    id: createOpaqueId('canonical', 'r1-11c:revision:1'),
    processDefinitionId: processId,
    revision: 1,
    createdAt: '2026-09-17T22:00:00.000Z',
    parentRevisionIds: [],
    derivationKind: 'IMPORT',
    sourceArtifactIds: [],
    nodes: [
      { id: start, kind: 'EVENT', name: 'Inicio', actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: wait, kind: 'WAIT', name: 'Dejar actuar 5 minutos', actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], details: { waitKind: 'UNKNOWN' }, truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: decision, kind: 'DECISION', name: '¿Es necesario lavar rines?', actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: yesTask, kind: 'ACTION', name: 'Restregar rines', actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: noTask, kind: 'ACTION', name: 'Continuar lavado', actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: end, kind: 'END', name: 'Fin', actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
    ],
    edges: [
      { id: createOpaqueId('canonical', 'r1-11c:e1'), sourceNodeId: start, targetNodeId: wait, kind: 'SEQUENCE', truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: createOpaqueId('canonical', 'r1-11c:e2'), sourceNodeId: wait, targetNodeId: decision, kind: 'SEQUENCE', truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: yesEdge, sourceNodeId: decision, targetNodeId: yesTask, kind: 'CONDITIONAL', label: 'Sí', truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: noEdge, sourceNodeId: decision, targetNodeId: noTask, kind: 'CONDITIONAL', label: 'No', truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: createOpaqueId('canonical', 'r1-11c:e5'), sourceNodeId: yesTask, targetNodeId: end, kind: 'SEQUENCE', truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: createOpaqueId('canonical', 'r1-11c:e6'), sourceNodeId: noTask, targetNodeId: end, kind: 'SEQUENCE', truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
    ],
    actors: [], variables: [], dataObjects: [], rules: [],
    semanticClaims: [{
      id: inferredClaim,
      subjectRef: yesTask,
      propertyPath: 'name',
      value: 'Restregar rines',
      perspective: 'BUSINESS_INTENT',
      truthClass: 'INFERRED',
      evidenceFragmentRefs: [],
      provenanceLinkRefs: [],
      createdAt: '2026-09-17T22:00:00.000Z',
      interpretationMethod: 'MODEL_INFERENCE',
    }],
    conflictRecords: [], annotations: [], provenanceLinks: [], sourceExtensions: [],
    semanticStatus: 'NORMALIZED', executionReadiness: 'NOT_ASSESSED', validationFindingRefs: [],
  };
}

function answers(revision: ProcessRevision, validation: ReturnType<typeof validateProcessRevision>): GuidedResolutionAnswer[] {
  return validation.findings.map((finding) => {
    const question = validation.questions.find((candidate) => candidate.findingRefs.includes(finding.id));
    if (!question) throw new Error(`missing question for ${finding.code}`);
    if (finding.code === 'SV-EVT-003') return {
      kind: 'WAIT_SEMANTICS' as const,
      questionRef: question.id,
      findingRef: finding.id,
      targetRef: question.targetRef,
      waitKind: 'DURATION' as const,
      expression: '5 minutes',
    };
    if (finding.code === 'SV-CFL-001') {
      const edge = revision.edges.find((candidate) => candidate.id === question.targetRef)!;
      return {
        kind: 'BRANCH_CONDITION' as const,
        questionRef: question.id,
        findingRef: finding.id,
        targetRef: question.targetRef,
        condition: edge.label === 'Sí' ? 'Los rines necesitan lavado adicional.' : 'Los rines no necesitan lavado adicional.',
      };
    }
    if (finding.code === 'SV-SRC-001') return {
      kind: 'MATERIAL_INFERENCE' as const,
      questionRef: question.id,
      findingRef: finding.id,
      targetRef: question.targetRef,
      claimRef: finding.targetRefs[1]!,
      confirmation: 'ACCEPT_INFERRED_MEANING' as const,
    };
    throw new Error(`unexpected finding ${finding.code}`);
  });
}

async function post(baseUrl: string, pathname: string, payload: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}${pathname}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  return { response, body: await response.json() as any };
}

test('R1-11C resolves wait, branch and inferred meaning only after explicit acceptance', () => {
  const revision = unresolvedRevision();
  const validation = validateProcessRevision(revision);
  assert.deepEqual(validation.findings.map((finding) => finding.code).sort(), ['SV-CFL-001', 'SV-CFL-001', 'SV-EVT-003', 'SV-SRC-001'].sort());
  const before = JSON.stringify(revision);
  const proposal = proposeGuidedSemanticResolution({
    processRevision: revision,
    validation,
    answers: answers(revision, validation),
    authority: { answeredBy: 'business-owner', authorityRef: 'authority:r1-11c-answers', rationale: 'These are the real process details.', answeredAt: '2026-09-17T22:01:00.000Z' },
  });
  assert.equal(proposal.createsCanonicalRevision, false);
  assert.equal(proposal.confirmsProcess, false);
  assert.equal(proposal.authorizesAutomationDesign, false);
  assert.equal(JSON.stringify(revision), before, 'proposal must not mutate canonical truth');

  const accepted = decideGuidedSemanticResolution({
    proposal,
    processRevision: revision,
    validation,
    decision: 'ACCEPT',
    decidedBy: 'business-owner',
    authorityRef: 'authority:r1-11c-accept',
    rationale: 'I accept these meanings.',
    decidedAt: '2026-09-17T22:02:00.000Z',
  });
  assert.equal(accepted.decision, 'ACCEPT');
  if (accepted.decision !== 'ACCEPT') throw new Error('expected accepted resolution');
  const wait = accepted.resolvedRevision.nodes.find((node) => node.kind === 'WAIT')!;
  assert.equal(wait.details?.waitKind, 'DURATION');
  assert.equal(wait.details?.expression, '5 minutes');
  assert.equal(accepted.resolvedRevision.rules.length, 2);
  const inferred = revision.semanticClaims[0]!;
  assert.ok(accepted.resolvedRevision.semanticClaims.some((claim) => claim.truthClass === 'CONFIRMED' && claim.supersedesClaimRefs?.includes(inferred.id)));
  assert.equal(accepted.validation.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');
  assert.equal(accepted.validation.findings.length, 0);
  assert.equal(accepted.requiresProcessReconfirmation, true);
  assert.equal(accepted.authorizesAutomationDesign, false);
  assert.equal(accepted.authorizesExecution, false);
});

test('R1-11C One-App router creates a new draft and retires the stale binding', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-11c-router-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos.sqlite'));
  const workspace = new BpmnWorkspaceService(repo, new LocalImageByteStore(path.join(runtimeDir, 'bytes')));
  const revision = unresolvedRevision();
  const validation = validateProcessRevision(revision);
  try {
    const imported = await workspace.importNativeBpmn({ bpmnXml: BPMN, declaredName: 'r1-11c.bpmn', initiatedBy: 'r1-11c-test' });
    const aligned = workspace.realignToCanonical({ revisionId: imported.revision.id, canonicalProcessRevisionId: revision.id, alignedBy: 'r1-11c-test', authorityRef: 'authority:r1-11c-align', alignedAt: '2026-09-17T22:03:00.000Z' });
    const review = initializeReview(repo, revision, validation, { createdBy: 'r1-11c-test' });
    const binding: any = {
      status: 'RECONCILED',
      sourceBpmnRevision: aligned,
      alignedBpmnRevision: aligned,
      processDefinition: { id: revision.processDefinitionId, canonicalName: 'R1-11C test', revisionIds: [revision.id] },
      processRevision: revision,
      validation,
      review,
      diagnostics: [],
    };
    const bindings = new Map<string, any>([[aligned.id, binding]]);
    const router = createOneAppSemanticResolutionRouter({ repo, workspace, bindings });
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`);
        if (await router.handle(req, res, url)) return;
        res.writeHead(404, { 'content-type': 'application/json' });res.end(JSON.stringify({ error: 'not found' }));
      } catch (error) {
        res.writeHead(400, { 'content-type': 'application/json' });res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
      }
    });
    await new Promise<void>((resolve, reject) => { server.once('error', reject);server.listen(0, '127.0.0.1', resolve); });
    const address = server.address();if (!address || typeof address === 'string') throw new Error('router test server did not bind');
    const baseUrl = `http://127.0.0.1:${address.port}`;
    try {
      const proposed = await post(baseUrl, '/api/semantic-resolution/propose', { revisionId: aligned.id, answers: answers(revision, validation), answeredBy: 'business-owner', authorityRef: 'authority:r1-11c-router-answers', rationale: 'Guided answers.' });
      assert.equal(proposed.response.status, 201);
      assert.equal(proposed.body.createsCanonicalRevision, false);
      assert.equal(proposed.body.authorizesAutomationDesign, false);
      const decided = await post(baseUrl, '/api/semantic-resolution/decide', { revisionId: aligned.id, proposalId: proposed.body.proposal.id, decision: 'ACCEPT', decidedBy: 'business-owner', authorityRef: 'authority:r1-11c-router-accept', rationale: 'Accept guided answers.' });
      assert.equal(decided.response.status, 201);
      assert.equal(decided.body.revision.state, 'DRAFT');
      assert.equal(decided.body.requiresProcessReconfirmation, true);
      assert.equal(decided.body.authorizesAutomationDesign, false);
      assert.equal(bindings.has(aligned.id), false, 'stale confirmed/review binding must be retired');
      assert.equal(bindings.has(decided.body.revision.id), true);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  } finally {
    repo.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('R1-11C default product UX is business-first and keeps internals behind Technical details', () => {
  const ui = readFileSync(path.resolve(process.cwd(), 'apps/reference-api/src/one-app-r1-11c-guided-resolution-ux-extension.ts'), 'utf8');
  const automation = readFileSync(path.resolve(process.cwd(), 'apps/reference-api/src/one-app-r1-05-automation-design-extension.ts'), 'utf8');
  assert.match(ui, /Show Talos how your process works/);
  assert.match(ui, /Technical details/);
  assert.match(ui, /A few details still need your confirmation/);
  assert.match(ui, /What are we waiting for here/);
  assert.match(ui, /When should this path be used/);
  assert.match(ui, /Is Talos’s interpretation correct/);
  assert.match(ui, /\/api\/semantic-resolution\/propose/);
  assert.match(ui, /\/api\/semantic-resolution\/decide/);
  assert.match(ui, /body:not\(\.r111cAdvanced\) \.meta/);
  assert.match(ui, /r111cFuture/);
  assert.equal(automation.includes('Automation Design did not open for the exact confirmed process.'), false);
  assert.match(automation, /Before we design the automation, confirm the missing process details above/);
  assert.match(automation, /talos:r1-11c-semantic-revision-created/);
});
