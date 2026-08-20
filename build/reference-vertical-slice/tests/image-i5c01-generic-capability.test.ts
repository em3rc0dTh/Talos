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
import { designGenericCapabilities } from '../packages/capability/src/generic-design.ts';
import type { FreezeRequestPayload, ReviewCommand, ScopeFreezeRequest } from '../packages/review/src/types.ts';
import { buildReadyQuarry02ImageReview } from './helpers/quarry02-ready-image.ts';

const fixturePath = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png');

function freezeReadyImage(repo: SqliteDocumentStore, current: ReturnType<typeof buildReadyQuarry02ImageReview>['current']) {
  const scope = current.validation.assessment.primaryScopeRef;
  const command: ReviewCommand = {
    id: createOpaqueId('review', `i5c01-freeze:${current.process.id}`),
    clientRequestKey: `i5c01-freeze-${current.process.id}`,
    reviewWorkspaceDefinitionId: current.context.workspaceDefinition.id,
    expectedReviewWorkspaceRevisionId: current.context.workspaceRevision.id,
    expectedReviewBaselineBundleId: current.context.baselineBundle.id,
    primarySemanticScopeRef: scope,
    targetSemanticScopeRefs: [scope],
    actionKind: 'REQUEST_FREEZE',
    targetSubjectRefs: [],
    actionPayloadRef: createOpaqueId('review', `i5c01-freeze-payload:${current.process.id}`),
    rationale: 'Freeze exact Quarry-02 semantic baseline before generic capability design.',
    authorityRef: 'reference-image-business-owner',
    requestedBy: 'image-reviewer',
    requestedAt: '2026-08-20T12:00:00.000Z',
  };
  const requestId = createOpaqueId('review', `i5c01-freeze-scope:${current.process.id}`);
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
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i5c01-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const bytes = readFileSync(fixturePath);
  const ready = buildReadyQuarry02ImageReview(repo, byteStore, bytes);
  const frozen = freezeReadyImage(repo, ready.current);
  return { runtimeDir, repo, ready, ...frozen };
}

function close(x: ReturnType<typeof setup>) {
  x.repo.close();
  rmSync(x.runtimeDir, { recursive: true, force: true });
}

test('I5C-01 derives capability requirements from frozen work semantics without reference approval/email assumptions', () => {
  const x = setup();
  try {
    const current = x.ready.current;
    const bundle = designGenericCapabilities(
      current.process,
      current.validation.scope,
      current.validation.assessment,
      x.freeze,
      x.scopeFreeze,
      '2026-08-20T12:00:01.000Z',
    );

    const workNodes = current.process.nodes.filter((node) => node.kind === 'ACTION' || node.kind === 'HUMAN_INTERACTION');
    assert.equal(bundle.requirements.length, workNodes.length);
    assert.deepEqual(
      new Set(bundle.requirements.flatMap((requirement) => requirement.semanticSubjectRefs)),
      new Set(workNodes.map((node) => node.id)),
    );

    for (const node of current.process.nodes.filter((item) => item.kind === 'ACTION')) {
      const requirement = bundle.requirements.find((item) => item.semanticSubjectRefs.includes(node.id));
      assert.ok(requirement, `missing capability design requirement for ACTION ${node.name ?? node.id}`);
      assert.equal(requirement!.operationIntent, 'PERFORM_ACTION');
      if (node.actorRefs.length === 0) {
        assert.equal(requirement!.family, 'SOURCE_DEFINED');
        assert.equal(requirement!.requirementState, 'UNRESOLVED');
      }
    }

    for (const node of current.process.nodes.filter((item) => ['DECISION', 'WAIT', 'SUBPROCESS', 'STATE', 'END', 'EVENT', 'PARALLEL_SPLIT', 'JOIN'].includes(item.kind))) {
      assert.equal(bundle.requirements.some((requirement) => requirement.semanticSubjectRefs.includes(node.id)), false, `${node.kind} must not become an external capability merely by existing`);
    }

    assert.equal(bundle.designRevision.designState, 'NEEDS_DESIGN_DECISION');
    assert.ok(bundle.designRevision.unresolvedRequirementRefs.length > 0);

    const serialized = JSON.stringify(bundle);
    for (const forbidden of [
      'COLLECT_APPROVAL',
      'SEND_NOTIFICATION',
      'REFERENCE_EMAIL_SINK',
      'recipientEmail',
      'Gmail',
      'N8N_WORKFLOW',
      'TEMPORAL_ACTIVITY',
      'CHILD_WORKFLOW',
    ]) assert.equal(serialized.includes(forbidden), false, `generic capability design invented ${forbidden}`);
  } finally {
    close(x);
  }
});

test('I5C-01 provenance pins exact freeze, scope freeze, process and validation assessment', () => {
  const x = setup();
  try {
    const current = x.ready.current;
    const bundle = designGenericCapabilities(current.process, current.validation.scope, current.validation.assessment, x.freeze, x.scopeFreeze, '2026-08-20T12:00:01.000Z');
    assert.equal(bundle.designRevision.semanticFreezeRecordId, x.freeze.id);
    assert.deepEqual(bundle.designRevision.scopeFreezeRefs, [x.scopeFreeze.id]);
    assert.equal(bundle.designRevision.processRevisionId, current.process.id);
    assert.deepEqual(bundle.designRevision.validationAssessmentRefs, [current.validation.assessment.id]);
    for (const trace of bundle.provenanceTraces) {
      assert.equal(trace.semanticFreezeRecordId, x.freeze.id);
      assert.equal(trace.scopeFreezeRef, x.scopeFreeze.id);
      assert.equal(trace.processRevisionId, current.process.id);
      assert.deepEqual(trace.validationAssessmentRefs, [current.validation.assessment.id]);
      assert.ok(trace.semanticSubjectRefs.length > 0);
    }
  } finally {
    close(x);
  }
});

test('I5C-01 rejects stale/substituted authority, scope and validation inputs', () => {
  const x = setup();
  try {
    const current = x.ready.current;
    assert.throws(
      () => designGenericCapabilities(current.process, current.validation.scope, current.validation.assessment, { ...x.freeze, authorityRef: undefined }, x.scopeFreeze, '2026-08-20T12:00:01.000Z'),
      /authority-backed semantic freeze/,
    );
    assert.throws(
      () => designGenericCapabilities(current.process, current.validation.scope, { ...current.validation.assessment, id: createOpaqueId('validation', 'i5c01-substitute-assessment') }, x.freeze, x.scopeFreeze, '2026-08-20T12:00:01.000Z'),
      /exact validation assessment/,
    );
    assert.throws(
      () => designGenericCapabilities(current.process, { ...current.validation.scope, id: createOpaqueId('validation', 'i5c01-substitute-scope') }, current.validation.assessment, x.freeze, x.scopeFreeze, '2026-08-20T12:00:01.000Z'),
      /exact frozen validation scope/,
    );
  } finally {
    close(x);
  }
});

test('I5C-01 persistence creates capability design only and no offering/binding/execution/Temporal artifacts', () => {
  const x = setup();
  try {
    const current = x.ready.current;
    const bundle = designGenericCapabilities(current.process, current.validation.scope, current.validation.assessment, x.freeze, x.scopeFreeze, '2026-08-20T12:00:01.000Z');
    persistGenericCapabilityDesign(x.repo, bundle);

    assert.deepEqual(x.repo.get(bundle.designRevision.id)?.payload, bundle.designRevision);
    assert.equal(x.repo.listByKind('CapabilityRequirement').length, bundle.requirements.length);
    assert.equal(x.repo.listByKind('CapabilityRequirementFacet').length, bundle.facets.length);
    assert.equal(x.repo.listByKind('CapabilityRequirementProvenanceTrace').length, bundle.provenanceTraces.length);

    for (const forbiddenKind of [
      'CapabilityOfferingDefinition',
      'CapabilityOfferingRevision',
      'CapabilityMatchAssessment',
      'CapabilitySelectionDecision',
      'CapabilityBindingRevision',
      'HumanInteractionDesignRevision',
      'FormRevision',
      'ExecutionPlanRevision',
      'TemporalMappingRevision',
      'RuntimePolicyRevision',
      'DeploymentRevision',
      'WorkflowExecutionObservation',
    ]) assert.equal(x.repo.listByKind(forbiddenKind).length, 0, `${forbiddenKind} must not be created by I5C-01`);
  } finally {
    close(x);
  }
});
