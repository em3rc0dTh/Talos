# TALOS — R1-02 One-App Product Intake Design v0.1

Status: **ACTIVE / EVIDENCE GATED**  
Date: **2026-08-25**  
Target: **R1-02 — real arbitrary-input image path in One-App**

## Decision

The fixture-only reference page remains a regression surface. It is not the Talos 1.0 product entrypoint.

R1-02 introduces a product-facing browser shell over the existing One-App backend:

```text
browser product shell
        ↓
One-App /api/status
One-App /api/input/image
        ↓
exact source intake
        ↓
configured perception runtime, when available
        ↓
response correlation + admission
        ↓
inferred Canonical/BPMN review candidate
        ↓
human review required
```

The shell MUST NOT implement an alternate semantic engine, confirmation path, automation authority path, deployment path, or workflow execution path.

## Truth boundary

```text
SOURCE PRESERVED
!=
VISION CONFIGURED
!=
PERCEPTION SUCCEEDED
!=
EVIDENCE ADMITTED
!=
BUSINESS PROCESS CONFIRMED
!=
AUTOMATION AUTHORIZED
!=
EXECUTION AUTHORIZED
```

### Unconfigured perception

The image endpoint still accepts and preserves exact PNG source bytes even when the live perception provider is not configured.

Expected state:

```text
image.exactSourceIntake          true
image.liveVisionInterpretation   false
interpretation.status            NOT_CONFIGURED
business meaning created         false
automation authorized            false
execution authorized             false
```

`inputRoutes` advertises `IMAGE_PNG` as an interpreted One-App route only when the live provider is configured. This does not remove the exact-source preservation boundary.

### Configured perception

A configured provider descriptor is safe metadata only. Bearer material stays closure-held and MUST NOT appear in status, product HTML, persisted safe descriptors, or returned process evidence.

A positive image run is acceptable only when:

```text
exact image source preserved
→ provider response exactly correlated
→ perception admitted for review
→ BPMN_READY_FOR_PROCESS_REVIEW
→ BPMN revision remains DRAFT
→ Canonical semantic claims remain INFERRED
→ validation is NEEDS_CONFIRMATION
→ automaticConfirmationAuthorized = false
→ automaticFreezeAuthorized = false
→ automaticExecutionAuthorized = false
```

## Product shell responsibility

The R1 product shell may:

- render runtime/provider availability;
- preview the locally selected PNG;
- submit exact PNG data to One-App;
- show source identity and status;
- show admitted inferred process nodes/findings;
- explain the next required authority.

It may not:

- manufacture perception evidence;
- substitute a fixture result;
- silently confirm an inferred process;
- freeze semantics;
- select capabilities;
- approve an ExecutionPlan;
- authorize deployment or execution.

## Fail-closed behavior

For any of these cases:

- provider not configured;
- provider outage/auth/model failure;
- response-correlation failure;
- insufficient evidence;
- admission rejection;

Talos preserves whatever source evidence is valid and stops before business meaning/authority that has not been earned.

## R1-02 certification cases

```text
A. product page points to One-App, not fixture perception
B. unconfigured vision: exact PNG preserved, no interpretation invented
C. configured status: provider/model metadata visible, bearer secret absent
D. configured correlated model response: product shell reaches
   BPMN_READY_FOR_PROCESS_REVIEW with INFERRED claims only
E. complete R1/image/B7-B10 regression remains green
```

Only after A–E are green may R1-02 close.

## Next gate

R1-03 must add the real end-user review/correction experience over the same One-App state, not by switching to a second independent workspace backend.
