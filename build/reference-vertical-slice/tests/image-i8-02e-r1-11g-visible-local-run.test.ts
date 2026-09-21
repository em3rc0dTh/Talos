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

test('R1-11G simple product exposes progressive local Temporal run actions without infrastructure forms',async()=>{
  const app=await startTalosOneAppProduct({port:0,simpleRuntimeTarget:target,oneApp:{imagePerceptionEnv:{}}});
  try{
    const response=await fetch(app.baseUrl);
    assert.equal(response.status,200);
    const page=await response.text();
    assert.match(page,/Use recommended runtime/);
    assert.match(page,/Prepare local deployment/);
    assert.match(page,/Deploy Worker once/);
    assert.match(page,/Start workflow once/);
    assert.match(page,/Open Temporal/);
    assert.match(page,/Live business work/);
    assert.match(page,/Mark task completed/);
    assert.match(page,/api\/automation\/execution\/state/);
    assert.match(page,/api\/automation\/execution\/human-task\/complete/);
    assert.match(page,/Waiting for you/);
    assert.match(page,/Timer running/);
    assert.match(page,/bounded Activity retries/);
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
