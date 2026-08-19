# TALOS — Cross-Adapter Conformance Result v0.1

Status: **P2-06 CONFORMANCE PASS**  
Date: **2026-08-19**

Target:

```text
design/18-CROSS-ADAPTER-CONFORMANCE-CONTRACT-v0.1.md
```

Suite:

```text
CAX01–CAX24
```

Result:

```text
TOTAL 24
PASS  24
FAIL   0
PASS RATE 100%

P2-06 CONFORMANCE PASS
PHASE-2 DESIGN/ARCH CLOSURE ALLOWED
BUILD STILL CLOSED
```

---

# Conformance result

```text
CAX01 PASS  preserve before interpretation
CAX02 PASS  source identity vs canonical identity
CAX03 PASS  0..N semantic scopes
CAX04 PASS  partial/unknown/unsupported evidence survival
CAX05 PASS  source-specific semantics survive
CAX06 PASS  truth/confidence/perspective independence
CAX07 PASS  adapter/model version immutability
CAX08 PASS  human correction/confirmation history
CAX09 PASS  Canvas projection preserves provenance ownership
CAX10 PASS  Canvas review write path creates new lineage
CAX11 PASS  multi-source evidence perspectives coexist
CAX12 PASS  conflict preservation / no automatic winner
CAX13 PASS  presentation/editor metadata separation
CAX14 PASS  relationship-role source awareness
CAX15 PASS  completion discipline
CAX16 PASS  side-effect/recovery discipline
CAX17 PASS  mixed-content delegation provenance
CAX18 PASS  sensitive-data boundary
CAX19 PASS  common normalization boundary
CAX20 PASS  common semantic-validation boundary
CAX21 PASS  source expression vs Temporal execution design
CAX22 PASS  automation definition/deployment/runtime distinction
CAX23 PASS  source revision vs Canvas review baseline
CAX24 PASS  one Talos core / no alternate semantic stack
```

---

# Source-family matrix

## Canvas Native

Conforms through:

```text
NATIVE_STRUCTURED SourceRepresentation
stable Canvas source identities
explicit UNKNOWN/dangling relationship semantics
TalosCanvasAdapter
common Canonical/Provenance/Validation
```

No Canvas ID becomes canonical ID by identity reuse.

## Canvas Review / Projection

Conforms as shared review layer rather than source replacement:

```text
ReviewWorkspaceRevision
ReviewProjectionRevision
ReviewAuthoredSourceRevision
BaselineTransitionCandidate / Decision
```

External provenance is preserved and semantic edits create new lineage.

## BPMN

Conforms through:

```text
STRUCTURED_PARSE
native BPMN IDs/types/refs/extensions
source-specific event/gateway/message/data semantics
0..N process/collaboration scopes
common normalization/validation
```

BPMN never becomes canonical or Temporal directly.

## Image / Perception

Conforms through:

```text
VISUAL_PERCEPTION
local VisualEvidenceAnchor
PerceptionObservation / AlternativeSet
source-only ambiguous relationships
common claims/provenance/scopes
```

Model preference remains distinct from human confirmation.

## Language / Document

Conforms through:

```text
TEXT_INTERPRETATION
TextEvidenceAnchor
LinguisticObservation
LanguageAlternativeSet / Decision
0..N process/policy/rule scopes
```

Document order remains distinct from runtime order.

## Existing Automation

Conforms through:

```text
AUTOMATION_PARSE
AutomationDefinitionSnapshot
IMPLEMENTED_BEHAVIOR claims
AutomationDeploymentObservation
separate OPERATIONAL_OBSERVATION runtime evidence
```

Existing implementation never becomes business intent or future Temporal design automatically.

---

# Mixed-source conformance examples

## Example 1 — BPMN + SOP + automation

```text
BPMN: manager approval step
SOP: manager must approve requests
Automation: auto-approves under threshold
```

Result:

```text
BPMN evidence preserved
BUSINESS_INTENT preserved
IMPLEMENTED_BEHAVIOR preserved
material disagreement becomes explicit conflict
no source wins automatically
```

## Example 2 — image + language + Canvas confirmation

```text
image: ambiguous handwritten role
language note: "Finance reviews it"
Canvas reviewer confirms Finance
```

Result:

```text
image inference remains historical
language evidence remains historical
review confirmation creates new authority lineage
accepted ProcessRevision may advance explicitly
```

## Example 3 — automation definition + deployment + runtime

```text
export says active=true
provider observation later says inactive
runtime trace exists from earlier date
```

Result:

```text
DefinitionSnapshot remains unchanged
DeploymentObservation is time-scoped independent evidence
RuntimeObservation is independent operational evidence
no fabricated current-state conclusion without temporal/authority evidence
```

## Example 4 — document embedding diagram

```text
SOP document contains process image
```

Result:

```text
document source preserved
embedded image represented/delegated with traceable derivation/context
image interpretation preserves its own local evidence
claims may merge later without provenance theft
```

---

# Frozen-contract impact

No CAX fixture required modification of frozen:

```text
Canonical Process Model v0.1
Provenance v0.3
Semantic Validation v0.2
Process Source Intake v0.2
Canvas Native v0.2
Canvas Review / Projection v0.2
BPMN v0.1
Image / Perception v0.2
Language / Document v0.2
Existing Automation v0.2
```

Therefore no source-family regression rerun is required by P2-06.

---

# Conformance conclusion

The Phase-2 source adapters are not separate semantic systems.

They are specializations of one common architecture:

```text
HETEROGENEOUS SOURCE
        ↓
PRESERVED EVIDENCE
        ↓
VERSIONED ADAPTER
        ↓
SOURCE-FAMILY OBSERVATIONS / CLAIMS
        ↓
0..N SEMANTIC SCOPES
        ↓
ONE CANONICAL / PROVENANCE / VALIDATION CORE
        ↓
PROVENANCE-SAFE REVIEW
```

P2-06 passes.

Phase-2 design/architecture closure may proceed.

BUILD remains closed until an explicit post-closure opening decision.
