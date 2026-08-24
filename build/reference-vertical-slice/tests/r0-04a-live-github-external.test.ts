import test from 'node:test';
import assert from 'node:assert/strict';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import type { CompiledGenericRuntimeProgram,GenericCapabilityActivityInput,GenericWorkflowResult } from '../workers/reference-temporal-worker/src/generic-contracts.ts';
import { genericEffectIdentity } from '../workers/reference-temporal-worker/src/generic-activities.ts';
import { createGenericTemporalWorker } from '../workers/reference-temporal-worker/src/generic-worker-runtime.ts';
import { TalosGenericWorkflow } from '../workers/reference-temporal-worker/src/generic-workflow.ts';
import {
  GitHubIssueCommentCapabilityTransport,
  GITHUB_ISSUE_COMMENT_TRANSPORT_REF,
  inspectGitHubIssueCommentEffect,
} from '../workers/reference-temporal-worker/src/github-issue-comment-transport.ts';

const LIVE_REQUIRED=process.env.R0_04_LIVE_REQUIRED==='1';
const USE_REF='capability-use:r0-04a-github-comment';
const TASK_QUEUE='talos-r0-04a-live-external';

function required(name:string):string{
  const value=process.env[name]?.trim();
  if(!value)throw new TypeError(`R0-04A live certification requires ${name}`);
  return value;
}

function program():CompiledGenericRuntimeProgram{
  return{
    schemaVersion:'talos.generic-runtime-program.v1',
    sdkTarget:{family:'TEMPORAL_TYPESCRIPT_SDK',version:'1.22.0'},
    executionPlanRevisionRef:'execution:r0-04a-live-external',
    temporalMappingRevisionRef:'temporal-mapping:r0-04a-live-external',
    runtimePolicyRevisionRef:'runtime-policy:r0-04a-live-external',
    deploymentRevisionRef:'deployment:r0-04a-live-external',
    temporalFeatureProfileRef:'temporal-profile:r0-04a-live-external',
    workflow:{workflowTypeName:'TalosGenericWorkflow',workflowMaximumAttempts:1},
    activity:{
      activityTypeName:'executeGenericCapability',
      policies:[{
        capabilityUseOccurrenceRef:USE_REF,
        temporalMappingUnitRef:'temporal-unit:r0-04a-live-external',
        retry:{
          initialIntervalMs:100,
          backoffCoefficient:2,
          maximumIntervalMs:1000,
          maximumAttempts:2,
          nonRetryableErrorTypes:[
            'INVALID_GITHUB_COMMENT_CAPABILITY_INPUT',
            'GITHUB_EXTERNAL_IDEMPOTENCY_CONFLICT',
            'GITHUB_EXTERNAL_AUTH_OR_SCOPE_FAILURE',
            'GITHUB_EXTERNAL_AUTH_OR_REQUEST_FAILURE',
            'GITHUB_EXTERNAL_INVALID_RESPONSE',
            'INVALID_EXTERNAL_CAPABILITY_EVIDENCE',
          ],
        },
        timeout:{startToCloseMs:15_000,scheduleToCloseMs:30_000},
        idempotency:{
          strategyKind:'IDEMPOTENCY_KEY',
          keyContract:'sha256(executionId + capabilityUseOccurrenceRef)',
          enforcementRef:GITHUB_ISSUE_COMMENT_TRANSPORT_REF,
        },
      }],
    },
    graph:{
      entryElementRef:'execution-element:r0-04a-invoke',
      elements:[
        {id:'execution-element:r0-04a-invoke',kind:'CAPABILITY_INVOCATION',constructKinds:[],capabilityUseOccurrenceRefs:[USE_REF],semanticSubjectRefs:['semantic:r0-04a-live-effect']},
        {id:'execution-element:r0-04a-complete',kind:'COMPLETION_COORDINATION',constructKinds:[],capabilityUseOccurrenceRefs:[],semanticSubjectRefs:[]},
      ],
      relations:[{id:'execution-relation:r0-04a-complete',sourceElementRef:'execution-element:r0-04a-invoke',targetElementRef:'execution-element:r0-04a-complete',relationKind:'SEQUENCE'}],
    },
    semantics:{conditionRules:[],waits:[],snapshotDigest:'r0-04a-live-external-semantic-snapshot'},
    deploymentIntent:{
      environmentClass:'TEST',
      desiredNamespaceKey:'talos-r0-04a',
      desiredTaskQueueKey:TASK_QUEUE,
      desiredWorkerLogicalName:'talos-r0-04a-live-external-worker',
      realizationState:'INCOMPLETE_ENVIRONMENT_REALIZATION',
    },
    programDigest:'r0-04a-live-external-program-v0.1',
  };
}

async function executeOnce(
  temporal:Awaited<ReturnType<typeof TestWorkflowEnvironment.createLocal>>,
  transport:GitHubIssueCommentCapabilityTransport,
  executionId:string,
  comment:string,
  suffix:string,
):Promise<GenericWorkflowResult>{
  const runtime=await createGenericTemporalWorker({
    connection:temporal.nativeConnection,
    namespace:temporal.namespace,
    taskQueue:TASK_QUEUE,
    identity:`r0-04a-worker-${suffix}`,
    capabilityTransport:transport,
  });
  const workerRun=runtime.worker.run();
  try{
    const handle=await temporal.client.workflow.start(TalosGenericWorkflow,{
      workflowId:`talos-r0-04a-${suffix}-${executionId}`,
      taskQueue:TASK_QUEUE,
      args:[{
        executionId,
        facts:{certification:'R0-04A'},
        capabilityInputs:{[USE_REF]:{comment}},
        program:program(),
      }],
      retry:{maximumAttempts:1},
    });
    return await handle.result();
  }finally{
    runtime.worker.shutdown();
    await workerRun;
  }
}

test('R0-04A real Temporal Activity creates exactly one idempotent GitHub external effect across Worker-ledger restart',{skip:!LIVE_REQUIRED,timeout:120_000},async()=>{
  const repository=required('R0_04_GITHUB_REPOSITORY');
  const token=required('R0_04_GITHUB_TOKEN');
  const headSha=required('R0_04_GITHUB_HEAD_SHA');
  const issueNumber=Number(required('R0_04_GITHUB_PR_NUMBER'));
  assert.equal(Number.isSafeInteger(issueNumber)&&issueNumber>0,true);

  const executionId=`R0-04A-${headSha}`;
  const comment=[
    'Talos R0-04A live external integration evidence.',
    '',
    `Certified head: ${headSha}`,
    'Path: TalosGenericWorkflow → executeGenericCapability → GitHub REST issue-comment transport.',
    'Authority baseline: I9-07 remains a separate required exact-head regression gate.',
  ].join('\n');
  const activityInput:GenericCapabilityActivityInput={executionId,capabilityUseOccurrenceRef:USE_REF,input:{comment}};
  const identity=genericEffectIdentity(activityInput);
  const options={repository,issueNumber,token};
  const transport=new GitHubIssueCommentCapabilityTransport(options);

  const before=await inspectGitHubIssueCommentEffect(options,identity);
  assert.equal(before.conflictingMatches.length,0,'existing GitHub evidence must not contain a drifted input digest for the same Talos effect key');
  assert.ok(before.exactMatches.length<=1,'R0-04A external idempotency requires at most one pre-existing exact effect');

  const temporal=await TestWorkflowEnvironment.createLocal({server:{namespace:'talos-r0-04a'}});
  try{
    const first=await executeOnce(temporal,transport,executionId,comment,'first');
    assert.equal(first.outcome,'COMPLETED');
    assert.equal(first.capabilityResults.length,1);
    const firstEffect=first.capabilityResults[0];
    assert.ok(['INSERTED','DUPLICATE_IDENTICAL'].includes(firstEffect.effectStatus));
    assert.equal(firstEffect.transportRef,GITHUB_ISSUE_COMMENT_TRANSPORT_REF);
    assert.ok(firstEffect.externalEffectRef?.startsWith('github:issue-comment:'));
    assert.ok(firstEffect.evidenceRefs?.some(ref=>ref===`talos:effect-key:${identity.effectKey}`));
    assert.ok(firstEffect.evidenceRefs?.some(ref=>ref===`talos:input-digest:${identity.inputDigest}`));
    assert.equal(JSON.stringify(firstEffect).includes(token),false);

    const second=await executeOnce(temporal,transport,executionId,comment,'second');
    assert.equal(second.outcome,'COMPLETED');
    assert.equal(second.capabilityResults.length,1);
    const secondEffect=second.capabilityResults[0];
    assert.equal(secondEffect.effectStatus,'DUPLICATE_IDENTICAL','fresh Worker ledger must deduplicate using external GitHub evidence');
    assert.equal(secondEffect.externalEffectRef,firstEffect.externalEffectRef);
    assert.equal(secondEffect.transportRef,GITHUB_ISSUE_COMMENT_TRANSPORT_REF);
    assert.equal(JSON.stringify(secondEffect).includes(token),false);

    const after=await inspectGitHubIssueCommentEffect(options,identity);
    assert.equal(after.conflictingMatches.length,0);
    assert.equal(after.exactMatches.length,1,'Temporal retries/restarts must leave exactly one GitHub effect for this Talos effect key + input digest');
    assert.equal(`github:issue-comment:${after.exactMatches[0].id}`,firstEffect.externalEffectRef);
  }finally{
    await temporal.teardown();
  }
});
