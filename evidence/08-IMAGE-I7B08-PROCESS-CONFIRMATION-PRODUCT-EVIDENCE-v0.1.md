# TALOS — I7B-08 Process Confirmation Product Evidence v0.1

Status: **PASS — I7B-08 PRODUCT SURFACE CLOSED ON EXACT CODE HEAD**  
Date: **2026-08-20**

## Exact proven code head

```text
d3424db713678afd0a500f39e3de067d9086abc8
```

The documentation commits after this head do not change the implementation under test.

## Exact CI evidence

```text
Image vertical slice              run 241  ✅
B7-B9 Temporal reference runtime  run 254  ✅
B10 Restart safety                run 159  ✅
```

Image run 241 passed the complete sequence through:

```text
I0 → I1 → I2 → I3 → I4
→ I5A → I5B → I5C
→ I6 → I7A → I7B-01 → I7B-02 → I7B-03 → I7B-04
→ I7B-05 → I7B-06 → I7B-07 → I7B-08
```

Critically, the historical **I7B-05 workspace contract passed unchanged** before the I7B-08 gate. I7B-08 therefore extends Talos rather than rewriting the earlier proof.

# What I7B-08 proves

## 1. One user-facing Process Confirmation surface exists

The product page is:

```text
apps/reference-api/src/process-confirmation-page.ts
```

It presents the intended trust relationship:

```text
ORIGINAL SOURCE
      ↕
BPMN — WHAT TALOS UNDERSTANDS
      ↕
BPMN XML + SEMANTIC VALIDATION
      ↕
USER AUTHORITY
```

The surface begins blank and requires explicit user input. No Quarry fixture is preloaded or represented as user input.

## 2. Native BPMN has a real product path

```text
native .bpmn
   ↓
exact BPMN import
   ↓
BPMN parse / validation
   ↓
deterministic BPMN semantic source view
   ↓
Talos Canonical ProcessRevision
   ↓
semantic validation
   ↓
aligned BPMN revision
   ↓
Process Confirmation
```

The native source is not reconstructed through image perception.

The canonical adapter is:

```text
packages/application/src/bpmn-canonical-import.ts
```

Raw BPMN parsing remains owned by the `review` layer through:

```text
packages/review/src/bpmn-canonical-source-view.ts
```

This was enforced by the architecture guard. An early implementation attempted to import `bpmn-moddle` directly from `application`; CI rejected that boundary. The implementation was moved behind the existing `review` boundary rather than weakening architecture policy.

## 3. Unsupported BPMN meaning is not guessed

The native-BPMN adapter maps only semantics it can establish deterministically.

Examples currently mapped include:

```text
StartEvent               → EVENT
EndEvent                 → END
Task / ServiceTask ...   → ACTION
UserTask                 → HUMAN_INTERACTION
ExclusiveGateway         → DECISION
ParallelGateway          → PARALLEL_SPLIT / JOIN when direction is provable
SubProcess / CallActivity→ SUBPROCESS
SequenceFlow             → SEQUENCE / CONDITIONAL / DEFAULT / PARALLEL
```

Unsupported or structurally ambiguous BPMN meaning returns explicit reconciliation diagnostics and does not produce a canonical ProcessRevision by coercion.

## 4. I7B-08 exposed and closed a semantic-readiness defect

The semantic validator already emitted:

```text
SV-CFL-001 — conditional branch has no structured business rule
```

but that code was missing from the automation-readiness blocker set. An exclusive gateway with unguarded branches could therefore incorrectly reach `READY_FOR_AUTOMATION_DESIGN`.

I7B-08 corrected the readiness rule:

```text
CONDITIONAL edge
+ no exact conditionRuleRef
→ SV-CFL-001
→ INSUFFICIENT_DETAIL
→ automation-design freeze blocked
```

The test was not weakened to accept the false-ready state.

## 5. Process Confirmation and automation readiness are independent gates

I7B-08 explicitly proves both paths.

### Semantically ready process

```text
BPMN DRAFT
→ canonical reconciliation
→ READY_FOR_AUTOMATION_DESIGN
→ Confirm Process
→ exact BusinessProcessConfirmationRecord
→ separate Approve for Automation Design authority
→ I7B-07 exact freeze handoff
→ SemanticFreezeRecord
```

### Confirmed but semantically incomplete process

```text
BPMN DRAFT
→ canonical reconciliation
→ INSUFFICIENT_DETAIL
→ user may still confirm “this is my process”
→ separate automation-design approval
→ REJECTED_VALIDATION_GATE
→ no SemanticFreezeRecord
```

This distinction is intentional:

```text
Process Confirmation
  = “Talos represents my business process correctly.”

Automation Design Approval
  = “Pass this exact confirmed process through the semantic freeze gate.”

Neither one
  = deployment approval.
```

## 6. Confirmation authority does not become freeze authority

The browser/API path supplies two independent authority references:

```text
business-process confirmation authority
≠
automation-design / semantic-freeze authority
```

The positive integration test verifies the resulting `SemanticFreezeRecord.authorityRef` is not the confirmation authority.

## 7. Graph/XML and correction contracts are connected without silent mutation

The product page connects the existing I7B-04/I7B-05 synchronized BPMN workspace and I7B-06 proposal-only correction engine.

Natural-language flow:

```text
instruction
→ untrusted provider proposal
→ validated BPMN proposal
→ visible diff
→ ACCEPT / REJECT
→ accepted proposal becomes a new BPMN revision
→ canonical reconciliation + semantic revalidation
```

The server adapts the internal I7B-06 contract (`PROPOSED_FOR_REVIEW`, `unifiedPreview`) to the browser presentation without changing the underlying authority rules.

If no correction provider is configured, the product returns an explicit safe stop:

```text
BPMN_CORRECTION_PROVIDER_NOT_CONFIGURED
```

No local fake proposal is substituted.

## 8. Confirmed BPMN is locked in the product surface

After `Confirm Process` succeeds for an exact BPMN revision, the current UI:

```text
disables graph editing
makes BPMN XML read-only
disables graphical/XML save actions
disables natural-language correction on that confirmed revision
```

A later semantic change must become a new revision rather than silently mutating the confirmed contract.

## 9. I7B-05 remains an immutable historical contract

A regression initially occurred when the new product orchestration was placed directly into the old workspace behavior.

The fix did not modify the old tests. Instead Talos now exposes two explicit entrypoints:

```text
startProcessConfirmationWorkspace()
    → historical I7B-05 behavior

startTalosProcessConfirmationProduct()
    → I7B-08 integrated product behavior
```

Running `workspace-server.ts` directly launches the I7B-08 product entrypoint, while old programmatic callers keep the frozen I7B-05 contract by default.

This preserves the project rule:

> New lifecycle slices extend prior truth; they do not rewrite previous evidence to make new work pass.

# Product surface proven by I7B-08

```text
USER INPUT
   │
   ├── PNG IMAGE
   │     ↓
   │  EXACT SOURCE PRESERVED
   │     ↓
   │  INTERPRETATION_PENDING
   │
   └── NATIVE BPMN
         ↓
      PARSE / RENDER / XML
         ↓
      CANONICAL RECONCILIATION
         ↓
      SEMANTIC VALIDATION
         ↓
      GRAPH / XML REVIEW
         ↓
      OPTIONAL NL PROPOSAL + DIFF
         ↓
      CONFIRM PROCESS
         ↓
      OPTIONAL AUTOMATION-DESIGN FREEZE GATE
```

# What I7B-08 does NOT prove

I7B-08 does **not** claim:

```text
arbitrary image vision interpretation       ❌
image → real BPMN candidate for any image   ❌
automatic confirmation                      ❌
automatic semantic freeze                   ❌
automatic capability binding                ❌
deployment approval                         ❌
automatic execution                         ❌
full product-state rehydration after reload ❌
headless end-user click-through UI proof    ❌
```

The server/API and browser surface contract are tested, and the page uses the real `bpmn-js` modeler assets. CI does not currently drive the page through a headless browser as a human would.

The current integrated product server also retains active canonical/review bindings in process memory for the open browser session. Persistence of underlying documents remains append-only, but I7B-08 does not yet claim complete browser-session restoration after server restart or page reload.

# Image-path boundary remains honest

For an uploaded image today:

```text
PNG
→ exact bytes + SHA-256 + dimensions preserved
→ SOURCE_PRESERVED_INTERPRETATION_PENDING
→ no BPMN candidate fabricated
```

That boundary is intentional until **I7C — real arbitrary-image vision provider** is proven.

# Closure verdict

```text
I7B-08 Full Process Confirmation product surface     ✅ CLOSED
native BPMN → confirmed business-process contract    ✅ PROVEN
confirmed BPMN → exact semantic freeze gate          ✅ PROVEN
semantic blockers visible / freeze prevented         ✅ PROVEN
legacy I7B-05 contract preserved                     ✅ PROVEN
arbitrary image → real process interpretation        ⛔ I7C
```
