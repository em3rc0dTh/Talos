import test from 'node:test';
import assert from 'node:assert/strict';
import {
  R1_11_FIELD_TRIAL_SCHEMA,
  validateR111FieldTrialSet,
  validateR111Receipt,
} from '../scripts/r1-11-field-trial-gate.ts';

function receipt(trialId:string,processFingerprint:string,overrides:Record<string,unknown>={}){
  return{
    schemaVersion:R1_11_FIELD_TRIAL_SCHEMA,
    trialId,
    processOrigin:{kind:'REAL_OPERATIONAL_PROCESS',organizationAlias:`org-${trialId}`,description:`Real process ${trialId}`},
    participant:{role:'Operations reviewer',externalToImplementationTeam:true},
    processFingerprint,
    inputKinds:['BPMN'],
    metrics:{
      semanticAccuracyReviewed:0.9,
      reviewerEffortMinutes:18,
      questionUsefulnessRating1to5:4,
      correctionUsabilityRating1to5:4,
      suggestionQualityRating1to5:4,
      authorityClarityRating1to5:5,
      timeToReviewedMinutes:16,
      timeToApprovedMinutes:24,
      executionOutcome:'COMPLETED',
      operatorFrictionNotes:'Observed and recorded during a real field trial.',
      defects:[],
    },
    evidenceRefs:[`evidence:${trialId}`],
    attestedBy:`participant-${trialId}`,
    attestedAt:'2026-09-14T22:00:00.000Z',
    ...overrides,
  };
}

test('R1-11 requires two qualifying receipts from two distinct real processes',()=>{
  const one=validateR111FieldTrialSet([receipt('trial-a','process-a')]);
  assert.equal(one.status,'FAIL');
  assert.ok(one.errors.some(error=>error.includes('at least two qualifying real field trials')));

  const duplicateProcess=validateR111FieldTrialSet([receipt('trial-a','process-a'),receipt('trial-b','process-a')]);
  assert.equal(duplicateProcess.status,'FAIL');
  assert.ok(duplicateProcess.errors.some(error=>error.includes('two distinct real process fingerprints')));

  const passing=validateR111FieldTrialSet([receipt('trial-a','process-a'),receipt('trial-b','process-b')]);
  assert.deepEqual(passing,{status:'PASS',qualifyingTrialCount:2,distinctProcessCount:2,errors:[],trialIds:['trial-a','trial-b']});
});

test('R1-11 rejects implementation-team participants and secret-like evidence',()=>{
  const internal=receipt('trial-a','process-a',{participant:{role:'Talos implementer',externalToImplementationTeam:false}});
  assert.ok(validateR111Receipt(internal).some(error=>error.includes('externalToImplementationTeam must be true')));

  const leaked=receipt('trial-b','process-b',{evidenceRefs:['Bearer abcdefghijklmnopqrstuvwxyz0123456789']});
  assert.ok(validateR111Receipt(leaked).some(error=>error.includes('secret material')));
});

test('R1-11 permits negative trial outcomes when they are measured instead of hidden',()=>{
  const blocked=receipt('trial-negative','process-negative',{
    metrics:{
      semanticAccuracyReviewed:0.45,
      reviewerEffortMinutes:55,
      questionUsefulnessRating1to5:2,
      correctionUsabilityRating1to5:2,
      suggestionQualityRating1to5:1,
      authorityClarityRating1to5:3,
      timeToReviewedMinutes:50,
      timeToApprovedMinutes:null,
      executionOutcome:'BLOCKED_BY_OPERATOR',
      operatorFrictionNotes:'Operator declined execution after identifying a material semantic ambiguity.',
      defects:[{id:'FT-NEG-001',severity:'HIGH',summary:'Material ambiguity blocked approval.',blockedTrial:true}],
    },
  });
  assert.deepEqual(validateR111Receipt(blocked),[]);
});
