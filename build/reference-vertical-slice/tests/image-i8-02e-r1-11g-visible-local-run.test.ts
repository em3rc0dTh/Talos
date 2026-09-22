import test from 'node:test';
import assert from 'node:assert/strict';
import { startTalosOneAppProduct } from '../apps/reference-api/src/one-app-product-server.ts';

const target={
  environmentKey:'talos-local-field-trial',
  environmentClass:'TEST' as const,
  temporalPlatformRef:'TEMPORAL_LOCAL_DOCKER',
  namespace:'default',
  taskQueue:'talos-r1-field-trial',
  workflowTypeName:'TalosGenericWorkflow',
  activityTypeName:'executeGenericCapability',
  workerLogicalName:'talos-r1-field-trial-worker',
  executableArtifactRef:'workers/reference-temporal-worker/src/generic-worker-runtime.ts',
  artifactDigest:'abc123',
  sdkFamily:'TEMPORAL_TYPESCRIPT_SDK',
  sdkVersionRef:'1.22.0',
  temporalWebUi:'http://localhost:18233',
};

test('R1-11G/R1-13C simple product preserves local Temporal authority actions behind business-facing implementation copy',async()=>{
  const app=await startTalosOneAppProduct({port:0,simpleRuntimeTarget:target,oneApp:{imagePerceptionEnv:{}}});
  try{
    const response=await fetch(app.baseUrl);
    assert.equal(response.status,200);
    const page=await response.text();
    assert.match(page,/Prepare execution/);
    assert.match(page,/Prepare this environment/);
    assert.match(page,/Make workflow available/);
    assert.match(page,/Start this process/);
    assert.match(page,/Open Temporal/);
    assert.match(page,/Live business work/);
    assert.match(page,/Mark task completed/);
    assert.match(page,/api\/automation\/execution\/state/);
    assert.match(page,/api\/automation\/execution\/human-task\/complete/);
    assert.match(page,/Waiting for you/);
    assert.match(page,/Timer running/);
    assert.match(page,/safe recommended execution settings/);
    assert.match(page,/Technical details/);
    assert.match(page,/body:not\(\.r113ImplementationChosen\) #r111dRun\{display:none!important\}/);
    assert.doesNotMatch(page,/Deploy Worker once/);
    assert.doesNotMatch(page,/r111gRunCard[^]*Artifact digest/);
    const runtime=await (await fetch(`${app.baseUrl}/api/product/runtime-target`)).json() as any;
    assert.equal(runtime.available,true);
    assert.equal(runtime.target.namespace,'default');
    assert.equal(runtime.target.taskQueue,'talos-r1-field-trial');
    assert.equal(runtime.target.temporalWebUi,'http://localhost:18233');
  }finally{
    await app.close();
  }
});
