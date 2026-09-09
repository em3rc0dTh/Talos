# TALOS — R1-11 real image field-test runbook v0.1

Status: **READY FOR USER EXECUTION**  
Release line: **Talos 1.0 RC**

## Purpose

Capture executable evidence from a real user machine for the Talos image route after the Gemini-primary / automatic-local-fallback implementation.

This runbook does not certify Talos by itself. It defines the exact user-side procedure and the receipt that must be reviewed before R1-11 image evidence can be called PASS.

## Required evidence law

Every field run must identify:

```text
exact Git SHA
exact PNG SHA-256
primary provider selection
fallback configuration state
Talos perception admission decision
Talos routing decision
whether automatic fallback triggered
selected provider
whether the canonical boundary was crossed
whether Talos safely stopped
proof that perception did not grant confirmation/freeze/execution authority
```

The helper probe writes these fields into a JSON receipt next to the tested PNG.

## Step 0 — pull the RC branch

From the Talos repository:

```powershell
git fetch origin
git switch feat/r1-04-r1-08-product-authority-journey
git pull --ff-only origin feat/r1-04-r1-08-product-authority-journey
git status --short
git rev-parse HEAD
```

`git status --short` must be empty before the launcher starts.

## Step 1 — Gemini primary field run

Open PowerShell in:

```text
Talos\build\reference-vertical-slice
```

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\r1-image-field-start.ps1
```

The launcher:

- verifies a clean Git working tree;
- records the exact Git SHA on screen;
- runs `npm ci` only when dependencies are absent;
- asks for `GEMINI_API_KEY` using hidden input if it is not already in the environment;
- configures Talos private preview in `DESIGN_ONLY` mode;
- forces Gemini as the primary provider for this field pass;
- keeps Temporal execution disabled;
- starts the Talos product on `http://127.0.0.1:8787`;
- does not persist the Gemini key in Talos evidence or descriptors.

Keep this terminal running.

## Step 2 — submit one real PNG

Open a second PowerShell in the same `build\reference-vertical-slice` directory.

Use a real Quarry/process image, for example:

```powershell
node .\scripts\r1-image-field-probe.mjs "C:\path\to\quarry-03.png"
```

The probe sends the exact PNG bytes to Talos and writes a receipt beside the image:

```text
quarry-03.talos-<timestamp>.json
```

Expected acceptable primary outcomes:

### A — primary sufficient

```text
status: BPMN_READY_FOR_PROCESS_REVIEW
perception admission: ADMITTED_FOR_REVIEW
routing: SINGLE_PROVIDER_NO_ROUTING_RECORD
selected provider: TALOS_GEMINI_PRIMARY
exact source hash match: true
automatic confirmation: false
automatic execution: false
```

The first Gemini-only pass intentionally has no fallback routing record because no fallback provider is configured.

### B — Gemini safe stop

```text
status: SAFE_STOP_BEFORE_CANONICAL
safe stop: true
automatic confirmation: false
automatic execution: false
```

This is not automatically a product defect. It is valid fail-closed evidence and must be diagnosed from the receipt.

Stop the first launcher with `Ctrl+C` after the receipt is written.

## Step 3 — automatic local fallback field run

This pass is separate so primary and fallback behavior remain distinguishable.

Ollama must be available locally. The packaged default fallback is:

```text
qwen3-vl:4b
```

Start Talos with automatic fallback enabled:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\r1-image-field-start.ps1 -EnableLocalFallback -PullFallbackModel
```

`-PullFallbackModel` asks Ollama to pull `qwen3-vl:4b` if needed. It may be omitted after the model is installed.

The local fallback is not called merely because it is configured. Talos must first reject Gemini at the deterministic perception sufficiency gate.

## Step 4 — submit a difficult/ambiguous real PNG

In the second PowerShell:

```powershell
node .\scripts\r1-image-field-probe.mjs "C:\path\to\difficult-quarry.png"
```

A useful fallback witness is a real image with one or more of:

- low legibility;
- ambiguous connector direction;
- unresolved connector endpoint;
- cropped/partially visible relevant region;
- unresolved branch/guard meaning;
- incomplete graph evidence;
- material provider uncertainty.

Do not artificially edit Talos output to force fallback. The source may be naturally difficult or intentionally degraded as a source artifact, but the receipt must identify the exact tested PNG hash.

## Expected fallback PASS witness

```text
product status:
  automaticFallbackOnPrimaryInsufficiency: true

image response:
  perceptionRouting.automaticFallbackTriggered: true
  perceptionRouting.decision: FALLBACK_ACCEPTED
  perceptionRouting.selectedProviderId: TALOS_OLLAMA_LOCAL_FALLBACK

verdict:
  sourceIdentityMatchesTalos: true
  canonicalBoundaryCrossed: true
  automaticConfirmationAuthorized: false
  automaticFreezeAuthorized: false
  automaticExecutionAuthorized: false
```

## Acceptable unresolved witness

If both Gemini and local fallback are insufficient:

```text
perceptionRouting.automaticFallbackTriggered: true
perceptionRouting.decision: UNRESOLVED_AFTER_FALLBACK
status: SAFE_STOP_BEFORE_CANONICAL
automaticConfirmationAuthorized: false
automaticFreezeAuthorized: false
automaticExecutionAuthorized: false
```

That is correct fail-closed behavior. It does not prove fallback success, but it does prove Talos did not manufacture process truth.

## Evidence to return for review

Return together:

```text
1. terminal output from git rev-parse HEAD
2. Gemini-primary JSON receipt
3. fallback JSON receipt (when the fallback pass is executed)
4. screenshot of the Talos review candidate if BPMN_READY_FOR_PROCESS_REVIEW was reached
5. any visible mismatch between the source image and Talos draft
```

Do not send the Gemini API key. The receipts are designed not to contain it.

## Certification boundary

These field receipts can close the image-specific portion of R1-11 only after review against the real source. They do not replace:

- the remaining R1-11 structural field matrix;
- the R1-12 exact-SHA executable test matrix;
- real Temporal release evidence where required.
