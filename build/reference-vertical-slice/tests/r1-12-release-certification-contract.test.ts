import test from 'node:test';
import assert from 'node:assert/strict';
import { R1_11_FIELD_TRIAL_SCHEMA } from '../scripts/r1-11-field-trial-gate.ts';
import {
  R1_12_RELEASE_RECEIPT_SCHEMA,
  buildR112ReleaseReceipt,
} from '../scripts/r1-12-release-receipt.ts';

function trial(trialId:string,processFingerprint:string){
  return{
    schemaVersion:R1_11_FIELD_TRIAL_SCHEMA,
    trialId,
    processOrigin:{kind:'REAL_CUSTOMER_PROCESS',organizationAlias:`org-${trialId}`,description:`Observed process ${trialId}`},
    participant:{role:'Business operator',externalToImplementationTeam:true},
    processFingerprint,
    inputKinds:['BPMN'],
    metrics:{
      semanticAccuracyReviewed:0.95,
      reviewerEffortMinutes:15,
      questionUsefulnessRating1to5:5,
      correctionUsabilityRating1to5:4,
      suggestionQualityRating1to5:4,
      authorityClarityRating1to5:5,
      timeToReviewedMinutes:14,
      timeToApprovedMinutes:21,
      executionOutcome:'COMPLETED',
      operatorFrictionNotes:'Measured in qualifying field work.',
      defects:[],
    },
    evidenceRefs:[`field-trial:${trialId}`],
    attestedBy:`attestor-${trialId}`,
    attestedAt:'2026-09-14T22:00:00.000Z',
  };
}

const sha='1234567890abcdef1234567890abcdef12345678';

function env(overrides:Record<string,unknown>={}){
  return{
    exactSha:sha,
    mainSha:sha,
    githubSha:sha,
    repository:'em3rc0dTh/Talos',
    workflowRunId:'12345',
    workflowRunAttempt:'1',
    workflowRef:'em3rc0dTh/Talos/.github/workflows/r1-12-talos-1-release-certification.yml@refs/heads/main',
    externalEffectIssueNumber:59,
    certifiedAt:'2026-09-14T22:30:00.000Z',
    ...overrides,
  } as any;
}

test('R1-12 receipt can only authorize PRODUCT READY for one exact merged-main SHA after R1-11 PASS',()=>{
  const receipt=buildR112ReleaseReceipt(env(),[trial('trial-a','process-a'),trial('trial-b','process-b')]);
  assert.equal(receipt.schemaVersion,R1_12_RELEASE_RECEIPT_SCHEMA);
  assert.equal(receipt.status,'PASS');
  assert.equal(receipt.productReadyClaimAuthorized,true);
  assert.equal(receipt.exactMainSha,sha);
  assert.equal(receipt.fieldTrials.status,'PASS');
  assert.equal(receipt.fieldTrials.distinctProcessCount,2);
  assert.equal(receipt.externalEffect.issueNumber,59);
  assert.ok(receipt.checks.some(check=>check.id==='NO_DUPLICATE_EFFECT_ON_REPLAY'&&check.status==='PASS'));
});

test('R1-12 refuses a checked-out SHA that is not current main',()=>{
  assert.throws(
    ()=>buildR112ReleaseReceipt(env({mainSha:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}),[trial('trial-a','process-a'),trial('trial-b','process-b')]),
    /exact-SHA violation/,
  );
});

test('R1-12 refuses to manufacture release readiness before R1-11 field trials pass',()=>{
  assert.throws(
    ()=>buildR112ReleaseReceipt(env(),[trial('trial-a','process-a')]),
    /R1-12 requires R1-11 PASS/,
  );
});
