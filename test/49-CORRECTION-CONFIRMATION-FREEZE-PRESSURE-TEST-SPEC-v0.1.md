# TALOS — Correction / Confirmation / Freeze Pressure-Test Spec v0.1

Status: **T3-03 PRESSURE-TEST SPEC**  
Date: **2026-08-19**

Targets:

```text
design/24-CORRECTION-CONFIRMATION-FREEZE-LOOP-CONTRACT-v0.1.md
arch/12-CORRECTION-CONFIRMATION-FREEZE-LOOP-ARCHITECTURE-v0.1.md
```

BUILD remains closed.

## Pass rule

A fixture passes only if review intent can be applied/frozen without mutating prior source, claims, ProcessRevisions, findings/questions or review-workspace history, and without bypassing frozen Semantic Validation.

---

# H01–H36

```text
H01  confirm inferred actor
H02  correct source-interpreted label
H03  reject an interpretation without deleting source evidence
H04  mark candidate meaning explicitly UNKNOWN
H05  answer clarification question
H06  add net-new process element with review-authored provenance
H07  add net-new relationship
H08  retire accepted meaning without deleting imported occurrence
H09  resolve material conflict with authority record
H10  apply suggestion as new review-authored evidence
H11  semantic correction creates new ProcessRevision
H12  new ProcessRevision gets new ValidationAssessment
H13  old finding remains immutable after resolution
H14  old question remains immutable after response
H15  old ProcessRevision remains immutable
H16  baseline transition candidate precedes adoption
H17  explicit within-intent correction may accept resulting baseline
H18  collateral semantic difference blocks automatic acceptance
H19  adapter/source change appearing during correction cannot piggyback silently
H20  no-semantic-change command does not manufacture ProcessRevision
H21  duplicate client request is idempotent
H22  same idempotency key + changed payload is rejected
H23  stale baseline command is rejected
H24  concurrent reviewer correction does not overwrite newer baseline
H25  source-only ambiguous relation can be reviewed without fake edge
H26  presentation-only movement does not create semantic command
H27  semantic property edit requires explicit ReviewCommand
H28  business semantic freeze does not claim automation readiness
H29  automation-design handoff requires READY_FOR_AUTOMATION_DESIGN
H30  NEEDS_CONFIRMATION blocks automation-design handoff
H31  BLOCKED_BY_CONFLICT blocks automation-design handoff
H32  freeze pins exact ProcessRevision / workspace / assessments
H33  later semantic change creates new freeze, old freeze remains historical
H34  one freeze request can intentionally target multiple semantic scopes
H35  scopes in one freeze have explicit individual disposition
H36  partial scope acceptance does not imply acceptance of excluded/deferred scopes
```

---

# Critical fixtures

## H01 — confirm inference

Before:

```text
actor = Manager
truth = INFERRED
```

After reviewer confirmation:

```text
old inferred claim remains
new ConfirmationRecord / confirmed claim exists
new ProcessRevision if acceptance state changes materially
new ValidationAssessment
```

Forbidden: mutate old claim to CONFIRMED.

## H03 — reject interpretation

Rejecting image/text interpretation must leave original evidence and historical inference traceable.

## H05 — clarification

```text
ClarificationQuestion Q
→ ReviewCommand(ANSWER_CLARIFICATION)
→ ClarificationResponse
→ new claim/evidence
→ candidate ProcessRevision
→ new assessment
```

Question Q does not mutate.

## H09 — conflict resolution

All competing claims remain historical. Authority-backed resolution creates new resolution/claim/revision history.

## H17 — within intent

Reviewer corrects only:

```text
actor: Supervisor → Manager
```

Actual semantic diff contains only that intended property.

If authority policy permits, distinct candidate/decision/workspace records may be committed in one application transaction.

## H18 — collateral difference

Reviewer changes actor, but normalization also changes branch target because a new adapter result entered context.

Expected:

```text
SemanticDiffGuard = COLLATERAL_CHANGES
no automatic baseline acceptance
```

## H21/H22 — idempotency

Network retry of identical command does not duplicate review-authored history. Different payload under same key is a conflict.

## H23/H24 — stale baseline

Reviewer B acts on workspace W1 after Reviewer A has advanced to W2.

Expected:

```text
REJECTED_STALE
```

or explicit merge/reconciliation, never overwrite.

## H25 — source-only relation

Reviewer can confirm that a connector exists while endpoint remains unknown. No canonical edge is fabricated until semantics are sufficient.

## H28 — business freeze

`BUSINESS_SEMANTIC_BASELINE` records accepted reviewed meaning for business understanding but cannot display `READY_FOR_AUTOMATION_DESIGN` unless validator separately says so.

## H29 — automation handoff

Required per accepted scope:

```text
assessmentIntent = AUTOMATION_DESIGN_READINESS
executionReadiness = READY_FOR_AUTOMATION_DESIGN
```

## H34 — multi-scope freeze request

Workspace contains:

```text
S1 PROCESS_FLOW
S2 POLICY_PROCEDURE
S3 ARCHITECTURE_SCOPE
```

Reviewer wants one intentional freeze operation covering S1 + S2 while S3 is deferred.

The command/intention model must represent the targeted scope set explicitly.

A contract with only:

```text
ReviewCommand.semanticScopeRef
```

singular fails this fixture because `REQUEST_FREEZE` cannot faithfully express a multi-scope request that produces one `SemanticFreezeRecord` with multiple `ScopeFreezeRecord`s.

## H35/H36 — scope dispositions

Each scope is independently:

```text
ACCEPTED
EXCLUDED
DEFERRED
```

No sibling scope inherits acceptance.

---

# Gate

```text
36 / 36 PASS required.
```

Any failure requires versioned evolution and full regression.
