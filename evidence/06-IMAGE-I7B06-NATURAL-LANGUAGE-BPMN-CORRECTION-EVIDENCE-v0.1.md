# Talos — I7B-06 Natural-Language BPMN Correction Evidence v0.1

Status: **CLOSURE CANDIDATE — FINAL EXACT-HEAD CI REQUIRED**  
Date: **2026-08-20**  
Branch: `image-i7b06-natural-language-bpmn-correction-v0.1`  
PR: **#20 — Image I7B-06: proposal-only natural-language BPMN correction**

## Safety question

Can Talos let a user describe a BPMN correction in natural language without allowing a model to silently become business authority?

I7B-06 implements:

```text
USER INSTRUCTION
      ↓
EXACT BASE BPMN REQUEST
      ↓
MODEL_PROVIDER
      ↓
UNTRUSTED RESPONSE
      ↓
CORRELATE TO EXACT REQUEST/BASE
      ↓
PARSE + BPMN ROUND-TRIP
      ↓
SEMANTIC CHANGE CHECK
      ↓
PROPOSED NATURAL_LANGUAGE_PATCH
      ↓
VISIBLE DIFF
      ↓
HUMAN ACCEPT / REJECT
```

## Provider protocol

`BPMN_CORRECTION_PROVIDER_PROTOCOL = talos-bpmn-correction-provider-v0.1`

Every request pins:

- base BPMN revision ID
- exact BPMN XML
- exact BPMN XML SHA-256
- base semantic digest
- user instruction
- deterministic request ID

Every accepted response must return the same request ID and base revision ID and identify itself as `MODEL_PROVIDER` with provider/model/pipeline metadata.

## Failure behavior

The test suite verifies terminal safe stops for:

```text
mismatched/malformed provider response  SAFE_STOP_PROVIDER_FAILURE
provider NO_RESULT                      SAFE_STOP_PROVIDER_NO_RESULT
invalid BPMN XML                        SAFE_STOP_INVALID_PROPOSAL
semantic no-op                          SAFE_STOP_NO_SEMANTIC_CHANGE
```

For every safe stop:

- the base BPMN remains intact;
- no correction proposal is created;
- no proposed BPMN revision is created;
- `automaticApplyAuthorized` remains false.

## Successful proposal behavior

A valid semantic proposal creates an immutable candidate revision:

```text
editMode                 NATURAL_LANGUAGE_PATCH
parentBpmnRevisionId     exact current base revision
state                    DRAFT
canonicalAlignmentStatus REQUIRES_CANONICAL_RECONCILIATION
```

and an immutable `NaturalLanguageBpmnCorrectionProposal` with:

```text
status                   PROPOSED
automaticApplyAuthorized false
```

The base revision remains unchanged.

## Visible difference

`buildBpmnXmlVisibleDiff(...)` emits deterministic removed/added line evidence and a bounded unified preview. Full proposed BPMN XML remains available separately when the preview is truncated.

This is deliberately an inspection aid. Diff visibility does not confer semantic authority.

## Human decision

Accept/reject is stored as a separate immutable `NaturalLanguageBpmnCorrectionDecisionRecord`.

Acceptance without `authorityRef` is rejected. Acceptance with authority yields an effective accepted proposal and may select the proposed BPMN revision for the next review state, but explicitly keeps:

```text
automaticCanonicalAlignmentAuthorized false
automaticConfirmationAuthorized       false
automaticExecutionAuthorized          false
```

The persisted proposal itself remains `PROPOSED`; later decision evidence is what establishes the effective ACCEPTED/REJECTED state.

A second decision for the same proposal is rejected.

## Real async transport proof

`AsyncHttpBpmnCorrectionProvider` is tested against a real local HTTP server. The test verifies that the provider receives the exact:

- protocol
- base revision ID
- base BPMN XML
- instruction

and that its response still passes through the untrusted-response validator before proposal creation.

## No provider-specific authority

I7B-06 does not couple Talos business truth to any model vendor. Provider/model success is never treated as confirmation.

```text
MODEL OUTPUT ≠ BPMN CURRENT STATE
MODEL OUTPUT ≠ CANONICAL TRUTH
MODEL OUTPUT ≠ PROCESS CONFIRMATION
MODEL OUTPUT ≠ EXECUTION AUTHORITY
```

## Regression requirement

The candidate must pass:

```text
Image vertical slice through I7B-06  pending final exact-head run
B7-B9 Temporal reference runtime     pending final exact-head run
B10 Restart safety                   pending final exact-head run
```

No final closure claim is made in this evidence file until PR #20 is merged from a head where all three are green.
