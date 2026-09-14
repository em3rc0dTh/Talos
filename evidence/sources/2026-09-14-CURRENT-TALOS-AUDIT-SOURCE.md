# SOURCE CAPTURE — CURRENT TALOS AUDIT

**Captured:** 2026-09-14  
**Source origin:** User-provided file `Pasted markdown(20260914-162411).md`  
**Source class:** Historical audit / brainstorming input  
**Repository role:** Evidence source for the commercial audit track.  
**Authority rule:** This file records what the source proposed. It does **not** automatically override newer repository truth.

## Why this source exists

The source asked a specific question:

> Can the Talos that exists today evolve toward the intended product thesis without being rebuilt from zero?

It proposed a read-only audit of architecture, semantics, product and readiness rather than a generic “does the code work?” review.

The commercial audit reuses that structure but separately evaluates customer value, buyer evidence, repeatability and willingness to pay.

---

# 1. Thirty audit areas preserved from the source

| ID | Area | Core question |
|---|---|---|
| A01 | Product identity | Is Talos a compiler/control plane or still effectively BPMN→Temporal? |
| A02 | Canonical Process Model | Is the canonical model neutral to runtime and vertical? |
| A03 | Semantic coverage | Can real process behavior be represented without hacks? |
| A04 | State model | Are epistemology, review, readiness and lifecycle separated? |
| A05 | Provenance | Can Talos explain why a canonical element exists? |
| A06 | Evidence / Claims | Does interpretation create evidence/claims rather than silent truth? |
| A07 | Conflict model | Are contradictions first-class? |
| A08 | Revision / Freeze | Is a frozen revision reproducible and immutable? |
| A09 | Validation | Does validation assess meaning rather than only schema? |
| A10 | Capability abstraction | Does the process request capabilities rather than concrete providers? |
| A11 | ExecutionPlan | Is it an independent executable representation? |
| A12 | Compiler boundary | Does Talos compile toward Temporal rather than make Temporal interpret the business? |
| A13 | Temporal implementation | Are determinism, replay, waits, retries and recovery correct? |
| A14 | Runtime lineage | Can runtime be traced back to semantic origin? |
| A15 | Source ingestion | Do image/BPMN/text/canvas inputs normalize coherently? |
| A16 | AI boundary | Does AI propose rather than silently change business truth/authority? |
| A17 | Human governance | Are confirmation and authority points explicit? |
| A18 | Vertical neutrality | Has reference-domain meaning leaked into Core? |
| A19 | Extensibility | Can a new vertical be added as data/capability rather than Core rewrite? |
| A20 | API/contracts | Are module boundaries stable and explicit? |
| A21 | Persistence | Can revisions and executions be reconstructed? |
| A22 | Observability | Is operational telemetry distinct from debug logging? |
| A23 | Customer access boundary | Can Talos leave a developer-only environment responsibly? |
| A24 | Multi-customer isolation | Can organizations remain separated? |
| A25 | Failure semantics | Are retry, timeout, cancellation and compensation meaningful? |
| A26 | Testing | Do tests certify Talos invariants rather than only one implementation? |
| A27 | Golden datasets | Can reference fixtures detect semantic regressions? |
| A28 | Product surface | Is there a coherent user journey from source to execution? |
| A29 | Deployment | Is installation/execution reproducible? |
| A30 | Commercial release gap | What separates usable framework from sellable product? |

---

# 2. Eight fundamental audits preserved from the source

## 2.1 Canonical Core audit

The source proposed checking:

### Runtime independence

Business meaning should not require runtime-specific fields such as workflow names, task queues or signal identifiers.

Preferred direction:

```text
Canonical meaning
"Request customer approval"
        ↓
Capability requirement
human.approval
        ↓
ExecutionPlan/runtime mapping
```

### Vertical independence

Terms such as manager, email confirmation, invoice, vehicle or customer may exist in fixtures/packs, but should not become generic Core assumptions.

Classification proposed by the source:

```text
CORE
GENERIC CAPABILITY
REFERENCE FIXTURE
VERTICAL PACK
ACCIDENTAL DOMAIN COUPLING
```

### Semantic expressiveness

The source proposed pressure-testing sequence, exclusive decisions, parallelism, joins, timers, external events, correlation, human waits, long-running work, subprocesses, exceptions, timeouts, cancellation, compensation, decisions, retries and case-like work.

Result labels:

```text
SUPPORTED EXACTLY
SUPPORTED WITH LIMITATION
EMULATED
MISSING
AMBIGUOUS
```

---

## 2.2 Truth / Evidence audit

Central source question:

> How does Talos know what it claims to know?

Desired conceptual chain:

```text
Source
  ↓
Evidence
  ↓
Claim
  ↓
Inference
  ↓
Review
  ↓
Canonical meaning
```

The source emphasized preservation of:

```text
source reference
source artifact
evidence reference
authority
confidence
inference
confirmation
revision
decision
```

Example test:

For canonical node:

```text
N-17
"Supervisor approves request"
```

Talos should eventually answer:

- where it came from;
- what source fragment supports it;
- whether it was explicit or inferred;
- who confirmed it;
- whether another source contradicted it.

---

## 2.3 Epistemological model audit

The source called for separating concepts similar to:

```text
SOURCE_TRUTH
INFERRED
SUGGESTED
CONFIRMED
EXECUTABLE
```

Important concern:

```text
origin = INFERRED
review = CONFIRMED
```

is safer than destroying origin by collapsing history into only:

```text
INFERRED → CONFIRMED
```

---

## 2.4 Compilation pipeline audit

The source described:

```text
Source
  ↓
Interpretation
  ↓
CanonicalRevision
  ↓
Validation
  ↓
ExecutionPlan
  ↓
Runtime
```

For every boundary it proposed checking:

```text
INPUT CONTRACT
OUTPUT CONTRACT
MUTABILITY
AUTHORITY
FAILURE CONDITIONS
VERSIONING
```

Important rules:

- validation should assess rather than mutate canonical truth;
- ExecutionPlan must pin exact canonical/validation inputs rather than “latest”;
- Temporal should receive a compiled execution representation instead of reinterpreting business meaning.

---

## 2.5 Capability audit

The source proposed classifying external actions such as:

```text
email
API
human approval
form
database
webhook
AI
n8n
MCP
```

Preferred abstraction:

```text
Business task:
notify customer

Capability:
notification.send

Provider binding:
specific provider implementation
```

A capability must carry more meaning than `name + URL`; its contract should eventually account for inputs/outputs, time behavior, repeated execution, external effects and recovery semantics.

---

## 2.6 Temporal / durability audit

The source did not frame the question as “does Temporal work?”

It framed it as:

> Is Temporal correctly subordinated to Talos?

It proposed review of:

```text
determinism
activity boundaries
signals / queries / updates
timers
retries
idempotency
continue-as-new
restart / recovery
version pinning
workflow evolution
ExecutionPlan pinning
```

And warned against domain-specific workflow code such as:

```text
if (task.type === "managerApproval") ...
```

Preferred principle:

> Runtime understands execution semantics, not the industry.

---

## 2.7 Complete lineage audit

The source identified this as a flagship architectural proof:

```text
Runtime Event
    ↓
Capability Binding
    ↓
ExecutionPlan Node
    ↓
Canonical Node
    ↓
Canonical Revision
    ↓
Claim
    ↓
Evidence
    ↓
Source
```

The gap from canonical meaning back to evidence/source was expected to be one of the most important areas to validate.

---

## 2.8 Release / Product audit

The source explicitly separated:

```text
Talos framework works
```

from:

```text
A customer can use Talos
```

It proposed walking a full journey:

```text
Create workspace
→ provide source
→ interpret
→ review ambiguity
→ resolve conflicts
→ confirm model
→ validate
→ bind capabilities
→ compile
→ deploy
→ run
→ observe
→ explain
```

Each stage should be classified using labels such as:

```text
EXISTS
PARTIAL
CLI ONLY
INTERNAL API
MOCK
MISSING
BROKEN
NOT PRODUCTIZED
```

---

# 3. Four audit artifacts proposed by the source

## CURRENT STATE MAP

Map actual packages, modules, contracts, data flow, runtime, persistence, tests and UI.

## REUSE MATRIX

Use decisions:

```text
KEEP
EVOLVE
REPLACE
REMOVE
MISSING
```

## TARGET GAP MATRIX

Compare desired architecture against current implementation and severity.

## RELEASE DELTA

Keep release planning bounded to:

```text
MUST BEFORE v0.1
SHOULD BEFORE PILOT
AFTER v0.1
DO NOT BUILD
```

---

# 4. Ten architecture questions preserved from the source

1. Is the Canonical Model independent from Temporal?
2. Has any reference/vertical meaning leaked into Core?
3. Can Talos preserve the origin of each canonical assertion?
4. Does Talos distinguish evidence, inference, confirmation and readiness?
5. Is a frozen canonical revision truly immutable/reproducible?
6. Is ExecutionPlan a real compile target?
7. Are integrations abstract capabilities rather than concrete knowledge embedded in the process?
8. Does Temporal execute a plan rather than interpret the business?
9. Can lineage traverse runtime → plan → canonical → source?
10. Can a radically different second vertical be introduced without changing Talos Core?

The source argued that if these answers are strongly positive, the remaining problem becomes primarily:

```text
PRODUCTIZATION
+
CUSTOMER ACCESS / TRUST BOUNDARIES
+
UX
+
CERTIFICATION
+
PACKAGING
```

---

# 5. How the commercial audit extends this source

The source is architectural/product-readiness oriented.

The commercial track adds questions that the source did not itself prove:

```text
Who pays?
Who owns the budget?
What measurable problem is expensive enough?
Which buyer/ICP values provenance and conflict handling?
Does Talos reduce discovery/rework/risk?
Will someone pay for a bounded pilot?
Can a second customer use the same Core?
Can delivery become repeatable?
```

Therefore:

```text
SOURCE AUDIT
tests architecture/product truth

COMMERCIAL AUDIT
tests buyer/value/repeatability truth
```

Both are required.

---

# 6. Preservation note

This source capture intentionally keeps the historical proposal separate from current repository truth.

When conflicts exist:

```text
CURRENT REPOSITORY EVIDENCE
wins for current technical state.

THIS SOURCE
remains evidence of the audit hypothesis and intended questions.
```

Do not silently rewrite this source to match later implementation. Add later evidence in the commercial evidence register instead.
