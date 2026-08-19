# TALOS — Canvas Review / Projection Pressure Test Result v0.1

Status: **PRESSURE TEST EXECUTED / P2-01B**  
Date: **2026-08-19**

## Target

```text
design/08-CANVAS-REVIEW-PROJECTION-CONTRACT-v0.1.md
test/18-CANVAS-REVIEW-PROJECTION-PRESSURE-TEST-SPEC-v0.1.md
```

## Result

```text
R01  PASS
R02  PASS
R03  PASS
R04  PASS
R05  PASS
R06  PASS
R07  PASS
R08  PASS
R09  PASS
R10  PASS
R11  PASS
R12  FAIL
R13  PASS
R14  FAIL

TOTAL
12 PASS
 2 FAIL
```

P2-01B does **not** close on v0.1.

BUILD remains closed.

---

# R01 — PASS

Imported canonical projection retains binding to canonical/source/provenance and does not become a new source occurrence merely through rendering.

---

# R02 — PASS

Projection display state is explicitly separate from frozen truth class/confidence. An inferred image interpretation remains inferred.

---

# R03 — PASS

`ReviewAuthoredSourceRevision` + `ReviewAction(CORRECT_PROPERTY)` preserve the external source literal and earlier interpretation while adding new reviewer evidence.

---

# R04 — PASS

Rejection/removal is modeled as review-authored semantic evidence rather than deletion of the underlying imported occurrence.

---

# R05 — PASS

`ProjectionBinding.subjectRefs[]`, provenance/source origin arrays and many-to-many cardinality support one semantic element backed by multiple source families.

---

# R06 — PASS

Net-new meaning is explicitly placed on review-authored TALOS/human evidence and is forbidden from inheriting imported origin.

The precise origin classification can remain an implementation/provenance-profile detail as long as frozen SourceOrigin/Capture/Artifact rules are obeyed and imported origin is not copied.

---

# R07 — PASS

Projection/presentation changes are separated from semantic ReviewActions and ProcessRevision creation.

---

# R08 — PASS

`ProjectionSubjectRef` supports source occurrence/relationship/claim/finding subjects without requiring canonical materialization.

---

# R09 — PASS

Unresolved/dangling relationships may be projected from source evidence and validation findings without fabricating canonical targets/edges.

---

# R10 — PASS

Confirmation is represented as new evidence/history and does not mutate the prior inferred claim.

---

# R11 — PASS

Material conflicts remain multi-origin and unresolved until authority-backed resolution exists.

---

# R12 — FAIL

Fixture:

```text
ReviewWorkspace baseline = ProcessRevision A
Adapter v2 reinterprets same preserved source
→ candidate ProcessRevision C
```

v0.1 correctly says:

```text
workspace remains pinned
no silent replacement
```

but it does not define a complete immutable reconciliation mechanism.

Problem:

```text
ReviewWorkspace
- baselineProcessRevisionId
- latestProjectionRevisionId
```

places mutable/current pointers on the stable workspace object while later baseline changes are semantically material.

The contract lacks first-class records for:

```text
new baseline candidate detected
comparison/diff context
existing review-authored overlay used in comparison
accept/reject/defer decision
new review context revision after acceptance
```

Therefore TALOS can prevent silent replacement conceptually but cannot yet represent deterministic, historical baseline reconciliation strongly enough.

Required evolution:

```text
ReviewWorkspaceDefinition
        ↓
ReviewWorkspaceRevision

BaselineTransitionCandidate
BaselineTransitionDecision
```

or an equivalent immutable model.

---

# R13 — PASS

Projection subject kinds allow functional/source-specific evidence to be shown without forcing canonical ACTION/SEQUENCE semantics.

---

# R14 — FAIL

Fixture:

```text
Projection 1
→ reviewer resolves ambiguity
→ ProcessRevision B
→ Assessment B
→ Projection 2
```

The downstream lineage is represented, but v0.1 does not explicitly version the review workspace/baseline after accepted semantic change.

If `ReviewWorkspace.baselineProcessRevisionId` is changed from A to B in place, history is weakened.

If it is never changed, the workspace's current semantic baseline becomes inconsistent with Projection 2.

Required evolution:

```text
Workspace Revision 1
baseline = ProcessRevision A

review correction
→ ProcessRevision B

Workspace Revision 2
parent = Workspace Revision 1
baseline = ProcessRevision B
```

with the transition/decision record linking why the baseline advanced.

---

# Failure synthesis

Both failures expose one architectural rule:

> **The review context is itself historical semantic state and must be revisioned.**

A stable review workspace identity is useful, but its active baseline, assessment and projection context cannot be mutable semantic truth.

Required v0.2 direction:

```text
ReviewWorkspaceDefinition            stable identity
ReviewWorkspaceRevision              immutable review context
ReviewProjectionRevision             immutable visual projection
ReviewAuthoredSourceRevision          immutable reviewer evidence
BaselineTransitionCandidate           immutable candidate transition
BaselineTransitionDecision            immutable decision
```

The candidate/decision model must handle both:

```text
A. user-authored semantic correction
B. new adapter interpretation of preserved source
```

without overwriting either history.

---

# Gate decision

```text
P2-01B v0.1       ❌ NOT FROZEN
R01–R14           12 PASS / 2 FAIL
NEXT              evolve contract to v0.2
BUILD             ⛔ CLOSED
```
