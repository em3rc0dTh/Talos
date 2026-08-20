import test from 'node:test';
import assert from 'node:assert/strict';
import { startGenericDemo } from '../apps/reference-api/src/generic-server.ts';

test('I6 generic browser demo starts, reports realized deployment, and executes Quarry-01 on Temporal', { timeout: 120_000 }, async()=>{
 const app=await startGenericDemo({port:0});
 try{
  const page=await fetch(app.baseUrl).then(r=>r.text());assert.match(page,/Image → frozen design → real Temporal execution/);
  const health=await fetch(`${app.baseUrl}/api/health`).then(r=>r.json()) as any;
  assert.equal(health.status,'READY');
  assert.equal(health.readiness.execution,'READY_FOR_TEMPORAL_MAPPING_DESIGN');
  assert.equal(health.readiness.temporal,'READY_FOR_RUNTIME_POLICY_DESIGN');
  assert.equal(health.readiness.deployment,'READY_FOR_DEPLOYMENT_ATTEMPT');
  assert.equal(health.source.sha256,'8ede24c9f1162ed83c10d8c62063d8d19813c993965378acf1a2e36113218bd9');
  const response=await fetch(`${app.baseUrl}/api/run`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({creditOk:true,fulfilledOk:true})});
  assert.equal(response.status,200);const result=await response.json() as any;
  assert.equal(result.outcome,'COMPLETED');assert(result.visitedNames.includes('Send invoice'));assert(result.visitedNames.includes('Order complete'));assert.equal(result.visitedNames.includes('Order Failed'),false);assert.equal(result.capabilityEffects.length,4);assert.ok(result.temporal.workflowId);assert.ok(result.temporal.runId);
 }finally{await app.close();}
});
