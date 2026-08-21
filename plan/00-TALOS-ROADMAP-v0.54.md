# TALOS — Gated Roadmap v0.54

Status: **I7C-06 CLOSED / I8 AUTOMATION DESIGN REVIEW OPEN**  
Date: **2026-08-21**

## Closed

```text
I0–I7B-08  canonical/runtime/BPMN product gates                 ✅
I7C-01      credential-safe real-provider runtime configuration  ✅
I7C-02      exact provider-response correlation                  ✅
I7C-03      arbitrary image → common evidence                    ✅
I7C-04      image evidence → canonical → BPMN review             ✅
I7C-05      product image → Process Confirmation                 ✅
I7C-06      adversarial / no-fabrication certification           ✅
```

I7C-06 exact implementation head:

```text
27cbd2be0fbffe54d657aa0f9cf4fe17735ada72
```

CI:

```text
Image 311 ✅ · Temporal 313 ✅ · Restart 202 ✅
```

Detailed evidence:

```text
evidence/14-IMAGE-I7C06-ADVERSARIAL-NO-FABRICATION-EVIDENCE-v0.1.md
```

# I8 — Automation Design Review + BPMN ↔ Temporal traceability

## Goal

After a business process is confirmed and independently frozen for automation design, Talos must turn the existing capability/execution/Temporal design engines into a visible, reviewable product surface.

The target is:

```text
CONFIRMED BPMN
      ↓
AUTOMATION-DESIGN FREEZE
      ↓
CAPABILITY REQUIREMENTS
      ↓
EXPLICIT CAPABILITY / HUMAN / INTEGRATION DECISIONS
      ↓
EXECUTION PLAN
      ↓
EXPLICIT COORDINATION DECISIONS
      ↓
TEMPORAL MAPPING
      ↓
VISIBLE TRACEABILITY
      ↓
CONFIRM AUTOMATION DESIGN
```

Never:

```text
business label → guessed provider/integration
BPMN task      → automatic Temporal Activity
WAIT label     → automatic timer
MESSAGE edge   → silent SEQUENCE coercion
```

## Required visible trace

For each material BPMN process element, the user must be able to inspect:

```text
BPMN element ID
→ canonical semantic subject
→ capability requirement (when work requires a capability)
→ explicit capability binding / human design decision
→ ExecutionPlan element / capability use
→ TemporalMappingUnit
```

For relationships/boundaries:

```text
canonical relation / subprocess
→ explicit execution-design resolution where required
→ ExecutionRelation / boundary treatment
→ Temporal group/unit when applicable
```

## I8 authority model

The following remain distinct:

```text
Process Confirmation authority
≠
Semantic Freeze / Automation Design admission authority
≠
Capability / execution design decision authority
≠
Automation Design Confirmation authority
≠
Deployment authority
≠
Execution authority
```

`Confirm Automation Design` confirms only the exact capability + ExecutionPlan + TemporalMapping revisions under review.

It must not create deployment/runtime execution authority.

## I8 implementation slices

```text
I8-01  immutable automation-review session + traceability model      ⛔
I8-02  capability/execution design decision API                      ⛔
I8-03  Temporal mapping decision API                                 ⛔
I8-04  Automation Design browser surface                             ⛔
I8-05  exact Automation Design Confirmation record                   ⛔
I8-06  browser/API E2E + stale/authority/no-inference adversarial gate ⛔
```

## I8 acceptance

```text
1. exact confirmed BPMN + BusinessProcessConfirmationRecord are pinned             required
2. exact frozen ProcessRevision/assessment/scope are pinned                         required
3. capability requirements are derived from frozen semantics                       required
4. provider/integration selection only appears through explicit design input         required
5. human interaction designs remain explicit                                        required
6. subprocess execution boundaries remain explicit                                  required
7. preserved MESSAGE/unsupported relation treatment remains explicit                 required
8. WAIT Temporal primitive selection remains explicit                               required
9. human Temporal interaction primitive selection remains explicit                  required
10. trace rows prove BPMN → semantic → capability → execution → Temporal lineage    required
11. unresolved/stale design cannot be confirmed                                     required
12. Automation Design Confirmation requires separate authority                      required
13. confirmation creates no DeploymentRevision or execution observation             required
14. prior I0–I7C-06 + Temporal + restart gates remain green                         required
```

## After I8

```text
I9 — ONE TALOS APPLICATION / RELEASE GATE

Process input
→ Process Confirmation
→ Automation Design Review
→ Automation Design Confirmation
→ runtime/deployment approval
→ real Temporal execution
→ persisted observations
→ restart/recovery
→ one-app startup + deployment proof
```

I8 completion is the planned handoff point for the first serious user acceptance test with a user-selected process rather than a repository fixture.
