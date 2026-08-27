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
import {
  persistAutomationCapabilitySelection,
  persistGenericCapabilityDesign,
} from '../packages/application/src/capability.ts';
import {
  reviewOneAppExecutionPlan,
  type OneAppAutomationContext,
} from '../packages/application/src/one-app-automation.ts';
import { buildFrozenQuarry02ImageReview } from './helpers/quarry02-frozen-image.ts';

const Q02 = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png');
const AT = '2026-08-27T03:20:00.000Z';

function explicitSystemSelections(base: ReturnType<typeof designGenericCapabilities>) {
  return base.requirements.map((requirement, index) => ({
    source: 'EXPLICIT_OFFERING' as const,
    requirementRef: requirement.id,
    family: 'SYSTEM_OPERATION' as const,
    offeringCanonicalName: `R1_11_REBUILD_SYSTEM_OPERATION_${index + 1}`,
    offeringLifecycleStatus: 'TEST_ONLY' as const,
    implementationKind: 'INTERNAL_SERVICE' as const,
    implementationRef: `r1-11-rebuild:${requirement.id}`,
    decidedBy: 'r1-11-field-user',
    authorityRef: 'authority:r1-11:capability-selection',
    rationale: 'TEST_ONLY explicit binding used to reproduce the field-trial ExecutionPlan rebuild boundary.',
  }));
}

test('R1-11 ExecutionPlan rebuild appends a child revision without rebinding capabilities or rewriting the immutable definition', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-11-execution-plan-rebuild-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const bytes = new LocalImageByteStore(path.join(dir, 'bytes'));
  try {
    const frozen = buildFrozenQuarry02ImageReview(repo, bytes, readFileSync(Q02));
    const current = frozen.ready.current;
    const design = designGenericCapabilities(
      current.process,
      current.validation.scope,
      current.validation.assessment,
      frozen.freeze,
      frozen.scopeFreeze,
      AT,
    );
    const workspace = openAutomationDesignWorkspace(design, AT);
    const selection = selectAndBindAutomationCapabilities(
      design,
      workspace,
      explicitSystemSelections(design),
      AT,
    );
    persistGenericCapabilityDesign(repo, design);
    persistAutomationCapabilitySelection(repo, selection);

    const initialContext: OneAppAutomationContext = {
      process: current.process,
      scope: current.validation.scope,
      assessment: current.validation.assessment,
      freeze: frozen.freeze,
      scopeFreeze: frozen.scopeFreeze,
      design,
      workspace,
      selection,
    };

    const blocked = reviewOneAppExecutionPlan(repo, initialContext, {}, AT);
    assert.ok(blocked.executionReview);
    assert.equal(blocked.executionReview.review.state, 'BLOCKED_EXECUTION_DESIGN');
    assert.equal(blocked.executionReview.execution.revision.revision, 1);
    assert.deepEqual(blocked.executionReview.execution.revision.parentRevisionRefs, []);

    const unresolvedRelationRefs = new Set(
      blocked.executionReview.execution.relations
        .filter((relation) => relation.relationState !== 'COMPLETE')
        .flatMap((relation) => relation.semanticRelationRefs),
    );
    const relationResolutions = current.process.edges
      .filter((edge) => unresolvedRelationRefs.has(edge.id))
      .filter((edge) => !['SEQUENCE', 'CONDITIONAL', 'DEFAULT', 'PARALLEL'].includes(edge.kind))
      .map((edge, index) => ({
        semanticRelationRef: edge.id,
        executionRelationKind: 'SEQUENCE' as const,
        authorityRef: `authority:r1-11:relation:${index + 1}`,
        decidedBy: 'r1-11-field-user',
        rationale: 'Explicit field-trial execution treatment; canonical source relation truth remains unchanged.',
      }));
    const subprocessResolutions = current.process.nodes
      .filter((node) => node.kind === 'SUBPROCESS')
      .map((node, index) => ({
        semanticSubjectRef: node.id,
        boundaryKind: 'INLINE_COORDINATION' as const,
        authorityRef: `authority:r1-11:subprocess:${index + 1}`,
        decidedBy: 'r1-11-field-user',
        rationale: 'Explicitly keep the frozen subprocess inline without inferring a Child Workflow boundary.',
      }));

    assert(relationResolutions.length > 0, 'fixture must exercise a source-defined relation decision');
    assert(subprocessResolutions.length > 0, 'fixture must exercise a subprocess execution-boundary decision');

    const decisions = { relationResolutions, subprocessResolutions };
    const rebuilt = reviewOneAppExecutionPlan(
      repo,
      blocked,
      decisions,
      '2026-08-27T03:21:00.000Z',
    );
    assert.ok(rebuilt.executionReview);
    assert.equal(rebuilt.executionReview.review.state, 'READY_FOR_AUTOMATION_APPROVAL');
    assert.notEqual(
      rebuilt.executionReview.execution.revision.id,
      blocked.executionReview.execution.revision.id,
    );
    assert.equal(rebuilt.executionReview.execution.revision.revision, 2);
    assert.deepEqual(
      rebuilt.executionReview.execution.revision.parentRevisionRefs,
      [blocked.executionReview.execution.revision.id],
    );
    assert.equal(
      rebuilt.executionReview.execution.definition.id,
      blocked.executionReview.execution.definition.id,
      'rebuild must retain the stable ExecutionPlanDefinition identity',
    );
    assert.deepEqual(
      rebuilt.executionReview.execution.definition,
      blocked.executionReview.execution.definition,
      'rebuild must not manufacture a different immutable definition payload',
    );

    assert.equal(repo.listByKind('ExecutionPlanDefinition').length, 1);
    assert.equal(repo.listByKind('ExecutionPlanRevision').length, 2);
    assert.equal(repo.listByKind('AutomationExecutionPlanReview').length, 2);
    assert.equal(
      repo.listByKind('CapabilityBindingRevision').length,
      selection.resolution.bindingRevisions.length,
      'ExecutionPlan rebuild must not re-bind capabilities',
    );

    const duplicate = reviewOneAppExecutionPlan(
      repo,
      rebuilt,
      decisions,
      '2026-08-27T03:22:00.000Z',
    );
    assert.equal(
      duplicate.executionReview?.execution.revision.id,
      rebuilt.executionReview.execution.revision.id,
      'identical rebuild must be idempotent',
    );
    assert.equal(repo.listByKind('ExecutionPlanRevision').length, 2);
    assert.equal(repo.listByKind('AutomationExecutionPlanReview').length, 2);
  } finally {
    repo.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
