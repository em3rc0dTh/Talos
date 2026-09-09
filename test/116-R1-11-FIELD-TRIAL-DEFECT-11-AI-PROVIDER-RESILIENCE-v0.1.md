# R1-11 FIELD TRIAL DEFECT 11 — AI PROVIDER RESILIENCE v0.1

Date: 2026-09-08 / updated 2026-09-09
Gate: R1-11 domain-agnostic real-user field trial
Status: FIX IMPLEMENTED — DOCKER COMPOSE FIELD RE-TEST REQUIRED

## Observation

During a real handwritten-process field trial, Gemini returned structured visual evidence but Talos rejected the result at its deterministic image-perception sufficiency gate. The source remained preserved and no Canonical business truth was created.

The exact captured event was therefore **not a Gemini process crash**: Gemini returned evidence and Talos correctly safe-stopped because that evidence was not sufficient.

The field trial nevertheless exposed the larger availability defect: the executable field path configured Gemini as the practical primary provider while the already-implemented independent local fallback was not reliably available from the product launcher. The first closure also assumed a host-installed `ollama` CLI, while the actual Talos field architecture runs Ollama in Docker.

Consequently, a Gemini provider outage, rate limit, invalid response, or repeatedly insufficient response could make AI-dependent product paths unavailable even though Talos core, source preservation, governance and Temporal remained healthy.

## Product requirement

```text
Gemini may fail.
Talos must not fail with it.
```

AI providers are replaceable execution dependencies. They are not Talos authority and must not become the availability boundary for the product.

## Existing engine capability

Talos already had independent provider routing.

### Image Perception

```text
primary attempt
  -> Talos deterministic sufficiency assessment
  -> if insufficient/provider failure: one independent fallback attempt
  -> independent Talos sufficiency assessment
  -> selected or safe-stop
```

### Automation Designer

```text
primary proposal
  -> Talos admission/normalization
  -> if PARTIAL / PROVIDER_FAILURE / POLICY_REJECTION: one independent fallback proposal
  -> independent Talos validation
  -> selected SUGGESTED proposal or governed safe-stop
```

No model voting or evidence merging is used to manufacture confidence. Fallback cannot grant business confirmation, capability binding, deployment authority, workflow-start authority or human-outcome authority.

## Root cause

Two different concerns had been mixed:

1. Talos provider routing already supported an independent local fallback.
2. The field launcher attempted to discover that fallback using a host `ollama` executable.

The real field environment uses Docker. Therefore provider redundancy was not reproducible from the repository alone.

## Docker Compose closure

Added:

```text
build/reference-vertical-slice/docker-compose.r1-field.yml
build/reference-vertical-slice/scripts/r1-field-infra-up.ps1
build/reference-vertical-slice/scripts/r1-field-infra-down.ps1
```

The Compose project is named:

```text
talos-r1-field
```

It owns the R1 field dependencies:

```text
Temporal
  host gRPC : 127.0.0.1:17233
  host UI   : 127.0.0.1:18233

Ollama
  host API  : http://127.0.0.1:11434

Ollama init
  model     : qwen3-vl:4b-instruct
```

The Ollama model is stored in a named persistent volume:

```text
talos-r1-ollama-models
```

`ollama-init` is idempotent: it checks the model first and only pulls it when absent. Normal shutdown preserves the model volume. Deleting the model volume requires the explicit `-DeleteModelVolume` switch.

The Compose stack deliberately uses different generated/container identities from the earlier ad-hoc `talos-temporal` container, so a stopped legacy container with that name does not block the new stack. Runtime coupling remains via published loopback ports, not container names.

## Launcher correction

`r1-image-temporal-field-start.ps1` no longer assumes that `ollama.exe` exists on Windows PATH.

It now discovers Ollama through the actual provider contract:

```text
GET http://127.0.0.1:11434/api/tags
```

When the configured model is present it enables both independent fallbacks and pins their endpoints explicitly:

```text
TALOS_OLLAMA_FALLBACK_ENABLED=true
TALOS_OLLAMA_FALLBACK_URL=http://127.0.0.1:11434/api/chat
TALOS_OLLAMA_FALLBACK_MODEL=qwen3-vl:4b-instruct

TALOS_OLLAMA_AUTOMATION_FALLBACK_ENABLED=true
TALOS_OLLAMA_AUTOMATION_FALLBACK_URL=http://127.0.0.1:11434/api/chat
TALOS_OLLAMA_AUTOMATION_FALLBACK_MODEL=qwen3-vl:4b-instruct
```

`-PullFallbackModel` now uses the Ollama HTTP API rather than a host CLI.

If Ollama is unavailable and strict redundancy was not requested, Talos may still start and truthfully reports:

```text
DEGRADED_AI_REDUNDANCY
```

For R1-11 release evidence, use `-RequireLocalFallback`; startup then fails before the field test if provider redundancy is not genuinely available.

## Canonical field startup

From `build/reference-vertical-slice`:

```powershell
.\scripts\r1-field-infra-up.ps1
```

The script delegates infrastructure lifecycle to Docker Compose, waits for Temporal to be reachable, waits for the persisted Ollama model to appear through `/api/tags`, and only then reports:

```text
Talos R1 field infrastructure READY
  Temporal : READY
  Ollama   : READY / qwen3-vl:4b-instruct
```

Then start the Talos product:

```powershell
.\scripts\r1-image-temporal-field-start.ps1 `
  -TemporalAddress "127.0.0.1:17233" `
  -RequireLocalFallback
```

Normal shutdown:

```powershell
.\scripts\r1-field-infra-down.ps1
```

Explicit model-volume deletion only when intentionally resetting the local model cache:

```powershell
.\scripts\r1-field-infra-down.ps1 -DeleteModelVolume
```

## Truth boundary

This closure does **not** weaken the image sufficiency gate or any authority gate.

If Gemini fails and Ollama returns sufficient evidence, Talos may continue to human review using that independently admitted evidence.

If Gemini fails and Ollama also fails or returns insufficient evidence, Talos safe-stops while preserving the original source. It does not invent the process.

If Docker/Ollama is not available, Talos core may still start in degraded provider redundancy unless strict field certification requested `-RequireLocalFallback`.

## Regression evidence

`build/reference-vertical-slice/tests/r1-11-ai-provider-resilience-launcher.test.ts` now proves the repository contract for:

- HTTP-based Docker Ollama discovery;
- explicit image and Automation Designer fallback endpoints;
- Temporal + Ollama + model-init Compose services;
- persistent model storage;
- field infrastructure readiness polling;
- non-destructive normal shutdown;
- strict `RequireLocalFallback` certification behavior;
- preservation of Temporal and authority boundaries.

Existing behavioral evidence separately proves that a primary HTTP 429/provider failure can route to one independently assessed fallback and reach `FALLBACK_ACCEPTED` without automatic authority.

## Field re-test acceptance

Run the field infrastructure and Talos launcher on the exact post-fix SHA.

Required startup evidence:

```text
Talos R1 field infrastructure READY
AI redundancy       : READY
Runtime             : TEMPORAL_EXECUTION
Temporal            : 127.0.0.1:17233
```

Then force or observe an unusable Gemini primary attempt. Acceptance requires:

```text
Gemini primary fails / is insufficient
        ↓
independent Docker Ollama fallback attempted
        ↓
Talos deterministic validation
        ↓
FALLBACK_ACCEPTED   OR   governed SAFE_STOP
```

At no point may provider failure create business truth or authority automatically.

## Release implication

R1-11 remains open until the real Docker Compose field path proves provider redundancy on the exact candidate SHA. R1-12 must certify the final exact SHA only after R1-11 stops changing the candidate.
