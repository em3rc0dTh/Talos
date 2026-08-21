# TALOS — Gated Roadmap v0.50

Status: **I7C-02 CLOSED / I7C-03 OPEN**  
Date: **2026-08-20**

## Closed

```text
I0–I7B-08  prior Talos/runtime/BPMN product gates        ✅
I7C-01      credential-safe real provider runtime config ✅
I7C-02      exact model-response correlation             ✅
```

I7C-02 exact head: `a45b35b38151facbd2338912a1c02b0a16f08378`  
CI: Image 255 ✅ · Temporal 269 ✅ · Restart 169 ✅

# I7C-03 — Arbitrary image perception → common source evidence

## Goal

Prove that a previously unregistered process image can enter through the correlated configured-provider route and materialize image-region provenance/common evidence without any Quarry digest dependency or truth escalation.

```text
UNREGISTERED PNG
→ exact intake
→ correlated configured provider
→ MODEL_INFERENCE
→ VisualEvidenceAnchor / PerceptionObservation / relations
→ AdapterResult
→ SourceEvidenceGraph / CandidateSemanticScope
```

## Acceptance

```text
1. no fixture digest/provider dependency                                required
2. image-region geometry survives into common evidence                  required
3. model observations remain INFERRED                                   required
4. candidate nodes/relations preserve supporting anchor references       required
5. ambiguity/unknown endpoint states remain explicit                    required
6. no canonical/freeze/execution authority is created by evidence step   required
7. I7C-02 correlation remains mandatory on strongest real route          required
8. all prior regressions remain green                                    required
```

## Remaining

```text
I7C-03  arbitrary perception → source evidence                       🟡 ACTIVE
I7C-04  source evidence → canonical validation → BPMN candidate       ⛔
I7C-05  product image upload → vision → Process Confirmation          ⛔
I7C-06  unseen-image adversarial/no-fabrication certification         ⛔
I8      automation design review + BPMN↔Temporal traceability         ⛔
I9      one-app startup/deploy/full end-to-end release gate           ⛔
```
