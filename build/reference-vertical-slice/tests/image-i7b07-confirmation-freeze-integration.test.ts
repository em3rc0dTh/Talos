import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyConfirmedBpmnFreezeHandoff } from '../packages/application/src/bpmn-freeze-handoff.ts';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import {
  confirmBusinessProcess,
  createBpmnProcessRevision,
  revokeBusinessProcessConfirmation,
} from '../packages/review/src/bpmn-confirmation.ts';
import type {
  FreezeRequestPayload,
  ReviewCommand,
  ScopeFreezeRequest,
} from '../packages/review/src/types.ts';
import type { ReviewContextBundle } from '../packages/review/src/workspace.ts';
import type { ProcessRevision, ValidationAssessment } from '../packages/semantic-core/src/types.ts';

const T = '2026-08-20T23:00:00.000Z';
const rid = (seed: string) => createOpaqueId('review', `i7b07:${seed}`);
const cid = (seed: string) => createOpaqueId('canonical', `i7b07:${seed}`);
const vid = (seed: string) => createOpaqueId('validation', `i7b07:${seed}`);

function processRevision(id = cid('process')): ProcessRevision {
  return {
    id,
    processDefinitionId: cid('definition'),
    revision: 7,
    createdAt: T,
    parentRevisionIds: [],
    derivationKind: 'HUMAN_CONFIRMATION',
    sourceArtifactIds: [],
    nodes: [],
    edges: [],
    actors: [],
    variables: [],
    dataObjects: [],
    rules: [],
    semanticClaims: [],
    conflictRecords: [],
    annotations: [],
    provenanceLinks: [],
    sourceExtensions: [],
    semanticStatus: 'VALIDATED',
    executionReadiness: 'READY_FOR_AUTOMATION_DESIGN',
    validationFindingRefs: [],
  };
}

function reviewContext(processId: ReturnType<typeof cid>, assessmentId = vid('assessment')): ReviewContextBundle {
  const workspaceDefinitionId = rid('workspace-definition');
  const workspaceRevisionId = rid('workspace-revision');
  const projectionId = rid('projection');
  const baselineId = rid('baseline');
  const scope = vid('scope');
  const scopeBindingId = rid('scope-binding');
  const authoredSourceId = rid('authored-source');
  return {
    workspaceDefinition: {
      id: workspaceDefinitionId,
      createdAt: T,
      createdBy: 'reviewer',
      sourceArtifactIds: [],
      sourceRepresentationIds: [],
      reviewAuthoredSourceDefinitionId: authoredSourceId,
      initialWorkspaceRevisionId: workspaceRevisionId,
      latestWorkspaceRevisionId: workspaceRevisionId,
      lifecycleStatus: 'ACTIVE',
    },
    workspaceRevision: {
      id: workspaceRevisionId,
      reviewWorkspaceDefinitionId: workspaceDefinitionId,
      revisionNumber: 4,
      createdAt: T,
      createdBy: 'reviewer',
      baselineProcessRevisionId: processId,
      baselineValidationAssessmentId: assessmentId,
      projectionRevisionId: projectionId,
      sourceContextRefs: [],
      adapterResultContextRefs: [],
      semanticContextDigest: 'i7b07-workspace-semantic-digest',
    },
    projectionRevision: {
      id: projectionId,
      reviewWorkspaceDefinitionId: workspaceDefinitionId,
      reviewWorkspaceRevisionId: workspaceRevisionId,
      revisionNumber: 4,
      baselineProcessRevisionId: processId,
      baselineValidationAssessmentId: assessmentId,
      createdAt: T,
      projectionItemSnapshots: [],
      projectionBindingSnapshots: [],
      projectionDigest: 'i7b07-projection-digest',
    },
    baselineBundle: {
      id: baselineId,
      reviewWorkspaceDefinitionId: workspaceDefinitionId,
      reviewWorkspaceRevisionId: workspaceRevisionId,
      baselineProcessRevisionId: processId,
      reviewProjectionRevisionId: projectionId,
      primaryReviewScopeRef: scope,
      contextReviewScopeRefs: [],
      scopeSurfaceBindingRefs: [scopeBindingId],
      sourceContextRefs: [],
      adapterResultContextRefs: [],
      baselineSemanticDigest: 'i7b07-baseline-semantic-digest',
      compatibilityDigest: 'i7b07-baseline-compatibility-digest',
      createdAt: T,
    },
    scopeBinding: {
      id: scopeBindingId,
      reviewBaselineBundleId: baselineId,
      semanticScopeRef: scope,
      scopeKind: 'PROCESS_REVISION',
      validationAssessmentRefs: [assessmentId],
      projectionSubjectRefs: [],
      visualGrammarKind: 'PROCESS_GRAPH',
      scopeCompatibilityDigest: 'i7b07-scope-compatibility-digest',
      createdAt: T,
    },
    reviewAuthoredSourceDefinition: {
      id: authoredSourceId,
      reviewWorkspaceDefinitionId: workspaceDefinitionId,
      createdAt: T,
      createdBy: 'reviewer',
    },
  };
}

function assessment(context: ReviewContextBundle, processId: ReturnType<typeof cid>, options: {
  id?: ReturnType<typeof vid>;
  readiness?: ValidationAssessment['executionReadiness'];
} = {}): ValidationAssessment {
  return {
    id: options.id ?? context.workspaceRevision.baselineValidationAssessmentId!,
    processRevisionId: processId,
    provenanceContractVersion: 'v0.3',
    canonicalModelVersion: 'v0.1',
    validatorVersion: 'i7b07-test',
    rulesetVersion: 'semantic-validation-v0.2',
    assessmentIntent: 'AUTOMATION_DESIGN_READINESS',
    primaryScopeRef: context.scopeBinding.semanticScopeRef as ReturnType<typeof vid>,
    contextScopeRefs: [],
    findingIds: [],
    semanticVerdict: options.readiness === 'READY_FOR_AUTOMATION_DESIGN' || options.readiness === undefined ? 'VALID' : 'INCOMPLETE',
    executionReadiness: options.readiness ?? 'READY_FOR_AUTOMATION_DESIGN',
    readinessDecisionRef: vid(`readiness:${options.id ?? 'baseline'}`),
    assessedAt: T,
  };
}

function confirmedBpmn(processId: ReturnType<typeof cid>) {
  const draft = createBpmnProcessRevision({
    revisionNumber: 7,
    sourceRoute: 'IMAGE_INTERPRETATION',
    editMode: 'INITIAL_PROJECTION',
    sourceArtifactRefs: ['source-artifact-i7b07'],
    sourceRepresentationRefs: ['source-representation-i7b07'],
    canonicalProcessRevisionId: processId,
    canonicalAlignmentStatus: 'ALIGNED_TO_CANONICAL',
    canonicalAlignmentAuthorityRef: 'canonical-review-authority',
    bpmnXml: '<?xml version="1.0"?><definitions><process id="Process_I7B07"/></definitions>',
    semanticDigest: 'i7b07-bpmn-semantic-digest',
    diagramDigest: 'i7b07-bpmn-diagram-digest',
    createdAt: T,
    createdBy: 'talos-bpmn-projector',
  });
  return confirmBusinessProcess(draft, {
    canonicalProcessRevisionId: processId,
    confirmedBy: 'business-user',
    confirmedAt: T,
    authorityRef: 'business-process-owner',
    rationale: 'The BPMN is the process I intend Talos to automate.',
  });
}

function freezeGraph(context: ReviewContextBundle, assessmentId: ReturnType<typeof vid>, options: { authority?: boolean } = {}) {
  const scope = context.scopeBinding.semanticScopeRef;
  const payloadId = rid('freeze-payload');
  const requestId = rid('freeze-scope-request');
  const command: ReviewCommand = {
    id: rid('freeze-command'),
    reviewWorkspaceDefinitionId: context.workspaceDefinition.id,
    expectedReviewWorkspaceRevisionId: context.workspaceRevision.id,
    expectedReviewBaselineBundleId: context.baselineBundle.id,
    primarySemanticScopeRef: scope,
    targetSemanticScopeRefs: [scope],
    actionKind: 'REQUEST_FREEZE',
    targetSubjectRefs: [],
    actionPayloadRef: payloadId,
    rationale: 'Freeze the exact confirmed and validated business process for automation design.',
    ...(options.authority === false ? {} : { authorityRef: 'automation-freeze-authority' }),
    requestedBy: 'business-user',
    requestedAt: T,
  };
  const payload: FreezeRequestPayload = {
    id: payloadId,
    reviewCommandId: command.id,
    freezeKind: 'AUTOMATION_DESIGN_HANDOFF',
    scopeRequestRefs: [requestId],
    requestedAt: T,
  };
  const request: ScopeFreezeRequest = {
    id: requestId,
    freezeRequestPayloadId: payload.id,
    semanticScopeRef: scope,
    requestedDisposition: 'ACCEPTED',
    referencedValidationAssessmentRefs: [assessmentId],
  };
  return { command, payload, request };
}

function harness() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-i7b07-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  return {
    repo,
    close() {
      repo.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

function exactFixture(options: { freezeAuthority?: boolean; readiness?: ValidationAssessment['executionReadiness'] } = {}) {
  const process = processRevision();
  const context = reviewContext(process.id);
  const pinnedAssessment = assessment(context, process.id, { readiness: options.readiness });
  const bpmn = confirmedBpmn(process.id);
  const freeze = freezeGraph(context, pinnedAssessment.id, { authority: options.freezeAuthority });
  return { process, context, pinnedAssessment, bpmn, freeze };
}

test('I7B-07 exact confirmed BPMN + exact READY assessment + independent freeze authority creates the existing semantic freeze', () => {
  const h = harness();
  try {
    const x = exactFixture();
    const result = applyConfirmedBpmnFreezeHandoff(h.repo, {
      currentBpmnRevision: x.bpmn.revision,
      confirmation: x.bpmn.confirmation,
      canonicalProcessRevision: x.process,
      reviewContext: x.context,
      freezeCommand: x.freeze.command,
      freezePayload: x.freeze.payload,
      scopeRequests: [x.freeze.request],
      assessments: [x.pinnedAssessment],
    });
    assert.equal(result.handoff.result, 'FROZEN');
    assert.equal(result.handoff.confirmationGateResult, 'AUTHORIZED');
    assert.equal(result.freeze?.freezeApplication.result, 'FROZEN');
    assert.equal(result.freezeRecord?.processRevisionId, x.process.id);
    assert.equal(result.freezeRecord?.reviewWorkspaceRevisionId, x.context.workspaceRevision.id);
    assert.equal(result.freezeRecord?.reviewBaselineBundleId, x.context.baselineBundle.id);
    assert.equal(result.freezeRecord?.authorityRef, 'automation-freeze-authority');
    assert.notEqual(result.freezeRecord?.authorityRef, x.bpmn.confirmation.authorityRef);
    assert.deepEqual(result.freeze?.scopeRecords[0]?.validationAssessmentRefs, [x.pinnedAssessment.id]);
    assert.equal(h.repo.listByKind('BpmnFreezeHandoffRecord').length, 1);
    assert.equal(h.repo.listByKind('SemanticFreezeRecord').length, 1);
  } finally {
    h.close();
  }
});

test('I7B-07 missing or revoked BPMN confirmation creates no semantic freeze', () => {
  for (const mode of ['missing', 'revoked'] as const) {
    const h = harness();
    try {
      const x = exactFixture();
      const confirmation = mode === 'missing'
        ? undefined
        : revokeBusinessProcessConfirmation(x.bpmn.confirmation, { revokedBy: 'business-user', revokedAt: T });
      const result = applyConfirmedBpmnFreezeHandoff(h.repo, {
        currentBpmnRevision: x.bpmn.revision,
        ...(confirmation ? { confirmation } : {}),
        canonicalProcessRevision: x.process,
        reviewContext: x.context,
        freezeCommand: x.freeze.command,
        freezePayload: x.freeze.payload,
        scopeRequests: [x.freeze.request],
        assessments: [x.pinnedAssessment],
      });
      assert.equal(result.handoff.result, 'REJECTED_BPMN_CONFIRMATION');
      assert.equal(result.freezeRecord, undefined);
      assert.equal(h.repo.listByKind('SemanticFreezeRecord').length, 0);
    } finally {
      h.close();
    }
  }
});

test('I7B-07 BPMN digest drift after confirmation is rejected before freeze', () => {
  const h = harness();
  try {
    const x = exactFixture();
    const drifted = { ...x.bpmn.revision, semanticDigest: 'different-semantic-digest' };
    const result = applyConfirmedBpmnFreezeHandoff(h.repo, {
      currentBpmnRevision: drifted,
      confirmation: x.bpmn.confirmation,
      canonicalProcessRevision: x.process,
      reviewContext: x.context,
      freezeCommand: x.freeze.command,
      freezePayload: x.freeze.payload,
      scopeRequests: [x.freeze.request],
      assessments: [x.pinnedAssessment],
    });
    assert.equal(result.handoff.result, 'REJECTED_BPMN_CONFIRMATION');
    assert.equal(result.handoff.confirmationGateResult, 'REJECTED_SEMANTIC_DIGEST_MISMATCH');
    assert.equal(h.repo.listByKind('SemanticFreezeRecord').length, 0);
  } finally {
    h.close();
  }
});

test('I7B-07 confirmed BPMN cannot freeze a different active canonical review baseline', () => {
  const h = harness();
  try {
    const x = exactFixture();
    const differentContext = reviewContext(cid('different-active-process'), x.pinnedAssessment.id);
    const differentFreeze = freezeGraph(differentContext, x.pinnedAssessment.id);
    const result = applyConfirmedBpmnFreezeHandoff(h.repo, {
      currentBpmnRevision: x.bpmn.revision,
      confirmation: x.bpmn.confirmation,
      canonicalProcessRevision: x.process,
      reviewContext: differentContext,
      freezeCommand: differentFreeze.command,
      freezePayload: differentFreeze.payload,
      scopeRequests: [differentFreeze.request],
      assessments: [x.pinnedAssessment],
    });
    assert.equal(result.handoff.result, 'REJECTED_CANONICAL_BASELINE_MISMATCH');
    assert.equal(result.handoff.confirmationGateResult, 'AUTHORIZED');
    assert.equal(h.repo.listByKind('SemanticFreezeRecord').length, 0);
  } finally {
    h.close();
  }
});

test('I7B-07 a different READY assessment cannot substitute for the exact pinned baseline assessment', () => {
  const h = harness();
  try {
    const x = exactFixture();
    const substitute = assessment(x.context, x.process.id, { id: vid('substitute-ready') });
    const request = { ...x.freeze.request, referencedValidationAssessmentRefs: [substitute.id] };
    const result = applyConfirmedBpmnFreezeHandoff(h.repo, {
      currentBpmnRevision: x.bpmn.revision,
      confirmation: x.bpmn.confirmation,
      canonicalProcessRevision: x.process,
      reviewContext: x.context,
      freezeCommand: x.freeze.command,
      freezePayload: x.freeze.payload,
      scopeRequests: [request],
      assessments: [substitute],
    });
    assert.equal(result.handoff.result, 'REJECTED_VALIDATION_GATE');
    assert.equal(result.freeze?.freezeApplication.result, 'REJECTED_VALIDATION_GATE');
    assert.equal(h.repo.listByKind('SemanticFreezeRecord').length, 0);
  } finally {
    h.close();
  }
});

test('I7B-07 confirmed BPMN remains blocked when exact validation is NOT ready for automation design', () => {
  const h = harness();
  try {
    const x = exactFixture({ readiness: 'NEEDS_CONFIRMATION' });
    const result = applyConfirmedBpmnFreezeHandoff(h.repo, {
      currentBpmnRevision: x.bpmn.revision,
      confirmation: x.bpmn.confirmation,
      canonicalProcessRevision: x.process,
      reviewContext: x.context,
      freezeCommand: x.freeze.command,
      freezePayload: x.freeze.payload,
      scopeRequests: [x.freeze.request],
      assessments: [x.pinnedAssessment],
    });
    assert.equal(result.handoff.result, 'REJECTED_VALIDATION_GATE');
    assert.equal(result.freezeRecord, undefined);
    assert.equal(h.repo.listByKind('SemanticFreezeRecord').length, 0);
  } finally {
    h.close();
  }
});

test('I7B-07 BPMN confirmation authority never substitutes for missing freeze authority', () => {
  const h = harness();
  try {
    const x = exactFixture({ freezeAuthority: false });
    assert.equal(x.bpmn.confirmation.authorityRef, 'business-process-owner');
    const result = applyConfirmedBpmnFreezeHandoff(h.repo, {
      currentBpmnRevision: x.bpmn.revision,
      confirmation: x.bpmn.confirmation,
      canonicalProcessRevision: x.process,
      reviewContext: x.context,
      freezeCommand: x.freeze.command,
      freezePayload: x.freeze.payload,
      scopeRequests: [x.freeze.request],
      assessments: [x.pinnedAssessment],
    });
    assert.equal(result.handoff.result, 'REJECTED_FREEZE_AUTHORITY');
    assert.equal(result.freeze?.freezeApplication.result, 'REJECTED_AUTHORITY');
    assert.equal(result.freezeRecord, undefined);
    assert.equal(h.repo.listByKind('SemanticFreezeRecord').length, 0);
  } finally {
    h.close();
  }
});
