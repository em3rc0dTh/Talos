# TALOS — T2-01 Canvas Adapter Pressure Test Result v0.1

Status: **EXECUTED / INITIAL CANDIDATE FAILED — EVOLUTION REQUIRED**  
Date: **2026-08-19**

Candidates under test:

```text
design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.1.md
design/06-PROCESS-SOURCE-INTAKE-CONTRACT-v0.1.md
arch/03-PHASE-2-SOURCE-INTAKE-AND-CANVAS-ADAPTER-v0.1.md
```

Fixture specification:

```text
test/12-T2-01-CANVAS-ADAPTER-PRESSURE-TEST-SPEC-v0.1.md
```

## Executive result

```text
TOTAL FIXTURES       20
PASS                 18
FAIL                  2
PASS RATE            90%

T2-01 DESIGN GATE     FAIL
BUILD                 CLOSED
```

Failing fixtures:

```text
C03 — incomplete/dangling branch intent
C20 — adapter failure after successful source preservation
```

The failures are narrow and evidence-forced.

---

# Fixture matrix

| Fixture | Result | Contract behavior | Change required? |
|---|---|---|---|
| C01 Simple sequence | PASS | stable Canvas IDs → source occurrences → deterministic canonical mapping + provenance | No |
| C02 Explicit decision guards | PASS | guards are native literal/structured source semantics | No |
| C03 Incomplete/dangling branch | **FAIL** | relationship snapshot currently requires `sourceElementId` + `targetElementId`; cannot faithfully preserve a branch with unresolved target | **Yes** |
| C04 Parallel + ALL join | PASS | explicit native components/relationships avoid geometry inference | No |
| C05 Incomplete wait time | PASS | `UNKNOWN` property survives WAIT mapping and can trigger T1-03 | No |
| C06 Human approval | PASS | business interaction remains independent from Temporal mechanism | No |
| C07 Actor/data/rule | PASS | native non-node families map to canonical actor/data/rule | No |
| C08 Presentation-only edit | PASS | native revision changes, semantic digest unchanged, no semantic revision required | No |
| C09 Semantic edit | PASS | semantic digest changes and triggers new interpretation/ProcessRevision candidate | No |
| C10 Node retirement | PASS | historical snapshots/source occurrences survive current-view deletion | No |
| C11 Structured subprocess membership | PASS | explicit membership beats visual containment | No |
| C12 Annotation/visual group | PASS | visible source evidence may be excluded from business graph | No |
| C13 UNKNOWN vs absent | PASS | property wrapper distinguishes explicit unknown from non-applicable absence | No |
| C14 Clarification write-back | PASS | response → explicit change set → new Canvas/source/process/assessment history | No |
| C15 Native + preview | PASS | NATIVE_STRUCTURED remains primary; preview secondary | No |
| C16 Idempotent adaptation | PASS | architecture defines replay identity from representation + adapter/mapping/canonical versions | No schema blocker |
| C17 Same label / distinct IDs | PASS | native stable IDs prevent label collapse | No |
| C18 Stable identity across revisions | PASS | stable identity + new snapshot + new revision-scoped occurrence | No |
| C19 Semantic defaults | PASS | visible/schema semantic defaults separated from hidden implementation defaults | No |
| C20 Adapter failure after preservation | **FAIL** | architecture says preservation survives failure, but no first-class `AdapterAttempt`/failure lineage object exists | **Yes** |

---

# C03 failure detail

Current v0.1 native relationship shape:

```text
CanvasRelationshipSnapshot
- snapshotId
- canvasRelationshipId
- canvasRevisionId
- kind
- sourceElementId
- targetElementId
- label?
- guard?
- relationshipProperties{}
```

This assumes a fully connected relationship.

But a real authoring state can be:

```text
Decision: Approved?
NO branch exists
NO label/guard exists
NO target chosen yet
```

TALOS must preserve that authored intention because T1-03 explicitly exists to handle incomplete semantics.

Required evolution:

```text
CanvasEndpointRef
- state: SET | UNKNOWN | UNCONNECTED
- elementId?
```

and:

```text
CanvasRelationshipSnapshot
- sourceEndpoint
- targetEndpoint
```

rather than mandatory source/target IDs.

### Canonical boundary

Canonical v0.1 `ProcessEdge` requires both endpoints.

Therefore an incomplete native relationship must **not** fabricate a canonical edge.

Instead:

```text
native relationship occurrence preserved
+ relationship/branch SemanticClaims
+ ProvenanceLink to relevant canonical decision/source extension
+ T1-03 SV-CFL-002 BRANCH_TARGET_UNRESOLVED
```

When the user later connects the branch, a new CanvasRevision creates a complete canonical edge in a later ProcessRevision.

This respects frozen Canonical v0.1 without reopening it.

---

# C20 failure detail

Current architecture correctly states:

```text
source capture preserved
native representation preserved
adapter extraction failed
canonical revision absent
```

but the common intake contract defines only a successful/partial `AdapterResult` and diagnostics.

It does not make a failed execution itself a first-class historical object.

That leaves ambiguity around:

```text
which exact representation/version failed?
which adapter version failed?
which stage failed?
was a retry the same attempt or a new attempt?
what idempotency key was used?
did a later attempt supersede/retry the failed one?
```

Required evolution:

```text
AdapterAttempt
- id
- sourceRepresentationId
- adapterId
- adapterVersion
- mappingRegistryVersion?
- canonicalModelVersion?
- inputFingerprint
- status
- startedAt
- completedAt?
- failureStage?
- diagnosticIds[]
- resultId?
- retryOfAttemptId?
```

Status:

```text
STARTED
SUCCEEDED
PARTIAL
FAILED
```

A failed attempt never invalidates the preserved source.

Retry creates a new attempt linked to the failed one.

---

# What did not fail

The pressure test confirms several important choices from v0.1:

```text
Canvas source ≠ canonical model
native IDs ≠ canonical IDs
presentation revision ≠ semantic revision
structured membership ≠ geometry
UNKNOWN ≠ default
annotation/group ≠ process node
human interaction ≠ Temporal mechanism
native representation > screenshot preview
```

The overall architecture does not require redesign.

---

# Required evolution

Create:

```text
design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.2.md
```

with incomplete endpoint support.

Create:

```text
design/06-PROCESS-SOURCE-INTAKE-CONTRACT-v0.2.md
arch/03-PHASE-2-SOURCE-INTAKE-AND-CANVAS-ADAPTER-v0.2.md
```

with first-class `AdapterAttempt` history and retry/idempotency lineage.

Then rerun **all C01–C20**.

---

# Gate decision

```text
T2-01 CANDIDATE v0.1      ❌ NOT FREEZABLE
C01–C20                   18 PASS / 2 FAIL
BUILD                     ⛔ CLOSED
NEXT                      EVOLVE → FULL REGRESSION
```
