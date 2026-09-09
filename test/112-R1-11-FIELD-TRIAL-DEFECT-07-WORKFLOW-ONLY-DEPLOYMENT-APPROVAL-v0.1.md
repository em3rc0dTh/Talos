# R1-11 FIELD TRIAL DEFECT 07 — WORKFLOW-ONLY DEPLOYMENT APPROVAL

Status: FIX CANDIDATE
Field date: 2026-09-07
Branch: `feat/r1-04-r1-08-product-authority-journey`

## Observed field failure

A real image-derived process reached the governed Run stage under `TEMPORAL_EXECUTION` with:

- Business work: 8
- Human: 8
- System / integration: 0
- Durable waits: 1
- Branches: 1

Talos successfully produced and pinned environment realization evidence, then the visible Worker activation flow stopped with:

`Worker activation failed: Deployment approval did not settle`

## Root cause

The runtime-policy and Temporal mapping boundary correctly keeps human coordination and durable waits Workflow-native. A Workflow with zero Temporal Activities is therefore valid.

However, `assertRealizedDeployment()` in `packages/deployment/src/generic-deployment-attempt.ts` required `activityTypeBindings.length > 0` for every deployment approval. This forced an Activity binding even when the approved mapping contained no Activity work.

That invariant contradicted the existing R1 product law:

`HUMAN / WAIT COORDINATION != TEMPORAL ACTIVITY WORK`

The browser release-closure layer then waited for the hidden deployment approval control to enable the deployment-attempt control. Because backend approval correctly failed closed under the incorrect invariant, the wrapper eventually surfaced the generic timeout text.

## Fix

Deployment approval now always requires concrete:

- Task Queue binding;
- Workflow type binding;
- Worker artifact binding;
- resolved namespace and environment lineage;
- fully resolved material deployment requirements.

Activity type bindings are now conditional:

- zero Activity bindings are valid for Workflow-only human/wait coordination;
- when Activity bindings exist, the realized Worker must support the exact same ActivityTypeBinding set;
- mismatched or partial Worker Activity support remains fail-closed.

No fake Activity is manufactured to make a human-only Workflow deployable.

## Regression evidence

Added:

`build/reference-vertical-slice/tests/r1-11-workflow-only-deployment-approval.test.ts`

It proves:

1. Workflow-native human/wait deployment can receive one explicit deployment-attempt approval with zero Activity bindings.
2. Activity-bearing deployments fail closed when Worker Activity support does not match realized Activity bindings.
3. Exact Activity support remains accepted when Activity work exists.

## Field re-test acceptance

On an exact post-fix SHA:

1. start Talos with a reachable Temporal runtime;
2. reuse a real human-dominant / durable-wait process;
3. confirm process;
4. approve automation;
5. compile the governed execution design;
6. activate the approved Worker;
7. backend `/api/automation/deployment/approve` must settle successfully;
8. backend `/api/automation/deployment/attempt` must return `SUCCEEDED` before the UI may show `Worker active`;
9. `Run workflow` must then become available;
10. no Activity binding may be synthesized solely to satisfy deployment approval.

Final release certification remains gated by R1-11 field evidence and R1-12 exact-SHA certification.
