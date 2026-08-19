# TALOS — Canvas Review / Projection Pressure Test Spec v0.1

Status: **TEST DESIGN / P2-01B**  
Date: **2026-08-19**

## Target

```text
design/08-CANVAS-REVIEW-PROJECTION-CONTRACT-v0.1.md
```

## Gate question

> Can TALOS project imported/source-derived meaning into Canvas for review and correction while preserving original evidence, uncertainty, conflicts, and historical semantics; and can accepted user changes create new lineage without turning the projection into the original source?

A pass requires preservation across:

```text
external source
→ adapter evidence
→ canonical/provenance/validation
→ review projection
→ user review action
→ review-authored evidence
→ new ProcessRevision
→ new ValidationAssessment
```

No fixture may pass by mutating the imported source or historical claims.

---

# R01 — Imported canonical node retains source provenance

Fixture:

```text
BPMN/source occurrence S1
→ canonical ACTION A1
→ review projection item P1
```

Required:

- P1 may display A1;
- P1 remains bound to A1 and S1/provenance;
- P1 is not a new source occurrence merely because it is rendered;
- original source identity remains addressable.

Fail if projection origin replaces source origin.

---

# R02 — Inferred visual interpretation remains inferred

Fixture:

Image source produces:

```text
literal evidence: handwritten box
candidate meaning: "Manager Review"
truthClass: INFERRED
```

Required:

- review item may show the candidate;
- truth class/confidence remain inspectable;
- rendering does not promote it to SOURCE_TRUTH or CONFIRMED.

---

# R03 — Property correction without source rewrite

Fixture:

```text
source literal: "Check order"
interpreted meaning: Check order
reviewer correction: "Validate purchase order"
```

Required:

- source literal remains immutable;
- prior interpretation remains historical;
- correction becomes review-authored evidence/claim;
- new ProcessRevision may select corrected meaning;
- provenance answers both old and new meaning.

---

# R04 — Reject/remove imported interpretation without deleting evidence

Fixture:

Projected node was inferred from an imported source but reviewer says it does not belong in the business process.

Required:

- source occurrence remains;
- prior canonical revision remains;
- reviewer action records rejection/retirement of accepted meaning;
- later ProcessRevision may omit/retire the semantic element;
- history explains why.

---

# R05 — Multi-source canonical element

Fixture:

```text
Canonical ACTION "Validate order"
  ← BPMN element
  ← SOP text span
  ← runtime observation
```

Required:

- one projection item may bind to all sources;
- no single source origin is fabricated as exclusive;
- evidence perspective remains distinct;
- review action does not erase prior evidence origins.

---

# R06 — Reviewer adds net-new process element

Fixture:

Imported source:

```text
Receive → Validate → Pay
```

Reviewer adds:

```text
Manager approval
```

Required:

- new element provenance is TALOS-native/human-authored review evidence;
- imported nodes retain imported provenance;
- later ProcessRevision may combine both;
- new element must not inherit BPMN/image/document origin.

---

# R07 — Presentation-only review edit

Fixture:

Reviewer moves projected nodes and changes zoom/layout only.

Required:

- projection/presentation revision may change;
- no ReviewAction semantic assertion;
- no new SemanticClaim;
- no new ProcessRevision merely for layout.

---

# R08 — Source-only unresolved evidence is reviewable

Fixture:

Image/source evidence contains an ambiguous element/edge that was preserved but not normalized into a canonical node/edge.

Required:

- projection may bind directly to source occurrence/claim/finding;
- no placeholder canonical element is required;
- user can inspect and later clarify the evidence.

---

# R09 — Dangling/ambiguous relationship

Fixture:

```text
Decision NO branch exists
source endpoint known
target unknown
```

Required:

- projection can show unresolved branch intent;
- canonical fake target/edge is not created;
- associated validation finding can be displayed;
- correction may later create review-authored target evidence and new ProcessRevision.

---

# R10 — Confirmation preserves prior inference

Fixture:

```text
claim: actor = Manager
truthClass: INFERRED
reviewer confirms Manager
```

Required:

- inferred claim remains historical;
- confirmation is separate evidence/record;
- accepted later revision may contain confirmed meaning;
- confirmation does not mutate source or old claim.

---

# R11 — Material source conflict remains visible

Fixture:

```text
BPMN threshold = 10000
SOP threshold  = 5000
```

Required:

- both claims/origins remain visible/addressable;
- projection does not choose one automatically;
- conflict overlay/record may be projected;
- resolution requires authority and new lineage.

---

# R12 — Adapter reinterpretation / baseline stability

Fixture:

```text
ReviewWorkspace baseline = ProcessRevision A
Adapter v2 reinterprets same preserved source
→ ProcessRevision candidate C
```

Required:

- workspace does not silently replace A with C;
- reviewer-authored corrections made against A remain preserved;
- TALOS can detect that a new interpretation candidate exists;
- adoption/reconciliation must be explicit and history-preserving.

Pressure point:

The v0.1 contract says a workspace remains pinned, but leaves exact reconciliation/rebase behavior unresolved.

A PASS requires enough model structure to prevent silent replacement **and** represent the explicit decision/reconciliation path deterministically.

---

# R13 — Functional/non-workflow source review

Fixture: Q12-like functional model.

Required:

- function/input/control/output/mechanism evidence can be projected;
- review Canvas does not force functions into ACTION or dependency arrows into SEQUENCE;
- source-specific/canonical/source-only subjects may coexist;
- review surface remains useful even when execution scope is unresolved.

---

# R14 — Correction → new revision → reassessment → new projection

Fixture:

Reviewer resolves a material ambiguity.

Required lineage:

```text
Projection 1
→ ReviewAuthoredSourceRevision
→ new claim/confirmation
→ ProcessRevision B
→ ValidationAssessment B
→ Projection 2
```

Historical Projection 1 / ProcessRevision A / Assessment A remain explainable.

---

# Acceptance

```text
14 / 14 PASS
```

required to freeze P2-01B v0.x.

Any failure that reveals a contract gap must produce a new contract version and full R01–R14 regression.

BUILD remains closed.
