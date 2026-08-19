# TALOS — T1-02 Provenance Pressure Test Spec v0.1

Status: **TEST DESIGN / NOT YET EXECUTED**  
Date: **2026-08-18**

## Purpose

This document defines the gate evidence required before `T1-02 — Provenance Model` may be closed.

It does not mark T1-02 as passed.

The pressure test exists because the Mining Site proved that provenance must survive more than a simple `sourceId + confidence` model.

The provenance candidate under test is:

```text
design/01-ORIGIN-PROVENANCE-AND-NORMALIZATION-v0.2.md
```

The evidence base includes Q01–Q10 plus the canonical-model fixtures already used during T1-01.

---

# Gate question

For any meaningful canonical claim or future execution element, can TALOS answer:

> Exactly which source evidence justified this meaning, which physical representation was used, whether it was original or derived, what kind of evidence it was, how it was interpreted, where uncertainty/conflict existed, and which later confirmation/revision accepted it?

If not, T1-02 remains open.

---

# Fixture P01 — Exact original vs derivative representation

## Evidence

Mining Site repository state contains both categories:

```text
Q04 / Q07 / Q08 / Q09 / Q10
→ exact original source bytes are now present in repository

Q01 / Q02 / Q03 / Q05
→ repository visual representation differs from captured original bytes
```

## Required model behavior

Represent independently:

```text
SourceArtifact
SourceRepresentation ORIGINAL_BYTES
SourceRepresentation EXACT_COPY / DERIVATIVE / TRANSCODE
hash + byte length + observed format
representation lineage
byteIdentityStatus
```

## Failure condition

FAIL if a derivative can inherit or masquerade as the original source content hash.

---

# Fixture P02 — Declared extension vs observed byte format

## Evidence

Q06 records:

```text
filename extension: .ppm
observed byte signature: PNG
```

## Required model behavior

Preserve both facts without silent correction.

## Failure condition

FAIL if TALOS stores only one normalized `format` field and loses the mismatch.

---

# Fixture P03 — Authoring context vs business graph

## Evidence

Q10 contains:

```text
Miro UI
collaborator labels/cursors
business process-like nodes
```

## Required model behavior

Represent source planes/evidence fragments so that:

```text
collaborator presence = preserved source evidence
collaborator presence ≠ process actor assignment
Miro controls = preserved source context
Miro controls ≠ process nodes
```

## Failure condition

FAIL if the provenance model cannot explain why a visible source element was intentionally excluded from the canonical business graph.

---

# Fixture P04 — Notation annotation vs process edge

## Evidence

Q09 contains red explanatory arrows/labels such as:

```text
Decision Node
Object Node
Join Node
Activity Final Node
```

These annotations describe notation semantics but do not participate in the business process.

## Required model behavior

Preserve:

```text
annotation evidence
source-asserted notation type
business graph edge separately
```

## Failure condition

FAIL if annotation arrows and control-flow arrows cannot be distinguished in provenance.

---

# Fixture P05 — Same label, distinct source occurrences

## Evidence

Examples:

```text
Q05 receive internal order ×2
Q05 in stock? in Ward and Pharmacy
Q08 can the problem be solved? ×2
```

## Required model behavior

Each occurrence receives independent source identity/provenance before any conceptual equivalence is considered.

## Failure condition

FAIL if equal labels automatically collapse to one canonical provenance identity.

---

# Fixture P06 — Same conceptual object, multiple source occurrences

## Evidence

Q09 contains two separate source nodes:

```text
aProposal : Proposal
```

## Required model behavior

Represent independently:

```text
source occurrence
conceptual business object candidate
runtime identity unknown
```

## Failure condition

FAIL if provenance forces the two source nodes to be the same runtime object.

---

# Fixture P07 — Property-scoped evidence

## Evidence

Q08/Q10 show that source support differs by property.

Example:

```text
shape exists                         SOURCE_TRUTH
label exists                         SOURCE_TRUTH
formal BPMN subtype                  NOT PROVEN
termination semantics                may be unresolved
```

## Required model behavior

`SemanticClaim` can target:

```text
subjectRef
propertyPath
value
```

with separate provenance/truth/confidence.

## Failure condition

FAIL if provenance attaches only to the whole node and forces all node properties to share one truth/confidence state.

---

# Fixture P08 — Edge endpoint uncertainty independent from node certainty

## Evidence

Q08 contains long visible connectors where node existence and regional topology are clear but one or more exact endpoints are source-limited.

## Required model behavior

Allow claims such as:

```text
edge exists                source-supported
edge.sourceNodeId          supported
edge.targetNodeId          unresolved / inferred
```

## Failure condition

FAIL if graph confidence is only global or edge-level without property granularity.

---

# Fixture P09 — Shared handler with preserved cause

## Evidence

Q04:

```text
review reject ─┐
               ├── shared rejection handling
final reject ──┘
```

Q10:

```text
OUT_OF_STOCK ─┐
              ├── Cancel order
CARD_INVALID ─┘
```

## Required model behavior

The shared canonical handler may be normalized once while incoming causal provenance remains distinguishable.

## Failure condition

FAIL if normalization loses which source branch/cause activated the handler.

---

# Fixture P10 — Participant collaboration with missing correlation

## Evidence

Q05 contains separate participant-local flows connected by message-like cross-participant relationships, but no explicit correlation identifier/payload contract.

## Required model behavior

Preserve:

```text
message relationship = source evidence
correlation strategy = unresolved
payload schema = unresolved
```

## Failure condition

FAIL if later execution design can silently claim a correlation rule that was never sourced or confirmed.

---

# Fixture P11 — Implemented behavior vs business intent

## Evidence

T1-01 canonical fixture for an imported automation.

Example:

```text
existing automation retries 5 times
```

## Required model behavior

Preserve:

```text
perspective: IMPLEMENTED_BEHAVIOR
```

without automatically converting it to:

```text
perspective: BUSINESS_INTENT
```

## Failure condition

FAIL if evidence perspective is not independent from truth class.

---

# Fixture P12 — Multi-source conflict

## Evidence

Canonical fixture:

```text
Source A approval threshold = 10,000
Source B approval threshold = 5,000
```

## Required model behavior

Both claims remain preserved through an explicit `ConflictRecord`.

A later resolution creates accepted meaning without deleting either original claim.

## Failure condition

FAIL if the system resolves by overwriting one source or selecting a winner without preserving disagreement history.

---

# Fixture P13 — Confirmation is historical authority evidence

## Scenario

An inferred branch interpretation is reviewed and accepted by an authorized user.

## Required model behavior

Preserve:

```text
original INFERRED claim
confirmation record
confirming authority
confirmation timestamp
resulting ProcessRevision
```

## Failure condition

FAIL if `INFERRED` is simply mutated into `CONFIRMED` and its epistemic history disappears.

---

# Fixture P14 — Canvas edit preserves imported origin

## Scenario

A BPMN/image source is imported, normalized, then changed in TALOS Canvas.

## Required model behavior

Lineage:

```text
original source representation
   ↓
interpretation / ProcessRevision N
   ↓
Canvas edit
   ↓
ProcessRevision N+1
```

The Canvas revision can become a new source artifact/representation without replacing the original import.

## Failure condition

FAIL if Canvas editing rewrites or severs the original provenance chain.

---

# Fixture P15 — Non-executable source preserved without false workflow semantics

## Evidence

Q06 is a reference architecture, not proven to be one process.

## Required model behavior

The source can remain:

```text
artifactClass: REFERENCE_ARCHITECTURE
perspective: ANALYTIC_MODEL / SOURCE_DEFINED
```

while selected regions may later become executable-slice candidates.

## Failure condition

FAIL if provenance requires every source artifact to anchor one canonical executable workflow.

---

# Fixture P16 — Missing completion remains a finding, not fabricated source truth

## Evidence

Q07/Q10 contain last visible activities without explicit successful final events.

## Required model behavior

TALOS can preserve:

```text
last visible node = SOURCE_TRUTH
process completion = UNPROVEN
```

and attach a validation/readiness finding later.

## Failure condition

FAIL if the provenance layer encourages `last visible = final outcome` normalization.

---

# Gate invariants

The following statements must remain true across all fixtures:

```text
confidence = 0.99 + truthClass = INFERRED
→ still INFERRED

repository path exists
→ does not prove original byte identity

same label
→ does not prove same source occurrence

source annotation
→ does not automatically become business graph

source UI/cursor
→ does not automatically become actor/ownership

existing implementation
→ does not automatically become business intent

human confirmation
→ does not erase original inference

conflict resolution
→ does not erase conflicting evidence
```

---

# Evidence required to close T1-02

Before freeze, create a result artifact that records for every fixture:

```text
PASS / FAIL
model elements used
source evidence used
what was preserved
what remained unresolved
any schema changes required
```

Target result artifact:

```text
test/03-PROVENANCE-PRESSURE-TEST-RESULT-v0.1.md
```

Do not create/mark that result as PASS until the candidate model has actually been walked through every fixture.

---

# Current verdict

```text
T1-02 Provenance Model candidate    🟡 READY FOR PRESSURE TEST
T1-02 Gate                          ⛔ NOT CLOSED
BUILD                               ⛔ CLOSED
```

The next correct action is to execute this pressure test against the v0.2 candidate and revise the provenance model if any fixture cannot be represented without source loss, false identity, or silent epistemic promotion.
