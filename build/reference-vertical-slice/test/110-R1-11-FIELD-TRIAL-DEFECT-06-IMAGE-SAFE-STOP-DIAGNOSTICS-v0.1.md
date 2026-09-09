# R1-11 Field Trial Defect 06 — Image safe-stop opacity and transient provider resilience v0.1

Status: **FIX CANDIDATE — USER EXECUTION REQUIRED**

## Field witness

Real source used repeatedly during R1-11:

```text
Source: image-test.png
SHA-256: b84a2abd02aed0632275864e5fb987832620ac9cfa69fd22be178d11e16da8ce
Source route: IMAGE_INTERPRETATION
```

The same source had previously reached review, confirmation, AI automation design and capability binding. A later rerun stopped at source intake with:

```text
SAFE_STOP_BEFORE_CANONICAL
source preserved, interpretation did not create business truth
```

Observed authority state remained correct:

```text
SOURCE TRUTH: preserved
INFERRED: no admitted process meaning
CONFIRMED: none
AUTOMATION: not authorized
DEPLOYMENT: not authorized
EXECUTION: not authorized
```

The product UI exposed no provider/routing/sufficiency reason, even though `/api/input/image` already returned `perceptionDecision`, `perceptionRouting` and provider diagnostics. This made a correct fail-closed state operationally opaque.

## Correction

### 1. Bounded transient provider retry

Direct Gemini image perception now uses a transport-only retry wrapper in private-preview startup.

Retry is bounded to at most three total attempts and only applies to replay-safe requests when the provider returns:

```text
429, 500, 502, 503, 504
```

Replay-safe network transport errors may also retry. Abort, authentication/policy 4xx responses, malformed model output, semantic insufficiency and Talos admission/sufficiency decisions are not converted into success.

The retry layer does not alter provider output, perception evidence, sufficiency policy, Canonical admission or authority.

### 2. Visible safe-stop diagnostics

The One-App Source card now renders a concise safe-stop explanation and an expandable `Why Talos stopped` section with:

- perception decision;
- routing decision;
- primary provider;
- primary sufficiency reason codes;
- fallback provider/reason codes when attempted;
- provider diagnostics already returned by the protected API.

No secret material is added to the response or UI.

## Anti-overfit statement

This correction contains no source hash matching, process-domain labels, car-wash task names or fixture-specific acceptance rule. Retry is transport-status based. Diagnostics are generated from generic perception-routing evidence already produced by Talos.

## Non-goal

This fix deliberately does **not** relax `perception-sufficiency.ts`. If the same source still safe-stops after transient retries, the displayed reason codes become the evidence needed to decide whether the sufficiency contract itself is too strict or the provider genuinely returned incomplete visual structure.

## Required closure evidence

Run on the exact candidate SHA:

```powershell
node --experimental-strip-types --test `
  .\tests\r1-11-gemini-transient-retry.test.ts `
  .\tests\r1-11-image-safe-stop-product-diagnostics.test.ts `
  .\tests\r1-11-image-wait-guard-perception.test.ts
```

Then rerun the same real `image-test.png` through One-App.

Expected outcomes:

1. If a transient Gemini failure was the cause, the bounded retry may recover and normal review continues.
2. If visual evidence remains insufficient, Talos still safe-stops, but `Why Talos stopped` exposes exact routing/reason codes.
3. In either case, source preservation and all downstream authority boundaries remain unchanged.

Do not close this defect from static inspection alone.
