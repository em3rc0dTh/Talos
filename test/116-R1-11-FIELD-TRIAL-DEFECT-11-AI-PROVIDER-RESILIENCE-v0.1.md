# R1-11 FIELD TRIAL DEFECT 11 — AI PROVIDER RESILIENCE v0.1

Date: 2026-09-08
Gate: R1-11 domain-agnostic real-user field trial
Status: FIX IMPLEMENTED — FIELD RE-TEST REQUIRED

## Observation

During a real handwritten-process field trial, Gemini returned structured visual evidence but Talos rejected the result at its deterministic image-perception sufficiency gate. The source remained preserved and no Canonical business truth was created.

The exact captured event was therefore **not a Gemini process crash**: Gemini returned evidence and Talos correctly safe-stopped because that evidence was not sufficient.

The field trial nevertheless exposed the larger availability defect: the normal executable field launcher configured Gemini as the practical primary provider while leaving the already-implemented independent local fallback disabled. For Automation Design, the launcher also did not enable the existing Ollama fallback at all.

Consequently, a Gemini provider outage, rate limit, invalid response, or repeatedly insufficient response could make AI-dependent product paths unavailable even though Talos core, source preservation, governance and Temporal remained healthy.

## Product requirement

```text
Gemini may fail.
Talos must not fail with it.
```

AI providers are replaceable execution dependencies. They are not Talos authority and must not become the availability boundary for the product.

## Existing engine capability

Talos already had independent provider routing:

### Image Perception

```text
primary attempt
  -> Talos deterministic sufficiency assessment
  -> if insufficient/provider failure: one independent fallback attempt
  -> independent Talos sufficiency assessment
  -> selected or safe-stop
```

No model voting or evidence merging is used to manufacture confidence.

### Automation Designer

```text
primary proposal
  -> Talos admission/normalization
  -> if PARTIAL / PROVIDER_FAILURE / POLICY_REJECTION: one independent fallback proposal
  -> independent Talos validation
  -> selected SUGGESTED proposal or governed safe-stop
```

Fallback cannot grant business confirmation, capability binding, deployment authority, workflow-start authority or human-outcome authority.

## Root cause

The executable field launcher did not activate the resilience already implemented in the engines:

- local vision fallback was opt-in;
- local Automation Designer fallback was not configured by the launcher;
- the normal launcher therefore behaved as a practical Gemini single-provider path.

## Fix

`build/reference-vertical-slice/scripts/r1-image-temporal-field-start.ps1` now:

1. attempts to discover a healthy local Ollama runtime by default;
2. verifies that the configured fallback model is installed;
3. enables the same independent local model for both:
   - image perception fallback via `TALOS_OLLAMA_FALLBACK_ENABLED`;
   - Automation Designer fallback via `TALOS_OLLAMA_AUTOMATION_FALLBACK_ENABLED`;
4. does **not** make Ollama a new startup SPOF:
   - if Ollama/model is unavailable, Talos still starts;
   - launcher truthfully reports `DEGRADED_AI_REDUNDANCY`;
5. supports strict release evidence with `-RequireLocalFallback`;
6. supports explicit opt-out with `-DisableLocalFallback`;
7. can pull the selected local model when intentionally requested with `-PullFallbackModel`.

Default fallback model remains:

```text
qwen3-vl:4b-instruct
```

## Truth boundary

This fix does **not** weaken the image sufficiency gate or any authority gate.

If Gemini fails and Ollama returns sufficient evidence, Talos may continue to human review using that independently admitted evidence.

If Gemini fails and Ollama also fails/returns insufficient evidence, Talos safe-stops while preserving the original source. It does not invent the process.

If Ollama is not available, Talos core still starts and reports degraded AI redundancy; AI-dependent work may safe-stop until a valid provider or manual/native source route is available.

## Regression evidence

Added:

`build/reference-vertical-slice/tests/r1-11-ai-provider-resilience-launcher.test.ts`

It proves that the field launcher:

- attempts local AI redundancy by default;
- enables both visual and Automation Designer local fallback contracts;
- degrades truthfully instead of terminating Talos when local fallback is unavailable;
- provides a strict `RequireLocalFallback` release gate;
- preserves the Temporal and authority boundaries.

Existing behavioral evidence also proves that a primary HTTP 429/provider failure can route to one independently assessed fallback and reach `FALLBACK_ACCEPTED` without automatic authority.

## Field re-test acceptance

Run the field launcher on the exact post-fix SHA.

The startup configuration must show one of:

```text
AI redundancy : READY
```

or, if local Ollama/model is genuinely unavailable:

```text
AI redundancy : DEGRADED_AI_REDUNDANCY
```

For the resilience field proof, `READY` is required.

Then force or observe an unusable Gemini primary attempt. Acceptance requires:

```text
Gemini primary fails / is insufficient
        ↓
independent Ollama fallback attempted
        ↓
Talos deterministic validation
        ↓
FALLBACK_ACCEPTED   OR   governed SAFE_STOP
```

At no point may provider failure create business truth or authority automatically.

## Release implication

R1-11 remains open until the field re-test proves the real launcher path with provider redundancy active. R1-12 must certify the final exact SHA only after R1-11 stops changing the candidate.
