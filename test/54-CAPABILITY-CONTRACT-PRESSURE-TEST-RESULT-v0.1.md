# TALOS — Capability Contract Pressure-Test Result v0.1

Status: **PRESSURE TEST EXECUTED — T4-01 NOT FROZEN**  
Date: **2026-08-19**

Targets:

```text
design/26-CAPABILITY-CONTRACT-v0.1.md
arch/14-CAPABILITY-MODEL-ARCHITECTURE-v0.1.md
```

Result:

```text
TOTAL        32
PASS         31
FAIL          1
PASS RATE  96.875%

T4-01 GATE   FAIL
BUILD        CLOSED
```

## Result summary

```text
K01–K11 PASS
K12 FAIL  requirement-wide basis flattens property-level design provenance
K13–K32 PASS
```

# K12 defect

v0.1 defines:

```text
CapabilityRequirement
- family
- operationIntent
- requirementBasis
- constraints...
```

`CapabilityConstraint` has its own basis, but material requirement properties such as:

```text
family
operationIntent
logical outcome
input/output requirement
```

do not all have a property-level basis record.

Example:

```text
accepted semantic text: "Send confirmation email"
```

A valid design may need to preserve:

```text
family = COMMUNICATION
  basis = SEMANTIC_DERIVED

operationIntent = SEND_NOTIFICATION
  basis = SEMANTIC_DERIVED

channel = EMAIL
  basis = SEMANTIC_EXPLICIT

provider = Gmail
  basis = DESIGN_SUGGESTION / implemented-behavior candidate only
```

One requirement-wide `requirementBasis` cannot accurately represent all of those simultaneously.

This repeats a principle already proven in T3-01/T3-02:

```text
ONE DESIGN OBJECT
may contain properties with DIFFERENT epistemic/design bases
```

# Required evolution

Add property/facet-scoped design provenance, e.g.:

```text
CapabilityRequirementFacet
- requirementId
- propertyPath
- value/valueRef
- designBasis
- designState
- semanticEvidenceRefs[]
- sourceEvidenceRefs[]?
- materiality
```

`requirementBasis` may remain only as a non-authoritative summary or be removed from the active model.

All material requirement properties must be traceable individually.

No Phase-1/2/3 contract needs reopening.

## Decision

```text
T4-01 v0.1      NOT FROZEN
EVOLVE          v0.2
BUILD           CLOSED
```
