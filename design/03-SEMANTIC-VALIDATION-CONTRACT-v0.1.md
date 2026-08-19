# TALOS — Semantic Validation Contract v0.1

Status: **DESIGN CANDIDATE / T1-03 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

## Purpose

T1-03 defines how TALOS decides whether an interpreted, provenance-safe business model is:

- structurally understandable;
- semantically coherent;
- incomplete but useful;
- blocked by ambiguity or source conflict;
- sufficiently specified to enter automation design.

The validator does **not** repair the process, choose Temporal constructs, bind integrations, or invent business truth.

T1-01 answers:

> What does this process/model mean canonically?

T1-02 answers:

> Why does TALOS believe that meaning and where did it come from?

T1-03 answers:

> Given that meaning and evidence, what is valid, what is unresolved, what matters now, and what must be clarified before automation design?

---

# 1. Fundamental invariants

```text
VALIDATION                         ≠ REPAIR
FINDING                            ≠ SOURCE TRUTH
QUESTION                           ≠ ASSUMED ANSWER
HIGH CONFIDENCE                    ≠ SEMANTIC COMPLETENESS
SEMANTIC COMPLETENESS              ≠ EXECUTION READINESS
USEFUL BUSINESS MODEL              ≠ AUTOMATION-READY PROCESS
MISSING TECHNICAL DESIGN           ≠ BUSINESS-SEMANTIC DEFECT
REFERENCE ARCHITECTURE             ≠ INVALID BECAUSE IT IS NOT ONE WORKFLOW
FUNCTIONAL MODEL                   ≠ INVALID BECAUSE IT LACKS SEQUENCE FLOW
UNKNOWN                            ≠ ERROR AUTOMATICALLY
LAST VISIBLE NODE                  ≠ COMPLETION
BUSINESS CONDITION                 ≠ TECHNICAL FAILURE
EXECUTION SUGGESTION               ≠ VALIDATED BUSINESS MEANING
```

Validation is conservative:

```text
DETECT
EXPLAIN
TRACE TO EVIDENCE
CLASSIFY IMPACT
ASK / DEFER
REVALIDATE AFTER NEW REVISION
```

Never:

```text
DETECT
GUESS
MUTATE
PRETEND CONFIRMED
```

---

# 2. ValidationAssessment

A validation run is immutable and reproducible against one accepted semantic revision and one validator/ruleset version.

```text
ValidationAssessment
- id
- processRevisionId
- provenanceContractVersion
- canonicalModelVersion
- validatorVersion
- rulesetVersion
- assessmentIntent
- assessmentScopes[]
- findingIds[]
- questionPlanId?
- semanticVerdict
- executionReadiness
- assessedAt
- supersedesAssessmentId?
```

`assessmentIntent`:

```text
BUSINESS_MODEL_UNDERSTANDING
AUTOMATION_DESIGN_READINESS
SOURCE_REVIEW
SOURCE_MERGE_REVIEW
EXECUTABLE_SLICE_DISCOVERY
SOURCE_DEFINED
```

The same ProcessRevision may legitimately receive different assessments for different intents.

---

# 3. Assessment scope

Validation is scope-aware.

```text
AssessmentScope
- id
- kind
- targetRefs[]
- artifactClass?
- parentScopeId?
- intendedUse?
```

Initial `kind` values:

```text
PROCESS_REVISION
PROCESS_REGION
EXECUTABLE_SLICE_CANDIDATE
COLLABORATION
PARTICIPANT_LOCAL_FLOW
FUNCTIONAL_MODEL
ARCHITECTURE_TOPOLOGY
NODE
RELATIONSHIP
BUSINESS_RULE
BUSINESS_OBJECT
SOURCE_DEFINED
```

Critical rule:

```text
VALID FOR ONE SCOPE
      ≠
VALID FOR EVERY OTHER SCOPE
```

Example Q06:

```text
REFERENCE ARCHITECTURE as architecture topology       VALID/USEFUL
whole artifact as one executable workflow             NOT SUPPORTED
DecisionRequest slice candidate                        ASSESS SEPARATELY
ModelLifecycle slice candidate                         ASSESS SEPARATELY
```

Example Q12:

```text
functional relationship model                          VALID/USEFUL
runtime control-flow process                            NOT YET ESTABLISHED
```

---

# 4. Semantic verdict

`semanticVerdict` evaluates the meaning available in the assessed scope, not runtime implementation.

```text
VALID
VALID_WITH_FINDINGS
INCOMPLETE
CONFLICTED
INVALID
NOT_APPLICABLE
```

Definitions:

### VALID

The requested semantic scope is coherent and has no open semantic finding material to that intent.

### VALID_WITH_FINDINGS

The scope is coherent and useful, while non-fatal unknowns or deferred design matters remain.

### INCOMPLETE

Important source/semantic information required for the requested intent is missing or unresolved.

### CONFLICTED

Unresolved source claims materially disagree on meaning required for the requested intent.

### INVALID

The accepted canonical interpretation violates a proven structural/semantic invariant, such as an edge targeting a nonexistent canonical node or an impossible synchronization contract.

### NOT_APPLICABLE

The requested validation intent does not apply to this scope, such as ordinary control-flow validation of a pure architecture container.

---

# 5. ExecutionReadiness

T1-03 uses the frozen Canonical Process Model v0.1 vocabulary:

```text
NOT_ASSESSED
INSUFFICIENT_DETAIL
BLOCKED_BY_CONFLICT
NEEDS_CONFIRMATION
SEMANTICALLY_COMPLETE
READY_FOR_AUTOMATION_DESIGN
```

T1-03 does not redefine or silently extend this enum.

Interpretation:

### INSUFFICIENT_DETAIL

Required business/process meaning is absent, omitted or too coarse for automation design.

### BLOCKED_BY_CONFLICT

Conflicting source claims prevent an authoritative design decision.

### NEEDS_CONFIRMATION

A sufficiently plausible interpretation exists but a material `INFERRED`/ambiguous semantic claim requires confirmation before automation design.

### SEMANTICALLY_COMPLETE

The business model is semantically coherent for its intended scope, but automation-design prerequisites may still remain.

### READY_FOR_AUTOMATION_DESIGN

No open T1-03 finding blocks automation design for the assessed executable scope. Later capability and Temporal design decisions are still expected.

Important:

```text
READY_FOR_AUTOMATION_DESIGN
      ≠
READY_TO_DEPLOY
```

---

# 6. ValidationFinding

A finding is a derived statement about semantic/readiness quality.

```text
ValidationFinding
- id
- assessmentId
- code
- family
- title
- description
- scopeRef
- targetRefs[]
- evidenceRefs[]
- provenanceRefs[]
- severity
- blockerClass
- status
- resolutionRoute
- deferredGate?
- questionCandidate?
- relatedFindingRefs[]
- createdAt
```

`severity`:

```text
INFO
WARNING
ERROR
CRITICAL
```

Severity describes consequence/importance; it does not by itself determine the gate.

`blockerClass`:

```text
NONE
SEMANTIC_UNDERSTANDING
AUTOMATION_DESIGN
SOURCE_ACCEPTANCE
```

`status`:

```text
OPEN
RESOLVED
DEFERRED
NOT_APPLICABLE
SUPERSEDED
```

`resolutionRoute`:

```text
SOURCE_REVIEW
USER_CONFIRMATION
BUSINESS_OWNER_DECISION
ADDITIONAL_SOURCE_REQUIRED
CANONICAL_CORRECTION
FOUNDRY_DESIGN
CAPABILITY_BINDING
TEMPORAL_EXECUTION_DESIGN
NOT_REQUIRED
```

This is one of the most important boundaries in T1-03.

Example:

```text
exact Gmail provider unknown
→ resolutionRoute: CAPABILITY_BINDING
→ blockerClass: NONE for semantic validation
→ deferredGate: T4
```

while:

```text
what does the NO branch mean?
→ resolutionRoute: USER_CONFIRMATION / SOURCE_REVIEW
→ blockerClass: AUTOMATION_DESIGN or SEMANTIC_UNDERSTANDING
→ must be resolved before design
```

---

# 7. Validation families

Initial rule families are intentionally semantic rather than notation-specific.

```text
STRUCTURE
CONTROL_FLOW
DECISION_RULE
COMPLETION
ACTOR_RESPONSIBILITY
DATA_OBJECT
BUSINESS_RULE
EVENT_WAIT
HUMAN_INTERACTION
COLLABORATION_CORRELATION
CONCURRENCY
LOOP_REENTRY
SUBPROCESS_SCOPE
SOURCE_UNCERTAINTY
SOURCE_CONFLICT
EXECUTABLE_SCOPE
SIDE_EFFECT_RECOVERY
FUNCTIONAL_RELATIONSHIP
STATE_LIFECYCLE
POLICY_GOVERNANCE
SOURCE_DEFINED
```

---

# 8. Initial rule catalog

Rule codes are stable identities. Message text may evolve without changing rule meaning.

## STRUCTURE

```text
SV-STR-001  UNRESOLVED_ENTRY_SEMANTICS
SV-STR-002  UNRESOLVED_EDGE_ENDPOINT
SV-STR-003  MISSING_REQUIRED_CONTINUATION
SV-STR-004  SOURCE_REGION_TOPOLOGY_PARTIAL
```

## CONTROL FLOW / DECISIONS

```text
SV-CFL-001  BRANCH_CONDITION_UNRESOLVED
SV-CFL-002  BRANCH_TARGET_UNRESOLVED
SV-CFL-003  EVENT_SUBTYPE_AFFECTS_FLOW
SV-CFL-004  BUSINESS_OUTCOME_UNRESOLVED
```

## COMPLETION

```text
SV-CMP-001  SUCCESS_COMPLETION_UNPROVEN
SV-CMP-002  CANCELLATION_COMPLETION_UNPROVEN
SV-CMP-003  LOCAL_END_NOT_GLOBAL_COMPLETION
```

## ACTORS / HUMANS

```text
SV-ACT-001  ACTOR_OR_OWNER_MISSING
SV-ACT-002  RESPONSIBILITY_TYPE_UNRESOLVED
SV-HUM-001  HUMAN_COMPLETION_OBSERVATION_UNRESOLVED
SV-HUM-002  HUMAN_OUTCOME_CONTRACT_UNRESOLVED
```

## DATA / RULES

```text
SV-DAT-001  DECISION_EVIDENCE_UNRESOLVED
SV-DAT-002  BUSINESS_OBJECT_IDENTITY_UNRESOLVED
SV-DAT-003  AUTHORITATIVE_STATE_OWNER_UNRESOLVED
SV-RUL-001  BUSINESS_RULE_TERM_UNRESOLVED
```

## EVENTS / WAITS

```text
SV-EVT-001  WAIT_RESUME_SEMANTICS_INCOMPLETE
SV-EVT-002  WAIT_TIME_EXPRESSION_INCOMPLETE
SV-EVT-003  EXTERNAL_EVENT_OBSERVATION_UNRESOLVED
```

## COLLABORATION

```text
SV-COR-001  CORRELATION_IDENTITY_UNRESOLVED
SV-COR-002  MESSAGE_PAYLOAD_MEANING_UNRESOLVED
SV-COR-003  PARTICIPANT_BOUNDARY_UNRESOLVED
```

## CONCURRENCY

```text
SV-CON-001  JOIN_POLICY_UNRESOLVED
SV-CON-002  BRANCH_COMPLETION_PREDICATE_UNRESOLVED
SV-CON-003  PARALLEL_FAILURE_SEMANTICS_UNRESOLVED
```

## LOOPS / SUBPROCESSES

```text
SV-LOP-001  LOOP_EXIT_OR_LIMIT_UNRESOLVED
SV-SUB-001  SUBPROCESS_INTERNAL_SEMANTICS_MISSING
SV-SUB-002  SUBPROCESS_BOUNDARY_MEANING_UNRESOLVED
```

## SOURCE UNCERTAINTY / CONFLICT

```text
SV-SRC-001  MATERIAL_INFERRED_MEANING_NEEDS_CONFIRMATION
SV-SRC-002  NOTATION_INTERPRETATION_UNRESOLVED
SV-CNF-001  UNRESOLVED_SOURCE_CONFLICT
```

## EXECUTABLE SCOPE

```text
SV-SCP-001  EXECUTABLE_SCOPE_NOT_ESTABLISHED
SV-SCP-002  ARTIFACT_NOT_ONE_EXECUTABLE_PROCESS
SV-SCP-003  FUNCTIONAL_DEPENDENCY_NOT_RUNTIME_SEQUENCE
SV-SCP-004  DECOMPOSITION_NOT_RUNTIME_BOUNDARY
```

## SIDE EFFECT / RECOVERY

```text
SV-SFX-001  POST_SIDE_EFFECT_FAILURE_POLICY_MISSING
SV-SFX-002  COMPENSATION_BUSINESS_POLICY_UNRESOLVED
SV-SFX-003  CANCELLATION_SIDE_EFFECT_POLICY_UNRESOLVED
```

The validator may add source-defined findings, but new reusable rule codes require versioning of this contract/ruleset.

---

# 9. Finding impact is intent-sensitive

The same unresolved fact may have different impact depending on assessment intent.

Example:

```text
Q12 relationship role = FUNCTION_CONTROL [strong inference]
```

For:

```text
BUSINESS_MODEL_UNDERSTANDING
```

it may be a warning / `VALID_WITH_FINDINGS`.

For:

```text
AUTOMATION_DESIGN_READINESS
```

if runtime sequencing depends on that interpretation, confirmation or a stronger native source may be required.

Therefore rules do not carry one universal blocker classification. The assessment computes impact using:

```text
rule
+ scope
+ intent
+ truth/provenance state
+ dependency on downstream semantics
```

---

# 10. Deferral boundary — do not ask too early

T1-03 must not block automation design because later design choices are naturally unresolved.

Usually defer:

```text
provider selection                     → T4 Capability Model
credentials / secrets                  → T4/T6 deployment
Temporal Task Queue                    → T5
Activity retry policy                  → T5
SDK/client choice                      → T5/build
worker topology                        → T5
exact deployment infrastructure        → T5/T6
```

But do **not** defer the underlying business semantics those designs depend on.

Examples:

```text
"send SMS" known, provider unknown
→ semantic meaning sufficient
→ provider deferred to T4
```

```text
"wait until Next Wednesday" but no timezone/instant/calendar semantics
→ business wait semantics incomplete
→ automation-design blocker now
```

```text
payment captured, delivery later fails, business outcome unknown
→ business recovery policy missing
→ automation-design blocker now
```

```text
exact Temporal compensation implementation unknown
→ T5 design, not T1-03 blocker
```

---

# 11. ClarificationQuestion

A material finding may generate a user/business/source clarification question.

```text
ClarificationQuestion
- id
- findingRefs[]
- scopeRef
- questionText
- whyItMatters
- expectedAnswerKind
- choices[]?
- authorityRequired?
- priority
- status
- answerClaimRef?
- resultingProcessRevisionRef?
```

`expectedAnswerKind`:

```text
BOOLEAN
SINGLE_SELECT
MULTI_SELECT
SHORT_TEXT
LONG_TEXT
STRUCTURED
REFERENCE_SOURCE
CONFIRM_OR_REJECT
SOURCE_DEFINED
```

`priority`:

```text
P0_SEMANTIC_BLOCKER
P1_AUTOMATION_DESIGN_BLOCKER
P2_IMPORTANT_NONBLOCKER
P3_DEFERRED_DESIGN
```

Question behavior:

```text
finding
   ↓
clarification question
   ↓
user/business/source answer
   ↓
SemanticClaim / ConfirmationRecord / source addition
   ↓
new ProcessRevision
   ↓
new ValidationAssessment
```

The validator never mutates an accepted ProcessRevision in place.

---

# 12. Minimum clarification principle

TALOS should not interrogate the user with every downstream technical question.

Questions should be:

```text
ROOT-CAUSE ORIENTED
HIGH INFORMATION GAIN
BUSINESS LANGUAGE FIRST
ORDERED BY DEPENDENCY
GROUPED WHEN ONE ANSWER RESOLVES MANY FINDINGS
```

Example Q11:

Instead of asking separately:

```text
Is T11-01 an end?
Does the process stop?
Does analysis still happen?
Does design still happen?
```

ask:

> When there is no previous website, what should the process do next?

One authoritative answer may resolve several topology/readiness findings.

---

# 13. Validation dependencies

Findings may depend on other findings.

```text
ValidationDependency
- findingId
- dependsOnFindingIds[]
- rationale
```

Example Q10:

```text
what does Process credit card actually do?
      ↓
then determine whether post-payment recovery/compensation is required
```

Do not ask compensation implementation questions until the side-effect meaning is known.

---

# 14. Structural validation vs source limitation

A source may be incomplete without the canonical graph being internally invalid.

Distinguish:

```text
CANONICAL_INVALIDITY
```

from:

```text
SOURCE_LIMITATION
```

Example Q08:

```text
source long-edge endpoint unreadable
```

should produce:

```text
SV-STR-002 UNRESOLVED_EDGE_ENDPOINT
resolutionRoute = SOURCE_REVIEW / ADDITIONAL_SOURCE_REQUIRED
```

not fabricate an edge and then report the fabricated graph as valid.

---

# 15. Conflict behavior

When a material unresolved `ConflictRecord` affects the assessed intent:

```text
semanticVerdict = CONFLICTED
executionReadiness = BLOCKED_BY_CONFLICT
```

unless the conflict is explicitly irrelevant to the assessed scope.

Resolution must occur through the T1-02 provenance/confirmation contract and produce a new ProcessRevision before revalidation.

---

# 16. Source uncertainty behavior

`INFERRED` does not automatically mean `NEEDS_CONFIRMATION`.

Confirmation is required only when the inferred property is materially depended upon by the requested intent.

Example:

```text
Q11 "Brainst" → brainstorm
```

If only explanatory copy depends on it:

```text
warning / clarification optional
```

If TALOS intends to decompose that token into a required lifecycle stage:

```text
material inference
→ confirmation required
```

This avoids turning every perception uncertainty into a blocking question.

---

# 17. Completion behavior

Completion must be explicit enough for the intended executable scope.

Examples:

```text
Q07 Deliver order is last visible activity
→ SUCCESS_COMPLETION_UNPROVEN
```

```text
Q10 Cancel order is last visible cancellation node
→ CANCELLATION_COMPLETION_UNPROVEN
```

```text
Q05 Purchase order placed is local Pharmacy end
→ LOCAL_END_NOT_GLOBAL_COMPLETION
```

A high-level/non-executable model may retain these as warnings. A candidate durable lifecycle cannot be `READY_FOR_AUTOMATION_DESIGN` while its terminal semantics are materially unknown.

---

# 18. Concurrency behavior

A parallel source must preserve:

```text
split semantics
active branch set
branch completion meaning
join policy
failure/cancellation effect across branches when business-significant
```

Do not require Temporal implementation yet.

Example Q07:

```text
payment + fulfillment both active
join waits for both
```

is semantically useful, but automation design remains blocked if business behavior when one branch fails/cancels is unknown and that can leave the other branch/side effect inconsistent.

---

# 19. Side-effect safety boundary

T1-03 does not design compensation, but it must detect when the business model omits a recovery decision after an irreversible/externally visible side effect.

Example Q10:

```text
Process credit card
      ↓
Deliver
```

If payment succeeds and delivery fails, the source provides no outcome.

Finding:

```text
SV-SFX-001 POST_SIDE_EFFECT_FAILURE_POLICY_MISSING
```

This blocks automation design until the business outcome/policy is known.

The eventual implementation of refund/reversal/reconciliation belongs later.

---

# 20. Executable-slice validation

For non-workflow source artifacts, T1-03 validates candidate slices rather than forcing one global workflow.

Example Q06:

```text
whole REFAI artifact
semanticVerdict: VALID_WITH_FINDINGS as architecture topology
executionReadiness: INSUFFICIENT_DETAIL as one workflow

DecisionRequest candidate
→ assess as EXECUTABLE_SLICE_CANDIDATE

ModelLifecycle candidate
→ assess separately
```

Example Q12:

```text
functional model
→ validate function/relationship semantics

runtime lifecycle
→ SV-SCP-001 EXECUTABLE_SCOPE_NOT_ESTABLISHED
```

---

# 21. Validation output contract

A user-facing validation summary must be derivable from the assessment without exposing internal schema noise.

Minimum summary:

```text
WHAT TALOS UNDERSTANDS
WHAT IS PROVEN / CONFIRMED
WHAT IS INFERRED BUT SAFE TO CONTINUE WITH
WHAT IS MISSING / AMBIGUOUS
WHAT BLOCKS AUTOMATION DESIGN
WHAT CAN BE DEFERRED TO LATER DESIGN
QUESTIONS TO ASK NEXT
CURRENT READINESS
```

This will later feed T3 human-readable draft/review surfaces.

---

# 22. Gate acceptance criteria

T1-03 may freeze only if TALOS can demonstrate across the first Mining Site batch that it can:

1. distinguish semantic validity from automation readiness;
2. validate non-workflow artifacts without falsely invalidating them;
3. scope findings to process/region/slice/relationship/object as needed;
4. detect unresolved branch semantics without repairing them;
5. detect missing or local-only completion semantics;
6. distinguish source limitation from canonical invalidity;
7. detect missing actor/data/rule/event/correlation semantics when material;
8. detect concurrency/join/failure-policy gaps without choosing Temporal implementation;
9. detect side-effect recovery business gaps without designing compensation;
10. preserve conflicts as blockers when relevant;
11. allow non-material uncertainty to remain non-blocking;
12. defer provider/retry/worker/deployment choices to later gates;
13. derive concise high-value clarification questions;
14. route answers through claims/confirmation/new ProcessRevision rather than in-place mutation;
15. produce a deterministic readiness verdict for a fixed revision + ruleset + intent;
16. explain every finding through provenance/evidence references.

---

# 23. Freeze boundary

This document is a **candidate** until pressure-tested against Q01–Q12.

Companion test:

```text
test/08-SEMANTIC-VALIDATION-PRESSURE-TEST-SPEC-v0.1.md
```

No BUILD is authorized by this contract.
