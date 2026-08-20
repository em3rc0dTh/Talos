# TALOS — I7B-03 CANONICAL → BPMN PROJECTION EVIDENCE v0.1

Status: **PASS — I7B-03 CLOSED**  
Date: **2026-08-20**

## Scope

I7B-03 makes the Business Process Confirmation representation concrete by projecting Talos canonical business-process meaning into a deterministic, non-executable BPMN review candidate.

```text
SOURCE
  ↓
CANONICAL PROCESS REVISION
  ↓
BPMN PROJECTOR
  ↓
BPMN 2.x XML + BPMN-DI CANDIDATE
  ↓
BpmnProcessRevision(DRAFT)
  ↓
USER REVIEW / EDIT / CONFIRM
```

This slice does not claim native BPMN round-trip editing or the browser BPMN modeler yet.

## Implementation

```text
build/reference-vertical-slice/packages/review/src/bpmn-projector.ts
build/reference-vertical-slice/packages/review/src/index.ts
```

Tests:

```text
build/reference-vertical-slice/tests/image-i7b03-bpmn-projection.test.ts
build/reference-vertical-slice/tests/image-i7b03-default-flow.test.ts
```

## Earned behavior

### Deterministic review BPMN

Talos emits:

```xml
<bpmn:process id="Talos_Process" isExecutable="false">
```

The same immutable canonical semantics produce the same:

```text
BPMN XML
BPMN XML SHA-256
semantic digest
initial BPMN-DI digest
BpmnProcessRevision identity
```

### Initial loss-aware mapping

```text
EVENT without incoming edge → startEvent
END                         → endEvent
ACTION                      → task
HUMAN_INTERACTION           → userTask
DECISION                    → exclusiveGateway only when branch semantics justify it
PARALLEL_SPLIT / JOIN       → parallelGateway
WAIT                        → intermediateCatchEvent for business review only
SUBPROCESS                  → subProcess
STATE                       → unprojectable diagnostic in v0.1
```

Unsupported meaning is surfaced rather than coerced.

### Provenance preservation

Every projected semantic BPMN element has a mapping back to:

```text
BPMN element
  ↓
canonical node / edge
  ↓
canonical provenanceRefs
  ↓
sourceArtifactIds
```

BPMN identity does not replace canonical identity.

### BusinessRule preservation

Conditional flow semantics remain attached to exact canonical `BusinessRule` references and structured expressions.

Talos does not guess `Yes` / `No` from visual labels.

### WAIT defense

Quarry-02-style:

```text
On Next Wednesday
```

may appear in the BPMN review candidate so the business user can verify the process topology, but I7B-03 emits no:

```xml
<bpmn:timerEventDefinition>
```

Executable timing is not fabricated.

### Default-flow hardening

During closure review, Talos identified that a canonical `DEFAULT` edge must preserve actual BPMN default-flow semantics rather than appear as an ordinary sequence flow.

The hardened projector now emits the BPMN source element's:

```xml
default="<exact sequenceFlow id>"
```

when supported.

Contradictory canonical input:

```text
DEFAULT edge + conditionRuleRef
```

is rejected as unprojectable and diagnosed with:

```text
DEFAULT_EDGE_HAS_CONDITION_RULE
```

rather than flattened into weaker BPMN semantics.

## Diagnostics

The projection boundary currently surfaces:

```text
UNSUPPORTED_NODE_KIND
UNSUPPORTED_EDGE_KIND
UNPROJECTABLE_EDGE_ENDPOINT
DECISION_NOT_EXCLUSIVE_BY_SEMANTICS
WAIT_EXECUTION_TIMING_NOT_MATERIALIZED
MULTIPLE_ACTORS_PRESERVED_AS_REFERENCES
RULE_REFERENCE_MISSING
DEFAULT_EDGE_HAS_CONDITION_RULE
DEFAULT_EDGE_SOURCE_UNSUPPORTED
```

## Exact-head CI evidence

Implementation/hardening exact head:

```text
569115353f93c9664f353cd1d25a3b3f38c22ae7
```

GitHub Actions:

```text
Image vertical slice
run 179
conclusion: SUCCESS

B7-B9 Temporal reference runtime
run 200
conclusion: SUCCESS
```

The Image vertical slice passed all regression gates from I0 through I7B-02 plus the complete I7B-03 projection/default-flow gate.

No exact-head B10 restart run was observed for this path-filtered change; this evidence makes no new B10 claim.

## Product truth earned

Talos can now create a deterministic BPMN review candidate from canonical business meaning without making that BPMN executable or authoritative by itself.

```text
CANONICAL MEANING
      ↓
BPMN REVIEW CANDIDATE       ✅
      ↓
USER CONFIRMATION REQUIRED  ✅
      ↓
AUTOMATION DIRECTLY         ❌
```

## Next gate

```text
I7B-04 — BPMN XML + BPMN-DI ROUND-TRIP WORKSPACE
```

The next slice must prove that XML and diagram are synchronized views of one BPMN revision, including native BPMN import, validation, and visual-only BPMN-DI changes without false semantic mutation.
