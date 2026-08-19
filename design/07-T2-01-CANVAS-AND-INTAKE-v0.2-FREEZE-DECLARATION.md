# TALOS — T2-01 Canvas & Source Intake v0.2 Freeze Declaration

Status: **FROZEN / T2-01 DESIGN + ARCH CONTRACTS**  
Date: **2026-08-19**

## Frozen contracts

### Canvas Native Source Contract v0.2

```text
path:
design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.2.md

contract commit:
6b93b9e7490b0c3f63fe512c135171f5b53e6dd1

contract blob:
f3b616fe11222b862fd76b75286a8ee31e208049
```

### Process Source Intake Contract v0.2

```text
path:
design/06-PROCESS-SOURCE-INTAKE-CONTRACT-v0.2.md

contract commit:
09d04a701e3c44d6d7e6124b3be0080e266ff029

contract blob:
3520961c9345914992468120b997e97e9ffe2b24
```

### Phase-2 Source Intake & Canvas Adapter Architecture v0.2

```text
path:
arch/03-PHASE-2-SOURCE-INTAKE-AND-CANVAS-ADAPTER-v0.2.md

contract commit:
f7f6bc4136c074b99b85247507b947affd623c68

contract blob:
46ea73aa17e1523c4fd8617fbb055e6aadf6a9e6
```

The exact blobs above are the artifacts that passed the C01–C20 regression. They are frozen without post-test semantic mutation.

---

# Pressure-test history

Initial candidates:

```text
Canvas Native Source v0.1
Process Source Intake v0.1
Phase-2 Source Intake / Canvas Adapter Architecture v0.1
```

Initial result:

```text
C01–C20
18 PASS / 2 FAIL
```

Evidence:

```text
test/13-T2-01-CANVAS-ADAPTER-PRESSURE-TEST-RESULT-v0.1.md
```

Failures:

```text
C03 incomplete/dangling branch intent
C20 adapter failure after source preservation
```

Evidence-forced evolution:

```text
Canvas v0.2
+ CanvasEndpointRef
+ SET / UNKNOWN / UNCONNECTED endpoint states
+ incomplete relationship → source evidence, not fabricated canonical edge

Intake/Architecture v0.2
+ AdapterAttempt
+ explicit failure stage/diagnostics
+ retry lineage
+ deterministic input fingerprint
+ failed adapter ≠ failed/lost source
```

Full regression:

```text
test/14-T2-01-CANVAS-ADAPTER-REGRESSION-RESULT-v0.1.md
20 / 20 PASS
```

---

# Frozen Phase-2 intake invariants

```text
CANVAS SOURCE                    ≠ CANONICAL MODEL
SOURCE INPUT                     ≠ PROCESS AUTOMATICALLY
ONE ARTIFACT                     MAY PRODUCE 0..N SEMANTIC SCOPES
CANVAS SCREENSHOT                ≠ NATIVE CANVAS SOURCE
PRESENTATION EDIT                ≠ SEMANTIC EDIT
CANVAS ID                        ≠ CANONICAL ID
DANGLING RELATIONSHIP            ≠ INVALID SOURCE
INCOMPLETE RELATIONSHIP          ≠ FABRICATED CANONICAL EDGE
UNKNOWN                          ≠ DEFAULT
ADAPTER FAILURE                  ≠ SOURCE LOSS
FAILED ATTEMPT                   ≠ FAILED SOURCE
RETRY                            ≠ RE-CAPTURE
ANNOTATION / AUTHORING UI        ≠ BUSINESS GRAPH
HUMAN INTERACTION                ≠ TEMPORAL MECHANISM
ADAPTER RESULT                   ≠ TEMPORAL MODEL
```

---

# Frozen intake path

```text
REAL PROCESS EXPRESSION
        ↓
SOURCE ORIGIN / CAPTURE / REPRESENTATION
        ↓
SOURCE PRESERVATION
        ↓
ADAPTER ATTEMPT
        ↓
SOURCE EVIDENCE GRAPH
        ↓
0..N CANDIDATE SEMANTIC SCOPES
        ↓
CANONICAL NORMALIZATION
        ↓
PROVENANCE
        ↓
SEMANTIC VALIDATION
```

For native Canvas:

```text
CanvasDefinition
        ↓
CanvasRevision
        ↓
NATIVE_STRUCTURED SourceRepresentation
        ↓
TalosCanvasAdapter
```

No image-perception step exists when native structure is available.

---

# Change rule

Any semantic change to these frozen v0.2 contracts requires:

```text
new version
+ preserved v0.2
+ updated/new fixtures
+ full C01–C20 regression (plus new fixtures)
+ explicit freeze declaration
```

Do not silently edit frozen meaning.

---

# Decision

```text
T2-01 DESIGN CONTRACTS        🔒 FROZEN v0.2
T2-01 ARCHITECTURE            🔒 FROZEN v0.2
C01–C20                       ✅ PASS
T2-01 IMPLEMENTATION PLAN     🟢 NEXT
T2-01 BUILD                   ⛔ NOT YET OPEN
```
