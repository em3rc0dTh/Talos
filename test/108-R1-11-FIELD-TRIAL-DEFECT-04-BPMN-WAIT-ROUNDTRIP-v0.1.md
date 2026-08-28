# R1-11 Field Trial Defect 04 — BPMN WAIT round-trip gap v0.1

Status: **FIX CANDIDATE — USER EXECUTION REQUIRED**

## Field witness

Exact candidate before fix:

```text
Git SHA: d08ed5c6253d3b1cbd24931b5ea2c62735b82ba4
Source SHA-256: b84a2abd02aed0632275864e5fb987832620ac9cfa69fd22be178d11e16da8ce
Source route: IMAGE_INTERPRETATION
Primary provider: TALOS_GEMINI_PRIMARY / gemini-3.6-flash
Perception result: BPMN_READY_FOR_PROCESS_REVIEW
Perception admission: ADMITTED_FOR_REVIEW
```

The user supplied explicit branch meanings for a decision. Talos successfully prepared the BPMN correction with the two conditions, but `Save correction` failed during structured BPMN → Canonical reconciliation.

Observed diagnostic:

```text
UNSUPPORTED_BPMN_ELEMENT
BPMN element bpmn:IntermediateCatchEvent is preserved but is not yet mapped by talos-structured-bpmn-canonical-adapter-v0.1.
```

The offending BPMN element represented the already-existing Canonical `WAIT` node (`Dejar actuar 5 minutos`). This was not a perception failure and not a branch-condition matching failure.

## Root cause

The BPMN projector emitted both:

- non-start Canonical `EVENT` → `bpmn:IntermediateCatchEvent`
- Canonical `WAIT` → `bpmn:IntermediateCatchEvent`

but the structured BPMN Canonical adapter had no import rule for `bpmn:IntermediateCatchEvent`.

Blindly mapping every intermediate catch event to `WAIT` would have manufactured semantics because non-start Canonical events use the same BPMN element type.

## Generic correction

Talos now uses standard BPMN event-definition evidence to preserve the distinction:

```text
Canonical WAIT
  → bpmn:IntermediateCatchEvent
     + bpmn:TimerEventDefinition
  → structured BPMN source view eventDefinitionTypes
  → Canonical WAIT

Canonical non-start EVENT
  → bpmn:IntermediateCatchEvent
     without timer definition
  → Canonical EVENT
```

The timer event definition expresses the event category only. Talos still does **not** invent an executable duration/time expression during business-process review. Runtime timing remains an automation-design concern.

## Code correction

- `packages/review/src/bpmn-projector.ts`
  - projected WAIT now carries standard `bpmn:timerEventDefinition` evidence;
  - diagnostic wording explicitly states that no executable timing expression is materialized.
- `packages/review/src/bpmn-canonical-source-view.ts`
  - source view now preserves `eventDefinitionTypes` for every BPMN flow node.
- `packages/application/src/bpmn-canonical-import.ts`
  - timer `IntermediateCatchEvent` → Canonical `WAIT`;
  - plain/non-timer `IntermediateCatchEvent` → Canonical `EVENT`.
- `tests/r1-11-bpmn-wait-roundtrip.test.ts`
  - proves projector distinction;
  - proves branch-condition correction no longer blocks on a WAIT;
  - proves WAIT and non-start EVENT remain distinct after reconciliation.

## Anti-overfit statement

The fix contains no car-wash task names, no actor names, no branch-label special case and no source-image hash special case.

It is based only on Canonical node semantics and standard BPMN event-definition structure.

## Required closure evidence

Run on the exact new branch head:

```powershell
node --experimental-strip-types --test `
  .\tests\r1-11-bpmn-wait-roundtrip.test.ts `
  .\tests\r1-11-branch-condition-resolution.test.ts `
  .\tests\r1-11-branch-condition-input-resolution.test.ts
```

Then repeat the same real image field journey:

```text
image → review → enter branch meanings → Apply branch conditions → Save correction
```

Expected closure witness:

```text
Save correction succeeds
new immutable BPMN review revision exists
WAIT remains WAIT
branch rules are present
business confirmation becomes available
no automatic confirmation/freeze/automation/deployment/execution authority
```

Do not close this defect from static code inspection alone.
