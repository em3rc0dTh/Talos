# TALOS — IMAGE I5C-01 Generic Capability Design Result v0.1

Status: **PASS / I5C-01 CLOSED**  
Date: **2026-08-20**

## Purpose

Prove that an authority-backed frozen image-derived process can enter Phase-4 capability design through a source/process-agnostic implementation path without reusing the bounded approval/email reference designer and without manufacturing provider/runtime meaning.

## Tested head

```text
96ff70e476b5538e8df58394012aac90fd3abf34
```

PR:

```text
#10 — Image I5C: generic capability design after semantic freeze
```

## CI result

```text
Image vertical slice                 ✅ PASS
B7-B9 Temporal reference runtime     ✅ PASS
B10 Restart safety                   ✅ PASS
```

The image workflow now regresses I0 through I5B and runs the new I5C-01 gate.

## New generic implementation boundary

`designGenericCapabilities(...)` requires:

```text
exact frozen ProcessRevision
exact PROCESS_REVISION AssessmentScope
exact AUTOMATION_DESIGN_READINESS ValidationAssessment
READY_FOR_AUTOMATION_DESIGN
exact SemanticFreezeRecord
exact accepted ScopeFreezeRecord
explicit freeze authority
exact assessment pinned by scope freeze
```

It has no image/BPMN/Canvas source-type input and performs no source-type switch.

## Output boundary

I5C-01 creates only:

```text
CapabilityDesignRevision
CapabilityRequirement[]
CapabilityRequirementFacet[]
CapabilityRequirementProvenanceTrace[]
```

The persistence test proves zero creation of:

```text
CapabilityOfferingDefinition
CapabilityOfferingRevision
CapabilityMatchAssessment
CapabilitySelectionDecision
CapabilityBindingRevision
HumanInteractionDesignRevision
FormRevision
ExecutionPlanRevision
TemporalMappingRevision
RuntimePolicyRevision
DeploymentRevision
WorkflowExecutionObservation
```

## Generic semantic classification

The v0.1 implementation treats only frozen work semantics as capability-design subjects:

```text
ACTION
HUMAN_INTERACTION
```

It does not manufacture an external capability merely from:

```text
DECISION
WAIT
SUBPROCESS
STATE
END
EVENT
PARALLEL_SPLIT
JOIN
```

For `ACTION`:

```text
operationIntent = PERFORM_ACTION
```

This means only that frozen business work must be implemented somehow. It does not imply Activity, API, form, human task, email, n8n, AI, or provider choice.

Capability family is derived only from explicit accepted actor semantics:

```text
HUMAN_ROLE / HUMAN_PERSON → HUMAN_INTERACTION
SYSTEM                    → SYSTEM_OPERATION
AI                        → AI_TASK
otherwise                 → SOURCE_DEFINED / UNRESOLVED
```

No action-label lexical inference is used.

## Quarry-02 result

Quarry-02 contains accepted business actions, but the frozen semantic baseline does not yet establish the execution family for all of those actions.

Therefore the safe result is:

```text
CapabilityDesignRevision.designState
  = NEEDS_DESIGN_DECISION
```

and under-specified work produces unresolved capability requirements rather than a fake provider binding.

This is the intended boundary:

```text
BUSINESS WORK EXISTS
        ≠
WE KNOW HOW IT SHOULD EXECUTE
```

## Forbidden-leakage assertions

The gate asserts that the generic capability bundle does not contain reference-process/runtime assumptions including:

```text
COLLECT_APPROVAL
SEND_NOTIFICATION
REFERENCE_EMAIL_SINK
recipientEmail
Gmail
N8N_WORKFLOW
TEMPORAL_ACTIVITY
CHILD_WORKFLOW
```

## Provenance result

Every derived capability requirement trace pins:

```text
SemanticFreezeRecord
ScopeFreezeRecord
ProcessRevision
ValidationAssessment
semantic subject(s)
semantic claim(s)
derivation method
designer version
```

Substituted authority/scope/assessment inputs are rejected.

## Gate result

```text
exact frozen-input enforcement                PASS ✅
source/process-agnostic entry                  PASS ✅
work-preservation without provider invention   PASS ✅
reference approval/email leakage               NONE ✅
property-level capability facets               PASS ✅
exact backward provenance                      PASS ✅
no offering/binding side effects               PASS ✅
no ExecutionPlan/Temporal side effects         PASS ✅
reference B7-B9 runtime regression              PASS ✅
B10 restart regression                          PASS ✅
```

**I5C-01 is CLOSED.**

The next gate is `I5C-02 — generic ExecutionPlan opening review`. It must not interpret unresolved capability requirements as executable coordination and must not map generic `ACTION` directly to Temporal Workflow logic or Activity.