# TALOS — Visual Review Workspace Pressure-Test Spec v0.1

Status: **T3-02 PRESSURE-TEST SPEC**  
Date: **2026-08-19**

Targets:

```text
design/22-VISUAL-REVIEW-WORKSPACE-PRODUCT-CONTRACT-v0.1.md
arch/11-VISUAL-REVIEW-WORKSPACE-ARCHITECTURE-v0.1.md
```

Purpose:

> Prove that TALOS can present text, Canvas, evidence, validation and history as one synchronized human review experience without flattening evidence state, inventing canonical meaning, or mixing incompatible semantic baselines.

BUILD remains closed.

## Pass condition

A fixture passes only if the product/architecture contracts can represent the required review state without:

```text
source rewrite
canonical fabrication
epistemic flattening
independent latest-revision fetches
silent baseline advance
review-action mutation
scope coercion
provenance loss
```

---

# W01–W32 fixtures

```text
W01  simple confirmed canonical process
W02  one node with mixed facet states
W03  unknown actor on otherwise understood action
W04  source-only ambiguous relationship
W05  source-only evidence + canonical meaning coexist
W06  material conflict on one property
W07  conflict across BUSINESS_INTENT and IMPLEMENTED_BEHAVIOR
W08  finding attached to one property, not whole node
W09  clarification question attached to unresolved branch
W10  one item supported by multiple source origins
W11  multi-source provenance without forced primary authority
W12  text draft facet → one Canvas item navigation
W13  one text proposition → many Canvas items
W14  one Canvas item → many text facets/propositions
W15  navigation uses IDs, not labels/positions
W16  draft ProcessRevision A + Canvas ProcessRevision B mismatch
W17  old assessment + new assessment mismatch
W18  newer baseline exists but current review remains pinned
W19  adapter reinterpretation candidate does not auto-rebase
W20  presentation-only lens change
W21  presentation-only layout/zoom/selection
W22  findings/questions grouping does not mutate records
W23  conflict marker does not resolve conflict
W24  review affordance does not equal ReviewAction
W25  image evidence region navigation
W26  language text-span navigation
W27  automation definition/deployment/runtime evidence lanes
W28  restricted/redacted evidence does not leak hidden values
W29  functional/architecture scope not forced into process graph
W30  one review workspace contains multiple semantic scopes with separate human-readable drafts
W31  source-only unsupported automation node remains reviewable
W32  baseline transition compare shows differences without adoption
```

---

# Critical fixture details

## W02 — mixed facet states

```text
Review Request
  type            CONFIRMED
  literal label   SOURCE_STATED
  actor            UNKNOWN
  ordering         INFERRED
```

Required:

```text
one visible item
+ multiple facet indicators
```

Forbidden:

```text
one authoritative item-wide state
```

## W04 — source-only ambiguous relationship

Image shows connector stroke with unresolved endpoint.

Required:

```text
visible source-only relationship evidence
no fake canonical edge
question/finding may bind to it
```

## W07 — cross-perspective conflict

```text
SOP: manager approval required       BUSINESS_INTENT
Automation: auto-approve score > 80  IMPLEMENTED_BEHAVIOR
```

Required: preserve both claims/perspectives and conflict.

## W09 — question placement

Question:

```text
Where does the NO branch continue?
```

must remain one immutable `ClarificationQuestion` that can be surfaced near the branch, in the question queue and in the draft context without duplication of semantic identity.

## W10/W11 — multi-source provenance

One canonical action may have evidence from BPMN + SOP + reviewer confirmation.

Required:

```text
many sources → one visible semantic item
```

without declaring one source authoritative solely for UI convenience.

## W16 — incompatible pane baseline

```text
Draft snapshot → ProcessRevision A
Canvas projection → ProcessRevision B
```

Expected:

```text
BASELINE_MISMATCH
combined review blocked
```

## W18 — newer baseline exists

Current bundle remains A while candidate B is available.

Expected:

```text
show "new baseline available"
keep review on A
```

## W24 — affordance vs action

Button/command target may show:

```text
CONFIRM actor = Manager
```

but no semantic history changes until T3-03 command semantics create actual review evidence/action.

## W27 — automation evidence lanes

For one automation source show separately:

```text
definition configuration
deployment observation
runtime observation
business-intent evidence if available
```

No lane becomes business authority automatically.

## W29 — scope-specific grammar

Architecture/function-model review remains useful without forced sequential workflow rendering.

## W30 — multi-scope workspace

One uploaded process manual yields:

```text
Scope S1 = PROCESS_FLOW
Scope S2 = POLICY_PROCEDURE
```

Each has a distinct T3-01 `ExplanationDraftSnapshot` because T3-01 drafts have one `primarySemanticScopeRef`.

The review workspace must be able to coordinate both under one compatible semantic baseline/history context.

A contract that permits only one explanation draft per `ReviewBaselineBundle` fails this fixture.

## W32 — comparison without adoption

```text
Baseline A
TransitionCandidate B
CompareReadModel(A,B)
```

Required: differences visible; A remains active until T3-03 explicit decision.

---

# Gate rule

```text
32 / 32 PASS required to freeze T3-02.
```

Any failure causes versioned design/architecture evolution and full regression.
