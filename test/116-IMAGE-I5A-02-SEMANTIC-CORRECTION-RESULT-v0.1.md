# Talos — I5A-02 Semantic Correction / Addition Result v0.1

Status: **PASS — I5A-02 CLOSED**  
Date: **2026-08-19**

## Gate under test

I5A-02 asked whether Talos can move from a confirmed-but-incomplete image-derived semantic model to an automation-design-ready semantic model through **explicit reviewer-authored corrections**, without converting validation findings into automatic repair instructions and without mutating the original image/perception history.

## Governing law proven

```text
ValidationFinding
      !=
repair instruction
      !=
ReviewCommand
      !=
reviewer authority
```

The implementation does not branch on `SV-CMP-001`, `SV-CFL-001`, or `SV-SUB-002` to manufacture repairs.

Instead, the reviewer issues frozen Phase-3 command kinds:

```text
CORRECT_PROPERTY
ADD_PROCESS_ELEMENT
ADD_RELATIONSHIP
```

with explicit `authorityRef`, expected review baseline IDs, semantic scope, reviewer identity, rationale, and requested time.

## Preflight contract defect repaired

I5A-01 had persisted:

```text
derivationKind = REINTERPRETATION
```

but the frozen Canonical reference type does not define that enum member.

I5A-02 repaired the implementation to the lawful existing value:

```text
derivationKind = HUMAN_CONFIRMATION
```

and updated the I5A-01 regression to assert it.

No frozen Canonical contract was changed.

## New semantic correction engine

Implemented:

```text
build/reference-vertical-slice/packages/application/src/semantic-correction.ts
```

Key properties:

- source-family neutral;
- stale baseline rejection;
- explicit reviewer authority required;
- unsupported correction shapes rejected rather than guessed;
- candidate semantics are append-only new `ProcessRevision` history;
- reviewer-authored `SemanticClaim` values are `CONFIRMED`;
- prior source/image claims remain historical records;
- `ReviewAuthoredSourceRevision` and `ReviewConfirmationRecord` preserve reviewer authority lineage;
- semantic diff guard compares nodes, edges, BusinessRules, actors, and data objects;
- revalidation uses the frozen semantic validator rather than correction-specific readiness logic;
- resolved findings receive separate `FindingDisposition` records only after the superseding assessment no longer emits them.

## Quarry-02 reviewer-authored correction sequence

The bounded fixture uses explicit reviewer input—not hidden image truth—to author:

### Explicit completion

```text
Deliver Water
    ↓ SEQUENCE
Order fulfilled [END]
```

`ADD_PROCESS_ELEMENT` requires the END placement/attachment intent to be explicit; the reference slice does not create a disconnected END merely to silence validation.

### Subprocess boundary meaning

```text
Arrange Delivery
subprocessMode = COLLAPSED_SUBPROCESS
```

This is semantic boundary meaning only.

```text
COLLAPSED_SUBPROCESS ≠ Temporal Child Workflow
```

### Structured conditional rules

NO branch:

```text
naturalLanguage = "Customer does not exist"
expression = {
  fact: "customerExists",
  operator: "EQUALS",
  value: false
}
```

YES branch:

```text
naturalLanguage = "Customer exists"
expression = {
  fact: "customerExists",
  operator: "EQUALS",
  value: true
}
```

Each becomes a first-class `BusinessRule` referenced through `ProcessEdge.conditionRuleRef`.

## Pressure tests

New suite:

```text
build/reference-vertical-slice/tests/image-i5a-02-semantic-correction.test.ts
```

Result:

```text
I5A-02 tests                                      6 / 6 PASS
I5A-01 confirmation tests                         5 / 5 PASS
```

The I5A-02 suite proves:

1. stale corrections are rejected;
2. corrections without explicit authority are rejected;
3. attached END addition clears completion only through the new semantic revision;
4. exact image/perception history remains unchanged;
5. no Canvas revision is fabricated;
6. `ADD_RELATIONSHIP` works as a separate generic primitive;
7. branch conditions become first-class reviewer-authored BusinessRules;
8. subprocess meaning becomes explicit;
9. the full correction sequence reaches `READY_FOR_AUTOMATION_DESIGN` through re-validation;
10. readiness creates no freeze/capability/execution/Temporal artifacts.

## Full regression evidence

Final code commit under gate:

```text
f7e87b47501cbbd1706e4fca930b40af91c9b2a2
```

Image workflow run:

```text
32331911072
```

Result:

```text
architecture boundaries            PASS
B2 source intake                    25 / 25 PASS
B3 canonical / validation           27 / 27 PASS
B4 review                           13 / 13 PASS
I0 image intake                     PASS
I1 perception                       PASS
I2 common evidence                  PASS
I3 browser source review            PASS
I4 canonical + validation           5 / 5 PASS
I5A-01 + I5A-02 combined            11 / 11 PASS
```

Existing real Temporal reference runtime remained green on the same commit:

```text
workflow run 32331911039             PASS
real SDK Activity boundary           PASS
tryable local app smoke              PASS
real local Temporal E2E              PASS
```

Restart safety remained green:

```text
workflow run 32331911022
Node 22.16.0                         PASS
Node 24.11.1                         PASS
```

## Final semantic state

Before I5A-02:

```text
SV-SRC-001  resolved by I5A-01 confirmation
SV-CMP-001  blocking
SV-CFL-001  blocking ×2
SV-SUB-002  blocking
```

After explicit I5A-02 reviewer corrections and re-validation:

```text
SV-SRC-001  absent
SV-CMP-001  absent
SV-CFL-001  absent
SV-SUB-002  absent

semanticVerdict     = VALID
executionReadiness  = READY_FOR_AUTOMATION_DESIGN
```

## Anti-corruption result

```text
IMAGE BYTES                    unchanged
PERCEPTION ATTEMPT             unchanged
PERCEPTION OBSERVATIONS        unchanged
COMMON EVIDENCE                unchanged
I4 ProcessRevision             unchanged historical record
I5A-01 ProcessRevision         unchanged historical record
REVIEW CORRECTIONS             new authority evidence
CORRECTED ProcessRevision      new semantic history
ValidationAssessment           new superseding assessment
```

## Downstream artifact check

At I5A-02 closure:

```text
SemanticFreezeRecord           0
CapabilityDesignRevision       0
CapabilityBindingRevision      0
ExecutionPlanRevision          0
TemporalMappingRevision        0
RuntimePolicyRevision          0
DeploymentRevision             0
WorkflowExecutionObservation   0
```

Therefore:

```text
READY_FOR_AUTOMATION_DESIGN ≠ frozen
READY_FOR_AUTOMATION_DESIGN ≠ executable
READY_FOR_AUTOMATION_DESIGN ≠ Temporal
```

## Verdict

**I5A-02 is CLOSED.**

The next lawful move is an **I5B opening review**, not automatic freeze.

That review must independently verify that the corrected semantic graph is structurally coherent enough to freeze and hand off. In particular, current validation's recognition of an explicit END must not be treated as proof that every completion or branch topology is semantically safe merely because blocker findings disappeared.