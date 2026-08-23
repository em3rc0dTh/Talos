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
import { persistGenericCapabilityDesign, persistAutomationCapabilitySelection } from '../packages/application/src/capability.ts';
import { persistAutomationExecutionPlanReview } from '../packages/application/src/execution-design.ts';
import { buildExecutableQuarry01ImageReview } from './helpers/quarry01-executable-image.ts';
import { buildFrozenQuarry02ImageReview } from './helpers/quarry02-frozen-image.ts';

const Q01 = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-01-order-process/imagen_2026-08-18_204857678.png');
const Q02 = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png');
const AT = '2026-08-23T22:20:00.000Z';

function explicitSystemSelections(base: ReturnType<typeof designGenericCapabilities>) {
  return base.requirements.map((requirement, index) => ({
    source: 'EXPLICIT_OFFERING' as const,
    requirementRef: requirement.id,
    family: 'SYSTEM_OPERATION' as const,
    offeringCanonicalName: `I8_05_SYSTEM_OPERATION_${index + 1}`,
    offeringLifecycleStatus: 'TEST_ONLY' as const,
    implementationKind: 'INTERNAL_SERVICE' as const,
    implementationRef: `i8-05-system-operation:${requirement.id}`,
    decidedBy: 'i8-05-automation-designer',
    authorityRef: 'authority:i8-05-capability-selection',
    rationale: 'TEST_ONLY explicit system-operation selection for ExecutionPlan review; no provider meaning is inferred from the source label.',
  }));
}

function q01() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-i8-05-q01-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const bytes = new LocalImageByteStore(path.join(dir, 'bytes'));
  const image = buildExecutableQuarry01ImageReview(repo, bytes, readFileSync(Q01));
  const current = image.current;
  const base = designGenericCapabilities(current.process, current.validation.scope, current.validation.assessment, image.freeze, image.scopeFreeze, AT);
  const workspace = openAutomationDesignWorkspace(base, AT);
  const selection = selectAndBindAutomationCapabilities(base, workspace, explicitSystemSelections(base), AT);
  return { dir, repo, image, current, base, workspace, selection };
}

function q02() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-i8-05-q02-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const bytes = new LocalImageByteStore(path.join(dir, 'bytes'));
  const frozen = buildFrozenQuarry02ImageReview(repo, bytes, readFileSync(Q02));
  const current = frozen.ready.current;
  const base = designGenericCapabilities(current.process, current.validation.scope, current.validation.assessment, frozen.freeze, frozen.scopeFreeze, AT);
  const workspace = openAutomationDesignWorkspace(base, AT);
  const selection = selectAndBindAutomationCapabilities(base, workspace, explicitSystemSelections(base), AT);
  return { dir, repo, frozen, current, base, workspace, selection };
}

function close(x: { repo: SqliteDocumentStore; dir: string }) {
  x.repo.close();
  rmSync(x.dir, { recursive: true, force: true });
}

test('I8-05 exposes a technically ready ExecutionPlan for review without authorizing Temporal', () => {
  const x = q01();
  try {
    const review = openAutomationExecutionPlanReview(
      x.current.process,
      x.current.validation.scope,
      x.current.validation.assessment,
      x.image.freeze,
      x.image.scopeFreeze,
      x.selection,
      {},
      AT,
    );

    assert.equal(review.execution.assessment.readiness, 'READY_FOR_TEMPORAL_MAPPING_DESIGN');
    assert.equal(review.review.technicalReadiness, 'READY_FOR_TEMPORAL_MAPPING_DESIGN');
    assert.equal(review.review.state, 'READY_FOR_AUTOMATION_APPROVAL');
    assert.deepEqual(review.review.materialExecutionRequirementRefs, []);
    assert.deepEqual(review.review.incompleteExecutionElementRefs, []);
    assert.deepEqual(review.review.incompleteExecutionRelationRefs, []);
    assert.equal(review.review.automationApprovalRequired, true);
    assert.equal(review.review.temporalDesignAuthorized, false);
    assert.equal(review.review.deploymentAuthorized, false);
    assert.equal(review.review.executionAuthorized, false);
    assert.equal(review.review.automationDesignWorkspaceRevisionRef, x.selection.workspaceRevisionRef);
    assert.deepEqual(new Set(review.review.capabilitySelectionTraceRefs), new Set(x.selection.traces.map((trace) => trace.id)));
    assert.deepEqual(new Set(review.review.capabilityBindingRevisionRefs), new Set(x.selection.resolution.bindingRevisions.map((binding) => binding.id)));
  } finally {
    close(x);
  }
});

test('I8-05 keeps unresolved execution design visible and blocks automation approval readiness', () => {
  const x = q02();
  try {
    const review = openAutomationExecutionPlanReview(
      x.current.process,
      x.current.validation.scope,
      x.current.validation.assessment,
      x.frozen.freeze,
      x.frozen.scopeFreeze,
      x.selection,
      {},
      AT,
    );

    assert.equal(review.review.state, 'BLOCKED_EXECUTION_DESIGN');
    assert.equal(review.review.technicalReadiness, 'NEEDS_EXECUTION_DESIGN_DECISION');
    assert(review.review.materialExecutionRequirementRefs.length > 0);
    assert(review.review.incompleteExecutionElementRefs.length > 0 || review.review.incompleteExecutionRelationRefs.length > 0);
    assert.equal(review.review.temporalDesignAuthorized, false);
    assert.equal(review.review.executionAuthorized, false);

    const subprocess = x.current.process.nodes.find((node) => node.kind === 'SUBPROCESS');
    const messageRelation = x.current.process.edges.find((edge) => edge.kind === 'MESSAGE');
    assert.ok(subprocess);
    assert.ok(messageRelation);
    const resolved = openAutomationExecutionPlanReview(
      x.current.process,
      x.current.validation.scope,
      x.current.validation.assessment,
      x.frozen.freeze,
      x.frozen.scopeFreeze,
      x.selection,
      {
        subprocessResolutions: [{
          semanticSubjectRef: subprocess.id,
          boundaryKind: 'INLINE_COORDINATION',
          authorityRef: 'authority:i8-05-execution-design',
          decidedBy: 'i8-05-automation-designer',
          rationale: 'Explicitly keep the frozen subprocess as inline coordination; do not infer Child Workflow.',
        }],
        relationResolutions: [{
          semanticRelationRef: messageRelation.id,
          executionRelationKind: 'SEQUENCE',
          authorityRef: 'authority:i8-05-execution-design',
          decidedBy: 'i8-05-automation-designer',
          rationale: 'Explicitly choose in-workflow sequence coordination while preserving canonical MESSAGE truth.',
        }],
      },
      '2026-08-23T22:21:00.000Z',
    );

    assert.equal(resolved.review.state, 'READY_FOR_AUTOMATION_APPROVAL');
    assert.equal(resolved.review.technicalReadiness, 'READY_FOR_TEMPORAL_MAPPING_DESIGN');
    assert.equal(x.current.process.edges.find((edge) => edge.id === messageRelation.id)?.kind, 'MESSAGE');
    assert.equal(resolved.review.temporalDesignAuthorized, false, 'technical readiness must not become approval authority');
  } finally {
    close(x);
  }
});

test('I8-05 persistence stores the exact ExecutionPlan review but creates no Temporal/runtime/deployment artifacts', () => {
  const x = q01();
  try {
    const bundle = openAutomationExecutionPlanReview(
      x.current.process,
      x.current.validation.scope,
      x.current.validation.assessment,
      x.image.freeze,
      x.image.scopeFreeze,
      x.selection,
      {},
      AT,
    );
    persistGenericCapabilityDesign(x.repo, x.base);
    persistAutomationCapabilitySelection(x.repo, x.selection);
    persistAutomationExecutionPlanReview(x.repo, bundle);

    assert.equal(x.repo.listByKind('AutomationCapabilitySelectionTrace').length, x.selection.traces.length);
    assert.equal(x.repo.listByKind('AutomationExecutionPlanReview').length, 1);
    assert.equal(x.repo.listByKind('ExecutionPlanRevision').length, 1);
    assert.equal(x.repo.listByKind('ExecutionPlanAssessment').length, 1);
    assert.deepEqual(x.repo.get(bundle.review.id as any)?.payload, bundle.review);
    for (const forbidden of [
      'TemporalMappingRevision',
      'RuntimePolicyRevision',
      'DeploymentRevision',
      'WorkflowExecutionObservation',
    ]) assert.equal(x.repo.listByKind(forbidden).length, 0, `${forbidden} must remain absent after I8-05 review`);
  } finally {
    close(x);
  }
});

test('I8-05 rejects stale or internally inconsistent I8-04 selection lineage', () => {
  const x = q01();
  try {
    const stale = {
      ...x.selection,
      workspaceRevisionRef: 'capability:stale-workspace',
    };
    assert.throws(() => openAutomationExecutionPlanReview(
      x.current.process,
      x.current.validation.scope,
      x.current.validation.assessment,
      x.image.freeze,
      x.image.scopeFreeze,
      stale,
      {},
      AT,
    ), /exact Automation Design Workspace revision/);
  } finally {
    close(x);
  }
});
