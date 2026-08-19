# TALOS — T1-02 Provenance Regression Result v0.1

Status: **EXECUTED / ALL P01–P28 PASS**  
Date: **2026-08-18**  
Candidate under test: `design/01-ORIGIN-PROVENANCE-AND-NORMALIZATION-v0.3.md`

## Purpose

This artifact reruns the complete first-batch T1-02 provenance suite after the v0.2 failures P17 and P28 produced the narrow v0.3 evolution.

The test is intentionally full-suite regression rather than a two-fixture retest.

Evidence set:

```text
P01–P16  test/02-PROVENANCE-PRESSURE-TEST-SPEC-v0.1.md
P17–P20  test/03-PHYSICAL-SOURCE-CAPTURE-FIXTURE-Q11-v0.1.md
P21–P28  test/04-FUNCTIONAL-MODEL-CANVAS-FIXTURE-Q12-v0.1.md
```

Prior failing execution:

```text
test/05-PROVENANCE-PRESSURE-TEST-RESULT-v0.1.md
```

---

# Executive result

```text
TOTAL FIXTURES        28
PASS                  28
FAIL                   0

PASS RATE           100%

REGRESSION             PASS
T1-02 FREEZE            ALLOWED
BUILD                   STILL CLOSED
```

No fixture requires another schema change.

---

# Regression matrix

| Fixture | Result | v0.3 representation | Regression note |
|---|---|---|---|
| P01 Exact source representation vs derivative | PASS | SourceRepresentation + representationKind + byteIdentityStatus + lineage | revised vocabulary preserves stronger native/captured distinction without weakening byte identity |
| P02 Declared extension vs observed format | PASS | declared vs observed representation fields | unchanged |
| P03 Authoring context vs business graph | PASS | SourcePlane + EvidenceFragment | unchanged |
| P04 Notation annotation vs process edge | PASS | plane/fragment/claim separation | unchanged |
| P05 Same label / distinct occurrences | PASS | SourceOccurrence | unchanged |
| P06 Same conceptual object / multiple occurrences | PASS | occurrence→canonical optional mapping | unchanged |
| P07 Property-scoped evidence | PASS | SemanticClaim.propertyPath | unchanged |
| P08 Edge endpoint uncertainty | PASS | relationship property claims | unchanged |
| P09 Shared handler / preserved cause | PASS | causal provenance claims/links | unchanged |
| P10 Missing correlation | PASS | relationship claims + unresolved properties | unchanged |
| P11 Implemented behavior vs business intent | PASS | EvidencePerspective | unchanged |
| P12 Multi-source conflict | PASS | ConflictRecord | unchanged |
| P13 Confirmation history | PASS | ConfirmationRecord + immutable claim history | unchanged |
| P14 Canvas edit preserves import | PASS | TransformationRecord + origin/revision lineage | stronger: edited Talos-native origin can coexist with imported origin |
| P15 Non-executable source | PASS | artifact class + perspective + claim model | unchanged |
| P16 Missing completion | PASS | property-scoped claim | unchanged |
| P17 Physical source vs captured representation | **PASS** | **SourceOrigin + SourceCapture + CAPTURED_BYTES + SourceAvailabilityRecord** | prior failure closed |
| P18 Handwriting uncertainty | PASS | EvidenceFragment + property-scoped SemanticClaim | unchanged |
| P19 Embedded text list vs graph decomposition | PASS | one SourceOccurrence + text fragments + optional decomposition claim | unchanged |
| P20 Source topology vs expected logic | PASS | source relationship claims remain independent from suggestion/inference | unchanged |
| P21 Function box vs executable task | PASS | source/candidate semantic typing + truth/readiness separation | unchanged |
| P22 Functional relationship roles | PASS | relationshipRole SemanticClaim + local evidence | unchanged |
| P23 Mechanism vs actor assignment | PASS | independent mechanism and ownership claims | unchanged |
| P24 Functional decomposition vs subprocess | PASS | decomposition claim remains source semantic, not runtime mapping | unchanged |
| P25 Functional dependency vs synchronous sequence | PASS | relationshipRole/dependency claim + execution unresolved | unchanged |
| P26 Output role vs runtime datatype | PASS | independent relationship-role and semantic-type claims | unchanged |
| P27 Notation-scoped geometry | PASS | EvidenceFragment.structuralAnchor + classification + interpretationMethod | unchanged |
| P28 Native canvas vs screenshot | **PASS** | **DIGITAL_NATIVE SourceOrigin + screenshot CAPTURED_BYTES + native availability NOT_SUPPLIED** | prior failure closed |

---

# P01 regression detail — representation vocabulary evolution

v0.2 used:

```text
ORIGINAL_BYTES
EXACT_COPY
DERIVATIVE
...
```

Q11 demonstrated that `ORIGINAL_BYTES` could be misread as the identity of a physical original.

v0.3 therefore uses:

```text
NATIVE_DIGITAL
NATIVE_STRUCTURED
CAPTURED_BYTES
EXACT_COPY
DERIVATIVE
...
```

P01 still passes because the required invariant is preserved more precisely:

```text
native/captured representation identity
      ≠
derivative identity
```

Every representation has its own byte metadata/hash and lineage.

No derivative can inherit another representation's hash without independent exact-byte verification.

---

# P17 regression detail — physical process capture

Q11 is now representable without collapsing paper into PNG:

```text
SourceOrigin O11
  originKind = PHYSICAL_ARTIFACT
  mediumKind = PAPER_DRAWING

SourceAvailabilityRecord A11
  representationClass = PHYSICAL_ORIGINAL
  status = NOT_AVAILABLE_TO_TALOS

SourceCapture C11
  sourceOriginId = O11
  captureMethod = PHOTO_CAPTURE / SOURCE_DEFINED as applicable

SourceRepresentation R11
  sourceOriginId = O11
  captureId = C11
  representationKind = CAPTURED_BYTES
  observedMimeType = image/png
  contentHash = d8103ded8284978420bcfc39b998653e78e54e2180619df9350afc8a0f82dc62
```

Interpretation then proceeds from `R11` to evidence fragments/claims.

Critical invariant now enforced:

```text
hash(R11)
   ≠
identity(O11 physical paper)
```

P17: **PASS**.

---

# P28 regression detail — digital canvas screenshot

Q12 is now representable as:

```text
SourceOrigin O12
  originKind = DIGITAL_NATIVE_ARTIFACT
  mediumKind = DIGITAL_CANVAS

SourceAvailabilityRecord A12-native
  representationClass = NATIVE_STRUCTURED_MODEL
  status = NOT_SUPPLIED

SourceCapture C12
  sourceOriginId = O12
  captureMethod = SCREENSHOT_CAPTURE

SourceRepresentation R12
  sourceOriginId = O12
  captureId = C12
  representationKind = CAPTURED_BYTES
  observedMimeType = image/png
  contentHash = 44c49f79e907e21810f9b379e6f378c1faca1e169cce3a5da9dafba449ad5322
```

If a native model later arrives:

```text
SourceAvailabilityRecord
  NATIVE_STRUCTURED_MODEL = AVAILABLE_TO_TALOS

SourceRepresentation R12-native
  representationKind = NATIVE_STRUCTURED
```

The earlier screenshot interpretation remains historically true to the evidence Talos actually had at that time.

P28: **PASS**.

---

# Cross-fixture invariants after regression

The suite confirms all of the following can coexist:

```text
source origin
capture event
representation byte identity
representation availability
artifact classification
source plane
local evidence fragment
source occurrence identity
property-scoped claim
truth class
confidence
evidence perspective
relationship uncertainty
conflict history
confirmation authority
transformation lineage
immutable ProcessRevision lineage
```

and preserves these prohibitions:

```text
CAPTURED IMAGE                 ≠ underlying physical/digital-native source
HASH OF REPRESENTATION         ≠ identity of non-byte origin
NOT SUPPLIED                   ≠ does not exist
SAME LABEL                     ≠ same occurrence
ANNOTATION / UI                ≠ process semantics
FUNCTION BOX                   ≠ automatic Activity
FUNCTION RELATIONSHIP          ≠ automatic sequence
MECHANISM                      ≠ automatic task owner
DECOMPOSITION                  ≠ automatic Child Workflow
IMPLEMENTED BEHAVIOR           ≠ business intent
HIGH CONFIDENCE INFERENCE      ≠ source truth
CONFIRMATION                   ≠ deletion of inference history
CONFLICT RESOLUTION            ≠ deletion of disagreement
LAST VISIBLE NODE              ≠ completion proof
```

---

# Schema-change verdict

```text
P01–P16     no additional change required
P17         closed by SourceOrigin + availability/capture lineage
P18–P27     no additional change required
P28         closed by SourceOrigin + SourceAvailabilityRecord
```

No further provenance entities are justified by the current evidence set.

In particular, Q12 does **not** justify embedding a complete notation-specific ontology in the provenance core. Its function/input/control/output/mechanism/decomposition semantics remain evidence-backed property claims.

---

# Regression verdict

```text
PROVENANCE v0.3         ✅ P01–P28 PASS
REGRESSION              ✅ CLEAN
SOURCE-LOSS DEFECTS     0 identified
FALSE-IDENTITY DEFECTS  0 identified
SILENT PROMOTION        0 required

T1-02 FREEZE            ✅ ALLOWED
BUILD                   ⛔ CLOSED
```

The next action is administrative/architectural gate closure:

1. mark Provenance Contract v0.3 frozen;
2. create explicit T1-02 closure evidence;
3. synchronize roadmap/README;
4. open T1-03 — Semantic Validation.
