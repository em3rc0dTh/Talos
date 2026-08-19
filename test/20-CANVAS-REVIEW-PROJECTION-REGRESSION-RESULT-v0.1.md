# TALOS — Canvas Review / Projection Regression Result v0.1

Status: **REGRESSION PASS / P2-01B**  
Date: **2026-08-19**

## Regression targets

```text
design/08-CANVAS-REVIEW-PROJECTION-CONTRACT-v0.2.md
arch/04-CANVAS-REVIEW-PROJECTION-ARCHITECTURE-v0.1.md
test/18-CANVAS-REVIEW-PROJECTION-PRESSURE-TEST-SPEC-v0.1.md
```

## Previous failure history

v0.1:

```text
R01–R14
12 PASS
 2 FAIL
```

Failures:

```text
R12 adapter reinterpretation / baseline stability
R14 correction → new revision → reassessment → new projection
```

v0.2 introduced immutable review-context lineage:

```text
ReviewWorkspaceDefinition
ReviewWorkspaceRevision
BaselineTransitionCandidate
BaselineReconciliationAnalysis
BaselineTransitionDecision
```

---

# Final result

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
R12  PASS
R13  PASS
R14  PASS

TOTAL
14 PASS
 0 FAIL
```

---

# R01 — PASS

Imported semantic projection remains bound to original canonical/source/provenance subjects. Rendering does not create a new source occurrence.

---

# R02 — PASS

`INFERRED` visual/perceptual meaning remains inferred. Projection UI states cannot rewrite frozen truth class/confidence.

---

# R03 — PASS

Reviewer correction creates review-authored evidence and a later semantic revision while preserving original literal/source and prior interpretation history.

---

# R04 — PASS

Reviewer rejection/removal changes accepted semantic meaning through new review lineage; underlying imported source occurrence remains preserved.

---

# R05 — PASS

Many-to-many `ProjectionBinding` supports one semantic subject backed by multiple source origins and evidence perspectives.

---

# R06 — PASS

Net-new process meaning authored in review receives its own TALOS/human review provenance and cannot inherit imported origin by co-location.

---

# R07 — PASS

Presentation-only changes may create new `ReviewProjectionRevision` while remaining under the same `ReviewWorkspaceRevision` / ProcessRevision / ValidationAssessment.

---

# R08 — PASS

Source-only evidence may be projected without canonical materialization through `ProjectionSubjectRef` bindings.

---

# R09 — PASS

Dangling/ambiguous relationships can be shown from source evidence + validation overlays without fabricated canonical targets/edges.

---

# R10 — PASS

Confirmation adds new authority/history while preserving the earlier inference and original source evidence.

---

# R11 — PASS

Material multi-source conflicts remain explicit and unresolved until authority-backed resolution produces new lineage.

---

# R12 — PASS

v0.2 closes the original failure.

Adapter reinterpretation now follows:

```text
current ReviewWorkspaceRevision W1
baseline = ProcessRevision A
        ↓
AdapterAttempt v2
        ↓
ProcessRevision candidate C
        ↓
BaselineTransitionCandidate
cause = ADAPTER_REINTERPRETATION
        ↓
BaselineReconciliationAnalysis
includes existing review-authored evidence
        ↓
BaselineTransitionDecision
ACCEPT / REJECT / DEFER
```

C cannot silently replace A.

If accepted, a new immutable `ReviewWorkspaceRevision` is created.

Existing reviewer corrections are included in reconciliation and cannot be silently discarded.

---

# R13 — PASS

Functional/non-workflow evidence can be projected through source/canonical/source-specific subjects without forcing function→ACTION or dependency→SEQUENCE semantics.

---

# R14 — PASS

v0.2 closes the second original failure.

Accepted review correction now produces complete immutable lineage:

```text
ReviewWorkspaceRevision W1
baseline = ProcessRevision A
        ↓
Projection P1
        ↓
ReviewAuthoredSourceRevision H1
        ↓
ProcessRevision B
        ↓
ValidationAssessment B
        ↓
BaselineTransitionCandidate
        ↓
BaselineTransitionDecision ACCEPT
        ↓
ReviewWorkspaceRevision W2
parent = W1
baseline = B
        ↓
Projection P2
```

A/W1/P1 and B/W2/P2 are independently reproducible and explainable.

---

# Regression invariants preserved

```text
ORIGINAL SOURCE                  immutable
REVIEW PROJECTION                non-authoritative read model
REVIEW SEMANTIC ACTION           separate write/evidence path
SOURCE-ONLY EVIDENCE             reviewable
MULTI-SOURCE PROVENANCE          preserved
INFERENCE / CONFIDENCE           not laundered by UI
VALIDATION FINDING               overlay, not process node
LAYOUT CHANGE                    not semantic change
REVIEW BASELINE                  immutable per workspace revision
ADAPTER REINTERPRETATION         explicit candidate, never auto-rebase
USER CORRECTION                  new lineage
BUILD                            still closed
```

---

# Gate result

```text
P2-01B Canvas Review / Projection
14 / 14 PASS
```

The exact tested design/architecture artifacts are eligible for freeze.
