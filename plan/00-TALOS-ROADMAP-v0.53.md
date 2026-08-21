# TALOS — Gated Roadmap v0.53

Status: **I7C-05 CLOSED / I7C-06 OPEN**  
Date: **2026-08-20**

## Closed

```text
I0–I7B-08  prior Talos/runtime/BPMN product gates         ✅
I7C-01      credential-safe real provider runtime config  ✅
I7C-02      exact model-response correlation              ✅
I7C-03      arbitrary image → common source evidence      ✅
I7C-04      image evidence → canonical → BPMN review      ✅
I7C-05      product image → Process Confirmation          ✅
```

I7C-05 exact implementation head: `d5941de076c7c950d9641cd767d6f9c415196a3f`  
CI: Image 290 ✅ · Temporal 297 ✅ · Restart 188 ✅

## What I7C-05 closed

```text
Upload arbitrary PNG
→ exact source preservation
→ configured/correlated perception
→ INFERRED canonical normalization
→ validation
→ DRAFT BPMN
→ graph/XML semantic edit
→ source-aware structured reconciliation
→ Confirm Process
→ HUMAN_CONFIRMATION canonical revision
→ CONFIRMED BPMN
→ independent automation-design approval
→ SemanticFreezeRecord
```

Deployment and execution remain unauthorized after the freeze.

# I7C-06 — External / adversarial / no-fabrication certification

## Goal

Pressure-test the production image route against unseen/ambiguous process diagrams and prove that Talos blocks or preserves uncertainty rather than fabricating executable semantics.

## Acceptance

```text
1. decision/branch ambiguity cannot become executable conditions by model preference       required
2. incomplete WAIT timing cannot become BPMN/Temporal timer semantics                      required
3. unresolved relation endpoints remain unresolved and block downstream readiness           required
4. provider correlation mismatch safe-stops before evidence                                required
5. provider NO_RESULT / malformed result cannot create canonical/BPMN                      required
6. human confirmation must correctly promote inferred BusinessRule meaning where present    required
7. confirmed ambiguous/incomplete processes remain blocked by semantic validation           required
8. unseen non-Quarry PNG path is used                                                       required
9. if a live external provider credential is available, capture a real vendor proof         conditional
10. if no live credential exists, do not claim external-vendor model proof                  invariant
11. all prior gates remain green                                                            required
```

## Then

```text
I7C-06  external-vendor/adversarial/no-fabrication certification   🟡 ACTIVE
I8      automation design review + BPMN↔Temporal traceability      ⛔
I9      one-app startup/deploy/full end-to-end release gate        ⛔
```
