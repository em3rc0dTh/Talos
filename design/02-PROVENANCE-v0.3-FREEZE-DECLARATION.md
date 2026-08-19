# TALOS — Provenance Contract v0.3 Freeze Declaration

Status: **FROZEN / T1-02 CONTRACT**  
Date: **2026-08-18**

## Frozen contract

The exact provenance contract frozen by this declaration is:

```text
design/01-ORIGIN-PROVENANCE-AND-NORMALIZATION-v0.3.md
```

Frozen Git identity:

```text
contract commit: 62e94569b0a1246cdd4232f2350b2224f347a60b
contract blob:   2e20a98aba744e9d719765c15429422f0e03c779
```

The blob identity is intentional: the exact bytes tested by the regression suite are frozen without post-test semantic mutation.

## Gate evidence

Initial execution against v0.2:

```text
test/05-PROVENANCE-PRESSURE-TEST-RESULT-v0.1.md
26 PASS / 2 FAIL
```

Evidence-forced evolution:

```text
v0.2
  + SourceOrigin
  + explicit origin → capture → representation lineage
  + SourceAvailabilityRecord
  + clarified native/captured representation kinds
  + representation-scoped byte identity
      ↓
v0.3
```

Full regression against v0.3:

```text
test/06-PROVENANCE-REGRESSION-RESULT-v0.1.md
28 PASS / 0 FAIL
```

Regression commit:

```text
5fe81947b1a4f43d7495d9e2ea508a999c3b195c
```

## Frozen invariants

The following are now part of the T1-02 contract:

```text
SOURCE ORIGIN                    ≠ capture event
CAPTURE EVENT                    ≠ captured representation
SOURCE ORIGIN                    ≠ byte identity
PHYSICAL ORIGINAL                ≠ photograph bytes
DIGITAL NATIVE MODEL             ≠ screenshot bytes
MISSING REPRESENTATION RECORD    ≠ proof of non-existence
NOT_SUPPLIED                     ≠ does not exist
FILE EXTENSION                   ≠ observed byte format
SOURCE OCCURRENCE                ≠ conceptual identity
SAME LABEL                       ≠ same occurrence
AUTHORING / ANNOTATION EVIDENCE  ≠ process semantics
TRUTH CLASS                      ≠ confidence
TRUTH CLASS                      ≠ evidence perspective
CONFIRMATION                     ≠ deletion of prior inference
CONFLICT RESOLUTION              ≠ deletion of disagreement
FUNCTION BOX                     ≠ automatic Temporal Activity
FUNCTIONAL RELATIONSHIP          ≠ automatic sequence
MECHANISM                        ≠ automatic runtime owner
FUNCTIONAL DECOMPOSITION         ≠ automatic Child Workflow
LAST VISIBLE NODE                ≠ completion proof
```

## Frozen core entities

```text
SourceOrigin
SourceCapture
SourceArtifact
SourceRepresentation
SourceAvailabilityRecord
SourcePlane
EvidenceFragment
SourceOccurrence
SemanticClaim
TruthClass
EvidencePerspective
ProvenanceLink
ConflictRecord
ConfirmationRecord
TransformationRecord
ProcessDefinition / ProcessRevision lineage
```

Notation-specific semantics remain property-scoped claims/extensions rather than being hard-coded into the provenance core.

## Change rule

Any future semantic change to this contract requires:

```text
new version
+ preserved v0.3
+ new/updated fixtures
+ full provenance regression
+ explicit freeze decision
```

Do not silently edit the meaning of frozen v0.3.

## Decision

```text
PROVENANCE CONTRACT v0.3    🔒 FROZEN
P01–P28                     ✅ PASS
T1-02                       ✅ READY TO CLOSE
BUILD                       ⛔ REMAINS CLOSED
```
