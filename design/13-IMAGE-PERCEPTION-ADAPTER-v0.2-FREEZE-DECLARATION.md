# TALOS — Image / Perception Adapter v0.2 Freeze Declaration

Status: **FROZEN — P2-03 DESIGN / ARCHITECTURE**  
Date: **2026-08-19**

## Frozen artifacts

### Design

```text
design/12-IMAGE-PERCEPTION-ADAPTER-CONTRACT-v0.2.md
blob: 16147de77eb340de2bc157170986867be4199822
```

### Architecture

```text
arch/06-IMAGE-PERCEPTION-ADAPTER-ARCHITECTURE-v0.2.md
blob: b3c6de6c32867b1190b3f5771fee1517da6f9689
```

These exact blobs are the artifacts that passed the full P2-03 regression.

No later edit may be described as the same frozen v0.2 contract. Evidence-forced changes require a new version and full affected regression.

---

# Pressure-test history

Initial candidates:

```text
design/12-IMAGE-PERCEPTION-ADAPTER-CONTRACT-v0.1.md
arch/06-IMAGE-PERCEPTION-ADAPTER-ARCHITECTURE-v0.1.md
```

Initial execution:

```text
I01–I28
27 PASS
 1 FAIL
```

Failure:

```text
I27 — human resolution of perception alternatives is historical
```

Defect:

```text
PerceptionAlternativeSet carried mutable-looking human selection state
```

v0.2 correction:

```text
PerceptionAlternativeSet       immutable model/attempt output
PerceptionAlternativeDecision  immutable later authority/human resolution
```

Full regression:

```text
test/27-IMAGE-PERCEPTION-ADAPTER-REGRESSION-RESULT-v0.1.md
28 / 28 PASS
```

---

# Frozen architectural laws added by P2-03

```text
PIXELS                       ≠ PERCEIVED STRUCTURE
PERCEIVED STRUCTURE          ≠ INTERPRETED SEMANTICS
INTERPRETED SEMANTICS        ≠ CONFIRMED BUSINESS TRUTH
MODEL PREFERENCE             ≠ HUMAN CONFIRMATION
OUT-OF-FRAME / OCCLUDED      ≠ PROVEN ABSENCE
VISIBLE ARROW                ≠ SEQUENCE FLOW
GEOMETRY                     ≠ UNIVERSAL SEMANTICS
NEW PERCEPTION MODEL         ≠ MUTATION OF OLD INTERPRETATION
```

Visual uncertainty must remain:

```text
local
addressable
property-scoped
versioned
provenance-backed
reviewable
```

---

# What is frozen vs not claimed

Frozen/proven at design/architecture level:

```text
image source provenance profile
visual evidence anchors / coordinate spaces
representation-transform lineage
perception observations and alternatives
independent relationship uncertainty
plane/artifact classification discipline
0..N scope discovery
notation-dependent geometry dependencies
multi-representation correspondence discipline
immutable re-perception
Canvas review integration
```

Not claimed:

```text
OCR implementation
vision model implementation
model/vendor selection
production image ingestion
accuracy benchmark
runtime integration
Temporal execution
```

---

# Dependency integrity

P2-03 passed without reopening:

```text
Canonical v0.1
Provenance v0.3
Semantic Validation v0.2
Process Source Intake v0.2
Canvas Native Authoring v0.2
Canvas Review / Projection v0.2
BPMN Structured Adapter v0.1
```

BUILD remains closed under the Phase-2 Input Understanding gate.
