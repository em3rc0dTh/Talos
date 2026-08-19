# TALOS — T1-03 Semantic Validation Pressure Test Spec v0.1

Status: **TEST DESIGN / NOT YET EXECUTED**  
Date: **2026-08-19**

## Candidate under test

```text
design/03-SEMANTIC-VALIDATION-CONTRACT-v0.1.md
```

## Evidence base

Primary real-source fixtures:

```text
Q01–Q12 Mining Site Foundry Sources
```

Cross-cutting semantic fixtures:

```text
unresolved source conflict
non-material inference
later-gate technical deferral
clarification → new revision → revalidation
```

## Gate question

For a fixed ProcessRevision + provenance snapshot + validation intent, can TALOS determine what is coherent, what is incomplete, what materially blocks automation design, what can be deferred, and what high-value clarification should happen next—without inventing missing truth or collapsing non-workflow sources into workflows?

---

# V01 — Q01 Order Process: understandable flow, incomplete automation contract

## Evidence

Q01 has a clear business flow, decisions and terminal outcomes, while trigger mechanics, stable identity, actor execution type, decision evidence/data, invoice implementation and technical policies are unresolved.

## Expected assessment

Intent:

```text
AUTOMATION_DESIGN_READINESS
```

Expected:

```text
semanticVerdict: VALID_WITH_FINDINGS
executionReadiness: INSUFFICIENT_DETAIL
```

Required behavior:

- do not report the business graph as invalid;
- identify unresolved trigger/instance identity as automation-design blockers;
- identify decision evidence/data ownership gaps where material;
- actor type may remain unresolved without erasing source lane responsibility;
- Gmail/provider/retry/Task Queue questions must be deferred to later gates rather than semantic blockers.

Representative findings:

```text
SV-STR-001 UNRESOLVED_ENTRY_SEMANTICS
SV-COR-001 CORRELATION_IDENTITY_UNRESOLVED
SV-DAT-001 DECISION_EVIDENCE_UNRESOLVED
SV-ACT-002 RESPONSIBILITY_TYPE_UNRESOLVED
```

---

# V02 — Q02 Water Order: wait + collapsed subprocess + physical work

## Evidence

Q02 contains `Next Wednesday`, collapsed `Arrange Delivery`, physical `Deliver Water`, customer/company messaging and source-observed purchase-order states.

## Expected

```text
semanticVerdict: VALID_WITH_FINDINGS
executionReadiness: INSUFFICIENT_DETAIL
```

Required findings include:

```text
SV-EVT-002 WAIT_TIME_EXPRESSION_INCOMPLETE
SV-SUB-001 SUBPROCESS_INTERNAL_SEMANTICS_MISSING
SV-HUM-001 HUMAN_COMPLETION_OBSERVATION_UNRESOLVED
SV-COR-001 CORRELATION_IDENTITY_UNRESOLVED
```

The validator must not ask for Temporal Timer APIs, task queues or provider credentials.

---

# V03 — Q03 Procurement: boundary-event meaning changes control flow

## Evidence

Q03 has `Undeliverable` and `Late Delivery` attached to Procurement, but their exact source class/interruption behavior is unresolved.

## Expected

```text
semanticVerdict: INCOMPLETE
executionReadiness: NEEDS_CONFIRMATION
```

Required behavior:

- detect that interrupting vs non-interrupting semantics materially change the graph;
- preserve `Undeliverable`/`Late Delivery` as business conditions, not technical failures;
- do not invent timeout/retry mappings.

Representative findings:

```text
SV-CFL-003 EVENT_SUBTYPE_AFFECTS_FLOW
SV-SUB-002 SUBPROCESS_BOUNDARY_MEANING_UNRESOLVED
```

High-value question candidate:

> When `Late Delivery` occurs during Procurement, does Procurement continue, stop, or complete in another state?

---

# V04 — Q04 Candidate Application: unresolved identity branch

## Evidence

The `Is anonymous` gateway is visible but the exact branch conditions are unresolved. Review/rejection convergence is clear. SMS channel is explicit; provider is not. CV future-use intent is visible; consent/policy is not established.

## Expected

```text
semanticVerdict: INCOMPLETE
executionReadiness: NEEDS_CONFIRMATION
```

Required behavior:

- branch semantics must block automation design until confirmed;
- SMS provider must be deferred to capability binding;
- retention/consent operational policy is a business/policy question if TALOS intends to automate retention;
- rejection remains a business outcome.

Representative findings:

```text
SV-CFL-001 BRANCH_CONDITION_UNRESOLVED
SV-RUL-001 BUSINESS_RULE_TERM_UNRESOLVED
```

---

# V05 — Q05 Ward/Pharmacy: local end ≠ collaboration completion

## Evidence

Q05 has cross-participant messages, missing correlation, duplicate labels, and a Pharmacy out-of-stock branch ending at `Purchase order placed` without showing how the original Ward demand resumes.

## Expected

```text
semanticVerdict: INCOMPLETE
executionReadiness: INSUFFICIENT_DETAIL
```

Required findings:

```text
SV-COR-001 CORRELATION_IDENTITY_UNRESOLVED
SV-COR-002 MESSAGE_PAYLOAD_MEANING_UNRESOLVED
SV-CMP-003 LOCAL_END_NOT_GLOBAL_COMPLETION
SV-STR-003 MISSING_REQUIRED_CONTINUATION
```

The validator must not invent supplier procurement/re-entry.

---

# V06 — Q06 REFAI: valid architecture, not one workflow

## Assessment A — business/source understanding

Intent:

```text
BUSINESS_MODEL_UNDERSTANDING
scope: ARCHITECTURE_TOPOLOGY
```

Expected:

```text
semanticVerdict: VALID_WITH_FINDINGS
executionReadiness: NOT_ASSESSED or INSUFFICIENT_DETAIL
```

## Assessment B — whole-artifact automation readiness

Intent:

```text
AUTOMATION_DESIGN_READINESS
scope: entire source artifact as one executable process
```

Expected:

```text
semanticVerdict: NOT_APPLICABLE or VALID_WITH_FINDINGS for architecture meaning
executionReadiness: INSUFFICIENT_DETAIL
```

Required finding:

```text
SV-SCP-002 ARTIFACT_NOT_ONE_EXECUTABLE_PROCESS
```

Candidate DecisionRequest and ModelLifecycle slices must be assessable independently with:

```text
SV-SCP-001 EXECUTABLE_SCOPE_NOT_ESTABLISHED
```

where boundaries remain unresolved.

Failure condition:

FAIL if the validator declares Q06 structurally invalid merely because it is architecture rather than one workflow.

---

# V07 — Q07 Order Validation: strong concurrency, missing success/recovery semantics

## Evidence

Q07 strongly supports an accepted-order parallel split and all-visible-branches join. Rejection has explicit completion; success does not. Payment and fulfillment failure/cancellation interaction is unspecified.

## Expected

```text
semanticVerdict: VALID_WITH_FINDINGS
executionReadiness: INSUFFICIENT_DETAIL
```

Required findings:

```text
SV-CMP-001 SUCCESS_COMPLETION_UNPROVEN
SV-CON-003 PARALLEL_FAILURE_SEMANTICS_UNRESOLVED
SV-SFX-002 COMPENSATION_BUSINESS_POLICY_UNRESOLVED
```

The validator must not weaken the source-supported ALL join merely because failure behavior is unknown.

---

# V08 — Q08 Multi-Department Service: graph uncertainty is a source limitation

## Evidence

Q08 has strong local regions and parallel structures but partially ambiguous long connectors, unresolved event subtypes, unresolved second decision guards and uncertain supplier boundary status.

## Expected

```text
semanticVerdict: INCOMPLETE
executionReadiness: INSUFFICIENT_DETAIL
```

Required findings:

```text
SV-STR-002 UNRESOLVED_EDGE_ENDPOINT
SV-STR-004 SOURCE_REGION_TOPOLOGY_PARTIAL
SV-CFL-001 BRANCH_CONDITION_UNRESOLVED
SV-COR-003 PARTICIPANT_BOUNDARY_UNRESOLVED
```

Critical classification:

```text
SOURCE LIMITATION
```

not:

```text
CANONICAL INVALIDITY caused by invented edges
```

---

# V09 — Q09 Proposal Preparation: business loop and object identity

## Evidence

Q09 has an explicit business re-entry loop, a three-way parallel region, repeated Proposal object occurrences and explicit Activity Final termination, but runtime/object identity and several business meanings remain unresolved.

## Expected

```text
semanticVerdict: VALID_WITH_FINDINGS
executionReadiness: NEEDS_CONFIRMATION
```

Representative findings:

```text
SV-DAT-002 BUSINESS_OBJECT_IDENTITY_UNRESOLVED
SV-LOP-001 LOOP_EXIT_OR_LIMIT_UNRESOLVED
SV-CFL-004 BUSINESS_OUTCOME_UNRESOLVED
```

The validator must not map the loop to retry/Continue-As-New and must not collapse the two Proposal occurrences.

---

# V10 — Q10 Collaborative Order: side-effect recovery is a business blocker

## Evidence

Q10 separates credit-card checking from processing, then delivery. Entry semantics and both success/cancellation completion are unproven. Post-payment delivery failure/refund policy is absent.

## Expected

```text
semanticVerdict: INCOMPLETE
executionReadiness: INSUFFICIENT_DETAIL
```

Required findings:

```text
SV-STR-001 UNRESOLVED_ENTRY_SEMANTICS
SV-CMP-001 SUCCESS_COMPLETION_UNPROVEN
SV-CMP-002 CANCELLATION_COMPLETION_UNPROVEN
SV-SFX-001 POST_SIDE_EFFECT_FAILURE_POLICY_MISSING
SV-SFX-002 COMPENSATION_BUSINESS_POLICY_UNRESOLVED
```

Important boundary:

```text
business outcome if paid-but-not-delivered   REQUIRED NOW
exact refund implementation                  DEFER TO T4/T5
```

---

# V11 — Q11 Hand-Drawn Website Delivery: understandable source, ambiguous branch meaning

## Evidence

Q11 preserves two `No` branches to terminal-like markers because that is what is drawn, despite domain intuition that work might continue. Actors are not provided and terminal-marker subtype is unresolved.

## Expected

```text
semanticVerdict: INCOMPLETE
executionReadiness: NEEDS_CONFIRMATION
```

Required findings:

```text
SV-CFL-002 BRANCH_TARGET_UNRESOLVED or source-defined branch-meaning finding
SV-CFL-004 BUSINESS_OUTCOME_UNRESOLVED
SV-ACT-001 ACTOR_OR_OWNER_MISSING
SV-SRC-001 MATERIAL_INFERRED_MEANING_NEEDS_CONFIRMATION
```

Minimum question behavior:

Do not ask four low-level shape questions first.

Ask high-value root questions such as:

> When there is no previous website, what should the process do next?

and:

> When the client has no new ideas, should the project stop or continue with the existing baseline?

`Brainst → brainstorm` is non-blocking unless the lifecycle is decomposed using that interpretation.

---

# V12 — Q12 Functional Canvas: functional validity ≠ runtime readiness

## Assessment A — functional model understanding

Expected:

```text
semanticVerdict: VALID_WITH_FINDINGS
```

ICOM-like role interpretation remains inference but is strongly supported by repeated geometry/pattern.

## Assessment B — automation readiness

Expected:

```text
executionReadiness: INSUFFICIENT_DETAIL
```

Required findings:

```text
SV-SCP-001 EXECUTABLE_SCOPE_NOT_ESTABLISHED
SV-SCP-003 FUNCTIONAL_DEPENDENCY_NOT_RUNTIME_SEQUENCE
SV-SCP-004 DECOMPOSITION_NOT_RUNTIME_BOUNDARY
SV-SRC-002 NOTATION_INTERPRETATION_UNRESOLVED
```

No generic missing-start/end error should be emitted against the functional-model scope merely because it is not a flowchart/BPMN process.

---

# V13 — Material unresolved source conflict

## Scenario

Two authoritative-enough sources disagree on a business rule required for an executable slice, and the ConflictRecord is `UNRESOLVED`.

## Expected

```text
semanticVerdict: CONFLICTED
executionReadiness: BLOCKED_BY_CONFLICT
finding: SV-CNF-001 UNRESOLVED_SOURCE_CONFLICT
```

Resolution must create provenance/confirmation and a new ProcessRevision before revalidation.

---

# V14 — Non-material inference must not block everything

## Scenario

A handwritten token is confidently read literally as `Brainst`, and TALOS infers it means `brainstorm`, but the current process keeps the entire design lifecycle as one composite stage.

## Expected

```text
finding severity: INFO/WARNING
blockerClass: NONE
executionReadiness: unaffected by this claim alone
```

Failure condition:

FAIL if every `INFERRED` claim automatically creates `NEEDS_CONFIRMATION`.

---

# V15 — Technical design deferral

## Scenario

Business meaning is clear:

```text
Send acceptance notification via SMS
```

but provider, credentials, retry settings and Task Queue are unknown.

## Expected

```text
semantic finding: none material
provider → CAPABILITY_BINDING / T4
retry / task queue → TEMPORAL_EXECUTION_DESIGN / T5
```

Failure condition:

FAIL if T1-03 prevents `READY_FOR_AUTOMATION_DESIGN` solely because later technical design choices remain unresolved.

---

# V16 — Clarification must produce a new revision

## Scenario

A material branch interpretation is inferred, the user confirms a different meaning, and the current accepted ProcessRevision must change.

## Expected lineage

```text
ValidationAssessment A
  ↓ finding
ClarificationQuestion
  ↓ answer
SemanticClaim / ConfirmationRecord
  ↓
ProcessRevision N+1
  ↓
ValidationAssessment B
```

Failure condition:

FAIL if validation mutates ProcessRevision N or marks the old finding resolved in-place while changing accepted semantics.

---

# Gate invariants

```text
source is useful but incomplete
→ do not call it invalid automatically

artifact is not a workflow
→ do not fabricate workflow validation errors

finding exists
→ explain scope + evidence + impact

unknown provider
→ usually later design

unknown branch meaning
→ semantic/readiness blocker when material

business side effect has missing recovery outcome
→ automation-design blocker

technical compensation implementation unknown
→ later execution design

inference exists
→ confirmation only if materially depended upon

clarification changes meaning
→ new immutable ProcessRevision
```

---

# Evidence required to close T1-03

Create an executed result artifact recording:

```text
PASS / FAIL per fixture
actual verdict
actual readiness
findings emitted
findings intentionally not emitted
clarification/defer behavior
schema/ruleset changes required
```

Target:

```text
test/09-SEMANTIC-VALIDATION-PRESSURE-TEST-RESULT-v0.1.md
```

No freeze before execution.
