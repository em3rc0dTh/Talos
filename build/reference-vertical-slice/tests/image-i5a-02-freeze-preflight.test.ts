import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import {
  LocalImageByteStore,
  ReferenceQuarryPerceptionProvider,
  intakePngUpload,
  runImagePerception,
} from '../packages/image-perception/src/index.ts';
import { normalizeAndValidateImageResult } from '../packages/application/src/image-semantic.ts';
import { initializeReview } from '../packages/application/src/review.ts';
import { applyClaimConfirmation } from '../packages/application/src/semantic-review.ts';
import { applySemanticCorrection } from '../packages/application/src/semantic-correction.ts';
import type { ProcessRevision, ValidationBundle } from '../packages/semantic-core/src/types.ts';
import type { ReviewCommand } from '../packages/review/src/types.ts';
import type { ReviewContextBundle } from '../packages/review/src/workspace.ts';

const fixturePath = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png');

type Current = { context: ReviewContextBundle; process: ProcessRevision; validation: ValidationBundle };

function byName(process: ProcessRevision, name: string) {
  const node = process.nodes.find((item) => item.name === name);
  assert.ok(node, `node ${name} must exist`);
  return node!;
}

function correctionCommand(current: Current, seq: number, input: Partial<ReviewCommand> & Pick<ReviewCommand, 'actionKind'>): ReviewCommand {
  return {
    id: createOpaqueId('review', `i5a02-preflight:${seq}:${current.process.id}:${input.actionKind}`),
    clientRequestKey: `i5a02-preflight-${seq}-${current.process.id}`,
    reviewWorkspaceDefinitionId: current.context.workspaceDefinition.id,
    expectedReviewWorkspaceRevisionId: current.context.workspaceRevision.id,
    expectedReviewBaselineBundleId: current.context.baselineBundle.id,
    primarySemanticScopeRef: current.validation.assessment.primaryScopeRef,
    targetSemanticScopeRefs: [current.validation.assessment.primaryScopeRef],
    actionKind: input.actionKind,
    targetSubjectRefs: input.targetSubjectRefs ?? [],
    ...(input.targetPropertyPath ? { targetPropertyPath: input.targetPropertyPath } : {}),
    ...(input.proposedValue !== undefined ? { proposedValue: input.proposedValue } : {}),
    rationale: input.rationale ?? 'Explicit reviewer-authored semantic correction for I5A-02 freeze preflight.',
    authorityRef: 'reference-image-business-reviewer',
    requestedBy: 'image-reviewer',
    requestedAt: `2026-08-20T06:00:${String(10 + seq).padStart(2, '0')}.000Z`,
  };
}

function apply(repo: SqliteDocumentStore, current: Current, cmd: ReviewCommand): Current {
  const result = applySemanticCorrection(repo, current.context, current.process, current.validation, cmd);
  assert.equal(result.application.result, 'APPLIED');
  assert.equal(result.diffGuard?.result, 'WITHIN_INTENT');
  assert.ok(result.candidateProcessRevision && result.candidateValidation && result.nextContext);
  return { context: result.nextContext!, process: result.candidateProcessRevision!, validation: result.candidateValidation! };
}

function weaklyConnected(process: ProcessRevision): boolean {
  if (process.nodes.length === 0) return true;
  const adjacency = new Map(process.nodes.map((node) => [node.id, new Set<string>()]));
  for (const edge of process.edges) {
    if (!adjacency.has(edge.sourceNodeId) || !adjacency.has(edge.targetNodeId)) continue;
    adjacency.get(edge.sourceNodeId)!.add(edge.targetNodeId);
    adjacency.get(edge.targetNodeId)!.add(edge.sourceNodeId);
  }
  const visited = new Set<string>();
  const queue = [process.nodes[0].id as string];
  while (queue.length) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of adjacency.get(current as any) ?? []) if (!visited.has(next)) queue.push(next);
  }
  return visited.size === process.nodes.length;
}

function prepare(repo: SqliteDocumentStore, byteStore: LocalImageByteStore, bytes: Buffer) {
  const intake = intakePngUpload(repo, byteStore, bytes, {
    receivedAt: '2026-08-20T06:00:00.000Z',
    declaredName: 'Quarry 02 — Aqua Distilled Water Order & Delivery',
  });
  const perception = runImagePerception(repo, intake, new ReferenceQuarryPerceptionProvider(), {
    now: '2026-08-20T06:00:01.000Z',
    materializeCommonEvidence: true,
  });
  assert.ok(perception.attempt.result);
  const semantic = normalizeAndValidateImageResult(repo, perception.attempt.result!.id, {
    normalizedAt: '2026-08-20T06:00:02.000Z',
    assessedAt: '2026-08-20T06:00:03.000Z',
  });
  const review = initializeReview(repo, semantic.normalization.processRevision, semantic.validation, {
    createdAt: '2026-08-20T06:00:04.000Z',
    createdBy: 'image-reviewer',
    sourceRepresentationRefs: [intake.representation.id],
    adapterResultContextRefs: [perception.attempt.result!.id],
  });
  const confirmation: ReviewCommand = {
    id: createOpaqueId('review', `i5a02-preflight-confirm:${semantic.normalization.processRevision.id}`),
    clientRequestKey: `i5a02-preflight-confirm-${semantic.normalization.processRevision.id}`,
    reviewWorkspaceDefinitionId: review.context.workspaceDefinition.id,
    expectedReviewWorkspaceRevisionId: review.context.workspaceRevision.id,
    expectedReviewBaselineBundleId: review.context.baselineBundle.id,
    primarySemanticScopeRef: semantic.validation.assessment.primaryScopeRef,
    targetSemanticScopeRefs: [semantic.validation.assessment.primaryScopeRef],
    actionKind: 'CONFIRM',
    targetSubjectRefs: [...new Set(semantic.normalization.processRevision.semanticClaims.map((claim) => claim.subjectRef))],
    selectedClaimRefs: semantic.normalization.processRevision.semanticClaims.map((claim) => claim.id),
    rationale: 'Explicitly confirm the current image-derived candidate before semantic corrections.',
    authorityRef: 'reference-image-business-reviewer',
    requestedBy: 'image-reviewer',
    requestedAt: '2026-08-20T06:00:05.000Z',
  };
  const confirmed = applyClaimConfirmation(repo, review.context, semantic.normalization.processRevision, semantic.validation, confirmation);
  assert.equal(confirmed.application.result, 'APPLIED');
  return {
    intake,
    perception,
    initialProcess: semantic.normalization.processRevision,
    current: { context: confirmed.nextContext!, process: confirmed.candidateProcessRevision!, validation: confirmed.candidateValidation! } as Current,
  };
}

function fullyCorrect(repo: SqliteDocumentStore, currentInput: Current): Current {
  let current = currentInput;
  const deliver = byName(current.process, 'Deliver Water');
  current = apply(repo, current, correctionCommand(current, 1, {
    actionKind: 'ADD_PROCESS_ELEMENT',
    proposedValue: { kind: 'END', name: 'Order fulfilled', afterSubjectRef: deliver.id, relationshipKind: 'SEQUENCE' },
  }));

  const subprocess = byName(current.process, 'Arrange Delivery');
  current = apply(repo, current, correctionCommand(current, 2, {
    actionKind: 'CORRECT_PROPERTY',
    targetSubjectRefs: [subprocess.id],
    targetPropertyPath: 'details.subprocessMode',
    proposedValue: 'COLLAPSED_SUBPROCESS',
  }));

  const decision = byName(current.process, 'Customer Exist?');
  const createCustomer = byName(current.process, 'Create Customer Account');
  const wednesday = byName(current.process, 'On Next Wednesday');
  const noEdge = current.process.edges.find((edge) => edge.sourceNodeId === decision.id && edge.targetNodeId === createCustomer.id)!;
  current = apply(repo, current, correctionCommand(current, 3, {
    actionKind: 'CORRECT_PROPERTY',
    targetSubjectRefs: [noEdge.id],
    targetPropertyPath: 'conditionRuleRef',
    proposedValue: { naturalLanguage: 'Customer does not exist', expression: { fact: 'customerExists', operator: 'EQUALS', value: false } },
  }));

  const decisionAfterNo = byName(current.process, 'Customer Exist?');
  const wednesdayAfterNo = byName(current.process, 'On Next Wednesday');
  const yesEdge = current.process.edges.find((edge) => edge.sourceNodeId === decisionAfterNo.id && edge.targetNodeId === wednesdayAfterNo.id)!;
  current = apply(repo, current, correctionCommand(current, 4, {
    actionKind: 'CORRECT_PROPERTY',
    targetSubjectRefs: [yesEdge.id],
    targetPropertyPath: 'conditionRuleRef',
    proposedValue: { naturalLanguage: 'Customer exists', expression: { fact: 'customerExists', operator: 'EQUALS', value: true } },
  }));
  return current;
}

test('I5A-02 freeze preflight proves the ready graph is structurally defensible and historically append-only', () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i5a02-preflight-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const bytes = readFileSync(fixturePath);
  try {
    const prepared = prepare(repo, byteStore, bytes);
    const countsBefore = {
      attempts: repo.listByKind('AdapterAttemptStart').length,
      observations: repo.listByKind('PerceptionObservation').length,
      alternatives: repo.listByKind('PerceptionAlternativeSet').length,
      artifacts: repo.listByKind('SourceArtifact').length,
      representations: repo.listByKind('SourceRepresentation').length,
      canvas: repo.listByKind('CanvasRevision').length,
    };
    const sourceHash = prepared.intake.representation.contentHash;
    const confirmedRevisionId = prepared.current.process.id;
    const final = fullyCorrect(repo, prepared.current);

    assert.equal(final.validation.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');
    assert.equal(final.validation.assessment.semanticVerdict, 'VALID');
    assert.equal(final.process.executionReadiness, 'NOT_ASSESSED', 'readiness authority belongs to ValidationAssessment, not ProcessRevision mutation');
    assert.equal(final.context.workspaceRevision.baselineProcessRevisionId, final.process.id);
    assert.equal(final.context.workspaceRevision.baselineValidationAssessmentId, final.validation.assessment.id);

    const end = byName(final.process, 'Order fulfilled');
    const inboundEnd = final.process.edges.filter((edge) => edge.targetNodeId === end.id);
    const outboundEnd = final.process.edges.filter((edge) => edge.sourceNodeId === end.id);
    assert.equal(inboundEnd.length, 1, 'explicit completion must have one bounded inbound business flow in this fixture');
    assert.equal(inboundEnd[0].kind, 'SEQUENCE');
    assert.equal(byName(final.process, 'Deliver Water').id, inboundEnd[0].sourceNodeId);
    assert.equal(outboundEnd.length, 0, 'END must not continue through ordinary process flow');
    assert.equal(weaklyConnected(final.process), true, 'full corrected process graph must not contain orphan process nodes');

    const decision = byName(final.process, 'Customer Exist?');
    const conditional = final.process.edges.filter((edge) => edge.sourceNodeId === decision.id && edge.kind === 'CONDITIONAL');
    assert.equal(conditional.length, 2);
    const ruleRefs = conditional.map((edge) => edge.conditionRuleRef);
    assert.equal(new Set(ruleRefs).size, 2, 'the two decision branches must not collapse onto one rule');
    const branchRules = ruleRefs.map((ref) => final.process.rules.find((rule) => rule.id === ref));
    assert.equal(branchRules.every(Boolean), true);
    const expressions = branchRules.map((rule) => rule!.expression as any);
    assert.deepEqual(expressions.map((expr) => expr.fact), ['customerExists', 'customerExists']);
    assert.deepEqual(expressions.map((expr) => expr.operator), ['EQUALS', 'EQUALS']);
    assert.deepEqual(new Set(expressions.map((expr) => expr.value)), new Set([false, true]), 'bounded YES/NO rules must be materially opposite');

    const subprocess = byName(final.process, 'Arrange Delivery');
    assert.equal(subprocess.details?.subprocessMode, 'COLLAPSED_SUBPROCESS');
    assert.equal(JSON.stringify(subprocess).includes('CHILD_WORKFLOW'), false);
    assert.equal(JSON.stringify(subprocess).includes('ACTIVITY'), false);

    const correctionCommands = repo.listByKind<ReviewCommand>('ReviewCommand').map((item) => item.payload)
      .filter((cmd) => ['CORRECT_PROPERTY', 'ADD_PROCESS_ELEMENT', 'ADD_RELATIONSHIP'].includes(cmd.actionKind));
    assert.equal(correctionCommands.length, 4);
    assert.equal(correctionCommands.every((cmd) => Boolean(cmd.authorityRef)), true);
    const correctionApplications = repo.listByKind<any>('ReviewCommandApplication').map((item) => item.payload)
      .filter((application) => correctionCommands.some((cmd) => cmd.id === application.reviewCommandId));
    assert.equal(correctionApplications.length, 4);
    assert.equal(correctionApplications.every((application) => application.result === 'APPLIED' && application.reviewAuthoredSourceRevisionRef), true);

    const processRevisions = repo.listByKind<ProcessRevision>('ProcessRevision').map((item) => item.payload)
      .filter((revision) => revision.processDefinitionId === final.process.processDefinitionId)
      .sort((a, b) => a.revision - b.revision);
    const fromConfirmed = processRevisions.slice(processRevisions.findIndex((revision) => revision.id === confirmedRevisionId));
    assert.equal(fromConfirmed.length, 5, 'confirmed baseline plus four semantic corrections must remain as five immutable revisions');
    for (let index = 1; index < fromConfirmed.length; index += 1) {
      assert.equal(fromConfirmed[index].revision, fromConfirmed[index - 1].revision + 1);
      assert.deepEqual(fromConfirmed[index].parentRevisionIds, [fromConfirmed[index - 1].id]);
    }

    assert.equal(repo.listByKind('AdapterAttemptStart').length, countsBefore.attempts);
    assert.equal(repo.listByKind('PerceptionObservation').length, countsBefore.observations);
    assert.equal(repo.listByKind('PerceptionAlternativeSet').length, countsBefore.alternatives);
    assert.equal(repo.listByKind('SourceArtifact').length, countsBefore.artifacts);
    assert.equal(repo.listByKind('SourceRepresentation').length, countsBefore.representations);
    assert.equal(repo.listByKind('CanvasRevision').length, countsBefore.canvas);
    assert.equal(prepared.intake.representation.contentHash, sourceHash);

    assert.equal(repo.listByKind('SemanticFreezeRecord').length, 0);
    assert.equal(repo.listByKind('ExecutionPlanRevision').length, 0);
    assert.equal(repo.listByKind('TemporalMappingRevision').length, 0);
  } finally {
    repo.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
