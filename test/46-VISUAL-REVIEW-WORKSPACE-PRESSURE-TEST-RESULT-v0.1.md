# TALOS — Visual Review Workspace Pressure-Test Result v0.1

Status: **PRESSURE TEST EXECUTED — T3-02 NOT FROZEN**  
Date: **2026-08-19**

Targets:

```text
design/22-VISUAL-REVIEW-WORKSPACE-PRODUCT-CONTRACT-v0.1.md
arch/11-VISUAL-REVIEW-WORKSPACE-ARCHITECTURE-v0.1.md
```

Result:

```text
TOTAL        32
PASS         31
FAIL          1
PASS RATE  96.875%

T3-02 GATE   FAIL
BUILD        CLOSED
```

## Fixture result

```text
W01 PASS
W02 PASS
W03 PASS
W04 PASS
W05 PASS
W06 PASS
W07 PASS
W08 PASS
W09 PASS
W10 PASS
W11 PASS
W12 PASS
W13 PASS
W14 PASS
W15 PASS
W16 PASS
W17 PASS
W18 PASS
W19 PASS
W20 PASS
W21 PASS
W22 PASS
W23 PASS
W24 PASS
W25 PASS
W26 PASS
W27 PASS
W28 PASS
W29 PASS
W30 FAIL  multi-scope workspace requires multiple scope-bound explanation drafts
W31 PASS
W32 PASS
```

# Failure W30

T3-01 freezes:

```text
ExplanationDraftSnapshot
- primarySemanticScopeRef
- contextSemanticScopeRefs[]
```

Therefore one draft has one primary semantic explanation target.

But T3-02 v0.1 defines:

```text
ReviewBaselineBundle
- explanationDraftSnapshotId
```

singular.

That is insufficient for a valid review workspace containing, for example:

```text
Scope S1 = PROCESS_FLOW
Scope S2 = POLICY_PROCEDURE
Scope S3 = ARCHITECTURE_SCOPE
```

under one compatible `ProcessRevision` / review-workspace history context.

Forcing one draft to narrate all scopes would violate T3-01 scope discipline.

Creating separate unrelated baseline bundles would make the product lose the fact that the scopes belong to one review context.

## Required evolution

T3-02 needs an explicit scope-to-surface binding model.

Candidate direction:

```text
ReviewBaselineBundle
- primaryReviewScopeRef?
- contextReviewScopeRefs[]
- scopeSurfaceBindingRefs[]

ReviewScopeSurfaceBinding
- semanticScopeRef
- explanationDraftSnapshotRef?
- validationAssessmentRefs[]
- projectionSubjectRefs[]?
- visualGrammarKind?
```

The shared `ReviewProjectionRevision` may still coordinate the overall Canvas projection, while each semantic scope binds to its own human-readable draft/assessment context.

No Phase-1, Phase-2 or T3-01 contract needs reopening.

## Decision

```text
T3-02 v0.1      NOT FROZEN
EVOLVE          v0.2
BUILD           CLOSED
```
