import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { evaluateFreeze } from '../packages/review/src/freeze.ts';
import type {
  FreezeRequestPayload,
  ReviewBaselineBundle,
  ReviewCommand,
  ReviewScopeSurfaceBinding,
  ReviewWorkspaceRevision,
  ScopeFreezeRequest,
} from '../packages/review/src/types.ts';
import type { ValidationAssessment } from '../packages/semantic-core/src/types.ts';

const rid = (seed: string) => createOpaqueId('review', `i5b00:${seed}`);
const cid = (seed: string) => createOpaqueId('canonical', `i5b00:${seed}`);
const vid = (seed: string) => createOpaqueId('validation', `i5b00:${seed}`);
const T = '2026-08-20T07:30:00.000Z';

function fixture(options: { authority?: boolean } = {}) {
  const scope = rid('scope') as unknown as string;
  const processRevisionId = cid('process');
  const assessmentId = vid('assessment');
  const workspaceDefinitionId = rid('workspace-definition');
  const workspace: ReviewWorkspaceRevision = {
    id: rid('workspace-revision'),
    reviewWorkspaceDefinitionId: workspaceDefinitionId,
    revisionNumber: 3,
    createdAt: T,
    createdBy: 'reviewer',
    baselineProcessRevisionId: processRevisionId,
    baselineValidationAssessmentId: assessmentId,
    sourceContextRefs: [],
    adapterResultContextRefs: [],
    semanticContextDigest: 'workspace-digest',
  };
  const baseline: ReviewBaselineBundle = {
    id: rid('baseline'),
    reviewWorkspaceDefinitionId: workspaceDefinitionId,
    reviewWorkspaceRevisionId: workspace.id,
    baselineProcessRevisionId: processRevisionId,
    reviewProjectionRevisionId: rid('projection'),
    primaryReviewScopeRef: scope,
    contextReviewScopeRefs: [],
    scopeSurfaceBindingRefs: [rid('scope-binding')],
    sourceContextRefs: [],
    adapterResultContextRefs: [],
    baselineSemanticDigest: 'baseline-semantic',
    compatibilityDigest: 'baseline-compatibility',
    createdAt: T,
  };
  const scopeBinding: ReviewScopeSurfaceBinding = {
    id: baseline.scopeSurfaceBindingRefs[0],
    reviewBaselineBundleId: baseline.id,
    semanticScopeRef: scope,
    scopeKind: 'PROCESS_REVISION',
    validationAssessmentRefs: [assessmentId],
    projectionSubjectRefs: [],
    visualGrammarKind: 'PROCESS_GRAPH',
    scopeCompatibilityDigest: 'scope-compatibility',
    createdAt: T,
  };
  const assessment = {
    id: assessmentId,
    processRevisionId,
    provenanceContractVersion: 'v0.3',
    canonicalModelVersion: 'v0.1',
    validatorVersion: 'reference',
    rulesetVersion: 'semantic-validation-v0.2',
    assessmentIntent: 'AUTOMATION_DESIGN_READINESS',
    primaryScopeRef: scope,
    contextScopeRefs: [],
    findingIds: [],
    semanticVerdict: 'VALID',
    executionReadiness: 'READY_FOR_AUTOMATION_DESIGN',
    readinessDecisionRef: vid('readiness'),
    assessedAt: T,
  } as ValidationAssessment;
  const payloadId = rid('payload');
  const requestId = rid('scope-request');
  const command: ReviewCommand = {
    id: rid('command'),
    reviewWorkspaceDefinitionId: workspaceDefinitionId,
    expectedReviewWorkspaceRevisionId: workspace.id,
    expectedReviewBaselineBundleId: baseline.id,
    primarySemanticScopeRef: scope,
    targetSemanticScopeRefs: [scope],
    actionKind: 'REQUEST_FREEZE',
    targetSubjectRefs: [],
    actionPayloadRef: payloadId,
    rationale: 'Freeze exact ready baseline.',
    ...(options.authority === false ? {} : { authorityRef: 'business-owner' }),
    requestedBy: 'reviewer',
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
    referencedValidationAssessmentRefs: [assessment.id],
  };
  return { scope, processRevisionId, workspace, baseline, scopeBinding, assessment, command, payload, request };
}

function evaluate(x: ReturnType<typeof fixture>, assessments: ValidationAssessment[] = [x.assessment]) {
  return evaluateFreeze(x.command, rid(`command-application:${x.command.id}`), x.payload, [x.request], x.workspace, x.baseline, x.scopeBinding, assessments, T);
}

test('I5B-00 ready freeze without explicit authority is rejected before any freeze record exists', () => {
  const x = fixture({ authority: false });
  const result = evaluate(x);
  assert.equal(result.application.result, 'REJECTED_AUTHORITY');
  assert.equal(result.freezeRecord, undefined);
  assert.equal(result.scopeRecords.length, 0);
});

test('I5B-00 exact current ready baseline with authority is eligible and pins the exact assessment', () => {
  const x = fixture();
  const result = evaluate(x);
  assert.equal(result.application.result, 'FROZEN');
  assert.equal(result.freezeRecord?.processRevisionId, x.processRevisionId);
  assert.equal(result.freezeRecord?.reviewWorkspaceRevisionId, x.workspace.id);
  assert.equal(result.freezeRecord?.reviewBaselineBundleId, x.baseline.id);
  assert.equal(result.freezeRecord?.authorityRef, 'business-owner');
  assert.deepEqual(result.scopeRecords[0].validationAssessmentRefs, [x.assessment.id]);
  assert.deepEqual(result.outcomes[0].validationAssessmentRefs, [x.assessment.id]);
});

test('I5B-00 unrelated ready assessment for the same scope cannot substitute for the pinned baseline assessment', () => {
  const x = fixture();
  const substitute = { ...x.assessment, id: vid('substitute-ready') } as ValidationAssessment;
  const request = { ...x.request, referencedValidationAssessmentRefs: [substitute.id] };
  const result = evaluateFreeze(x.command, rid('substitute-app'), x.payload, [request], x.workspace, x.baseline, x.scopeBinding, [substitute], T);
  assert.equal(result.application.result, 'REJECTED_VALIDATION_GATE');
  assert.equal(result.freezeRecord, undefined);
});

test('I5B-00 pinned assessment for the wrong ProcessRevision cannot authorize freeze', () => {
  const x = fixture();
  const wrong = { ...x.assessment, processRevisionId: cid('different-process') } as ValidationAssessment;
  const result = evaluate(x, [wrong]);
  assert.equal(result.application.result, 'REJECTED_VALIDATION_GATE');
  assert.equal(result.freezeRecord, undefined);
});

test('I5B-00 malformed payload/scope-request association is rejected as an invalid freeze graph', () => {
  const x = fixture();
  const badRequest = { ...x.request, freezeRequestPayloadId: rid('different-payload') };
  const result = evaluateFreeze(x.command, rid('bad-request-app'), x.payload, [badRequest], x.workspace, x.baseline, x.scopeBinding, [x.assessment], T);
  assert.equal(result.application.result, 'REJECTED_INVALID_SCOPE_SET');
  assert.equal(result.freezeRecord, undefined);
});

test('I5B-00 incoherent baseline/scope binding is rejected as stale before freeze', () => {
  const x = fixture();
  const wrongBinding = { ...x.scopeBinding, reviewBaselineBundleId: rid('different-baseline') };
  const result = evaluateFreeze(x.command, rid('stale-binding-app'), x.payload, [x.request], x.workspace, x.baseline, wrongBinding, [x.assessment], T);
  assert.equal(result.application.result, 'REJECTED_STALE');
  assert.equal(result.freezeRecord, undefined);
});
