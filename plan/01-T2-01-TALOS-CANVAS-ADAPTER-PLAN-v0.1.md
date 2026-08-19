# TALOS — T2-01 TALOS Canvas Adapter Plan v0.1

Status: **ACTIVE T2-01 PLAN / BUILD CLOSED**  
Date: **2026-08-19**

## Goal

Close the first Phase-2 source-adapter gate using the native TALOS Canvas as the reference source.

T2-01 proves that a real user-authored process can enter TALOS through a native structured source and survive:

```text
source preservation
→ source adaptation
→ canonical normalization
→ provenance
→ semantic validation
→ clarification/revision
```

without OCR/perception ambiguity and without directly generating Temporal execution.

---

# 1. Inputs to this gate

Frozen Phase-1 contracts:

```text
arch/01-CANONICAL-PROCESS-MODEL-v0.1.md
design/01-ORIGIN-PROVENANCE-AND-NORMALIZATION-v0.3.md
design/03-SEMANTIC-VALIDATION-CONTRACT-v0.2.md
```

T2-01 candidates:

```text
design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.1.md
design/06-PROCESS-SOURCE-INTAKE-CONTRACT-v0.1.md
arch/03-PHASE-2-SOURCE-INTAKE-AND-CANVAS-ADAPTER-v0.1.md
```

Historical Canvas product draft:

```text
design/02-TALOS-CANVAS-CONTRACT-v0.1.md
```

The native-source contract refines the storage/source semantics without deleting the product draft.

---

# 2. T2-01 lifecycle

```text
T2-01A DESIGN CONTRACTS            🟡 CANDIDATE
        ↓
T2-01B ARCHITECTURE                🟡 CANDIDATE
        ↓
T2-01C PRESSURE TEST               🟢 NEXT
        ↓
T2-01D EVOLVE IF REQUIRED          ⚪
        ↓
T2-01E FULL REGRESSION             ⚪
        ↓
T2-01F FREEZE DESIGN/ARCH          ⚪
        ↓
T2-01G BUILD PLAN                  ⚪
        ↓
T2-01 BUILD                        ⛔ CLOSED UNTIL EXPLICIT OPENING
```

---

# 3. Pressure-test target

Create:

```text
test/12-T2-01-CANVAS-ADAPTER-PRESSURE-TEST-SPEC-v0.1.md
```

The test must walk the candidate contracts through native source fixtures, not merely review prose consistency.

---

# 4. Minimum native fixtures

## C01 — Simple sequence

```text
Manual Start
→ Receive request
→ Validate request
→ Complete
```

Prove native source IDs, canonical mapping, provenance and validation.

## C02 — Exclusive decision with explicit guards

Prove guard literal/structured meaning survives.

## C03 — Decision with unresolved branch target

Prove Canvas accepts incomplete semantics and T1-03 produces a finding instead of adapter failure/default END.

## C04 — Parallel split + ALL join

Prove concurrency and synchronization are native semantics, not geometry inference.

## C05 — Wait with incomplete business time

```text
wait until Next Wednesday
timezone = UNKNOWN
```

Prove WAIT mapping succeeds and validation blocks automation readiness for missing required business timing semantics.

## C06 — Human approval

Prove human business semantics survive without choosing Signal/Update/Form implementation.

## C07 — Actor, data and business rule relations

Prove these become canonical actor/data/rule families rather than ordinary process nodes.

## C08 — Presentation-only edit

Move/resize/recolor a node.

Prove:

```text
new CanvasRevision
native digest changed
semantic digest unchanged
no new ProcessRevision required
```

## C09 — Semantic edit

Change a decision guard.

Prove new CanvasRevision + changed semantic digest + new canonical ProcessRevision candidate.

## C10 — Node retirement

Delete a node from current view.

Prove old source occurrence remains resolvable from historical ProcessRevision/provenance.

## C11 — Structured subprocess membership

Prove membership comes from explicit structure, not rectangle containment.

## C12 — Annotation and visual group

Prove visible non-process elements remain source evidence without contaminating canonical graph.

## C13 — Explicit UNKNOWN vs absent property

Prove the adapter preserves the distinction.

## C14 — Clarification write-back

T1-03 question → user answer → ClarificationResponse → CanvasChangeSet → CanvasRevision N+1 → ProcessRevision N+1 → new assessment.

No historical mutation.

## C15 — Native structured source + screenshot preview

Prove native source remains primary and preview remains secondary representation.

## C16 — Idempotent adaptation

Same immutable CanvasRevision + same adapter/mapping versions must not create semantically duplicate interpretations.

## C17 — Same label, distinct Canvas elements

Prove stable source IDs prevent label-based collapse.

## C18 — Stable element identity across revisions

Same logical node edited across revisions retains `CanvasElementIdentity` while revision-local snapshots/SourceOccurrences change.

## C19 — Source-defined semantic default

Prove visible/schema-declared default can become source truth while hidden code defaults cannot.

## C20 — Adapter extraction failure after preservation

Prove native source/provenance remains intact even if adaptation fails.

---

# 5. Gate questions

T2-01 cannot close unless the answer is YES to all:

1. Can Canvas act as a real source rather than a privileged canonical editor?
2. Can exact native revisions be preserved independently from canonical revisions?
3. Can stable source element identity coexist with revision-local occurrences?
4. Can presentation-only edits avoid semantic revision noise?
5. Can semantic edits create new canonical history without rewriting old history?
6. Can incomplete/unknown business semantics enter safely?
7. Can every canonical property trace back to the exact native source revision/property?
8. Can non-process Canvas objects remain visible evidence without becoming workflow nodes?
9. Can validation findings/questions write back through explicit new revisions?
10. Can adaptation be replayed/versioned deterministically?
11. Can the same intake boundary later support BPMN/image adapters?
12. Does T2-01 remain free of Temporal/provider implementation leakage?

---

# 6. Expected pressure-test evidence

Create:

```text
test/13-T2-01-CANVAS-ADAPTER-PRESSURE-TEST-RESULT-v0.1.md
```

If any fixture fails:

```text
FAIL
→ identify evidence-forced gap
→ create new version of affected design/arch artifact
→ preserve prior version
→ rerun complete C01–C20 suite
```

Do not freeze by declaration.

---

# 7. Freeze artifacts

If full regression passes, create explicit freeze declarations for:

```text
Canvas Native Source Contract
Process Source Intake Contract
Phase-2 Source Intake / Canvas Adapter Architecture
```

The exact tested Git blobs should be recorded.

---

# 8. Build opening boundary

T2-01 BUILD may open only after design/architecture freeze.

Before coding, create a separate implementation plan covering:

```text
module boundaries
storage/persistence choice
schema/wire format
Canvas UI framework boundary
adapter API
mapping registry implementation
hash/digest implementation
revision transaction semantics
validation invocation
migration/version strategy
unit/integration fixture implementation
```

Those are BUILD planning decisions, not reasons to contaminate the current semantic contract.

---

# 9. Build slice after gate opens

The first implementation slice should be deliberately small:

```text
Manual Start
  ↓
Action
  ↓
Decision
  ├── one explicit branch
  └── one unresolved branch
```

The slice must prove native revisioning + canonical normalization + provenance + T1-03 validation before adding many Canvas components.

Then add incrementally:

```text
parallel/join
wait
human interaction
actor/data/rule
subprocess/state
```

---

# 10. Non-goals

T2-01 does not yet build:

```text
BPMN importer
image OCR/perception
n8n importer
capability integrations
Temporal code generation
runtime worker
production deployment
full visual design system
collaborative multiplayer editing
```

Those remain later gates.

---

# Current decision

```text
T2-01 DESIGN                    🟡 ACTIVE
T2-01 ARCH                      🟡 ACTIVE
T2-01 PRESSURE TEST             🟢 NEXT
T2-01 BUILD                     ⛔ CLOSED
```
