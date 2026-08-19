# TALOS — Correction / Confirmation / Freeze Loop Architecture v0.1

Status: **ARCHITECTURE CANDIDATE / T3-03 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

Target: `design/24-CORRECTION-CONFIRMATION-FREEZE-LOOP-CONTRACT-v0.1.md`

BUILD remains closed.

## 1. End-to-end command architecture

```text
T3-02 ReviewBaselineBundle
        ↓
ReviewCommand
        ↓
ReviewCommandPreconditionService
        ↓
ReviewCommandApplicationService
        ↓
ReviewAuthoredSourceRevision
        ↓
claims / confirmations / resolution history
        ↓
Canonical normalization
        ↓
Candidate ProcessRevision
        ↓
Semantic Validation
        ↓
SemanticDiffGuard
        ↓
BaselineTransitionCandidate
        ↓
reconciliation / decision
        ↓
new ReviewWorkspaceRevision when accepted
```

Every write is append-only/history-preserving.

## 2. ReviewCommandPreconditionService

Validates:

```text
workspace identity
expected ReviewWorkspaceRevision
expected ReviewBaselineBundle
action target/scope existence
authority context where required
idempotency key consistency
```

Results:

```text
READY
STALE_BASELINE
INVALID_CONTEXT
IDEMPOTENCY_CONFLICT
AUTHORITY_REQUIRED
```

No semantic mutation occurs on failed precondition.

## 3. Idempotency store

Conceptual repository:

```text
ReviewCommandRequestRegistry
```

Keyed by reviewer/workspace/client request identity according to policy.

It returns existing command/application result for safe retries and rejects payload mismatch under the same key.

## 4. ReviewCommandApplicationService

Transforms a valid command into immutable review-authored evidence.

Action handlers are semantic command handlers, not UI event handlers:

```text
ConfirmHandler
RejectInterpretationHandler
CorrectPropertyHandler
AddElementHandler
AddRelationshipHandler
RetireMeaningHandler
MarkUnknownHandler
ResolveConflictHandler
ApplySuggestionHandler
AnswerClarificationHandler
FreezeRequestHandler
```

UI drag/click events must first be translated into an explicit command.

## 5. Review-authored source writer

```text
ReviewAuthoredEvidenceWriter
```

Creates a new `ReviewAuthoredSourceRevision` and associated claims/confirmation/resolution records.

It cannot update imported source representations or old review-authored revisions.

## 6. Candidate revision builder

```text
ReviewSemanticRevisionBuilder
```

Consumes:

```text
base ProcessRevision
new review-authored evidence
frozen normalization rules
```

Produces zero or one new candidate `ProcessRevision` for one application transaction.

If semantic meaning is unchanged, it returns explicit `NO_SEMANTIC_CHANGE` rather than manufacturing a revision.

## 7. Revalidation boundary

```text
ReviewRevalidationService
```

Runs applicable Semantic Validation v0.2 assessments for the candidate revision/scopes.

Old assessments are never reused as current assessments for the new revision.

## 8. SemanticDiffGuard

Compares reviewer intent with actual candidate differences.

```text
intended target/property change
        vs
actual ProcessRevision diff
```

Results:

```text
WITHIN_INTENT
COLLATERAL_CHANGES
NO_SEMANTIC_CHANGE
UNSAFE_TO_AUTO_ACCEPT
```

Only `WITHIN_INTENT` may be eligible for same-transaction baseline acceptance under product/authority policy.

## 9. Baseline transition orchestrator

```text
ReviewBaselineTransitionOrchestrator
```

Always creates explicit P2-01B transition history when semantic baseline changes.

Possible flows:

```text
WITHIN_INTENT + sufficient authority
→ Candidate
→ Decision ACCEPT
→ new ReviewWorkspaceRevision
```

or:

```text
COLLATERAL_CHANGES / unsafe
→ Candidate
→ reconciliation pending
→ current workspace baseline unchanged
```

## 10. Historical finding/question integration

When review evidence answers or resolves an old item:

```text
ClarificationResponse
FindingDisposition
new claims
new ProcessRevision
new ValidationAssessment
```

are appended.

Old findings/questions remain unchanged.

## 11. Freeze architecture

```text
FreezeRequestHandler
        ↓
SemanticFreezeEligibilityService
        ↓
SemanticFreezeRecord
        └── ScopeFreezeRecord[]
```

Freeze references exact:

```text
ReviewWorkspaceRevision
ReviewBaselineBundle
ProcessRevision
semantic scopes
ValidationAssessment(s)
T3-01 draft / T3-02 scope binding where applicable
authority
contract versions
```

No freeze changes ProcessRevision state.

## 12. Freeze eligibility service

For `BUSINESS_SEMANTIC_BASELINE`:

- requires explicit authority acceptance;
- pins unresolved accepted findings where policy permits;
- does not claim automation readiness.

For `AUTOMATION_DESIGN_HANDOFF`:

```text
assessmentIntent = AUTOMATION_DESIGN_READINESS
executionReadiness = READY_FOR_AUTOMATION_DESIGN
```

is mandatory per accepted scope.

T3-03 cannot override the validator.

## 13. Multi-scope freeze

`SemanticFreezeRecord` may contain several `ScopeFreezeRecord`s.

Each scope has explicit disposition and pinned validation/draft/visual binding references.

No scope inherits acceptance from another.

## 14. Freeze/history supersession

Later semantic change does not invalidate or mutate an old freeze.

```text
Freeze F1 → ProcessRevision A
later ReviewRevision B
later Freeze F2 → ProcessRevision B
```

F1 remains historical acceptance evidence.

## 15. Concurrency architecture

All semantic commands use expected-baseline preconditions.

A command based on old workspace revision cannot silently overwrite a newer accepted revision.

Stale command options are:

```text
reject
reopen against current baseline
explicit merge/conflict workflow
```

never implicit overwrite.

## 16. Source-only action architecture

Review commands may target `SOURCE_ONLY` subjects/relationships.

The evidence writer can record confirmation/rejection/correction before canonical materialization is possible.

Normalization later decides whether accepted meaning can become canonical.

## 17. Presentation separation

Presentation interactions remain outside this architecture unless they are deliberately translated into semantic commands.

```text
move visual item for layout
→ no ReviewCommand

change actor property via inspector
→ ReviewCommand(CORRECT_PROPERTY)
```

## 18. Authority boundary

Architecture records authority references and policy outcomes but does not define organization-specific authentication/authorization technology.

## 19. Audit architecture

For any freeze or accepted transition, TALOS can traverse:

```text
Freeze / ReviewWorkspaceRevision
← transition decision/candidate
← candidate ProcessRevision + assessment
← ReviewCommandApplication
← ReviewCommand
← review-authored evidence
← prior baseline + imported evidence/provenance
```

## 20. Anti-goals

Do not:

- mutate old review/source/canonical/validation records;
- apply commands from stale baselines silently;
- auto-accept collateral semantic differences;
- use UI event identity as semantic command authority;
- freeze by flipping a mutable ProcessRevision flag;
- equate business-semantic freeze with automation readiness;
- bypass P2-01B baseline transition history;
- introduce capabilities/Temporal execution design into T3-03.

## 21. Gate

T3-03 passes only if the correction/confirmation/freeze pressure suite preserves all Phase-1/2/T3-01/T3-02 laws.

BUILD remains closed.
