# TALOS — Canonical Process Model Pressure Test v0.1

Status: **GATE EVIDENCE / T1-01**  
Date: **2026-08-18**

## Purpose

This document pressure-tests `arch/01-CANONICAL-PROCESS-MODEL-v0.1.md` against the twelve representative semantic fixtures defined by the T1-01 freeze gate.

The purpose is not to prove that TALOS supports every process notation. The purpose is to prove that the canonical model has enough structure to normalize shared business-process semantics **without destroying source origin, notation-specific evidence, uncertainty, or non-executable context**.

The acceptance question is:

> Can one canonical model represent all twelve fixtures without forcing them into BPMN, flattening them into a task list, inventing execution truth, or losing their origin?

---

# 1. Pre-test findings

The original architecture draft already represented:

- process identity and immutable revisions;
- source artifacts;
- semantic nodes and edges;
- actors;
- data and variables;
- business rules;
- wait categories;
- source-specific annotations;
- provenance;
- aggregate semantic state;
- separation from Temporal implementation details.

However, pressure testing exposed eight areas that were too implicit for a freeze-quality canonical contract:

1. **Join semantics** needed an explicit policy (`ALL`, `ANY`, `N_OF_M`, source-defined) instead of a generic join label.
2. **Wait semantics** needed structured resume information rather than only a wait category.
3. **Human interactions** needed explicit interaction kind, expected outcomes, requested information and responsible actor references.
4. **Subprocesses** needed to distinguish embedded, referenced and external process boundaries.
5. **Source conflict** needed a first-class claim/conflict representation rather than only an aggregate `CONFLICTED` state.
6. **Execution readiness** needed to be separate from semantic truth and semantic normalization state.
7. **Petri Net state/place semantics** needed a canonical state concept plus token-flow preservation.
8. **Existing automation evidence** needed a perspective dimension so implemented behavior is not silently treated as authoritative business intent.

These changes are incorporated into the frozen canonical model.

---

# 2. Fixture matrix

| Fixture | Required semantic evidence | Pre-test result | Required correction | Final result |
|---|---|---:|---|---:|
| 01 Simple sequence | ordered actions and completion | PASS | none | PASS |
| 02 Exclusive decision | conditions, default route, merge semantics | PARTIAL | explicit routing/join policy | PASS |
| 03 Parallel split + join | concurrency and synchronization | PARTIAL | explicit join policy | PASS |
| 04 Durable wait | wait kind and resume condition | PARTIAL | structured wait details | PASS |
| 05 Human approval | actor, interaction, outcomes | PARTIAL | human interaction contract | PASS |
| 06 Subprocess | process boundary and invocation meaning | PARTIAL | subprocess mode/reference | PASS |
| 07 Source conflict | contradictory evidence preserved | FAIL | SemanticClaim + ConflictRecord | PASS |
| 08 SIPOC incomplete model | business context without fake executability | PARTIAL | explicit execution readiness | PASS |
| 09 Petri Net concurrency | places, transitions, arcs, marking evidence | PARTIAL | STATE + TOKEN_FLOW + source extension | PASS |
| 10 BPMN source IDs | exact source identity preserved | PASS | none | PASS |
| 11 Native TALOS Canvas | explicit native semantics + source identity | PASS | none | PASS |
| 12 Existing automation evidence | implemented behavior distinct from intended process | PARTIAL | evidence perspective | PASS |

---

# 3. Fixture 01 — Simple sequence

## Source meaning

```text
Start
  ↓
Receive request
  ↓
Validate request
  ↓
Complete
```

## Canonical representation

```text
EVENT(start)
  ↓ SEQUENCE
ACTION(receive request)
  ↓ SEQUENCE
ACTION(validate request)
  ↓ SEQUENCE
END(success)
```

## Required properties

- node identities are stable inside one `ProcessRevision`;
- edge order is graph semantics, not array/XML order;
- every node and edge may link to source evidence;
- actions do not require an implementation binding yet.

## Verdict

**PASS.**

The canonical graph represents ordered process behavior without coupling it to Temporal Activities or a particular notation.

---

# 4. Fixture 02 — Exclusive decision

## Source meaning

```text
Validate customer
      ↓
Existing customer?
   /             \
 yes              no
  ↓                ↓
Continue       Create customer
   \              /
       Continue
```

## Required semantics

TALOS must preserve:

- the decision itself;
- branch guards;
- a possible default branch;
- reconvergence semantics;
- unresolved natural-language conditions where no executable expression exists.

## Canonical representation

```text
ACTION(validate customer)
  ↓
DECISION(routingMode = EXCLUSIVE)
  ├─ CONDITIONAL [customer exists] → ...
  └─ DEFAULT / CONDITIONAL [otherwise] → ACTION(create customer)

reconvergence:
JOIN(joinPolicy = ANY)
```

The rule `customer exists` may be stored as a `BusinessRule` even before it has an executable expression.

## Verdict

**PASS after correction.**

The freeze model adds explicit routing and join semantics so an exclusive branch cannot be confused with parallel synchronization.

---

# 5. Fixture 03 — Parallel split and join

## Source meaning

```text
Order received
      ↓
   parallel
   /      \
Inventory  Credit
 check     check
   \      /
    join all
       ↓
    Continue
```

## Required semantics

- branches become active concurrently;
- continuation waits for the defined synchronization condition;
- parallelism must not be flattened into arbitrary sequential task order.

## Canonical representation

```text
PARALLEL_SPLIT
  ├─ PARALLEL → ACTION(inventory check)
  └─ PARALLEL → ACTION(credit check)

JOIN(joinPolicy = ALL)
```

## Verdict

**PASS after correction.**

The explicit `JoinPolicy` preserves the distinction between `wait for all`, `continue with any`, and other synchronization rules.

---

# 6. Fixture 04 — Durable wait

## Source meaning

Examples:

```text
Wait 3 days
```

```text
Wait until customer responds
```

```text
Wait until 2026-09-01 09:00
```

These are not equivalent.

## Canonical representation

`WAIT` carries structured details such as:

```text
waitKind: DURATION | DEADLINE | EXTERNAL_EVENT | HUMAN_RESPONSE | MESSAGE | CONDITION | SCHEDULE
resumeSemantics: ...
```

A duration/deadline may be known exactly, while an event may only be known in business language at first.

## Verdict

**PASS after correction.**

The canonical layer records the business meaning of the pause without prematurely choosing a Temporal Timer, Signal, Update or external callback mechanism.

---

# 7. Fixture 05 — Human approval

## Source meaning

```text
Manager reviews invoice
      ↓
Approved?
 /        \
yes       no
```

## Required semantics

- a human role/person is responsible;
- the interaction is an approval rather than a generic task;
- expected outcomes are known;
- requested information/forms may be represented;
- the process may wait for the response;
- approval criteria may remain unresolved.

## Canonical representation

```text
HUMAN_INTERACTION
- interactionKind: APPROVAL
- actorRefs: [manager-role]
- outcomes: [APPROVED, REJECTED]
- requestedDataRefs: [...]
```

Outgoing edges may reference rules based on the interaction outcome.

## Verdict

**PASS after correction.**

Human work is preserved as business semantics and does not become a Temporal Signal/Update until execution design.

---

# 8. Fixture 06 — Subprocess

## Source meaning

A process may:

- contain an embedded subprocess;
- invoke another defined business process;
- reference behavior owned outside TALOS.

Those cases must not collapse into one generic rectangle.

## Canonical representation

```text
SUBPROCESS
- subprocessMode: EMBEDDED | REFERENCED | EXTERNAL
- processDefinitionRef?
- processRevisionRef?
- sourceBoundaryRef?
```

## Verdict

**PASS after correction.**

The canonical model preserves process decomposition without prematurely deciding whether execution later uses an inline block, Child Workflow, Nexus operation, API, or other mechanism.

---

# 9. Fixture 07 — Source conflict

## Sources

```text
Source A:
"Manager approval is required above $10,000."

Source B:
"Manager approval is required above $5,000."
```

TALOS must not silently choose either value.

## Canonical representation

Each source produces a `SemanticClaim` about the same semantic subject/property.

```text
Claim A
subject: approval-rule
property: threshold
value: 10000
perspective: BUSINESS_INTENT
truthClass: SOURCE_TRUTH

Claim B
subject: approval-rule
property: threshold
value: 5000
perspective: BUSINESS_INTENT
truthClass: SOURCE_TRUTH
```

A `ConflictRecord` groups the incompatible claims:

```text
ConflictRecord
- subjectRef
- propertyPath
- claimRefs: [A, B]
- resolutionStatus: UNRESOLVED
```

If a user resolves the conflict, the competing claims remain in history.

## Verdict

**PASS after correction.**

This fixture produced the largest necessary change. Conflict is now first-class rather than hidden inside aggregate process status.

---

# 10. Fixture 08 — SIPOC high-level, not execution-ready

## Source

```text
Supplier: Customer
Input: Vehicle + service request
Process: Receive → Inspect → Quote → Repair → Deliver
Output: Repaired vehicle
Customer: Vehicle owner
```

## Risk

A naive automation system may pretend each word is immediately executable.

TALOS must preserve the useful business model while admitting missing detail.

## Canonical representation

- suppliers/customers map to actor/context references;
- input/output information maps to data/context;
- the high-level process steps may map to semantic actions;
- SIPOC relationships remain in a source extension;
- `executionReadiness = INSUFFICIENT_DETAIL`;
- missing details are later expressed by semantic validation findings.

## Verdict

**PASS after correction.**

Execution readiness is explicitly separate from truth. A process can be valid business truth and still be insufficiently specified for automation.

---

# 11. Fixture 09 — Petri Net concurrency semantics

## Source meaning

A Petri Net may carry information that is not adequately represented by ordinary task boxes:

- places/state;
- transitions;
- arcs;
- markings/tokens;
- concurrency;
- synchronization.

## Canonical representation

Shared semantic meaning can be normalized using:

```text
STATE(stateKind = PETRI_PLACE)
ACTION / EVENT for transitions where semantically appropriate
TOKEN_FLOW edges for place/transition relationships
```

Notation-specific information remains preserved in a `PetriNetExtension`, including source place/transition identity and marking/token evidence.

## Verdict

**PASS after correction.**

TALOS can standardize shared process meaning without pretending Petri Net token semantics are ordinary sequence edges.

---

# 12. Fixture 10 — Imported BPMN preserving original IDs

## Source

Example:

```text
bpmn:Task id="Activity_0ugvqse"
```

## Canonical requirement

The canonical node receives a TALOS identity while provenance retains:

```text
sourceArtifactId
sourceElementRef = "Activity_0ugvqse"
source notation/type
```

A BPMN source extension may preserve gateway/event subtype, lanes/pools, boundary relationships and extension metadata.

## Verdict

**PASS.**

Canonical identity and source identity remain separate and traceable.

---

# 13. Fixture 11 — Native TALOS Canvas

## Source meaning

A user creates a process directly in TALOS using explicit components such as:

```text
Trigger
Action
Decision
Parallel
Wait
Human interaction
Integration intent
```

## Canonical behavior

The Canvas is still a `SourceArtifact`.

Its components have explicit source element IDs and map into canonical semantics with high structural certainty, but provenance is still retained.

Editing the Canvas creates a new process revision rather than overwriting prior semantic history.

## Verdict

**PASS.**

TALOS does not exempt its own UI from provenance and revision discipline.

---

# 14. Fixture 12 — Existing automation as process evidence

## Source

An imported n8n, AWS Step Functions or internal workflow may execute:

```text
Receive order
→ write temporary record
→ call workaround service
→ retry five times
→ send email
```

This proves implemented behavior. It does **not** automatically prove intended business policy.

## Canonical representation

Claims carry a perspective:

```text
BUSINESS_INTENT
IMPLEMENTED_BEHAVIOR
OPERATIONAL_OBSERVATION
ANALYTIC_MODEL
DESIGN_SUGGESTION
```

Therefore TALOS may preserve:

```text
IMPLEMENTED_BEHAVIOR:
"retry five times"
```

without silently asserting:

```text
BUSINESS_INTENT:
"business policy requires five retries"
```

## Verdict

**PASS after correction.**

The canonical model now has a first-class way to distinguish process truth from implementation evidence.

---

# 15. Cross-fixture invariants

All twelve fixtures satisfy the following v0.1 invariants.

## Invariant A — Origin survives normalization

Every meaningful canonical element can point to its source artifact and source element/evidence.

## Invariant B — Canonical identity is not source identity

TALOS may standardize multiple source representations into shared semantics without rewriting or discarding their original identities.

## Invariant C — Truth, confidence and readiness are independent

For example:

```text
truthClass: SOURCE_TRUTH
confidence: 1.0
executionReadiness: INSUFFICIENT_DETAIL
```

is valid.

So is:

```text
truthClass: INFERRED
confidence: 0.98
executionReadiness: NEEDS_CONFIRMATION
```

## Invariant D — Business semantics are not execution bindings

`Send confirmation` may remain the same canonical business action whether the eventual implementation is Gmail, n8n, an internal API, or another capability.

## Invariant E — Conflict is preserved, not erased

Resolution may select an authoritative current meaning, but contradictory historical evidence remains traceable.

## Invariant F — Source-specific meaning may remain source-specific

TALOS is not required to force every notation-specific concept into a universal execution primitive.

A source extension is a valid part of canonical preservation when the evidence matters but has no safe shared abstraction.

## Invariant G — Non-executable business models are valid TALOS inputs

SIPOC, VSM, incomplete diagrams and natural-language descriptions may produce useful normalized process revisions without being declared execution-ready.

---

# 16. Gate verdict

After applying the corrections documented above:

```text
01 Simple sequence                         PASS
02 Exclusive decision                      PASS
03 Parallel split + join                   PASS
04 Durable wait                            PASS
05 Human approval                          PASS
06 Subprocess                              PASS
07 Source conflict                         PASS
08 SIPOC incomplete process                PASS
09 Petri Net concurrency                   PASS
10 BPMN source-ID preservation             PASS
11 Native TALOS Canvas                     PASS
12 Existing automation evidence            PASS
```

## T1-01 verdict

**CLOSE `CANONICAL PROCESS MODEL v0.1`.**

The model is intentionally not a complete BPMN/UML/Petri/UPN runtime specification. It is a minimal canonical semantic contract that can represent the twelve gate fixtures while preserving origin and leaving execution implementation to later TALOS layers.

Future source adapters may discover new semantics. Those discoveries should create a new model version rather than silently expanding the meaning of frozen v0.1.

---

# 17. Next gate

With T1-01 closed, the next logical gate is:

```text
T1-02 — Provenance Model
```

The pressure test specifically proved that provenance cannot remain only metadata. T1-02 must formalize `SourceArtifact`, `ProvenanceLink`, `SemanticClaim`, evidence perspective, conflict resolution, human confirmation and transformation lineage as a complete contract.

**BUILD remains closed.**
