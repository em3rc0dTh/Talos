# TALOS — R1 Product Completion Plan v0.1

Status: **ACTIVE**  
Target: **TALOS 1.0 PRODUCT READY**  
Started: **2026-08-25**  
Base release: `009b266bbfc7d82218ba613bedf1ef14af0159fc` — Talos v0.1 Private Technical Preview certification

## Goal

R1 converts the certified Talos architecture into the complete end-user product path.

The R0 reference approval demo is not the product target. It remains a regression spine for Canvas → Canonical → review → freeze → Temporal execution. R1 converges on the existing One-App authority chain and makes that path usable from arbitrary supported source input through durable observed execution.

```text
SOURCE
  image / BPMN / native canvas / supported authored input
    ↓
exact source preservation
    ↓
source-aware perception / parsing
    ↓
common evidence
    ↓
INFERRED canonical process
    ↓
validation + uncertainty
    ↓
human review / correction / confirmation
    ↓
confirmed Canonical ProcessRevision
    ↓
automation-design handoff
    ↓
Automation Design Workspace
    ↓
explicit capability/integration decisions
    ↓
ExecutionPlan review
    ↓
explicit automation approval
    ↓
Temporal mapping
    ↓
explicit runtime policy
    ↓
deployment design + environment realization
    ↓
explicit deployment approval + attempt
    ↓
explicit workflow execution approval
    ↓
Temporal execution
    ↓
real external effect
    ↓
durable evidence / lineage / recovery
```

## Product-complete invariant

Talos 1.0 must never collapse these states:

```text
SOURCE TRUTH
!=
PERCEPTION EVIDENCE
!=
INFERRED BUSINESS MEANING
!=
HUMAN-CONFIRMED BUSINESS PROCESS
!=
AUTOMATION APPROVAL
!=
DEPLOYMENT AUTHORITY
!=
EXECUTION AUTHORITY
```

Confidence never upgrades truth class or authority.

## R1 gates

### R1-01 — Truthful source and perception UX

Goal: the UI must report the actual result of each source-processing stage, not merely whether a capability exists in the build.

Acceptance:

```text
I0 exact bytes              PASS / FAIL
I1 perception               PASS / PARTIAL / NO_RESULT
I2 common evidence          PASS / BLOCKED / NOT_REACHED
I3 review                   PASS / NOT_REACHED
I4 Canonical + Validation   PASS / NOT_REACHED
I5 freeze / execution       CLOSED until explicit authority
I6 image → Temporal         CLOSED until explicit authority
```

No `NO_RESULT` upload may display I1–I4 as successful.

### R1-02 — Real arbitrary-input image path in One-App

Use the already-certified runtime binding and One-App image route instead of the fixture-only reference perception provider.

Required:

- exact PNG preservation before provider use;
- configured real perception provider binding;
- correlated provider response;
- model/CV evidence retained separately from semantic truth;
- arbitrary supported process image can produce `BPMN_READY_FOR_PROCESS_REVIEW` when evidence is sufficient;
- insufficient/ambiguous evidence fails closed without manufacturing Canonical meaning;
- provider outage/auth/model errors remain observable and non-authoritative.

### R1-03 — End-user process review and correction workspace

The user must be able to inspect:

- original source;
- observed evidence;
- inferred activities, actors, flows, data and decision candidates;
- uncertainty and alternatives;
- validation findings/questions;
- provenance from Canonical subjects back to source evidence.

The user can correct, accept, reject or defer. Corrections create new revisions; original source evidence remains immutable.

### R1-04 — Business-process confirmation

The complete reviewed process can only become confirmed through explicit actor authority.

Acceptance:

- confirmation pins the exact reconciled BPMN revision and Canonical ProcessRevision;
- stale confirmation fails closed;
- image-derived meaning remains inferred until explicit confirmation;
- no confirmation automatically authorizes automation or execution.

### R1-05 — Automation Design Workspace product path

After confirmation and explicit automation-design handoff:

- requirements are visible;
- Talos suggests capabilities/integrations by requirement family;
- user may ACCEPT / REPLACE / REJECT / DEFER;
- suggestion does not equal binding;
- selections are traceable to authority and process revision;
- missing required capability remains blocking.

### R1-06 — ExecutionPlan review and automation approval

Acceptance:

- generated ExecutionPlan is visible as user-reviewable process steps and implementation design;
- runtime inputs are explicit;
- retries/idempotency/timeouts are explicit;
- external effects are explicit;
- automation approval pins the exact plan/revision;
- changed semantics invalidate downstream approval as required.

### R1-07 — Runtime / deployment / execution authority

One-App must expose and enforce the complete I9 chain:

```text
approved Temporal mapping
→ explicit runtime policy
→ deployment design
→ environment realization
→ explicit deployment approval
→ deployment attempt
→ explicit workflow execution approval
→ workflow execution
```

No earlier approval substitutes for a later authority.

### R1-08 — Real capability execution

At least one production-representative capability transport must execute through Temporal from the One-App path and create a concrete external effect with durable evidence and idempotency protection.

The existing R0 GitHub transport proof may serve as the first certified transport, but R1 must prove it from the complete product path rather than an isolated release fixture.

### R1-09 — Durability, restart and upgrade behavior

Required:

- same-build restart rehydrates without immutable conflicts;
- durable source/review/authority/execution evidence survives restart;
- in-flight workflow recovery behavior is characterized;
- old-runtime/new-build incompatibility is detected and handled explicitly rather than surfacing as an unexplained immutable conflict;
- migrations or versioned runtime isolation are defined before 1.0.

### R1-10 — Product UX

Replace reference/debug-first surfaces with the user product experience.

Required screens/flows:

- source intake;
- process understanding/review;
- source ↔ Canonical evidence inspection;
- correction/confirmation;
- automation design;
- integration/capability decisions;
- execution plan;
- authority gates;
- running workflow status;
- execution evidence/history;
- recover/resume existing work.

Raw JSON remains available as evidence/debug detail, not the primary product interaction.

### R1-11 — Field trials

Run multiple real processes that are not implementation fixtures.

Capture:

- interpretation accuracy;
- missing/incorrect semantics;
- reviewer effort;
- question quality;
- correction loop usability;
- automation suggestion quality;
- authority clarity;
- execution success/failure;
- operator friction;
- time-to-reviewed-process;
- time-to-approved-execution;
- defects by severity.

No field-trial source becomes a hard-coded provider fixture in order to manufacture a pass.

### R1-12 — Talos 1.0 release certification

The final gate runs against one exact merged-main SHA and proves:

- clean install/build;
- architecture/frozen invariants;
- all semantic/source/review/automation/authority tests;
- arbitrary-input positive and fail-closed cases;
- same-build restart;
- upgrade-state behavior;
- real One-App input → review → confirmation → automation → deployment → execution;
- real external effect and durable evidence;
- no duplicate effect on replay/retry;
- secret-safe evidence;
- exact-SHA release receipt.

Only after R1-01 through R1-12 are closed may the repository state:

> **Talos 1.0 — PRODUCT READY**

## Completion rule

R1 is evidence-gated, not percentage-gated.

`100%` means all defined Talos 1.0 product gates above are closed with identified runtime receipts. It does not mean the software can never receive another feature; it means the agreed 1.0 product scope is complete and releasable without known blockers inside that scope.

## Immediate execution order

```text
R1-01A truthful image-stage UI                         ← ACTIVE
R1-01B regression test + Quarry-02 positive control
R1-02  connect product UI to real One-App image path
R1-03  source-aware review/correction UX
R1-04  confirmation UX
R1-05  Automation Design Workspace UX
R1-06  ExecutionPlan + automation approval UX
R1-07  runtime/deployment/execution authority UX
R1-08  real capability effect from full product path
R1-09  durable recovery + versioned upgrade behavior
R1-10  product UX consolidation
R1-11  real field trials
R1-12  exact-SHA Talos 1.0 release certification
```

No new unrelated product idea is admitted before the active gate is closed.
