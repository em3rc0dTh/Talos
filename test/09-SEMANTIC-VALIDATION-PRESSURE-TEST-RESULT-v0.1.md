# TALOS — T1-03 Semantic Validation Pressure Test Result v0.1

Status: **EXECUTED / v0.1 FAILED GATE — NARROW EVOLUTION REQUIRED**  
Date: **2026-08-19**  
Candidate: `design/03-SEMANTIC-VALIDATION-CONTRACT-v0.1.md`

## Executive result

```text
TOTAL FIXTURES        16
PASS                  15
FAIL                   1

PASS RATE           93.75%
T1-03 GATE             FAIL
BUILD                  CLOSED
```

Failing fixture:

```text
V16 — Clarification must produce a new revision
```

The failure is not in the core finding families or quarry coverage. It is a historical-state modeling inconsistency:

> v0.1 declares `ValidationAssessment` immutable, but `ValidationFinding.status` includes mutable-looking states such as `RESOLVED` and `SUPERSEDED`. Without a separate disposition/history object, an implementation could resolve an old finding in place after a later clarification changed accepted semantics.

That would violate the same historical-truth discipline already frozen in T1-02.

---

# Fixture matrix

| Fixture | Result | Actual semantic verdict | Actual readiness | Key behavior |
|---|---|---|---|---|
| V01 Q01 Order Process | PASS | VALID_WITH_FINDINGS | INSUFFICIENT_DETAIL | clear business graph retained; trigger/correlation/data gaps block automation; technical provider/retry deferred |
| V02 Q02 Water Order | PASS | VALID_WITH_FINDINGS | INSUFFICIENT_DETAIL | incomplete Wednesday wait, collapsed delivery subprocess and physical completion correctly surfaced |
| V03 Q03 Procurement | PASS | INCOMPLETE | NEEDS_CONFIRMATION | interrupting/non-interrupting boundary meaning correctly treated as control-flow material |
| V04 Q04 Candidate Application | PASS | INCOMPLETE | NEEDS_CONFIRMATION | anonymous-branch meaning blocks; SMS provider deferred; retention policy remains business question |
| V05 Q05 Ward/Pharmacy | PASS | INCOMPLETE | INSUFFICIENT_DETAIL | correlation + local/global completion + missing procurement continuation detected without invention |
| V06 Q06 REFAI | PASS | VALID_WITH_FINDINGS / NOT_APPLICABLE for one-workflow intent | NOT_ASSESSED / INSUFFICIENT_DETAIL | architecture remains valid architecture; no fake workflow errors; executable slices assessed separately |
| V07 Q07 Order Validation | PASS | VALID_WITH_FINDINGS | INSUFFICIENT_DETAIL | success completion and cross-branch failure/compensation policy surfaced without weakening supported ALL join |
| V08 Q08 Multi-Department | PASS | INCOMPLETE | INSUFFICIENT_DETAIL | ambiguous long-edge topology classified as source limitation, not repaired graph |
| V09 Q09 Proposal | PASS | VALID_WITH_FINDINGS | NEEDS_CONFIRMATION | business loop/object identity retained; no retry/Continue-As-New inference |
| V10 Q10 Collaborative Order | PASS | INCOMPLETE | INSUFFICIENT_DETAIL | entry/completion + paid-but-not-delivered business recovery gap surfaced; technical refund implementation deferred |
| V11 Q11 Hand-Drawn Website | PASS | INCOMPLETE | NEEDS_CONFIRMATION | source-drawn NO branches preserved; minimum root questions preferred; `Brainst` inference non-blocking by itself |
| V12 Q12 Functional Canvas | PASS | VALID_WITH_FINDINGS for functional scope | INSUFFICIENT_DETAIL for automation | function/ICOM-like semantics validated without pretending runtime sequence/subprocess |
| V13 Material source conflict | PASS | CONFLICTED | BLOCKED_BY_CONFLICT | conflict remains provenance-backed blocker until new authoritative revision |
| V14 Non-material inference | PASS | VALID_WITH_FINDINGS | unaffected by inference alone | inferred token does not automatically trigger NEEDS_CONFIRMATION |
| V15 Technical design deferral | PASS | VALID / VALID_WITH_FINDINGS | may be READY_FOR_AUTOMATION_DESIGN | provider/credentials/retry/task queue correctly routed to T4/T5 |
| V16 Clarification revision lineage | **FAIL** | — | — | assessment immutability conflicts with mutable-looking finding status model |

---

# Detailed quarry observations

## Q01

Required-now semantic gaps:

```text
UNRESOLVED_ENTRY_SEMANTICS
CORRELATION_IDENTITY_UNRESOLVED
DECISION_EVIDENCE_UNRESOLVED
RESPONSIBILITY_TYPE_UNRESOLVED
```

Deferred:

```text
provider / retry / Task Queue / concrete SDK
```

Verdict is not `INVALID`; the business graph is coherent.

## Q02

Material blockers:

```text
WAIT_TIME_EXPRESSION_INCOMPLETE
SUBPROCESS_INTERNAL_SEMANTICS_MISSING
HUMAN_COMPLETION_OBSERVATION_UNRESOLVED
CORRELATION_IDENTITY_UNRESOLVED
```

`Next Wednesday` is business-time meaning, so it cannot be deferred merely as a Temporal Timer setting.

## Q03

Material source ambiguity changes control flow:

```text
EVENT_SUBTYPE_AFFECTS_FLOW
SUBPROCESS_BOUNDARY_MEANING_UNRESOLVED
```

This correctly yields `NEEDS_CONFIRMATION` rather than a fabricated timeout/escalation mapping.

## Q04

The `Is anonymous` branch is material. Unknown SMS provider is not.

This validates the contract's gate-aware deferral rule.

## Q05

The validator correctly distinguishes:

```text
Purchase order placed = local Pharmacy milestone/end evidence
```

from:

```text
original Ward demand complete = NOT PROVEN
```

and raises missing continuation instead of designing supplier procurement.

## Q06

This is an important pass.

A naive validation engine would produce dozens of false errors such as `missing start`, `missing end`, or `unknown actor` across architecture resources.

v0.1 correctly scopes validation:

```text
architecture topology → valid/useful
whole diagram as one workflow → not supported
candidate slices → assess separately
```

## Q07

The source-supported parallel semantics remain intact while business recovery gaps are raised separately:

```text
ALL join evidence             preserved
success completion            unproven
one-branch failure behavior   unresolved
business compensation policy  unresolved
```

## Q08

Long-edge uncertainty remains a source limitation:

```text
UNRESOLVED_EDGE_ENDPOINT
SOURCE_REGION_TOPOLOGY_PARTIAL
```

No edge repair occurs.

## Q09

The validator does not confuse:

```text
business re-entry loop
```

with:

```text
technical retry / Continue-As-New
```

and preserves object-occurrence uncertainty.

## Q10

The strongest safety finding is:

```text
payment side effect succeeds
      ↓
delivery fails
      ↓
business outcome absent
```

This is a T1-03 automation-design blocker.

The exact refund/reversal implementation remains a later design concern.

## Q11

The validator respects the strange-but-source-supported branches.

Root questions:

```text
When there is no previous website, what should happen next?
When the client has no new ideas, should work stop or continue from the known baseline?
```

This is better than asking users to classify terminal-marker geometry.

## Q12

Functional-model validation and automation-readiness validation remain separate.

The model is not invalid because:

```text
FUNCTIONAL_DEPENDENCY ≠ SEQUENCE
FUNCTIONAL_DECOMPOSITION ≠ SUBPROCESS
```

Instead, executable scope/runtime order remain unresolved findings.

---

# V16 failure analysis

v0.1 defines:

```text
ValidationAssessment
→ immutable
```

but also:

```text
ValidationFinding.status
OPEN
RESOLVED
DEFERRED
NOT_APPLICABLE
SUPERSEDED
```

This permits two incompatible implementation interpretations:

### Interpretation A — mutate old finding

```text
Assessment A
Finding F status=OPEN

user clarification

Finding F status=RESOLVED   ← historical mutation
```

This is forbidden.

### Interpretation B — preserve old assessment

```text
Assessment A
Finding F remains present/open-at-assessment

user clarification
  ↓
new SemanticClaim / ConfirmationRecord
  ↓
ProcessRevision N+1
  ↓
Assessment B
finding absent or replaced
```

This is the correct model.

T1-03 must make Interpretation B explicit in schema rather than relying on implementation discipline.

---

# Required v0.2 evolution

1. Make `ValidationFinding` immutable as part of its assessment snapshot.
2. Remove mutable lifecycle semantics from the finding itself.
3. Introduce a separate `FindingDisposition` / resolution-history record when product UX needs to explain what later resolved/deferred/superseded a historical finding.
4. Link dispositions to resulting claims/revisions/assessments rather than rewriting old findings.
5. Add explicit deterministic readiness precedence so revalidation produces a stable verdict when several blocker types coexist.

Recommended readiness precedence for `AUTOMATION_DESIGN_READINESS`:

```text
material unresolved conflict
  → BLOCKED_BY_CONFLICT

else missing/absent required semantics
  → INSUFFICIENT_DETAIL

else only material inferred meaning requiring authority
  → NEEDS_CONFIRMATION

else no T1-03 automation-design blockers
  → READY_FOR_AUTOMATION_DESIGN
```

For non-automation intents, `SEMANTICALLY_COMPLETE` / `NOT_ASSESSED` may be selected according to scope/intent.

---

# Gate decision

```text
SEMANTIC VALIDATION v0.1        ❌ DO NOT FREEZE
V01–V15                        ✅ PASS
V16                            ❌ FAIL
T1-03                          ⛔ OPEN
BUILD                          ⛔ CLOSED
```

Next action:

```text
evolve v0.1 → v0.2
full V01–V16 regression
freeze only on clean pass
```
