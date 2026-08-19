# TALOS — Forms / Human Interaction Pressure-Test Result v0.1

Status: **PRESSURE TEST EXECUTED — T4-02 NOT FROZEN**  
Date: **2026-08-19**

Targets:

```text
design/28-FORMS-HUMAN-INTERACTION-CONTRACT-v0.1.md
arch/15-FORMS-HUMAN-INTERACTION-ARCHITECTURE-v0.1.md
```

Result:

```text
TOTAL       36
PASS        34
FAIL         2
PASS RATE 94.44%

T4-02 GATE  FAIL
BUILD       CLOSED
```

## Failures

```text
U05 FAIL  reusable form field owns one process-context information requirement identity
U06 FAIL  reusable form action owns one process-context HumanOutcome identity
```

All other fixtures pass.

## Root cause

v0.1 allows reusable form-local structures to contain process-context references:

```text
FormFieldContract
- informationItemRequirementRef?

FormOutcomeAction
- candidateHumanOutcomeRef?
```

But one `FormRevision` may be reused by many `HumanInteractionDesignRevision` occurrences.

Example:

```text
shared FormRevision F1
field = reason
action = submit
```

Use A:

```text
Invoice rejection
A.reason
A.REJECTED
```

Use B:

```text
Exception rejection
B.reason
B.REJECTED_EXCEPTION
```

A reusable form cannot make A's process-context identities authoritative inside F1 and still be cleanly reusable by B.

## Required evolution

Make form-local identity independent:

```text
FormFieldContract
- form-local field identity / logical schema only

FormOutcomeAction
- form-local action intent only
```

Then make use mappings explicit:

```text
FormUseBinding
  ├── FormInformationItemMapping
  │     interaction information item ↔ form field
  └── FormOutcomeMapping
        form action intent ↔ interaction HumanOutcome
```

The same reusable form revision can then support many process occurrences without mutation or provenance leakage.

## Decision

```text
T4-02 v0.1      NOT FROZEN
EVOLVE          v0.2
BUILD           CLOSED
```
