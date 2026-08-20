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

function withFixture<T>(fn: (ctx: { repo: SqliteDocumentStore; byteStore: LocalImageByteStore; bytes: Buffer }) => T): T {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i5a02-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const bytes = readFileSync(fixturePath);
  try { return fn({ repo, byteStore, bytes }); }
  finally { repo.close(); rmSync(runtimeDir, { recursive: true, force: true }); }
}

function prepare(repo: SqliteDocumentStore, byteStore: LocalImageByteStore, bytes: Buffer) {
  const intake = intakePngUpload(repo, byteStore, bytes, {
    receivedAt: '2026-08-20T05:00:00.000Z',
    declaredName: 'Quarry 02 — Aqua Distilled Water Order & Delivery',
  });
  const perception = runImagePerception(repo, intake, new ReferenceQuarryPerceptionProvider(), {
    now: '2026-08-20T05:00:01.000Z',
    materializeCommonEvidence: true,
  });
  assert.ok(perception.attempt.result);
  const semantic = normalizeAndValidateImageResult(repo, perception.attempt.result!.id, {
    normalizedAt: '2026-08-20T05:00:02.000Z',
    assessedAt: '2026-08-20T05:00:03.000Z',
  });
  const review = initializeReview(repo, semantic.normalization.processRevision, semantic.validation, {
    createdAt: '2026-08-20T05:00:04.000Z',
    createdBy: 'image-reviewer',
    sourceRepresentationRefs: [intake.representation.id],
    adapterResultContextRefs: [perception.attempt.result!.id],
  });
  const allInferred = semantic.normalization.processRevision.semanticClaims.map((claim) => claim.id);
  const confirmation: ReviewCommand = {
    id: createOpaqueId('review', `i5a02-confirm:${semantic.normalization.processRevision.id}`),
    clientRequestKey: `i5a02-confirm-${semantic.normalization.processRevision.id}`,
    reviewWorkspaceDefinitionId: review.context.workspaceDefinition.id,
    expectedReviewWorkspaceRevisionId: review.context.workspaceRevision.id,
    expectedReviewBaselineBundleId: review.context.baselineBundle.id,
    primarySemanticScopeRef: semantic.validation.assessment.primaryScopeRef,
    targetSemanticScopeRefs: [semantic.validation.assessment.primaryScopeRef],
    actionKind: 'CONFIRM',
    targetSubjectRefs: [...new Set(semantic.normalization.processRevision.semanticClaims.map((claim) => claim.subjectRef))],
    selectedClaimRefs: allInferred,
    rationale: 'Explicitly confirm current image-derived semantic candidate before authoring corrections.',
    authorityRef: 'reference-image-business-reviewer',
    requestedBy: 'image-reviewer',
    requestedAt: '2026-08-20T05:00:05.000Z',
  };
  const confirmed = applyClaimConfirmation(repo, review.context, semantic.normalization.processRevision, semantic.validation, confirmation);
  assert.equal(confirmed.application.result, 'APPLIED');
  return {
    intake,
    perception,
    initial: semantic,
    current: {
      context: confirmed.nextContext!,
      process: confirmed.candidateProcessRevision!,
      validation: confirmed.candidateValidation!,
    },
  };
}

type Current = { context: ReviewContextBundle; process: ProcessRevision; validation: ValidationBundle };

function command(current: Current, seq: number, input: Partial<ReviewCommand> & Pick<ReviewCommand, 'actionKind'>): ReviewCommand {
  return {
    id: createOpaqueId('review', `i5a02-command:${seq}:${current.process.id}:${input.actionKind}`),
    clientRequestKey: `i5a02-${seq}-${current.process.id}`,
    reviewWorkspaceDefinitionId: current.context.workspaceDefinition.id,
    expectedReviewWorkspaceRevisionId: current.context.workspaceRevision.id,
    expectedReviewBaselineBundleId: current.context.baselineBundle.id,
    primarySemanticScopeRef: current.validation.assessment.primaryScopeRef,
    targetSemanticScopeRefs: [current.validation.assessment.primaryScopeRef],
    actionKind: input.actionKind,
    targetSubjectRefs: input.targetSubjectRefs ?? [],
    ...(input.targetPropertyPath ? { targetPropertyPath: input.targetPropertyPath } : {}),
    ...(input.proposedValue !== undefined ? { proposedValue: input.proposedValue } : {}),
    rationale: input.rationale ?? 'Explicit reviewer-authored semantic correction.',
    authorityRef: input.authorityRef ?? 'reference-image-business-reviewer',
    requestedBy: input.requestedBy ?? 'image-reviewer',
    requestedAt: input.requestedAt ?? `2026-08-20T05:00:${String(5 + seq).padStart(2, '0')}.000Z`,
  };
}

function apply(repo: SqliteDocumentStore, current: Current, cmd: ReviewCommand): Current {
  const result = applySemanticCorrection(repo, current.context, current.process, current.validation, cmd);
  assert.equal(result.application.result, 'APPLIED');
  assert.equal(result.diffGuard?.result, 'WITHIN_INTENT');
  assert.ok(result.candidateProcessRevision);
  assert.ok(result.candidateValidation);
  assert.ok(result.nextContext);
  return { context: result.nextContext!, process: result.candidateProcessRevision!, validation: result.candidateValidation! };
}

function byName(process: ProcessRevision, name: string) {
  const node = process.nodes.find((item) => item.name === name);
  assert.ok(node, `node ${name} must exist`);
  return node!;
}

function fullCorrection(repo: SqliteDocumentStore, prepared: ReturnType<typeof prepare>): Current {
  let current = prepared.current;
  const deliverWater = byName(current.process, 'Deliver Water');

  current = apply(repo, current, command(current, 1, {
    actionKind: 'ADD_PROCESS_ELEMENT',
    proposedValue: {
      kind: 'END',
      name: 'Order fulfilled',
      afterSubjectRef: deliverWater.id,
      relationshipKind: 'SEQUENCE',
    },
    rationale: 'Business reviewer explicitly states that successful delivery completes the process as Order fulfilled.',
  }));

  const arrangeDelivery = byName(current.process, 'Arrange Delivery');
  current = apply(repo, current, command(current, 2, {
    actionKind: 'CORRECT_PROPERTY',
    targetSubjectRefs: [arrangeDelivery.id],
    targetPropertyPath: 'details.subprocessMode',
    proposedValue: 'COLLAPSED_SUBPROCESS',
    rationale: 'Business reviewer confirms this is a collapsed subprocess boundary; no runtime primitive is implied.',
  }));

  const decision = byName(current.process, 'Customer Exist?');
  const createCustomer = byName(current.process, 'Create Customer Account');
  const nextWednesday = byName(current.process, 'On Next Wednesday');
  const noEdge = current.process.edges.find((edge) => edge.sourceNodeId === decision.id && edge.targetNodeId === createCustomer.id);
  const yesEdge = current.process.edges.find((edge) => edge.sourceNodeId === decision.id && edge.targetNodeId === nextWednesday.id);
  assert.ok(noEdge && yesEdge);
  assert.equal(noEdge!.kind, 'CONDITIONAL');
  assert.equal(yesEdge!.kind, 'CONDITIONAL');

  current = apply(repo, current, command(current, 3, {
    actionKind: 'CORRECT_PROPERTY',
    targetSubjectRefs: [noEdge!.id],
    targetPropertyPath: 'conditionRuleRef',
    proposedValue: {
      naturalLanguage: 'Customer does not exist',
      expression: { fact: 'customerExists', operator: 'EQUALS', value: false },
    },
    rationale: 'Business reviewer authors the structured NO-branch business rule.',
  }));

  const decisionAfterNo = byName(current.process, 'Customer Exist?');
  const nextWednesdayAfterNo = byName(current.process, 'On Next Wednesday');
  const yesEdgeAfterNo = current.process.edges.find((edge) => edge.sourceNodeId === decisionAfterNo.id && edge.targetNodeId === nextWednesdayAfterNo.id);
  assert.ok(yesEdgeAfterNo);
  current = apply(repo, current, command(current, 4, {
    actionKind: 'CORRECT_PROPERTY',
    targetSubjectRefs: [yesEdgeAfterNo!.id],
    targetPropertyPath: 'conditionRuleRef',
    proposedValue: {
      naturalLanguage: 'Customer exists',
      expression: { fact: 'customerExists', operator: 'EQUALS', value: true },
    },
    rationale: 'Business reviewer authors the structured YES-branch business rule.',
  }));

  return current;
}

test('I5A-02 rejects stale or authority-free corrections before semantic acceptance', () => {
  withFixture(({ repo, byteStore, bytes }) => {
    const prepared = prepare(repo, byteStore, bytes);
    const subprocess = byName(prepared.current.process, 'Arrange Delivery');
    const noAuthority = command(prepared.current, 20, {
      actionKind: 'CORRECT_PROPERTY',
      targetSubjectRefs: [subprocess.id],
      targetPropertyPath: 'details.subprocessMode',
      proposedValue: 'COLLAPSED_SUBPROCESS',
      authorityRef: undefined,
    });
    delete (noAuthority as any).authorityRef;
    const authorityResult = applySemanticCorrection(repo, prepared.current.context, prepared.current.process, prepared.current.validation, noAuthority);
    assert.equal(authorityResult.application.result, 'REJECTED_AUTHORITY');

    const stale = command(prepared.current, 21, {
      actionKind: 'CORRECT_PROPERTY',
      targetSubjectRefs: [subprocess.id],
      targetPropertyPath: 'details.subprocessMode',
      proposedValue: 'COLLAPSED_SUBPROCESS',
    });
    stale.expectedReviewWorkspaceRevisionId = createOpaqueId('review', 'stale-workspace');
    const staleResult = applySemanticCorrection(repo, prepared.current.context, prepared.current.process, prepared.current.validation, stale);
    assert.equal(staleResult.application.result, 'REJECTED_STALE');
  });
});

test('I5A-02 ADD_PROCESS_ELEMENT can add explicit attached completion without mutating image or Canvas history', () => {
  withFixture(({ repo, byteStore, bytes }) => {
    const prepared = prepare(repo, byteStore, bytes);
    const beforeAttempts = repo.listByKind('AdapterAttemptStart').length;
    const beforeObservations = repo.listByKind('PerceptionObservation').length;
    const beforeHash = prepared.intake.representation.contentHash;
    const deliver = byName(prepared.current.process, 'Deliver Water');
    const result = applySemanticCorrection(repo, prepared.current.context, prepared.current.process, prepared.current.validation, command(prepared.current, 30, {
      actionKind: 'ADD_PROCESS_ELEMENT',
      proposedValue: { kind: 'END', name: 'Order fulfilled', afterSubjectRef: deliver.id, relationshipKind: 'SEQUENCE' },
    }));

    assert.equal(result.application.result, 'APPLIED');
    const end = byName(result.candidateProcessRevision!, 'Order fulfilled');
    assert.equal(end.kind, 'END');
    assert.equal(end.truthClass, 'CONFIRMED');
    const attachment = result.candidateProcessRevision!.edges.find((edge) => edge.sourceNodeId === deliver.id && edge.targetNodeId === end.id);
    assert.ok(attachment);
    assert.equal(attachment!.kind, 'SEQUENCE');
    assert.equal(result.candidateValidation!.findings.some((finding) => finding.code === 'SV-CMP-001'), false);
    assert.equal(repo.listByKind('AdapterAttemptStart').length, beforeAttempts);
    assert.equal(repo.listByKind('PerceptionObservation').length, beforeObservations);
    assert.equal(prepared.intake.representation.contentHash, beforeHash);
    assert.equal(repo.listByKind('CanvasRevision').length, 0);
    assert.equal(result.authoredRevision?.sourceCanvasRevisionRef, undefined);
  });
});

test('I5A-02 ADD_RELATIONSHIP is a separate generic reviewer primitive', () => {
  withFixture(({ repo, byteStore, bytes }) => {
    const prepared = prepare(repo, byteStore, bytes);
    let current = prepared.current;
    const addState = applySemanticCorrection(repo, current.context, current.process, current.validation, command(current, 40, {
      actionKind: 'ADD_PROCESS_ELEMENT',
      proposedValue: { kind: 'STATE', name: 'Reviewer checkpoint' },
    }));
    assert.equal(addState.application.result, 'APPLIED');
    current = { context: addState.nextContext!, process: addState.candidateProcessRevision!, validation: addState.candidateValidation! };
    const deliver = byName(current.process, 'Deliver Water');
    const checkpoint = byName(current.process, 'Reviewer checkpoint');
    const relation = applySemanticCorrection(repo, current.context, current.process, current.validation, command(current, 41, {
      actionKind: 'ADD_RELATIONSHIP',
      proposedValue: { sourceNodeRef: deliver.id, targetNodeRef: checkpoint.id, kind: 'SEQUENCE', label: 'reviewer-authored relationship' },
    }));
    assert.equal(relation.application.result, 'APPLIED');
    assert.equal(relation.diffGuard?.result, 'WITHIN_INTENT');
    assert.ok(relation.candidateProcessRevision!.edges.some((edge) => edge.sourceNodeId === deliver.id && edge.targetNodeId === checkpoint.id && edge.kind === 'SEQUENCE'));
  });
});

test('I5A-02 structured branch rules and subprocess correction are first-class reviewer-authored semantics', () => {
  withFixture(({ repo, byteStore, bytes }) => {
    const prepared = prepare(repo, byteStore, bytes);
    const final = fullCorrection(repo, prepared);
    const arrange = byName(final.process, 'Arrange Delivery');
    assert.equal(arrange.details?.subprocessMode, 'COLLAPSED_SUBPROCESS');
    assert.equal(final.process.rules.length, 2);
    assert.equal(final.process.rules.every((rule) => rule.truthClass === 'CONFIRMED'), true);
    assert.deepEqual(final.process.rules.map((rule) => rule.naturalLanguage).sort(), ['Customer does not exist', 'Customer exists']);
    const conditional = final.process.edges.filter((edge) => edge.kind === 'CONDITIONAL');
    assert.equal(conditional.length, 2);
    assert.equal(conditional.every((edge) => Boolean(edge.conditionRuleRef)), true);
    assert.equal(conditional.every((edge) => final.process.rules.some((rule) => rule.id === edge.conditionRuleRef)), true);
    assert.equal(repo.listByKind('ReviewAuthoredSourceRevision').length >= 5, true, 'confirmation plus each reviewer correction must remain auditable');
    assert.equal(repo.listByKind('ReviewConfirmationRecord').length > 0, true);
  });
});

test('I5A-02 closes its own correction targets but hardened v0.2 validation keeps broader Quarry readiness insufficient', () => {
  withFixture(({ repo, byteStore, bytes }) => {
    const prepared = prepare(repo, byteStore, bytes);
    const initialCodes = prepared.current.validation.findings.map((finding) => finding.code);
    assert.ok(initialCodes.includes('SV-CMP-001'));
    assert.ok(initialCodes.includes('SV-SUB-002'));
    assert.equal(initialCodes.filter((code) => code === 'SV-CFL-001').length, 2);

    const final = fullCorrection(repo, prepared);
    const codes = final.validation.findings.map((finding) => finding.code);
    assert.equal(codes.includes('SV-CMP-001'), false);
    assert.equal(codes.includes('SV-SUB-002'), false);
    assert.equal(codes.includes('SV-CFL-001'), false);
    assert.equal(codes.includes('SV-SRC-001'), false);
    assert.ok(codes.includes('SV-STR-001'), 'company process entry/trigger must remain unresolved');
    assert.ok(codes.includes('SV-EVT-001'), 'accepted WAIT still lacks a business resume/time class');
    assert.ok(codes.includes('SV-SUB-001'), 'collapsed subprocess boundary does not reveal internals');
    assert.ok(codes.includes('SV-COR-001'), 'message interaction still lacks accepted correlation identity');
    assert.equal(final.validation.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');
    assert.equal(final.validation.assessment.semanticVerdict, 'VALID_WITH_FINDINGS');
    assert.equal(final.process.parentRevisionIds.length, 1);
    assert.equal(final.process.derivationKind, 'HUMAN_CONFIRMATION');
    assert.equal(repo.listByKind('FindingDisposition').length >= 4, true);
  });
});

test('I5A-02 insufficient readiness still creates no freeze, capability, execution or Temporal artifacts', () => {
  withFixture(({ repo, byteStore, bytes }) => {
    const prepared = prepare(repo, byteStore, bytes);
    const final = fullCorrection(repo, prepared);
    assert.equal(final.validation.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');
    assert.equal(repo.listByKind('SemanticFreezeRecord').length, 0);
    assert.equal(repo.listByKind('CapabilityDesignRevision').length, 0);
    assert.equal(repo.listByKind('CapabilityBindingRevision').length, 0);
    assert.equal(repo.listByKind('ExecutionPlanRevision').length, 0);
    assert.equal(repo.listByKind('TemporalMappingRevision').length, 0);
    assert.equal(repo.listByKind('RuntimePolicyRevision').length, 0);
    assert.equal(repo.listByKind('DeploymentRevision').length, 0);
    assert.equal(repo.listByKind('WorkflowExecutionObservation').length, 0);
  });
});