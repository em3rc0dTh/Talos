# TALOS — I7B-02 BPMN PROCESS CONFIRMATION CONTRACT EVIDENCE v0.1

Status: **PASS — I7B-02 CLOSED**  
Date: **2026-08-20**

## Scope

I7B-02 establishes the executable business-truth gate that must sit between Talos process understanding and downstream automation design.

```text
SOURCE / INTERPRETATION
        ↓
BPMN REVISION
        ↓
USER PROCESS CONFIRMATION
        ↓
AUTOMATION-DESIGN HANDOFF ELIGIBILITY
```

This slice does not yet claim BPMN projection, browser modeling, native BPMN round-trip, or real arbitrary-image vision interpretation.

## Implementation

Primary implementation:

```text
build/reference-vertical-slice/packages/review/src/bpmn-confirmation.ts
```

Export surface:

```text
build/reference-vertical-slice/packages/review/src/index.ts
```

Test gate:

```text
build/reference-vertical-slice/tests/image-i7b02-bpmn-confirmation.test.ts
```

Design contract:

```text
design/04-BPMN-PROCESS-CONFIRMATION-CONTRACT-v0.1.md
```

## Earned contracts

### Immutable BPMN revision

`BpmnProcessRevision` pins:

```text
revision number
parent revision when present
source route
edit mode
source artifact / representation references
exact canonical ProcessRevision
exact BPMN XML
BPMN XML SHA-256
semantic digest
BPMN-DI / diagram digest
creator / timestamp
```

### Visual versus semantic change

Talos can distinguish:

```text
NO_CHANGE
VISUAL_ONLY
SEMANTIC
```

A BPMN-DI/layout-only modification does not falsely declare new business meaning.

### Natural-language correction safety

`NaturalLanguageBpmnCorrectionProposal` is proposal-only:

```text
automaticApplyAuthorized = false
```

Accepting a natural-language correction requires explicit authority. The correction agent may propose a new BPMN revision, but may not silently replace the current process.

### Explicit process confirmation

`BusinessProcessConfirmationRecord` pins:

```text
exact BpmnProcessRevision
exact BPMN XML SHA-256
exact BPMN semantic digest
exact canonical ProcessRevision
authorityRef
confirmedBy
confirmedAt
```

### Automation handoff precondition

`evaluateAutomationHandoffConfirmation(...)` refuses handoff when:

```text
confirmation is missing
confirmation was revoked
confirmation lacks authority
current BPMN revision is not confirmed
confirmation is stale for another BPMN revision
XML digest differs
semantic digest differs
canonical ProcessRevision differs
```

Only an exact, current, authority-backed confirmation returns:

```text
AUTHORIZED
```

This evaluation does not itself create SemanticFreezeRecord, capability design, execution design, Temporal mapping, deployment, or execution.

## Test proof

I7B-02 proves:

```text
1. explicit BPMN review revision pins source + canonical meaning       ✅
2. BPMN-DI-only changes classify VISUAL_ONLY                          ✅
3. business meaning changes classify SEMANTIC                         ✅
4. natural-language correction remains proposal-only                  ✅
5. accepting NL correction requires authority                         ✅
6. automation handoff is blocked before process confirmation          ✅
7. exact confirmed BPMN revision authorizes handoff evaluation        ✅
8. later unconfirmed BPMN revision invalidates prior handoff           ✅
9. revocation removes handoff authority                               ✅
```

## CI evidence

Implementation exact head:

```text
ddc81a9831d8caa1033c06e3b2c07e7ca93f63e2
```

GitHub Actions:

```text
Image vertical slice
run 169
conclusion: SUCCESS

B7-B9 Temporal reference runtime
run 194
conclusion: SUCCESS
```

The Image vertical slice passed every regression gate through I7B-01 and the new I7B-02 gate.

No exact-head B10 restart workflow run was observed for this path-filtered change, so this evidence does not claim a new B10 run.

## Failure found and corrected during gate

The first I7B-02 CI attempt correctly failed because deterministic identity construction included an absent optional `parentBpmnRevisionId` as JavaScript `undefined`. Talos deterministic JSON rejects `undefined`.

The implementation was corrected by omitting the optional key entirely when no parent exists. The deterministic serializer contract was **not** relaxed.

```text
undefined accepted into deterministic identity   ❌
optional absent field omitted                    ✅
```

The corrected exact head then passed the full Image vertical slice and B7-B9 runtime regression.

## Product truth earned

Talos can now state at the contract level:

> A plausible process interpretation is not enough. An authority must explicitly confirm the exact BPMN revision representing the exact canonical business process before the BPMN workspace may hand off into automation design.

Frozen distinction:

```text
AI UNDERSTOOD IT       ≠ USER CONFIRMED IT
USER CONFIRMED PROCESS ≠ DEPLOYMENT APPROVAL
```

## Next gate

```text
I7B-03 — CANONICAL / IMAGE / CANVAS → BPMN PROJECTION
```

The next slice must make the review representation concrete by deterministically projecting Talos canonical process meaning into a BPMN candidate while retaining complete source provenance.
