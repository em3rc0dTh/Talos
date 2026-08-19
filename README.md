# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a process-intelligence and durable-execution system whose central responsibility is to **normalize and standardize business processes while preserving the truth, semantics, notation, provenance, and evidence of the source from which each process originated**.

TALOS is not a BPMN converter, not a Temporal UI, and not merely a diagramming product. BPMN, UPN, UML Activity Diagrams, EPC, Petri Nets, SIPOC, Value Stream Mapping, Bizagi exports, Mermaid, draw.io, images, screenshots, physical drawings, digital canvases, natural language, existing workflow definitions, runtime observations, and the TALOS Canvas are all possible **process-expression sources**.

The system preserves a source first, interprets it second, normalizes candidate meaning into the TALOS Canonical Process Model, records why every meaning is believed, validates what is complete or missing, and only later designs capabilities and durable Temporal execution.

```text
REAL PROCESS EXPRESSION
        ↓
SOURCE ORIGIN / CAPTURE / REPRESENTATION
        ↓
SOURCE PRESERVATION
        ↓
SOURCE ADAPTER ATTEMPT
        ↓
SOURCE EVIDENCE GRAPH
        ↓
0..N CANDIDATE SEMANTIC SCOPES
        ↓
TALOS CANONICAL MODEL
        ↓
PROVENANCE / CLAIMS
        ↓
SEMANTIC VALIDATION
        ↓
AUTOMATION DESIGN
        ↓
CAPABILITY BINDING
        ↓
TEMPORAL EXECUTION PLAN
        ↓
DURABLE EXECUTION + OBSERVATION
```

## Non-negotiable truth

> TALOS normalizes and standardizes the business process **without destroying or replacing its origin**.

Mandatory distinctions now include:

```text
SOURCE ORIGIN                    ≠ capture event
CAPTURE EVENT                    ≠ source representation
PHYSICAL DRAWING                 ≠ photograph bytes
NATIVE DIGITAL CANVAS            ≠ screenshot
DERIVATIVE                       ≠ exact source representation
SOURCE OCCURRENCE                ≠ conceptual identity
SAME LABEL                       ≠ same source node
SOURCE INPUT                     ≠ process automatically
ONE ARTIFACT                     may produce 0..N semantic scopes
CANVAS SOURCE                    ≠ canonical model
PRESENTATION EDIT                ≠ semantic edit
DANGLING RELATIONSHIP            ≠ invalid source
INCOMPLETE RELATIONSHIP          ≠ fabricated canonical edge
ADAPTER FAILURE                  ≠ source loss
UNKNOWN                          ≠ default
TRUTH CLASS                      ≠ confidence
SEMANTIC VALIDITY                ≠ automation readiness
VALIDATION                       ≠ repair
HUMAN INTERACTION                ≠ Temporal mechanism
FUNCTIONAL DEPENDENCY            ≠ runtime sequence
```

## Lifecycle

```text
brainstorming/
      ↓
design/
      ↓
arch/
      ↓
plan/
      ↓
build/
      ↓
test/
```

`test/` is also used before BUILD for semantic fixtures, pressure tests, regressions and gate evidence. Superseded versions are retained rather than silently overwritten.

## Repository map

- `brainstorming/` — system truth, Mining Site quarries, hypotheses and discovered constraints.
- `design/` — product/source/provenance/validation/Canvas contracts and freeze declarations.
- `arch/` — canonical/system/source-adapter/capability/runtime boundaries.
- `plan/` — gated roadmap and implementation plans.
- `build/` — implementation only after the corresponding BUILD gate opens.
- `test/` — fixtures, pressure tests, regression results and gate closures.
- `deprecated/` — superseded material retained for history where appropriate.

# Current state

```text
SYSTEM TRUTH                         🟢 v0.1 ESTABLISHED
MINING SITE                          🟢 Q01–Q12 FIRST BATCH COMPLETE

T1-01 CANONICAL PROCESS MODEL        🟢 v0.1 FROZEN
T1-02 PROVENANCE MODEL               🟢 v0.3 FROZEN
T1-03 SEMANTIC VALIDATION            🟢 v0.2 FROZEN
PHASE 1 — CANONICAL SEMANTICS        🟢 CLOSED

PROCESS SOURCE INTAKE CONTRACT       🟢 v0.2 FROZEN
TALOS CANVAS NATIVE SOURCE           🟢 v0.2 FROZEN
PHASE-2 ADAPTER ARCHITECTURE         🟢 v0.2 FROZEN
T2-01 DESIGN / ARCH                  🟢 CLOSED
T2-01 IMPLEMENTATION PLAN            🟢 READY
T2-01 BUILD                          🟡 READY FOR EXPLICIT OPENING

T2-02 BPMN ADAPTER                   ⚪ PENDING
T2-03 IMAGE / GRAPHIC ADAPTER        ⚪ PENDING
CAPABILITY MODEL                     ⚪ LATER GATE
TEMPORAL EXECUTION                   ⚪ LATER GATE
```

# Phase 1 — frozen semantic core

## T1-01 — What does it mean?

Frozen:

```text
arch/01-CANONICAL-PROCESS-MODEL-v0.1.md
```

Evidence:

```text
test/01-CANONICAL-PROCESS-MODEL-PRESSURE-TEST-v0.1.md
12 / 12 PASS
```

## T1-02 — Why do we believe it?

Frozen:

```text
design/01-ORIGIN-PROVENANCE-AND-NORMALIZATION-v0.3.md
blob: 2e20a98aba744e9d719765c15429422f0e03c779
```

Regression:

```text
test/06-PROVENANCE-REGRESSION-RESULT-v0.1.md
28 / 28 PASS
```

## T1-03 — Is it sufficient, and what is missing?

Frozen:

```text
design/03-SEMANTIC-VALIDATION-CONTRACT-v0.2.md
blob: 2b1463a6286fd3c3edcfd0417d29a9ffef45704f
```

Regression:

```text
test/10-SEMANTIC-VALIDATION-REGRESSION-RESULT-v0.1.md
16 / 16 PASS
```

Closure:

```text
test/11-T1-03-SEMANTIC-VALIDATION-GATE-CLOSURE-v0.1.md
```

# Phase 2 — teaching TALOS to receive real sources

T2-01 begins with the source TALOS controls completely: the native TALOS Canvas.

The Canvas is now explicitly a **source producer**, not a privileged editor of canonical truth.

```text
CanvasDefinition
        ↓
CanvasRevision
        ↓
NATIVE_STRUCTURED SourceRepresentation
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

## Frozen T2-01 design contracts

```text
design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.2.md
design/06-PROCESS-SOURCE-INTAKE-CONTRACT-v0.2.md
arch/03-PHASE-2-SOURCE-INTAKE-AND-CANVAS-ADAPTER-v0.2.md
```

Freeze declaration:

```text
design/07-T2-01-CANVAS-AND-INTAKE-v0.2-FREEZE-DECLARATION.md
```

## T2-01 pressure-test history

Initial result:

```text
C01–C20
18 PASS / 2 FAIL
```

Failures exposed two important requirements:

```text
C03 — user-authored incomplete/dangling relationship must be preserved
C20 — adapter failure must not lose/recreate the source
```

v0.2 added:

```text
CanvasEndpointRef
SET / UNKNOWN / UNCONNECTED endpoint states

AdapterAttempt
failure-stage diagnostics
retry lineage
input fingerprint / idempotent replay
```

Full regression:

```text
test/14-T2-01-CANVAS-ADAPTER-REGRESSION-RESULT-v0.1.md
20 / 20 PASS
```

Design/architecture closure:

```text
test/15-T2-01-DESIGN-ARCH-GATE-CLOSURE-v0.1.md
```

# Universal intake law

Every future adapter—BPMN, image, text, automation, runtime evidence—must use the same source boundary:

```text
RECEIVE
  ↓
PRESERVE
  ↓
CLASSIFY
  ↓
ADAPTER ATTEMPT
  ↓
ADDRESS SOURCE EVIDENCE
  ↓
INTERPRET
  ↓
DISCOVER 0..N CANDIDATE SCOPES
  ↓
NORMALIZE
  ↓
VALIDATE
```

No adapter receives permission to bypass provenance or emit Temporal code directly.

# Current gate

Implementation plan:

```text
plan/02-T2-01-CANVAS-ADAPTER-IMPLEMENTATION-PLAN-v0.1.md
```

Recommended reference implementation:

```text
TypeScript
framework-independent domain modules
versioned deterministic JSON source serialization
executable C01–C20 fixtures
```

BUILD is not yet marked open. The next explicit action is the T2-01 BUILD-opening review, authorizing only the reference Canvas/intake adapter slice.

Active roadmap:

```text
plan/00-TALOS-ROADMAP-v0.4.md
```

## Working definition

> **TALOS is the semantic guard between business-process expression and durable machine execution.** It receives heterogeneous process expressions as evidence, preserves their origin before interpretation, discovers the semantic scope actually present, normalizes what is supportable, exposes what remains unknown, and only then permits automation and durable execution design.
