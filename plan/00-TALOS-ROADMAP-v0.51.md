# TALOS — Gated Roadmap v0.51

Status: **I7C-03 CLOSED / I7C-04 OPEN**  
Date: **2026-08-20**

## Closed

```text
I0–I7B-08  prior Talos/runtime/BPMN product gates        ✅
I7C-01      credential-safe real provider runtime config ✅
I7C-02      exact model-response correlation             ✅
I7C-03      arbitrary image → common source evidence     ✅
```

I7C-03 exact head: `36193d265ae8e7450ff4334beadd7a3733d40282`  
CI: Image 262 ✅ · Temporal 277 ✅ · Restart 174 ✅

# I7C-04 — Source evidence → canonical validation → BPMN review candidate

## Goal

Create the first integrated image-processing application service that composes the already-proven contracts:

```text
PNG
→ exact intake
→ correlated configured perception
→ common source evidence
→ image semantic normalization
→ canonical ProcessRevision
→ semantic validation
→ deterministic canonical→BPMN projection
→ persisted DRAFT BpmnProcessRevision
```

## Safety

```text
provider failure / NO_RESULT
→ stop before canonical normalization

successful perception
→ canonical meaning remains INFERRED
→ validation runs before BPMN review handoff
→ BPMN is isExecutable=false / DRAFT
→ no BusinessProcessConfirmationRecord
→ no SemanticFreezeRecord
→ no deployment / execution authority
```

## Acceptance

```text
1. arbitrary provider evidence normalizes into an INFERRED ProcessRevision   required
2. canonical provenance points back to image-region evidence                  required
3. frozen semantic validation runs on that exact ProcessRevision               required
4. projector emits IMAGE_INTERPRETATION DRAFT BPMN                             required
5. projected BPMN pins exact canonical ProcessRevision                          required
6. BPMN process remains isExecutable=false                                      required
7. provider safe-stop produces no canonical/BPMN revision                       required
8. no confirmation/freeze/execution authority is created                        required
9. all prior regressions + movable edge remain green                            required
```

## Remaining

```text
I7C-04  evidence → canonical → BPMN candidate                     🟡 ACTIVE
I7C-05  product image upload → vision → Process Confirmation       ⛔
I7C-06  unseen-image adversarial/no-fabrication certification      ⛔
I8      automation design review + BPMN↔Temporal traceability      ⛔
I9      one-app startup/deploy/full end-to-end release gate        ⛔
```
