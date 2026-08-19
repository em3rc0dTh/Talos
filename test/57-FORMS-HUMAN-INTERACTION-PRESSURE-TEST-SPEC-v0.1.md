# TALOS — Forms / Human Interaction Pressure-Test Spec v0.1

Status: **T4-02 PRESSURE-TEST SPEC**  
Date: **2026-08-19**

Targets:

```text
design/28-FORMS-HUMAN-INTERACTION-CONTRACT-v0.1.md
arch/15-FORMS-HUMAN-INTERACTION-ARCHITECTURE-v0.1.md
```

BUILD remains closed.

## Gate rule

```text
36 / 36 PASS required
```

A fixture fails if T4-02 must conflate human business semantics with UI, identity/assignment providers, provider-specific forms, runtime mechanics, or process routing.

# U01–U36

```text
U01  human approval specializes T4-01 requirement without rewriting it
U02  human interaction can exist without a form
U03  one interaction may use multiple forms
U04  one reusable form revision may support multiple interaction occurrences
U05  reusable form fields must not own one process-context information requirement identity
U06  reusable form actions must not own one process-context HumanOutcome identity
U07  participant role ≠ concrete runtime user
U08  manager authority ≠ IAM implementation
U09  identity assurance ≠ identity provider
U10  anonymous participant may be allowed explicitly
U11  approval outcomes are business outcomes, not button labels
U12  Submit ≠ business completion automatically
U13  Save draft ≠ business completion
U14  required information item ≠ HTML/UI field type
U15  field order ≠ process order
U16  visibility rule ≠ process branch
U17  form data validation ≠ client-side implementation
U18  conditional requiredness remains interaction/form rule
U19  form outcome action ≠ canonical edge automatically
U20  form logical revision ≠ renderer revision
U21  presentation-only form change does not alter logical FormRevision
U22  logical form change creates new immutable revision
U23  form use mapping pins one exact FormRevision
U24  signature requirement ≠ signature provider
U25  attachment requirement ≠ upload widget/storage provider
U26  business deadline ≠ Temporal timer/task timeout
U27  escalation requirement ≠ scheduler/notification implementation
U28  delegation policy ≠ task-inbox feature
U29  multiple eligible approvers with EXACTLY_ONE assignment remains provider-agnostic
U30  N_OF_M human approval cardinality is representable
U31  privacy/sensitivity constraint ≠ storage/encryption provider
U32  runtime assignment does not become timeless semantic truth
U33  interaction may require evidence such as reason/comment without form dependency
U34  one form field may map to different process-context data requirements in different uses
U35  one form action intent may map to different semantic outcomes in different uses
U36  HumanInteractionDesignRevision history is immutable
```

## Critical fixtures

### U04–U06 — reusable form anti-coupling

Form:

```text
FormDefinition = Decision Reason
FormRevision F1
fields:
  reason
actions:
  submit
```

Interaction A:

```text
Manager rejects invoice
information requirement A.reason
outcome A.REJECTED
```

Interaction B:

```text
Auditor rejects exception
information requirement B.reason
outcome B.REJECTED_EXCEPTION
```

The same `FormRevision F1` may be reused by both.

Therefore the reusable form artifact must not contain authoritative direct references such as:

```text
FormFieldContract.informationItemRequirementRef = A.reason
FormOutcomeAction.candidateHumanOutcomeRef = A.REJECTED
```

because those are process-context identities from only one use.

Required architecture:

```text
reusable FormRevision owns form-local field/action identities

FormUseBinding for Interaction A
  maps A.reason → F1.reason
  maps F1.submit → A.REJECTED

FormUseBinding for Interaction B
  maps B.reason → F1.reason
  maps F1.submit → B.REJECTED_EXCEPTION
```

If process-context references remain authoritative inside reusable form-local children, U05/U06 fail.

### U11/U12

Renderer may show:

```text
[Approve] [Reject]
```

but button clicks are UI events. They must map explicitly to `FormOutcomeAction` / `HumanOutcome`; no label matching creates business outcome truth.

### U16

```text
if rejection selected, show reason field
```

may be a form interaction rule. It does not create a new canonical process branch merely because a conditional UI path exists.

### U26

```text
Manager must respond within 2 business days
```

is a business timing requirement. T4-02 must not decide Temporal timer, task timeout, retry, reminder scheduler or worker logic.

### U30

A business rule requiring 2 of 3 authorized reviewers must be expressible as participant/authority cardinality without choosing runtime assignment/orchestration mechanics.

### U34/U35

Form reuse must preserve process-context identity exclusively through use mappings, not by mutating the shared form revision for each use.

# Decision

Any failure requires versioned T4-02 contract/architecture evolution and full U01–U36 regression.
