# TALOS — T2-01 Canvas Adapter Regression Result v0.1

Status: **EXECUTED / C01–C20 ALL PASS**  
Date: **2026-08-19**

Regression targets:

```text
design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.2.md
design/06-PROCESS-SOURCE-INTAKE-CONTRACT-v0.2.md
arch/03-PHASE-2-SOURCE-INTAKE-AND-CANVAS-ADAPTER-v0.2.md
```

Prior result:

```text
test/13-T2-01-CANVAS-ADAPTER-PRESSURE-TEST-RESULT-v0.1.md
18 PASS / 2 FAIL
```

Repairs:

```text
C03 → CanvasEndpointRef + incomplete native relationship bridge
C20 → AdapterAttempt + diagnostics/failure/retry/idempotency lineage
```

---

# Executive result

```text
TOTAL FIXTURES       20
PASS                 20
FAIL                  0
PASS RATE           100%

REGRESSION            PASS
DESIGN/ARCH FREEZE    ALLOWED
BUILD                  STILL CLOSED
```

---

# Regression matrix

| Fixture | Result | v0.2 behavior |
|---|---|---|
| C01 Simple sequence | PASS | stable native identities map through source occurrence/provenance into canonical sequence |
| C02 Explicit decision guards | PASS | literal/structured guards are native source truth; no label guessing required |
| C03 Incomplete/dangling branch | **PASS** | `CanvasEndpointRef(UNKNOWN/UNCONNECTED)` preserves branch intent; no fabricated canonical edge; T1-03 can emit `SV-CFL-002` |
| C04 Parallel + ALL join | PASS | concurrency/join semantics are native structured meaning, not geometry inference |
| C05 Incomplete wait | PASS | WAIT maps while timezone/business timing remains explicit UNKNOWN and validation-blockable |
| C06 Human approval | PASS | human semantics survive without Signal/Update/Form/Activity selection |
| C07 Actor/data/rule | PASS | native source families map to canonical Actor/DataObject/BusinessRule families |
| C08 Presentation-only edit | PASS | new Canvas revision + native digest change; semantic digest unchanged; no new ProcessRevision required |
| C09 Semantic edit | PASS | semantic digest changes; new adapter/normalization lineage and ProcessRevision candidate |
| C10 Node retirement | PASS | current-view deletion does not erase historical source snapshots/provenance |
| C11 Structured subprocess membership | PASS | explicit membership is semantic; rectangle containment is not used as evidence |
| C12 Annotation/visual group | PASS | preserved source evidence can be excluded from canonical business graph |
| C13 UNKNOWN vs absent | PASS | property-state contract preserves explicit unknown separately from non-applicable/absent schema fields |
| C14 Clarification write-back | PASS | response → explicit source change → new Canvas revision → new ProcessRevision → reassessment; no history mutation |
| C15 Native + preview | PASS | `NATIVE_STRUCTURED` remains primary; screenshot/render remains secondary representation |
| C16 Idempotent adaptation | PASS | immutable input fingerprint identifies logical adaptation input; successful result may be reused; attempts remain auditable |
| C17 Same label / distinct IDs | PASS | equal display labels never collapse native source identity |
| C18 Stable identity across revisions | PASS | stable `CanvasElementIdentity` + immutable snapshots + revision-scoped SourceOccurrences coexist |
| C19 Semantic defaults | PASS | visible/schema-declared default may be source truth; hidden implementation default may not |
| C20 Adapter failure after preservation | **PASS** | `AdapterAttempt(FAILED)` records stage/diagnostics; source survives; retry is a new linked attempt and does not recreate source |

---

# C03 closure

v0.2 now supports:

```text
CanvasRelationshipSnapshot
  sourceEndpoint = SET(Approved?)
  targetEndpoint = UNKNOWN
  guard = NO
```

This produces:

```text
source relationship occurrence ✅
NO branch intent/source truth   ✅
NO target unresolved            ✅
canonical fake edge             ⛔
validation finding              ✅
```

Frozen Canonical v0.1 remains unchanged.

This is the correct separation:

```text
SOURCE MAY BE INCOMPLETE
      ↓
CANONICAL MODEL PRESERVES WHAT CAN BE REPRESENTED
      ↓
PROVENANCE KEEPS THE INCOMPLETE SOURCE INTENT
      ↓
VALIDATION EXPLAINS THE GAP
```

---

# C20 closure

v0.2 now records:

```text
SourceRepresentation preserved
        ↓
AdapterAttempt a1 FAILED
        ↓
source remains valid
        ↓
AdapterAttempt a2 retryOf=a1
        ↓
SUCCEEDED / AdapterResult
```

This proves source acquisition/preservation and semantic interpretation are separate failure domains.

---

# Cross-phase regression verdict

The T2-01 v0.2 contracts do not require changes to frozen Phase-1 contracts.

```text
Canonical Process Model v0.1   unchanged
Provenance v0.3                unchanged
Semantic Validation v0.2      unchanged
```

The adapter architecture consumes them correctly.

---

# What T2-01 design now establishes

TALOS can receive a native process expression as:

```text
CanvasDefinition
  ↓
CanvasRevision
  ↓
SourceRepresentation(NATIVE_STRUCTURED)
  ↓
AdapterAttempt
  ↓
SourceEvidenceGraph
  ↓
CandidateSemanticScope
  ↓
Canonical ProcessRevision
  ↓
Provenance
  ↓
Semantic Validation
```

while supporting:

```text
incomplete/dangling authored semantics
explicit UNKNOWN values
presentation-only revision history
semantic revision history
failed/partial adapter attempts
non-process annotations/groups
clarification write-back
```

---

# Freeze recommendation

Freeze the exact tested v0.2 contracts and architecture.

After freeze, T2-01 should move to **implementation planning** before BUILD opens.

```text
T2-01 DESIGN/ARCH      ✅ REGRESSION PASS
T2-01 BUILD            ⛔ CLOSED
NEXT                   FREEZE → BUILD PLAN
```
