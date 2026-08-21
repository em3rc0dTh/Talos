# TALOS — I7C-06 Adversarial No-Fabrication Evidence v0.1

Status: **PASS — ADVERSARIAL IMAGE SAFETY GATE CLOSED**  
Date: **2026-08-21**

## Exact proven implementation head

```text
27cbd2be0fbffe54d657aa0f9cf4fe17735ada72
```

## Exact CI

```text
Image vertical slice              run 311 ✅
B7-B9 Temporal reference runtime  run 313 ✅
B10 Restart safety                run 202 ✅
```

Image 311 replayed the full historical chain through the current I7C-06 edge. All prior gates passed.

## Adversarial source

I7C-06 includes a non-Quarry 2×2 PNG with SHA-256:

```text
168b8b2e81aec05759d67532d962380f5df5006429479777dea01a0b7296e4bf
```

It is not registered in the Quarry fixture provider.

## No-fabrication proofs

### Branch labels are not executable rules

```text
“Yes” / “No” visible text
→ evidence may be preserved
→ conditional relationship candidate may be preserved
→ BusinessRule fabricated                 ❌
→ conditionExpression fabricated          ❌
→ SV-CFL-001 remains when rule is absent  ✅
```

### WAIT text is not a timer

The validator was hardened to v0.3.

```text
WAIT with no explicit waitKind
→ SV-EVT-003
→ INSUFFICIENT_DETAIL
```

For schedule/deadline semantics, both an expression and timezone are required.

```text
“On Next Wednesday”
→ WAIT review meaning preserved       ✅
→ automatic timerEventDefinition      ❌
→ automatic DURABLE_TIMER             ❌
```

The historical Quarry-02 ready path was migrated rather than weakening this invariant. It now reaches automation readiness only after an explicit reviewer-authored semantic correction:

```text
waitKind   = SCHEDULE
expression = NEXT_WEDNESDAY
timezone   = America/Lima
```

These values are HUMAN REVIEW DESIGN TRUTH, not claims that the raster image itself contained an executable timezone contract.

### Unresolved relationship endpoint remains unresolved

```text
provider endpoint = UNRESOLVED
→ incomplete relationship evidence preserved
→ ProcessEdge fabricated ❌
→ SV-CFL-002             ✅
```

### Correlation mismatch cannot cross the provider boundary

A structurally valid response for the wrong source representation/SHA/coordinate space safe-stops before common evidence/canonical/BPMN materialization.

```text
correlation mismatch
→ SAFE_STOP_PROVIDER_FAILURE
→ SourceEvidenceGraph ❌
→ ProcessRevision     ❌
→ BpmnProcessRevision ❌
```

## BusinessRule confirmation hardening

`applyClaimConfirmation` now promotes the BusinessRule object itself to `CONFIRMED` only when all active semantic claims for that rule subject are confirmed.

```text
model/provider structured rule
→ BusinessRule.truthClass = INFERRED
→ explicit user Process Confirmation
→ new HUMAN_CONFIRMATION ProcessRevision
→ BusinessRule.truthClass = CONFIRMED
```

The old inferred ProcessRevision remains immutable.

## Preserved MESSAGE relation is not coerced

I7C-06 also exposed an execution-design ambiguity in Quarry-02:

```text
Place Order
   -- MESSAGE -->
Verify Customer Identity
```

Canonical truth correctly remains:

```text
ProcessEdge.kind = MESSAGE
```

A MESSAGE business relation is not directly one of the generic executable coordination kinds. Talos therefore used to keep it as an unresolved `SOURCE_DEFINED` ExecutionRelation.

The fix was not to rewrite MESSAGE as SEQUENCE. I7C-06 adds explicit authority-backed execution relation resolution:

```text
canonical MESSAGE
      ↓
ExecutionRelationResolution
  authorityRef
  decidedBy
  rationale
  resolvedExecutionRelationKind = SEQUENCE
      ↓
ExecutionPlan relation = SEQUENCE coordination
```

The original canonical edge remains MESSAGE. This cleanly separates business semantics from implementation/orchestration design.

## Authority / downstream invariants

I7C-06 does not authorize:

```text
model output → Process Confirmation       ❌
Process Confirmation → semantic freeze    ❌
semantic freeze → deployment              ❌
semantic freeze → execution               ❌
```

All authority transitions remain explicit and independently recorded.

## External-provider honesty

I7C-06 proves the vendor-neutral production-shaped HTTP boundary, exact correlation, adversarial safe-stops, and unseen-source path.

It does **not** claim a live commercial vision-vendor inference run because no live external provider credential was supplied to this gate.

```text
live commercial vision model quality proof  ⛔ NOT CLAIMED
```

That remains an environment certification item, not a reason to substitute fixture output or fabricate evidence.

## Closure

```text
I7C-06 adversarial / no-fabrication certification   ✅ CLOSED
Image program I7C structural product path           ✅ CLOSED
Next: I8 automation design review + traceability    🟡 OPEN
```