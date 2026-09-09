# R1-11 Field Trial Defect 05 — Duration WAIT execution handoff v0.1

Status: **FIX CANDIDATE — USER EXECUTION REQUIRED**

## Field witness

The real `image-test.png` journey progressed materially beyond the previous blockers:

```text
Source SHA-256: b84a2abd02aed0632275864e5fb987832620ac9cfa69fd22be178d11e16da8ce
Source route: IMAGE_INTERPRETATION
Business confirmation: CONFIRMED
AI Automation Design: PRIMARY_ACCEPTED
AI design readiness: READY_FOR_CAPABILITY_SELECTION
Capabilities: explicitly bound from accepted AI proposal
ExecutionPlan: BLOCKED_EXECUTION_DESIGN
ExecutionPlan readiness: NEEDS_EXECUTION_DESIGN_DECISION
```

The review UI preserved the source wait as:

```text
Dejar actuar 5 minutos — WAIT
```

Automation design counted one durable wait and successfully reached accepted capability selection. Step 5 then blocked with:

```text
WAIT exists semantically but lacks complete structured resume semantics required for Temporal mapping.
Do not infer timer/schedule behavior from its label.
```

This is a downstream execution-design contract defect. It is not a perception failure, business-confirmation failure, Gemini automation-design failure, capability-binding failure or authority-boundary failure.

The exact user field-run Git SHA was not independently supplied with this screenshot, so this receipt does not claim an exact-SHA field PASS/FAIL beyond the visible product state.

## Root cause

The Canonical duration contract introduced by the previous R1-11 correction is:

```text
waitKind = DURATION
durationExpression = PT5M
durationSeconds = 300
```

However, the resolved ExecutionPlan builder still tested:

```text
waitKind === DURATION → details.expression must exist
```

rather than consuming `details.durationExpression` / `details.durationSeconds`.

A second latent mismatch existed in the product Temporal runtime snapshot. It only accepted legacy:

```text
durationMs
waitDurationMs
```

so even if Step 5 were unblocked, the same Canonical duration could fail later during real runtime-program compilation.

## Generic correction

Talos now consumes the Canonical DURATION contract across downstream boundaries.

### ExecutionPlan readiness

A DURATION wait is complete when it contains an explicit structured duration via:

```text
durationExpression
```

or a positive numeric:

```text
durationSeconds
```

Legacy `expression` remains accepted for already-persisted fixtures.

This does not authorize a Temporal primitive. It only establishes that the frozen business wait has complete elapsed-time semantics.

### Runtime semantic snapshot

Runtime duration materialization now accepts, in compatibility order:

```text
legacy durationMs / waitDurationMs
canonical durationSeconds
canonical fixed ISO durationExpression
legacy fixed ISO expression
```

and produces the deterministic runtime snapshot value:

```text
PT5M / 300 seconds → 300000 ms
```

Unsupported/ambiguous calendar durations remain fail-closed through the existing fixed-duration parser.

## Authority boundary preserved

This correction does **not** automatically choose Temporal `DURABLE_TIMER`.

The authority sequence remains:

```text
CONFIRMED business WAIT(DURATION, PT5M)
        ↓
ExecutionPlan recognizes complete coordination semantics
        ↓
READY_FOR_TEMPORAL_MAPPING_DESIGN
        ↓
explicit Step-6 Temporal mapping decision
        ↓
DURABLE_TIMER or another permitted explicit mapping
```

Semantic completeness is not Temporal-design authority.

## Code correction

- `packages/execution/src/generic-resolved-plan.ts`
  - DURATION readiness consumes `durationExpression` / `durationSeconds`;
  - legacy `expression` remains compatible;
  - empty DURATION semantics remain blocked.
- `apps/reference-api/src/private-preview-temporal-runtime.ts`
  - runtime snapshot consumes canonical `durationSeconds`;
  - fixed ISO `durationExpression` can be deterministically converted when seconds are absent;
  - legacy millisecond fields remain compatible.
- `tests/r1-11-duration-wait-semantics.test.ts`
  - proves ExecutionPlan duration readiness;
  - proves missing duration remains fail-closed;
  - proves canonical seconds become deterministic runtime milliseconds;
  - proves fixed ISO durationExpression can drive the runtime snapshot without legacy fields.

## Anti-overfit statement

The fix contains no car-wash task name, source hash, decision label, actor name or source-specific branch.

It depends only on the Canonical WAIT kind and structured duration fields.

## Required closure evidence

Run the focused regression on the exact new branch head:

```powershell
node --experimental-strip-types --test `
  .\tests\r1-11-duration-wait-semantics.test.ts `
  .\tests\r1-11-bpmn-wait-roundtrip.test.ts `
  .\tests\r1-11-ai-automation-primary-product-path.test.ts `
  .\tests\r1-11-runtime-policy-activity-boundary.test.ts
```

Then repeat the same real image journey through Step 5.

Expected closure witness:

```text
AI DESIGN ACCEPTED · CAPABILITIES BOUND
ExecutionPlan readiness = READY_FOR_TEMPORAL_MAPPING_DESIGN
no semantic-correction-required WAIT blocker
ExecutionPlan can be explicitly approved
Step 6 becomes available
Temporal wait primitive still requires explicit mapping authority
no deployment or execution authority is created automatically
```

Do not close this defect from static inspection alone.
