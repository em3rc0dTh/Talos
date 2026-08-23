import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { LocalImageByteStore } from '../packages/image-perception/src/byte-store.ts';
import { designGenericCapabilities } from '../packages/capability/src/generic-design.ts';
import { openAutomationDesignWorkspace } from '../packages/capability/src/automation-design-workspace.ts';
import { selectAndBindAutomationCapabilities } from '../packages/capability/src/automation-capability-selection.ts';
import { openAutomationExecutionPlanReview } from '../packages/execution/src/automation-execution-review.ts';
import { approveAutomationDesign } from '../packages/execution/src/automation-approval.ts';
import { designApprovedAutomationTemporalMapping } from '../packages/temporal-design/src/approved-mapping.ts';
import { persistAutomationDesignApproval, persistAutomationExecutionPlanReview } from '../packages/application/src/execution-design.ts';
import { persistAutomationCapabilitySelection, persistGenericCapabilityDesign } from '../packages/application/src/capability.ts';
import { buildExecutableQuarry01ImageReview } from './helpers/quarry01-executable-image.ts';
import { buildFrozenQuarry02ImageReview } from './helpers/quarry02-frozen-image.ts';

const Q01 = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-01-order-process/imagen_2026-08-18_204857678.png');
const Q02 = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png');
const AT = '2026-08-23T22:30:00.000Z';

function explicitSelections(base: ReturnType<typeof designGenericCapabilities>) {
  return base.requirements.map((requirement, index) => ({
    source: 'EXPLICIT_OFFERING' as const,
    requirementRef: requirement.id,
    family: 'SYSTEM_OPERATION' as const,
    offeringCanonicalName: `I8_06_SYSTEM_OPERATION_${index + 1}`,
    offeringLifecycleStatus: 'TEST_ONLY' as const,
    implementationKind: 'INTERNAL_SERVICE' as const,
    implementationRef: `i8-06-system-operation:${requirement.id}`,
    decidedBy: 'i8-06-automation-designer',
    authorityRef: 'authority:i8-06-capability-selection',
    rationale: 'TEST_ONLY explicit capability selection; source labels do not select implementation providers.',
  }));
}

function q01() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-i8-06-q01-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(dir, 'bytes'));
  const image = buildExecutableQuarry01ImageReview(repo, byteStore, readFileSync(Q01));
  const current = image.current;
  const base = designGenericCapabilities(current.process, current.validation.scope, current.validation.assessment, image.freeze, image.scopeFreeze, AT);
  const workspace = openAutomationDesignWorkspace(base, AT);
  const selection = selectAndBindAutomationCapabilities(base, workspace, explicitSelections(base), AT);
  const planReview = openAutomationExecutionPlanReview(
    current.process,
    current.validation.scope,
    current.validation.assessment,
    image.freeze,
    image.scopeFreeze,
    selection,
    {},
    AT,
  );
  return { dir, repo, image, current, base, workspace, selection, planReview };
}

function q02Blocked() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-i8-06-q02-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(dir, 'bytes'));
  const frozen = buildFrozenQuarry02ImageReview(repo, byteStore, readFileSync(Q02));
  const current = frozen.ready.current;
  const base = designGenericCapabilities(current.process, current.validation.scope, current.validation.assessment, frozen.freeze, frozen.scopeFreeze, AT);
  const workspace = openAutomationDesignWorkspace(base, AT);
  const selection = selectAndBindAutomationCapabilities(base, workspace, explicitSelections(base), AT);
  const planReview = openAutomationExecutionPlanReview(
    current.process,
    current.validation.scope,
    current.validation.assessment,
    frozen.freeze,
    frozen.scopeFreeze,
    selection,
    {},
    AT,
  );
  return { dir, repo, frozen, current, base, workspace, selection, planReview };
}

function close(x: { repo: SqliteDocumentStore; dir: string }) {
  x.repo.close();
  rmSync(x.dir, { recursive: true, force: true });
}

function approvalFor(x: ReturnType<typeof q01>) {
  return approveAutomationDesign(x.planReview, {
    approvedBy: 'business-automation-owner',
    authorityRef: 'authority:i8-06-automation-approval',
    rationale: 'Approve this exact reviewed ExecutionPlan for Temporal mapping design only.',
    approvedAt: '2026-08-23T22:31:00.000Z',
  });
}

test('I8-06 is the explicit authority transition from a ready ExecutionPlan review into Temporal design', () => {
  const x = q01();
  try {
    assert.equal(x.planReview.review.state, 'READY_FOR_AUTOMATION_APPROVAL');
    assert.equal(x.planReview.review.temporalDesignAuthorized, false);

    const approval = approvalFor(x);
    assert.equal(approval.approvalKind, 'AUTOMATION_DESIGN_TO_TEMPORAL_HANDOFF');
    assert.equal(approval.automationExecutionPlanReviewRef, x.planReview.review.id);
    assert.equal(approval.executionPlanRevisionRef, x.planReview.execution.revision.id);
    assert.equal(approval.executionPlanAssessmentRef, x.planReview.execution.assessment.id);
    assert.equal(approval.executionDigest, x.planReview.execution.revision.executionDigest);
    assert.equal(approval.temporalDesignAuthorized, true);
    assert.equal(approval.deploymentAuthorized, false);
    assert.equal(approval.executionAuthorized, false);

    const mapping = designApprovedAutomationTemporalMapping(
      x.planReview.execution,
      approval,
      { waits: [], humans: [] },
      '2026-08-23T22:32:00.000Z',
    );
    assert.equal(mapping.revision.executionPlanRevisionRef, x.planReview.execution.revision.id);
    assert.equal(mapping.assessment.readiness, 'READY_FOR_RUNTIME_POLICY_DESIGN');
  } finally {
    close(x);
  }
});

test('I8-06 refuses approval while ExecutionPlan review still has material execution-design blockers', () => {
  const x = q02Blocked();
  try {
    assert.equal(x.planReview.review.state, 'BLOCKED_EXECUTION_DESIGN');
    assert.throws(() => approveAutomationDesign(x.planReview, {
      approvedBy: 'business-automation-owner',
      authorityRef: 'authority:i8-06-invalid-approval',
      rationale: 'Attempt to bypass blockers must fail.',
      approvedAt: '2026-08-23T22:33:00.000Z',
    }), /READY_FOR_AUTOMATION_APPROVAL/);
  } finally {
    close(x);
  }
});

test('I8-06 approved Temporal handoff rejects stale ExecutionPlan digest, assessment and binding lineage', () => {
  const x = q01();
  try {
    const approval = approvalFor(x);
    assert.throws(() => designApprovedAutomationTemporalMapping(
      x.planReview.execution,
      { ...approval, executionDigest: 'stale-digest' },
      { waits: [], humans: [] },
      '2026-08-23T22:34:00.000Z',
    ), /exact ExecutionPlan revision, assessment and digest/);
    assert.throws(() => designApprovedAutomationTemporalMapping(
      x.planReview.execution,
      { ...approval, executionPlanAssessmentRef: 'execution:stale-assessment' },
      { waits: [], humans: [] },
      '2026-08-23T22:34:00.000Z',
    ), /exact ExecutionPlan revision, assessment and digest/);
    assert.throws(() => designApprovedAutomationTemporalMapping(
      x.planReview.execution,
      { ...approval, capabilityBindingRevisionRefs: ['capability:stale-binding'] },
      { waits: [], humans: [] },
      '2026-08-23T22:34:00.000Z',
    ), /binding lineage mismatch/);
  } finally {
    close(x);
  }
});

test('I8-06 approval persistence is append-only and approval alone creates no Temporal/deployment/runtime artifacts', () => {
  const x = q01();
  try {
    persistGenericCapabilityDesign(x.repo, x.base);
    persistAutomationCapabilitySelection(x.repo, x.selection);
    persistAutomationExecutionPlanReview(x.repo, x.planReview);
    const approval = approvalFor(x);
    persistAutomationDesignApproval(x.repo, approval);

    assert.equal(x.repo.listByKind('AutomationDesignApprovalRecord').length, 1);
    assert.deepEqual(x.repo.get(approval.id as any)?.payload, approval);
    for (const forbidden of [
      'TemporalMappingRevision',
      'RuntimePolicyRevision',
      'DeploymentRevision',
      'WorkflowExecutionObservation',
    ]) assert.equal(x.repo.listByKind(forbidden).length, 0, `${forbidden} must remain absent after approval alone`);

    persistAutomationDesignApproval(x.repo, approval);
    assert.equal(x.repo.listByKind('AutomationDesignApprovalRecord').length, 1, 'idempotent identical approval must not fork history');

    const competing = approveAutomationDesign(x.planReview, {
      approvedBy: 'different-owner',
      authorityRef: 'authority:different-approval',
      rationale: 'A competing approval for the same review must not create a second decision.',
      approvedAt: '2026-08-23T22:35:00.000Z',
    });
    assert.throws(() => persistAutomationDesignApproval(x.repo, competing), /already has a different append-only approval decision/);
  } finally {
    close(x);
  }
});

test('I8-06 requires fresh explicit approval authority and cannot inherit authority from I8-05 readiness', () => {
  const x = q01();
  try {
    assert.throws(() => approveAutomationDesign(x.planReview, {
      approvedBy: '',
      authorityRef: 'authority:i8-06',
      rationale: 'Missing approver must fail.',
      approvedAt: '2026-08-23T22:36:00.000Z',
    }), /approvedBy is required/);
    assert.throws(() => approveAutomationDesign(x.planReview, {
      approvedBy: 'owner',
      authorityRef: '',
      rationale: 'Missing authority must fail.',
      approvedAt: '2026-08-23T22:36:00.000Z',
    }), /authorityRef is required/);
    assert.throws(() => approveAutomationDesign(x.planReview, {
      approvedBy: 'owner',
      authorityRef: 'authority:i8-06',
      rationale: '',
      approvedAt: '2026-08-23T22:36:00.000Z',
    }), /rationale is required/);
  } finally {
    close(x);
  }
});
