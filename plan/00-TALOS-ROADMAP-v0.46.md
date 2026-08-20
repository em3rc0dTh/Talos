# TALOS — Gated Roadmap v0.46

Status: **ACTIVE PLAN — I7B-05 CLOSED / I7B-06 NATURAL-LANGUAGE CORRECTION CLOSURE**  
Date: **2026-08-20**  
Supersedes `00-TALOS-ROADMAP-v0.45.md` for active planning. Historical versions remain preserved.

## Closed through I7B-05

```text
I0–I6   canonical / validation / automation / real Temporal runtime  ✅ CLOSED
I7A     arbitrary-image admission boundary                           ✅ CLOSED
I7B-01  async image provider transport                               ✅ CLOSED
I7B-02  BPMN process-confirmation contract                           ✅ CLOSED
I7B-03  canonical → BPMN review projection                           ✅ CLOSED
I7B-04  BPMN XML ↔ BPMN-DI round trip                                ✅ CLOSED
I7B-05  real Process Confirmation input/workbench shell               ✅ CLOSED
```

I7B-05 exact closure evidence:

```text
Image vertical slice              run 200 ✅
B7-B9 Temporal reference runtime  run 219 ✅
B10 Restart safety                run 134 ✅
merge                              21d02fdc64fbf21a58f5b633b76cd7af5a92268a
```

# I7B-06 — Natural-language BPMN correction

## Required interaction

```text
CURRENT BPMN REVISION
      ↓
USER: "Tell Talos what's wrong"
      ↓
MODEL / CORRECTION PROVIDER
      ↓
UNTRUSTED PROPOSED BPMN XML
      ↓
TALOS PARSE + ROUND-TRIP VALIDATION
      ↓
PROPOSED BPMN REVISION
      ↓
VISIBLE DIFF
      ↓
ACCEPT / REJECT
```

Never:

```text
USER TEXT → MODEL OUTPUT → CURRENT BPMN MUTATED
```

## Provider boundary

Talos uses a vendor-neutral protocol. The provider receives the exact base BPMN revision identity, XML, XML digest, semantic digest, and user instruction. A response is accepted for review only if it correlates back to the exact request/base revision.

Model output remains untrusted even when transport succeeds.

## Safe-stop conditions

```text
PROVIDER FAILURE / TIMEOUT      → SAFE_STOP_PROVIDER_FAILURE
PROVIDER NO_RESULT              → SAFE_STOP_PROVIDER_NO_RESULT
MISMATCHED RESPONSE             → SAFE_STOP_PROVIDER_FAILURE
INVALID / NON-BPMN XML          → SAFE_STOP_INVALID_PROPOSAL
NO BUSINESS-SEMANTIC CHANGE     → SAFE_STOP_NO_SEMANTIC_CHANGE
```

All safe stops preserve the current BPMN revision and create no proposed revision.

## Proposal authority

A successful model proposal creates:

```text
BpmnProcessRevision
  editMode = NATURAL_LANGUAGE_PATCH
  state = DRAFT
  canonicalAlignmentStatus = REQUIRES_CANONICAL_RECONCILIATION

NaturalLanguageBpmnCorrectionProposal
  status = PROPOSED
  automaticApplyAuthorized = false

BpmnCorrectionAttemptRecord
  append-only provider/audit evidence
```

## Visible diff

Talos returns a deterministic XML diff preview plus the complete proposed BPMN XML. The diff is an inspection aid, not an authority record.

## Decision persistence

The original proposal is immutable. Accept/reject does not rewrite it:

```text
PROPOSAL(PROPOSED)        immutable
       +
DECISION(ACCEPTED|REJECTED) immutable
       ↓
EFFECTIVE DECISION
```

Acceptance requires `authorityRef` and still grants:

```text
automaticCanonicalAlignmentAuthorized = false
automaticConfirmationAuthorized       = false
automaticExecutionAuthorized          = false
```

An accepted patch must still be reconciled to a new canonical ProcessRevision before Process Confirmation.

## I7B-06 acceptance gate

```text
1. exact base revision/request sent to provider                   ✅ required
2. response correlation validated                                 ✅ required
3. valid semantic proposal creates NATURAL_LANGUAGE_PATCH          ✅ required
4. proposal never auto-applies                                    ✅ required
5. visible diff returned                                           ✅ required
6. provider failure safe-stops                                     ✅ required
7. NO_RESULT safe-stops                                            ✅ required
8. invalid BPMN safe-stops                                         ✅ required
9. semantic no-op safe-stops                                       ✅ required
10. acceptance requires authority                                  ✅ required
11. proposal remains immutable after decision                      ✅ required
12. double decision blocked                                        ✅ required
13. acceptance grants no canonical/confirmation/execution authority ✅ required
14. real async HTTP provider boundary proven                       ✅ required
15. all prior image/runtime/restart gates remain green             ✅ required
```

## Product sequencing after I7B-06

```text
I7B-07 confirmation → canonical validation/freeze integration       ⛔ NEXT
I7B-08 consolidate full browser Product Confirmation UX             ⛔
I7C    real arbitrary-image vision provider                         ⛔
I8     automation design review + BPMN↔Temporal traceability        ⛔
I9     one-app startup / deploy / end-to-end product gate           ⛔
```

The I7B-06 backend protocol/service is intentionally provider-neutral. A real model credential is not required to prove the safety boundary; browser/provider configuration is consolidated before the one-app product gate.
