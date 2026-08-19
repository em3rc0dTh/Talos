# TALOS — T1-02 Provenance Pressure Test Result v0.1

Status: **EXECUTED / v0.2 FAILED GATE — EVOLUTION REQUIRED**  
Date: **2026-08-18**  
Candidate under test: `design/01-ORIGIN-PROVENANCE-AND-NORMALIZATION-v0.2.md`

## Purpose

This artifact executes the complete first-batch provenance suite P01–P28 against Provenance Contract v0.2.

Evidence sources:

```text
test/02-PROVENANCE-PRESSURE-TEST-SPEC-v0.1.md      P01–P16
test/03-PHYSICAL-SOURCE-CAPTURE-FIXTURE-Q11-v0.1.md P17–P20
test/04-FUNCTIONAL-MODEL-CANVAS-FIXTURE-Q12-v0.1.md P21–P28
```

This is a semantic/model pressure test, not runtime test implementation.

---

# Executive result

```text
TOTAL FIXTURES        28
PASS                  26
FAIL                   2

PASS RATE          92.9%

T1-02 GATE            FAIL
BUILD                 CLOSED
```

The failures are not broad defects in provenance. They are concentrated in one missing boundary exposed by Q11 and Q12:

> Provenance v0.2 distinguishes logical artifacts, capture events and byte representations, but does not explicitly model the **underlying source origin** independently from its captures, nor the **availability/non-supply of source-native representations**.

Failing fixtures:

```text
P17 — Physical process expression captured digitally
P28 — Native canvas vs screenshot representation
```

No other fixture requires a schema change.

---

# Fixture matrix

| Fixture | Result | v0.2 model elements exercised | Evidence preserved / unresolved | Schema change? |
|---|---|---|---|---|
| P01 Exact original vs derivative | PASS | SourceArtifact, SourceRepresentation, byteIdentityStatus | derivative lineage and byte identity remain distinct | No |
| P02 Declared extension vs observed bytes | PASS | SourceRepresentation declared/observed fields | `.ppm` declaration and PNG signature coexist | No |
| P03 Authoring context vs business graph | PASS | SourcePlane, EvidenceFragment | Miro/editor context preserved without actor/process promotion | No |
| P04 Notation annotation vs process edge | PASS | SourcePlane, EvidenceFragment, SemanticClaim | annotation and business-edge evidence remain separate | No |
| P05 Same label / distinct occurrences | PASS | SourceOccurrence | equal labels do not collapse source identity | No |
| P06 Conceptual object / multiple occurrences | PASS | SourceOccurrence + optional canonical mapping | runtime identity remains unresolved | No |
| P07 Property-scoped evidence | PASS | SemanticClaim.propertyPath | label/shape/type/termination can carry different truth/confidence | No |
| P08 Edge endpoint uncertainty | PASS | relationship SemanticClaims | edge existence/source/target certainty can differ | No |
| P09 Shared handler / preserved cause | PASS | SemanticClaim + ProvenanceLink + causal lineage | normalized handler retains incoming cause | No |
| P10 Collaboration / missing correlation | PASS | relationship claims + unresolved properties | message evidence preserved; correlation/payload remain unresolved | No |
| P11 Implemented behavior vs intent | PASS | EvidencePerspective | implementation evidence does not become business intent | No |
| P12 Multi-source conflict | PASS | ConflictRecord | both claims survive resolution | No |
| P13 Confirmation history | PASS | ConfirmationRecord + SemanticClaim | accepted meaning does not mutate away prior inference | No |
| P14 Canvas edit preserves import | PASS | TransformationRecord + ProcessRevision lineage | Canvas revision extends rather than replaces import provenance | No |
| P15 Non-executable source | PASS | SourceArtifact.artifactClass + perspective | reference architecture can remain non-workflow evidence | No |
| P16 Missing completion | PASS | property-scoped claim | last-visible node and completion truth remain independent | No |
| P17 Physical origin vs digital capture | **FAIL** | SourceCapture, SourceArtifact, SourceRepresentation | capture bytes are representable, but physical source origin is not first-class | **Yes** |
| P18 Handwriting uncertainty | PASS | EvidenceFragment + SemanticClaim | literal token and interpreted expansion carry independent confidence/truth | No |
| P19 Embedded textual lifecycle | PASS | SourceOccurrence + TEXT_SPAN fragments + claims | one source shape can retain embedded list without graph expansion | No |
| P20 Source topology vs expected logic | PASS | relationship claims + truth classes | drawn topology survives even when business expectation disagrees | No |
| P21 Function box vs executable task | PASS | SourceOccurrence.sourceAssertedType/candidateSemanticType + truth class | source function can remain non-executable | No |
| P22 Functional relationship roles | PASS | edge occurrence + SemanticClaim.propertyPath=`relationshipRole` | INPUT/CONTROL/OUTPUT/MECHANISM can remain notation-specific inferred values | No |
| P23 Mechanism vs runtime actor | PASS | separate semantic claims | mechanism relation and runtime ownership remain independent | No |
| P24 Functional decomposition | PASS | semantic/relationship claims + evidence perspective | abstraction/decomposition can be claimed without Child Workflow promotion | No |
| P25 Functional dependency vs sequence | PASS | relationship-role claim + execution unresolved | output→input dependency does not force synchronous sequence | No |
| P26 Output role vs runtime datatype | PASS | property-scoped claims | OUTPUT role and semantic object/type remain separate | No |
| P27 Notation-scoped geometry | PASS | EvidenceFragment.structuralAnchor + artifact classification + interpretationMethod | geometry is usable evidence only inside the classified source context | No |
| P28 Native canvas vs screenshot | **FAIL** | SourceCapture + SourceRepresentation | PNG screenshot is representable, but native-source availability/non-supply is only implicit | **Yes** |

---

# Detailed failure F01 — P17 physical origin vs digital capture

## Evidence

Q11 is not fundamentally a PNG-origin process. Its stated origin is a physical hand-drawn process on graph paper, captured digitally as an image.

Required distinction:

```text
PHYSICAL DRAWING
      ↓ capture
PNG REPRESENTATION
      ↓ perception
SEMANTIC CLAIMS
```

## What v0.2 can represent

```text
SourceCapture
  captureMethod = UPLOAD / SCREENSHOT_CAPTURE / SOURCE_DEFINED

SourceArtifact
  artifactClass = ...
  captureId = ...

SourceRepresentation
  observedMimeType = image/png
  contentHash = ...
```

## Why that is insufficient

`SourceArtifact` does not have a first-class source-origin reference or origin kind. The model can describe the image and its capture context, but cannot cleanly state:

```text
the semantic source originated as physical paper
Talos does not possess that physical original
the PNG is a captured representation of that origin
its hash identifies the PNG, not the paper
```

Using `artifactClass`, free-form metadata or `SOURCE_DEFINED` values can approximate this, but the gate requires the distinction to be structurally protected rather than convention-only.

## Required correction

Introduce first-class source origin and capture lineage:

```text
SourceOrigin
SourceCapture.originId
SourceArtifact.originId
SourceArtifact.captureIds[]
SourceRepresentation.captureId
```

and explicitly define byte identity as representation identity, never physical-origin identity.

---

# Detailed failure F02 — P28 native canvas vs screenshot

## Evidence

Q12 entered Talos as a PNG screenshot of a digital canvas. The native structured graph/model was not supplied.

Required distinction:

```text
DIGITAL CANVAS ORIGIN
      ├── native structured representation   NOT SUPPLIED TO TALOS
      └── screenshot PNG                     AVAILABLE TO TALOS
```

## What v0.2 can represent

The screenshot can be recorded through:

```text
SourceCapture.captureMethod = SCREENSHOT_CAPTURE
SourceRepresentation = captured PNG bytes
```

## Why that is insufficient

The model lacks a first-class way to distinguish:

```text
native representation does not exist
native representation exists but was not supplied
native representation is available to Talos
availability is unknown
```

The absence of a `SourceRepresentation` row is ambiguous and therefore cannot satisfy provenance.

The same defect affects Q11's physical original: Talos must be able to say that the physical source exists as origin evidence but is not available to the runtime/session.

## Required correction

Add explicit source availability evidence rather than creating fake/missing representation objects:

```text
SourceAvailabilityRecord
- sourceOriginId
- capability / representationClass
- status
- evidenceRefs[]
```

Candidate statuses:

```text
AVAILABLE_TO_TALOS
NOT_SUPPLIED
NOT_AVAILABLE
NOT_APPLICABLE
UNKNOWN
```

---

# Important non-failures from Q12

Q12 did **not** force Talos to create a global IDEF0/ICOM ontology inside provenance.

The existing v0.2 claim model is deliberately generic enough to represent notation-specific relationship roles as property-scoped claims:

```text
subjectRef: edge-occurrence
propertyPath: relationshipRole
value: FUNCTION_INPUT | FUNCTION_CONTROL | FUNCTION_OUTPUT | FUNCTION_MECHANISM
truthClass: INFERRED
```

with local geometric evidence held in `EvidenceFragment.structuralAnchor` and the interpretation method/version retained.

This is preferable to hard-coding every source notation into the provenance core.

Likewise:

```text
FUNCTIONAL_DECOMPOSITION
FUNCTIONAL_DEPENDENCY
BUSINESS_FUNCTION
```

may remain source/canonical semantic claims rather than new provenance entities.

---

# Evolution decision

The correct change is narrow:

```text
v0.2
  + explicit SourceOrigin
  + explicit origin→capture→representation lineage
  + explicit source/native availability records
  + clarified representation kinds
  + clarified meaning of byte identity
      ↓
Provenance Contract v0.3
```

Do **not** redesign the rest of the model.

The following v0.2 structures have survived P01–P28 and should be retained:

```text
SourcePlane
EvidenceFragment
SourceOccurrence
SemanticClaim
TruthClass
EvidencePerspective
ProvenanceLink
relationship/property provenance
ConflictRecord
ConfirmationRecord
TransformationRecord
ProcessDefinition / ProcessRevision lineage
multi-source normalization
```

---

# Gate verdict

```text
PROVENANCE v0.2         ❌ NOT FREEZABLE
P01–P28                 26 PASS / 2 FAIL
REQUIRED NEXT ACTION    EVOLVE TO v0.3
T1-02                   OPEN
BUILD                   CLOSED
```

No T1-03 work should begin until v0.3 is regression-tested against all 28 fixtures and T1-02 is explicitly closed.
