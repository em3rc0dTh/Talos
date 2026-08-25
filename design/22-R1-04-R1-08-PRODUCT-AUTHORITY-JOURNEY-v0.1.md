# R1-04 → R1-08 — Talos Product Authority Journey v0.1

Status: ACTIVE BUILD CONTRACT  
Branch: `feat/r1-04-r1-08-product-authority-journey`

## Goal

Turn the already-certified One-App authority backend into one coherent end-user journey without weakening source truth, semantic review, or execution authority.

The product journey begins only after R1-03 has produced an ACTIVE review candidate and ends only after Talos has recorded a real workflow execution observation.

```text
REAL SOURCE
  ↓
INFERRED PROCESS REVIEW
  ↓ human correction as needed
EXPLICIT BUSINESS CONFIRMATION                 R1-04
  ↓
AUTOMATION DESIGN HANDOFF + WORKSPACE          R1-05
  ↓
SUGGESTION DECISIONS
  ↓
EXPLICIT CAPABILITY SELECTION
  ↓
EXECUTIONPLAN REVIEW + AUTOMATION APPROVAL     R1-06
  ↓
TEMPORAL MAPPING
  ↓
EXPLICIT RUNTIME POLICY
  ↓
DEPLOYMENT DESIGN + ENVIRONMENT REALIZATION
  ↓
EXPLICIT DEPLOYMENT APPROVAL + ONE ATTEMPT     R1-07
  ↓
EXPLICIT WORKFLOW EXECUTION APPROVAL
  ↓ exact approved facts/capability inputs
REAL TEMPORAL WORKFLOW START
  ↓
DURABLE WORKFLOW EXECUTION OBSERVATION          R1-08
```

## Non-negotiable invariant

`SOURCE_TRUTH != PERCEPTION_EVIDENCE != INFERRED_BUSINESS_MEANING != USER_CORRECTION != HUMAN_BUSINESS_CONFIRMATION != AUTOMATION_APPROVAL != DEPLOYMENT_AUTHORITY != EXECUTION_AUTHORITY`.

No product-screen convenience may collapse those states.

## Backend authority

The product UI MUST drive the existing `one-app-server.ts` routes. It MUST NOT create a parallel semantic, automation, deployment, or execution state machine.

Authoritative routes:

- `POST /api/bpmn/confirm`
- `POST /api/bpmn/automation-design-approval`
- `POST /api/automation/suggestion/decide`
- `POST /api/automation/capability/select`
- `POST /api/automation/execution-plan/review`
- `POST /api/automation/approve`
- `POST /api/automation/temporal-mapping`
- `POST /api/automation/runtime-policy`
- `POST /api/automation/deployment-design`
- `POST /api/automation/environment-realization`
- `POST /api/automation/deployment/approve`
- `POST /api/automation/deployment/attempt`
- `POST /api/automation/execution/approve`
- `POST /api/automation/execution/start`

## R1-04 — Business confirmation

The browser must show the exact current BPMN review revision and reconciled Canonical `ProcessRevision` being confirmed.

Confirmation requires:

- deliberate user action;
- a non-empty authority reference;
- rationale;
- exact current BPMN revision id;
- exact current reconciled ProcessRevision id.

After confirmation:

- BPMN state is `CONFIRMED`;
- Canonical derivation is `HUMAN_CONFIRMATION` for image-derived meaning;
- confirmed claims are `CONFIRMED`;
- readiness can advance to `READY_FOR_AUTOMATION_DESIGN` only if validation permits;
- automation design remains unopened until the separate R1-05 action.

Any later semantic correction invalidates the prior review head and requires reconfirmation.

## R1-05 — Automation Design

Opening automation design requires the exact confirmed process plus an explicit `AUTOMATION_DESIGN_HANDOFF` authority action.

The browser must expose:

- capability requirements;
- unresolved requirements;
- suggestions grouped by requirement;
- each suggestion's implementation direction;
- `ACCEPT`, `REPLACE`, `REJECT`, `DEFER` decisions;
- explicit rationale and authority for decisions.

A suggestion decision MUST NOT create a binding.

Binding requires explicit capability selection. A user must choose exactly one valid selection per requirement. `REJECT` and `DEFER` can never be promoted into a binding.

`SOURCE_DEFINED` requirements require an explicit offering choice and family. Human-interaction requirements require explicit participant/outcome design.

## R1-06 — ExecutionPlan and automation approval

After explicit capability selection Talos may create a resolved ExecutionPlan candidate.

The browser must display the plan before approval, including:

- execution elements and relations;
- capability uses;
- human coordination where present;
- unresolved decisions;
- readiness.

The user reviews the ExecutionPlan and then separately approves automation.

Automation approval must pin the exact reviewed plan and must remain distinct from Temporal runtime policy, deployment authority, and workflow-start authority.

## R1-07 — Runtime and deployment authority

The browser must drive explicit runtime policy decisions rather than inserting hidden defaults.

For every Activity the user-approved runtime policy must include material retry, timeout, idempotency, and failure-classification decisions. Whole-workflow retry policy is separate.

Deployment requires:

1. Deployment design;
2. concrete environment realization;
3. explicit deployment approval;
4. exactly one consumed deployment attempt.

A deployment attempt MUST NOT start a workflow.

The normal Talos product launcher must inject a trusted deployment executor when runtime mode is `TEMPORAL_EXECUTION`; otherwise the UI must truthfully identify execution as unavailable instead of presenting a dead button.

## R1-08 — Workflow execution and effect evidence

Workflow execution requires:

- a successful exact deployment attempt;
- explicit workflow execution approval;
- exact `executionId`;
- exact facts digest;
- exact capability-input digest;
- one authorized workflow start.

Drifted execution inputs must be rejected before `workflow.start`.

The trusted execution executor must return real Temporal evidence:

- workflow execution reference;
- workflow id;
- run id;
- terminal execution status;
- evidence references.

The durable One-App repository records the resulting `WorkflowExecutionObservation`.

A second start using the consumed authority must fail closed.

## Private-preview product boundary

The final local product launcher MUST preserve the existing R0 private-preview boundary:

- loopback binding;
- bearer authentication;
- configured workspace and actor binding;
- request-size limits;
- source-image size limits;
- no secret material in browser responses;
- durable operator lock;
- recovery inspection before startup.

The browser-facing product shell should proxy to that boundary server-side so the bearer token is never delivered to browser JavaScript.

## Product UX states

The product screen must make these states visually distinct:

- `INFERRED · REVIEW REQUIRED`
- `CORRECTED · RECONFIRMATION REQUIRED`
- `CONFIRMED · AUTOMATION NOT YET APPROVED`
- `AUTOMATION DESIGN · USER DECISION REQUIRED`
- `CAPABILITIES SELECTED · PLAN REVIEW REQUIRED`
- `EXECUTIONPLAN REVIEWED · APPROVAL REQUIRED`
- `AUTOMATION APPROVED · RUNTIME DESIGN REQUIRED`
- `DEPLOYMENT DESIGNED · REALIZATION REQUIRED`
- `DEPLOYMENT REALIZED · DEPLOYMENT APPROVAL REQUIRED`
- `DEPLOYMENT SUCCEEDED · EXECUTION APPROVAL REQUIRED`
- `EXECUTION APPROVED · ONE START AUTHORIZED`
- `EXECUTION OBSERVED · COMPLETE`

## Closure evidence

This consolidated slice is not closed merely because the old backend tests pass. It requires new R1 product regressions proving:

1. browser product page exposes every authority stage without automatic shortcuts;
2. business confirmation pins the exact current review revision;
3. semantic correction forces reconfirmation;
4. suggestion decisions remain non-binding;
5. explicit capability selection is required;
6. ExecutionPlan review precedes automation approval;
7. runtime policy contains no hidden product defaults;
8. deployment approval is single-attempt authority;
9. workflow execution approval is single-start authority;
10. exact execution-input drift is blocked;
11. successful execution returns durable Temporal observation evidence;
12. browser-facing product boundary never exposes bearer or provider secrets;
13. the normal product launcher can actually reach the trusted runtime when configured;
14. design-only mode fails closed and remains useful for review/design.

## Explicit non-goals for this slice

- multi-tenant public SaaS IAM;
- autonomous business confirmation;
- autonomous integration binding;
- autonomous automation approval;
- autonomous production deployment;
- autonomous workflow execution authority;
- pretending every external provider is certified.

Those are not required to make Talos 1.0 a complete controlled product and must not be smuggled into this build as convenience behavior.
