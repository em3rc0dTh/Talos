# R1-11 Field Observation 07 — Gemini HTTP 429

Status: **OBSERVED · SAFE STOP CORRECT · REMEDIATION NOT YET EXECUTED**

Date: 2026-08-28

## Exact field evidence

User-executed candidate SHA:

`70948c722a8d3494d673a367e4f05f00730b1f7a`

Node:

`v24.11.1`

Real source:

- file: `image-test.png`
- SHA-256: `b84a2abd02aed0632275864e5fb987832620ac9cfa69fd22be178d11e16da8ce`
- product runtime: `DESIGN_ONLY`
- image mode: `REQUIRED`
- primary: Gemini `gemini-3.6-flash`
- local fallback: disabled for this field pass

## Focused regression gate executed before the field observation

Command surface:

- `r1-11-gemini-transient-retry.test.ts`
- `r1-11-image-safe-stop-product-diagnostics.test.ts`
- `r1-11-image-wait-guard-perception.test.ts`

Observed result on exact SHA `70948c...`:

- tests: 7
- pass: 7
- fail: 0
- skipped: 0

This is valid evidence only for that exact candidate and focused gate. It is not R1-11 closure and not R1-12 certification.

## Real One-App result

The same preserved image produced:

- perception decision: `SAFE_STOP_PROVIDER_FAILURE`
- provider diagnostic: `IMAGE_PERCEPTION_PROVIDER_FAILURE · Error: IMAGE_PERCEPTION_PROVIDER_HTTP_429`
- routing: `NOT_REPORTED`
- primary provider in routing panel: `NOT_REPORTED`
- admitted process meaning: none
- business confirmation: none
- automation authority: none
- deployment authority: none
- workflow execution authority: none

The source hash remained exactly preserved.

## Interpretation

This observation is **not evidence that the image was semantically insufficient**. The primary provider failed at the HTTP transport boundary because Gemini returned HTTP 429.

The safe-stop behavior is correct: Talos did not create Canonical meaning, business truth, automation authority, deployment authority or workflow-start authority from a failed provider attempt.

`Routing NOT_REPORTED` is expected for this exact launch because the field launcher explicitly reported that local fallback was disabled.

## Retry-policy finding

The field investigation found that the private-preview launcher had added a second transient-retry wrapper around Gemini while `packages/image-perception/src/async-http-provider.ts` already owned bounded retry for HTTP 429/500/502/503/504.

That composition could multiply one perception into nested provider requests and increase rate-limit pressure. The duplicate launcher wrapper is therefore removed. The image provider transport remains the single retry owner.

## Fallback contract

The existing perception router accepts a primary attempt only when both conditions are true:

1. admission is `ADMITTED_FOR_REVIEW`; and
2. deterministic sufficiency is `SUFFICIENT`.

Any other primary outcome — including provider failure — proceeds to exactly one configured fallback attempt. Primary and fallback are evaluated independently; there is no voting or evidence merge. Neither attempt creates semantic or execution authority.

A dedicated regression now covers the real field shape:

`primary HTTP 429 exhaustion → SAFE_STOP_PROVIDER_FAILURE for primary → configured fallback invoked once → fallback may be accepted only if independently admitted and sufficient`.

## Required follow-up evidence

The remediation is **NOT EXECUTED** until a user/local exact-SHA run proves:

1. provider transient-retry tests pass at the actual image transport boundary;
2. primary-provider-failure → fallback routing test passes;
3. safe-stop UI remains diagnostic-only;
4. the real `image-test.png` is rerun with local fallback enabled;
5. if Gemini remains rate-limited, the receipt shows the fallback provider/routing rather than manufacturing primary success.

R1-11 remains OPEN. R1-12 remains OPEN. PRODUCT READY is not claimed.
