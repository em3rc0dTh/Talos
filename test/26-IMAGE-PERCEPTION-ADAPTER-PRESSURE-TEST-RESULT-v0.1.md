# TALOS — P2-03 Image / Perception Adapter Pressure-Test Result v0.1

Status: **INITIAL EXECUTION — CONTRACT CHANGE REQUIRED**  
Date: **2026-08-19**

Target:

```text
design/12-IMAGE-PERCEPTION-ADAPTER-CONTRACT-v0.1.md
arch/06-IMAGE-PERCEPTION-ADAPTER-ARCHITECTURE-v0.1.md
```

Spec:

```text
test/25-IMAGE-PERCEPTION-ADAPTER-PRESSURE-TEST-SPEC-v0.1.md
```

## Result

```text
I01–I28
27 PASS
 1 FAIL
```

Failure:

```text
I27 — human resolution of perception alternatives is historical
```

---

# Fixture matrix

```text
I01 PASS  physical origin vs photo capture
I02 PASS  digital-native origin vs screenshot
I03 PASS  region-addressable evidence
I04 PASS  crop/rotation/deskew derivative lineage
I05 PASS  literal text vs interpreted meaning
I06 PASS  competing text readings
I07 PASS  shape existence vs semantic type
I08 PASS  independent relationship uncertainty
I09 PASS  out-of-frame/occluded continuation vs termination
I10 PASS  authoring UI separation
I11 PASS  collaborator cursor ≠ actor
I12 PASS  same text ≠ same occurrence
I13 PASS  ambiguous long connector
I14 PASS  event-like circle ≠ terminal
I15 PASS  architecture diagram not one process
I16 PASS  metric/style overlays not execution policy
I17 PASS  functional role depends on notation hypothesis
I18 PASS  mechanism/resource ≠ process step
I19 PASS  functional dependency ≠ temporal sequence
I20 PASS  composite text inside one shape
I21 PASS  domain expectation does not repair source
I22 PASS  multiple representations do not auto-collapse
I23 PASS  re-perception is immutable/versioned
I24 PASS  Canvas review of uncertain/source-only evidence
I25 PASS  partial perception is not failed source
I26 PASS  perception failure preserves source
I27 FAIL  human resolution could mutate perception alternative set
I28 PASS  reviewer correction survives newer perception result
```

---

# Failure analysis — I27

v0.1 defines:

```text
PerceptionAlternativeSet
- ...
- selectionState
- selectedAlternativeId?
- selectionAuthorityRef?
```

with states including:

```text
UNRESOLVED
MODEL_PREFERRED
HUMAN_CONFIRMED
AUTHORITY_SELECTED
```

This is insufficiently historical.

Example:

```text
AdapterAttempt A
alternative set S
selectionState = MODEL_PREFERRED
selected = "Brainst"
```

Later:

```text
human confirms "Brainstorm"
```

If TALOS updates S to:

```text
selectionState = HUMAN_CONFIRMED
selected = "Brainstorm"
```

then the system loses the exact state of what AdapterAttempt A originally preferred.

That violates frozen historical principles already established by:

```text
Provenance v0.3
Semantic Validation v0.2
Canvas Review / Projection v0.2
```

The defect is narrow: alternative generation is sound; **alternative resolution needs its own immutable record**.

---

# Required correction

Create Image/Perception v0.2 with:

```text
PerceptionAlternativeSet
```

as immutable output of one adapter attempt, containing alternatives and optional model preference only.

Add a separate immutable authority/history structure, candidate name:

```text
PerceptionAlternativeDecision
```

which records:

```text
alternativeSetId
chosen/rejected alternative(s)
decision kind
authority
rationale
decidedAt
evidence/confirmation refs
resulting claim/revision refs where applicable
```

Human confirmation must create new evidence/confirmation/claims and must never edit the perception set.

---

# Contracts not reopened

This failure does **not** require changing:

```text
Canonical v0.1
Provenance v0.3
Semantic Validation v0.2
Process Source Intake v0.2
Canvas Review / Projection v0.2
```

The defect can be repaired inside the image-family specialization carried by common `sourceExtensionRefs`.

---

# Gate decision

```text
P2-03 IMAGE/PERCEPTION
❌ NOT READY TO FREEZE
```

Next:

```text
Image / Perception Adapter v0.2
→ full I01–I28 regression
```

BUILD remains closed.
