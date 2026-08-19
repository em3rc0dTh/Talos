# TALOS — Visual Review Workspace Regression Result v0.1

Status: **FULL REGRESSION PASS / T3-02 FREEZE ALLOWED**  
Date: **2026-08-19**

Targets:

```text
design/22-VISUAL-REVIEW-WORKSPACE-PRODUCT-CONTRACT-v0.2.md
arch/11-VISUAL-REVIEW-WORKSPACE-ARCHITECTURE-v0.2.md
```

Result:

```text
TOTAL        32
PASS         32
FAIL          0
PASS RATE   100%

T3-02 FREEZE ALLOWED
BUILD CLOSED
```

## Full fixture result

```text
W01 PASS  simple confirmed canonical process
W02 PASS  one item / mixed facet states
W03 PASS  unknown actor on understood action
W04 PASS  source-only ambiguous relationship
W05 PASS  source-only + canonical coexistence
W06 PASS  material property conflict
W07 PASS  BUSINESS_INTENT vs IMPLEMENTED_BEHAVIOR conflict
W08 PASS  property-scoped validation finding
W09 PASS  one clarification question / multiple product placements
W10 PASS  multi-source provenance on one item
W11 PASS  no forced primary source authority
W12 PASS  text facet → Canvas item
W13 PASS  one proposition → many Canvas items
W14 PASS  one Canvas item → many textual facets
W15 PASS  ID/scope binding, not labels/positions
W16 PASS  draft/canvas baseline mismatch blocked
W17 PASS  assessment mismatch blocked
W18 PASS  newer baseline advertised without adoption
W19 PASS  adapter reinterpretation does not auto-rebase
W20 PASS  lens change is presentation-only
W21 PASS  layout/zoom/selection is presentation-only
W22 PASS  finding/question grouping preserves immutable records
W23 PASS  conflict marker does not resolve conflict
W24 PASS  affordance does not equal ReviewAction
W25 PASS  image-region evidence navigation
W26 PASS  text-span evidence navigation
W27 PASS  automation definition/deployment/runtime lanes
W28 PASS  restricted evidence does not leak hidden values
W29 PASS  non-process scope receives scope-specific grammar
W30 PASS  multi-scope workspace uses scope-bound drafts/assessments/grammars
W31 PASS  unsupported automation node remains source-only/reviewable
W32 PASS  compare exposes differences without baseline adoption
```

## W30 regression proof

v0.2 now supports:

```text
ReviewBaselineBundle
  one immutable ProcessRevision/review context
  + 0..N ReviewScopeSurfaceBinding records
```

Each binding can independently pin:

```text
semanticScopeRef
ExplanationDraftSnapshot
ValidationAssessment(s)
projection subject membership
visual grammar
```

while all remain part of one review baseline/history context.

No scope is forced into another scope's explanation grammar or validation verdict.

## Decision

```text
T3-02 DESIGN/ARCH      PASS
T3-02 FREEZE           ALLOWED
BUILD                  CLOSED
```
