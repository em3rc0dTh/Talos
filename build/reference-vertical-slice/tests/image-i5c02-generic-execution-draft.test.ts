import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { LocalImageByteStore } from '../packages/image-perception/src/byte-store.ts';
import { applyFreezeCommand } from '../packages/application/src/review.ts';
import { persistGenericCapabilityDesign } from '../packages/application/src/capability.ts';
import { persistGenericExecutionDraft } from '../packages/application/src/execution-design.ts';
import { designGenericCapabilities } from '../packages/capability/src/generic-design.ts';
import { designGenericExecutionDraft } from '../packages/execution/src/generic-plan.ts';
import type { FreezeRequestPayload, ReviewCommand, ScopeFreezeRequest } from '../packages/review/src/types.ts';
import { buildReadyQuarry02ImageReview } from './helpers/quarry02-ready-image.ts';

const fixturePath = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png');

function freezeReadyImage(repo: SqliteDocumentStore, current: ReturnType<typeof buildReadyQuarry02ImageReview>['current']) {
  const scope = current.validation.assessment.primaryScopeRef;
  const command: ReviewCommand = {
    id: createOpaqueId('review', `i5c02-freeze:${current.process.id}`),
    clientRequestKey: `i5c02-freeze-${current.process.id}`,
    reviewWorkspaceDefinitionId: current.context.workspaceDefinition.id,
    expectedReviewWorkspaceRevisionId: current.context.workspaceRevision.id,
    expectedReviewBaselineBundleId: current.context.baselineBundle.id,
    primarySemanticScopeRef: scope,
    targetSemanticScopeRefs: [scope],
    actionKind: 'REQUEST_FREEZE',
    targetSubjectRefs: [],
    actionPayloadRef: createOpaqueId('review', `i5c02-freeze-payload:${current.process.id}`),
    rationale: 'Freeze exact Quarry-02 semantic baseline before generic execution draft design.',
    authorityRef: 'reference-image-business-owner',
    requestedBy: 'image-reviewer',
    requestedAt: '2026-08-20T13:00:00.000Z',
  };
  const requestId = createOpaqueId('review', `i5c02-freeze-scope:${current.process.id}`);
  const payload: FreezeRequestPayload = {
    id: command.actionPayloadRef!,
    reviewCommandId: command.id,
    freezeKind: 'AUTOMATION_DESIGN_HANDOFF',
    scopeRequestRefs: [requestId],
    requestedAt: command.requestedAt,
  };
  const request: ScopeFreezeRequest = {
    id: requestId,
    freezeRequestPayloadId: payload.id,
    semanticScopeRef: scope,
    requestedDisposition: 'ACCEPTED',
    referencedValidationAssessmentRefs: [current.validation.assessment.id],
  };
  const result = applyFreezeCommand(repo, current.context, command, payload, [request], [current.validation.assessment]);
  assert.equal(result.freezeApplication.result, 'FROZEN');
  assert.ok(result.freezeRecord);
  return { freeze: result.freezeRecord!, scopeFreeze: result.scopeRecords[0] };
}

function setup() {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i5c02-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const bytes = readFileSync(fixturePath);
  const ready = buildReadyQuarry02ImageReview(repo, byteStore, bytes);
  const frozen = freezeReadyImage(repo, ready.current);
  const current = ready.current;
  const capability = designGenericCapabilities(
    current.process,
    current.validation.scope,
    current.validation.assessment,
    frozen.freeze,
    frozen.scopeFreeze,
    '2026-08-20T13:00:01.000Z',
  );
  const execution = designGenericExecutionDraft(
    current.process,
    current.validation.scope,
    current.validation.assessment,
    frozen.freeze,
    frozen.scopeFreeze,
    capability,
    '2026-08-20T13:00:02.000Z',
  );
  return { runtimeDir, repo, ready, current, capability, execution, ...frozen };
}

function close(x: ReturnType<typeof setup>) {
  x.repo.close();
  rmSync(x.runtimeDir, { recursive: true, force: true });
}

test('I5C-02 creates inspectable execution draft but blocks Temporal readiness while work design is unresolved', () => {
  const x = setup();
  try {
    assert.equal(x.capability.designRevision.designState, 'NEEDS_DESIGN_DECISION');
    assert.equal(x.execution.scopeAssessments[0].readiness, 'NEEDS_EXECUTION_DESIGN_DECISION');
    assert.equal(x.execution.assessment.readiness, 'NEEDS_EXECUTION_DESIGN_DECISION');
    assert.equal(x.execution.revision.readiness, 'NEEDS_EXECUTION_DESIGN_DECISION');
    assert.notEqual(x.execution.revision.readiness, 'READY_FOR_TEMPORAL_MAPPING_DESIGN');
    assert.ok(x.execution.requirements.some((requirement) => requirement.resolutionState === 'UNRESOLVED'));
    assert.equal(x.execution.regions[0].boundaryState, 'INCOMPLETE');
  } finally {
    close(x);
  }
});

test('I5C-02 represents every canonical node without converting generic ACTION into capability invocation or runtime primitive', () => {
  const x = setup();
  try {
    assert.equal(x.execution.elements.length, x.current.process.nodes.length);
    assert.equal(x.execution.mappingTraces.length, x.current.process.nodes.length);
    assert.deepEqual(
      new Set(x.execution.elements.flatMap((element) => element.semanticSubjectRefs)),
      new Set(x.current.process.nodes.map((node) => node.id)),
    );
    assert.deepEqual(x.execution.capabilityUses, []);
    assert.deepEqual(x.execution.revision.capabilityBindingRevisionRefs, []);
    assert.deepEqual(x.execution.revision.humanInteractionDesignRevisionRefs, []);
    assert.deepEqual(x.execution.revision.capabilityUseOccurrenceRefs, []);

    for (const node of x.current.process.nodes.filter((item) => item.kind === 'ACTION')) {
      const element = x.execution.elements.find((item) => item.semanticSubjectRefs.includes(node.id));
      assert.ok(element, `missing execution element for ACTION ${node.name ?? node.id}`);
      assert.equal(element!.designState, 'INCOMPLETE');
      assert.equal(element!.capabilityUseRefs.length, 0);
      assert.ok(element!.executionRequirementRefs.length > 0);
      assert.notEqual(element!.kind, 'CAPABILITY_INVOCATION');
    }
  } finally {
    close(x);
  }
});

test('I5C-02 preserves decision BusinessRule identity exactly in conditional execution relations', () => {
  const x = setup();
  try {
    const conditionalEdges = x.current.process.edges.filter((edge) => edge.kind === 'CONDITIONAL');
    assert.ok(conditionalEdges.length >= 2);
    for (const edge of conditionalEdges) {
      assert.ok(edge.conditionRuleRef, 'semantic readiness should have structured rule ref');
      assert.ok(x.current.process.rules.some((rule) => rule.id === edge.conditionRuleRef));
      const relation = x.execution.relations.find((item) => item.semanticRelationRefs.includes(edge.id));
      assert.ok(relation);
      assert.equal(relation!.relationKind, 'CONDITIONAL');
      assert.equal(relation!.conditionRef, edge.conditionRuleRef);
      assert.equal(relation!.relationState, 'COMPLETE');
    }
  } finally {
    close(x);
  }
});

test('I5C-02 keeps WAIT as business coordination and collapsed subprocess as unresolved execution boundary', () => {
  const x = setup();
  try {
    const wait = x.current.process.nodes.find((node) => node.kind === 'WAIT');
    assert.ok(wait);
    const waitElement = x.execution.elements.find((element) => element.semanticSubjectRefs.includes(wait!.id));
    assert.equal(waitElement?.kind, 'WAIT_COORDINATION');
    assert.equal(waitElement?.designState, 'COMPLETE');

    const subprocess = x.current.process.nodes.find((node) => node.kind === 'SUBPROCESS');
    assert.ok(subprocess);
    assert.equal(subprocess!.details?.subprocessMode, 'COLLAPSED_SUBPROCESS');
    const subprocessElement = x.execution.elements.find((element) => element.semanticSubjectRefs.includes(subprocess!.id));
    assert.ok(subprocessElement);
    assert.equal(subprocessElement!.kind, 'COORDINATION_STEP');
    assert.equal(subprocessElement!.designState, 'INCOMPLETE');
    const boundaryRequirement = x.execution.requirements.find((requirement) => subprocessElement!.executionRequirementRefs.includes(requirement.id));
    assert.equal(boundaryRequirement?.requirementKind, 'COORDINATION_BOUNDARY');
    assert.equal(boundaryRequirement?.resolutionState, 'UNRESOLVED');
  } finally {
    close(x);
  }
});

test('I5C-02 preserves unsupported semantic relation kinds as incomplete rather than coercing them', () => {
  const x = setup();
  try {
    for (const edge of x.current.process.edges.filter((item) => !['SEQUENCE', 'CONDITIONAL', 'DEFAULT', 'PARALLEL'].includes(item.kind))) {
      const relation = x.execution.relations.find((item) => item.semanticRelationRefs.includes(edge.id));
      assert.ok(relation);
      assert.equal(relation!.relationKind, 'SOURCE_DEFINED');
      assert.equal(relation!.relationState, 'INCOMPLETE');
      assert.ok(x.execution.requirements.some((requirement) => requirement.targetRef === relation!.id && requirement.resolutionState === 'UNRESOLVED'));
    }
  } finally {
    close(x);
  }
});

test('I5C-02 exact lineage rejects substituted capability design and assessment', () => {
  const x = setup();
  try {
    const badCapability = {
      ...x.capability,
      designRevision: {
        ...x.capability.designRevision,
        semanticFreezeRecordId: createOpaqueId('review', 'i5c02-substitute-freeze'),
      },
    };
    assert.throws(
      () => designGenericExecutionDraft(x.current.process, x.current.validation.scope, x.current.validation.assessment, x.freeze, x.scopeFreeze, badCapability, '2026-08-20T13:00:03.000Z'),
      /capability\/freeze mismatch/,
    );
    assert.throws(
      () => designGenericExecutionDraft(x.current.process, x.current.validation.scope, { ...x.current.validation.assessment, id: createOpaqueId('validation', 'i5c02-substitute-assessment') }, x.freeze, x.scopeFreeze, x.capability, '2026-08-20T13:00:03.000Z'),
      /exact validation assessment/,
    );
  } finally {
    close(x);
  }
});

test('I5C-02 persistence writes execution draft only and creates no Temporal/runtime/deployment artifacts', () => {
  const x = setup();
  try {
    persistGenericCapabilityDesign(x.repo, x.capability);
    persistGenericExecutionDraft(x.repo, x.execution);

    assert.deepEqual(x.repo.get(x.execution.revision.id)?.payload, x.execution.revision);
    assert.equal(x.repo.listByKind('ExecutionPlanRevision').length, 1);
    assert.equal(x.repo.listByKind('ExecutionElement').length, x.execution.elements.length);
    assert.equal(x.repo.listByKind('ExecutionRequirement').length, x.execution.requirements.length);
    assert.equal(x.repo.listByKind('CapabilityUseOccurrence').length, 0);

    for (const forbiddenKind of [
      'TemporalMappingDefinition',
      'TemporalMappingRevision',
      'TemporalMappingUnit',
      'RuntimePolicyRevision',
      'DeploymentDefinition',
      'DeploymentRevision',
      'WorkflowExecutionObservation',
    ]) assert.equal(x.repo.listByKind(forbiddenKind).length, 0, `${forbiddenKind} must not be created by I5C-02`);
  } finally {
    close(x);
  }
});
