import test from 'node:test';
import assert from 'node:assert/strict';
import { compileRuntimeConditionExpression } from '../workers/reference-temporal-worker/src/generic-runtime-expression.ts';

test('R1-11I compiles legacy fact conditions into the generic runtime context',()=>{
  assert.deepEqual(
    compileRuntimeConditionExpression(
      {fact:'temperature',operator:'GREATER_THAN_OR_EQUAL',value:90},
      'rule:temperature',
    ),
    {
      kind:'COMPARE',
      left:{kind:'REFERENCE',path:'initialInputs.temperature'},
      operator:'GREATER_THAN_OR_EQUAL',
      right:{kind:'LITERAL',value:90},
    },
  );
});

test('R1-11I preserves explicit generic runtime-context references without domain coupling',()=>{
  assert.deepEqual(
    compileRuntimeConditionExpression(
      {
        kind:'AND',
        expressions:[
          {
            kind:'COMPARE',
            left:{kind:'REFERENCE',path:'activityOutputs.payment.status'},
            operator:'EQUALS',
            right:{kind:'LITERAL',value:'APPROVED'},
          },
          {
            kind:'EXISTS',
            value:{kind:'REFERENCE',path:'humanOutputs.inspection.result'},
          },
        ],
      },
      'rule:generic-domain',
    ),
    {
      kind:'AND',
      expressions:[
        {
          kind:'COMPARE',
          left:{kind:'REFERENCE',path:'activityOutputs.payment.status'},
          operator:'EQUALS',
          right:{kind:'LITERAL',value:'APPROVED'},
        },
        {
          kind:'EXISTS',
          value:{kind:'REFERENCE',path:'humanOutputs.inspection.result'},
        },
      ],
    },
  );
});

test('R1-11I turns confirmed business-language branch conditions into explicit runtime decisions',()=>{
  assert.deepEqual(
    compileRuntimeConditionExpression(
      {language:'BUSINESS_NATURAL_LANGUAGE',body:'Does this confirmed business condition apply now?'},
      'rule:business-decision',
    ),
    {
      kind:'DECISION_INPUT',
      decisionRef:'rule:business-decision',
      prompt:'Does this confirmed business condition apply now?',
    },
  );
});

test('R1-11I rejects unknown condition operators before Temporal execution',()=>{
  assert.throws(
    ()=>compileRuntimeConditionExpression(
      {fact:'arbitraryFact',operator:'UNSUPPORTED_DOMAIN_OPERATOR',value:true},
      'rule:unsupported',
    ),
    /RUNTIME_CONDITION_OPERATOR_UNSUPPORTED:rule:unsupported:UNSUPPORTED_DOMAIN_OPERATOR/,
  );
});

test('R1-11I rejects opaque condition languages instead of sending them to the Worker',()=>{
  assert.throws(
    ()=>compileRuntimeConditionExpression(
      {language:'SOME_VENDOR_EXPRESSION',body:'x'},
      'rule:opaque',
    ),
    /RUNTIME_EXPRESSION_NOT_EXECUTABLE:rule:opaque:SOME_VENDOR_EXPRESSION/,
  );
});
