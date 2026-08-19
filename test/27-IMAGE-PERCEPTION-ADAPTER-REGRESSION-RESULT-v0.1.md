# TALOS — P2-03 Image / Perception Adapter Regression Result v0.1

Status: **FULL REGRESSION PASS**  
Date: **2026-08-19**

Regression target:

```text
design/12-IMAGE-PERCEPTION-ADAPTER-CONTRACT-v0.2.md
arch/06-IMAGE-PERCEPTION-ADAPTER-ARCHITECTURE-v0.2.md
```

Original spec:

```text
test/25-IMAGE-PERCEPTION-ADAPTER-PRESSURE-TEST-SPEC-v0.1.md
```

Initial result:

```text
27 PASS / 1 FAIL
```

Evidence-forced change:

```text
PerceptionAlternativeSet becomes immutable adapter output
PerceptionAlternativeDecision becomes separate immutable human/authority record
```

## Full regression

```text
I01–I28
28 PASS
 0 FAIL
```

---

# Fixture results

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
I27 PASS  human resolution is separate immutable history
I28 PASS  reviewer correction survives newer perception result
```

---

# I27 regression proof

v0.2 flow:

```text
AdapterAttempt A
      ↓
PerceptionAlternativeSet S
modelPreferredAlternativeId = X
      ↓
S remains immutable
      ↓
user / authority action
      ↓
PerceptionAlternativeDecision D
selectedAlternativeIds = [Y]
      ↓
ConfirmationRecord / SemanticClaim / ReviewAction as applicable
      ↓
new ProcessRevision if accepted semantics change
```

Talos can preserve both:

```text
model originally preferred X
human later confirmed Y
```

without historical mutation.

---

# Cross-contract regression

The v0.2 image specialization does not require changing:

```text
Canonical Process Model v0.1
Provenance v0.3
Semantic Validation v0.2
Process Source Intake v0.2
Canvas Native Authoring v0.2
Canvas Review / Projection v0.2
BPMN Structured Adapter v0.1
```

Image-specific structures remain behind common `sourceExtensionRefs` and provenance links.

---

# Gate conclusion

The exact v0.2 design/architecture under test satisfy P2-03 design/architecture conformance for I01–I28.

```text
P2-03 IMAGE / PERCEPTION ADAPTER
✅ REGRESSION PASS — READY TO FREEZE DESIGN/ARCH
```

This is not an implementation claim.

```text
vision/OCR implementation        ❌
production image support         ❌
runtime/Temporal implementation  ❌
```

BUILD remains closed.
