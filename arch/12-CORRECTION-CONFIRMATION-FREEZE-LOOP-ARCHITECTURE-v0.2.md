# TALOS — Correction / Confirmation / Freeze Loop Architecture v0.2

Status: **ARCHITECTURE CANDIDATE / T3-03 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T3-03 architecture: `12-CORRECTION-CONFIRMATION-FREEZE-LOOP-ARCHITECTURE-v0.1.md`

Target: `design/24-CORRECTION-CONFIRMATION-FREEZE-LOOP-CONTRACT-v0.2.md`

BUILD remains closed.

## Why v0.2 exists

Initial result:

```text
H01–H36
35 PASS / 1 FAIL
```

H34 proved that a multi-scope freeze needs one explicit multi-scope reviewer intent, not several unrelated commands.

v0.2 adds command-scope cardinality and a dedicated freeze-request payload while retaining all v0.1 application/history boundaries.

## 1. End-to-end architecture

```text
T3-02 ReviewBaselineBundle
        ↓
ReviewCommand
  targetSemanticScopeRefs[]
  actionPayloadRef?
        ↓
ReviewCommandPreconditionService
        ↓
ReviewCommandApplicationService
        ├── ordinary semantic action handlers
        └── FreezeRequestHandler
        ↓
review-authored evidence / freeze evaluation
        ↓
ProcessRevision / Validation / Transition history
        ↓
SemanticFreezeRecord when eligible/requested
```

## 2. CommandScopePolicy

Conceptual component:

```text
CommandScopePolicy
```

Validates action-kind cardinality:

```text
ordinary semantic action → normally exactly 1 scope
cross-scope conflict      → explicit multi-scope only when conflict supports it
REQUEST_FREEZE            → 1..N scopes
SOURCE_DEFINED            → declared policy required
```

Invalid scope cardinality is rejected before writes.

## 3. FreezeRequestParser

For `REQUEST_FREEZE`:

```text
ReviewCommand.actionPayloadRef
        ↓
FreezeRequestPayload
        ↓
ScopeFreezeRequest[]
```

Checks:

```text
scope request set == targetSemanticScopeRefs set
no duplicate scope request identities
valid requested disposition per scope
freeze kind present
baseline context matches
```

## 4. Precondition service

Retains v0.1 checks and adds:

```text
scope-cardinality validation
freeze-payload consistency
scope existence in ReviewBaselineBundle
per-scope T3-02 binding availability where required
```

Results may include:

```text
READY
STALE_BASELINE
INVALID_CONTEXT
INVALID_SCOPE_SET
IDEMPOTENCY_CONFLICT
AUTHORITY_REQUIRED
```

## 5. Idempotency

Canonical command fingerprint includes scope set and action payload.

Set-valued scope order is normalized deterministically.

One retry cannot duplicate a multi-scope freeze request/history.

## 6. Ordinary action application

All v0.1 handlers retain the same pipeline:

```text
command
→ review-authored evidence
→ candidate ProcessRevision if semantic change
→ new ValidationAssessment(s)
→ SemanticDiffGuard
→ BaselineTransitionCandidate
→ decision/workspace revision when accepted
```

## 7. FreezeRequestHandler

Conceptual flow:

```text
ReviewCommand(REQUEST_FREEZE)
        ↓
FreezeRequestPayload
        ↓
SemanticFreezeEligibilityService
        ├── evaluate S1
        ├── evaluate S2
        └── evaluate Sn
        ↓
ScopeFreezeOutcome[]
        ↓
SemanticFreezeApplication
        ↓
SemanticFreezeRecord + ScopeFreezeRecord[] when outcome permits
```

Requested intent and resulting governance outcome remain separate records.

## 8. SemanticFreezeEligibilityService

Evaluation is scope-specific.

For `BUSINESS_SEMANTIC_BASELINE`, it checks authority/policy plus compatible reviewed baseline context.

For `AUTOMATION_DESIGN_HANDOFF`, every scope requested `ACCEPTED` must have:

```text
AUTOMATION_DESIGN_READINESS assessment
READY_FOR_AUTOMATION_DESIGN
```

The service cannot change validator output.

## 9. Partial-scope result policy

If one scope fails eligibility:

```text
policy forbids partial result
→ reject freeze operation
```

or, when explicit product/governance policy permits:

```text
PARTIAL_SCOPE_FREEZE
```

with exact `ScopeFreezeOutcome` records showing requested vs resulting disposition.

No successful sibling scope silently upgrades the failed scope.

## 10. Audit trace

Multi-scope freeze trace:

```text
SemanticFreezeRecord
← SemanticFreezeApplication
← ReviewCommandApplication
← ReviewCommand
← FreezeRequestPayload
← ScopeFreezeRequest[]
← exact T3-02 ReviewBaselineBundle
```

Per scope:

```text
ScopeFreezeRecord / Outcome
← requested disposition
← validation assessment(s)
← T3-01 explanation draft / T3-02 scope binding where applicable
```

## 11. All v0.1 safety boundaries remain

```text
stale baseline guard
idempotency
immutable review-authored evidence
new ProcessRevision on semantic change
new ValidationAssessment on revalidation
SemanticDiffGuard collateral-change protection
explicit P2-01B baseline transition history
source-only review support
presentation/semantic separation
freeze ≠ source truth
freeze ≠ readiness
```

## 12. Anti-goals

Do not:

- reconstruct one multi-scope freeze intent from unrelated commands;
- infer per-scope disposition from sibling scope outcome;
- let scope-list ordering change idempotent meaning;
- accept a scope for automation handoff without frozen validator readiness;
- mutate prior freeze/application/outcome records;
- bypass stale-baseline checks for governance actions;
- introduce capabilities or Temporal execution design into T3-03.

## 13. Gate

v0.2 must pass full H01–H36 regression.

BUILD remains closed.
