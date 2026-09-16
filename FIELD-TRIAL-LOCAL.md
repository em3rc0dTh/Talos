# Talos R1-11 — Local Field-Trial Docker

Status: LOCAL FIELD-TRIAL ENVIRONMENT
Purpose: run qualifying R1-11 product trials on a developer machine without requiring a public deployment.

This environment does not change the R1-11 evidence contract. A localhost run counts only when it uses a real operational/customer process and a participant external to the Talos implementation team for that trial.

## What this stack starts

```text
Browser
  ↓ http://localhost:8787
Talos One-App product
  ├─ image source → Talos Perception Gateway
  │                  ├─ PRIMARY: Ollama qwen2.5vl:7b
  │                  └─ FALLBACK: Gemini when GEMINI_API_KEY is configured
  └─ trusted local deployment/execution host
       ↓
Temporal dev server
  ├─ gRPC: host localhost:17233 → container 7233
  └─ UI:   http://localhost:18233

Ollama API: http://localhost:11434
```

Talos durable product state is stored in the named Docker volume `talos_field_trial_runtime`. Ollama model files are stored in `talos_ollama_models`, so a normal stop/restart does not redownload the model. Field-trial receipt files remain on the host under `evidence/field-trials/`.

## Vision policy

The local field-trial stack is intentionally provider-routed:

```text
PNG
→ exact Talos source preservation
→ Talos Perception Gateway
→ Ollama qwen2.5vl:7b
→ validate Talos perception schema + cross-references + source correlation
→ if valid SUCCEEDED: continue
→ if invalid / unavailable / insufficient: Gemini fallback when configured
→ if neither provider returns valid evidence: fail closed
```

Provider output is perception evidence only. It cannot confirm business truth, authorize automation, authorize deployment, or authorize workflow execution.

Ollama is the primary provider because the local model has no external per-request quota. Gemini is optional resilience, not the source of truth. The gateway records which upstream provider was actually selected in a diagnostic while exposing one stable Talos provider contract to One-App.

## Prerequisites

- Docker Desktop or Docker Engine with Docker Compose v2.
- Repository checked out at the current `main` used for the trial.
- Ports `8787`, `11434`, `17233`, and `18233` available.
- Enough local disk for `qwen2.5vl:7b` (approximately 6 GB model download plus runtime overhead).
- A Gemini API key only if fallback is desired. Ollama primary works without one.

The first full startup downloads `qwen2.5vl:7b`. Later restarts reuse the Docker model volume.

## Optional Gemini fallback

Create a local field-trial environment file:

```bash
cp .env.field-trial.example .env.field-trial
```

Edit only your local `.env.field-trial`:

```text
GEMINI_API_KEY=your_real_local_key
GEMINI_MODEL=gemini-2.5-flash
```

Do not commit `.env.field-trial` or any real credential. If `GEMINI_API_KEY` is blank, the gateway simply runs Ollama-only and still fails closed if Ollama cannot produce valid evidence.

## Start

From the repository root, with Gemini fallback configured:

```bash
docker compose --env-file .env.field-trial -f docker-compose.field-trial.yml up --build
```

Without Gemini fallback:

```bash
docker compose -f docker-compose.field-trial.yml up --build
```

Open:

```text
Talos:       http://localhost:8787
Temporal UI: http://localhost:18233
Ollama API:  http://localhost:11434
```

On first startup the sequence is:

```text
Ollama server healthy
→ qwen2.5vl:7b pull completes
→ Talos Perception Gateway becomes healthy
→ Talos starts
```

Therefore Talos does not advertise the local image provider before the primary model is actually installed and reachable in the full stack.

## Verify before a trial

In another terminal:

```bash
curl http://localhost:8787/api/status
curl http://localhost:11434/api/tags
```

For the full local field-trial stack, Talos status must report:

```text
status: READY
image.liveVisionInterpretation: true
deploymentAttemptExecutorConfigured: true
workflowExecutionExecutorConfigured: true
```

The provider descriptor should identify the stable routing boundary:

```text
providerId: TALOS_OLLAMA_GEMINI_GATEWAY
modelRef: router:ollama-primary-gemini-fallback
pipelineVersion: talos-r1-11-local-vision-v0.1
```

Those flags mean the product is wired to the local perception/runtime hosts. They do not mean process confirmation, automation, deployment, or execution is pre-authorized; the R1 authority gates still require explicit operator actions.

## Image Trial path

The original R1 product path is now available locally without an external vision dependency:

```text
Choose PNG
→ Preserve & understand
→ exact image source persisted
→ Ollama qwen2.5vl:7b perception
→ Gemini fallback only if needed and configured
→ schema/correlation validation
→ Process review
→ correction if required
→ explicit business confirmation
→ Automation Design
→ capability selection/binding
→ ExecutionPlan review
→ explicit automation approval
→ Temporal mapping
→ explicit RuntimePolicy
→ deployment design + realization
→ explicit deployment approval
→ local deployment attempt
→ explicit workflow-execution approval
→ local Temporal execution when supported
```

If both perception providers fail, Talos must stop rather than manufacture a process. The exact source remains durable and the failure is evidence, not business truth.

## Native BPMN path

Native BPMN remains available directly in One-App:

```text
Choose BPMN
→ select a real .bpmn/.xml source
→ Preserve BPMN
→ Canonical reconciliation
→ Process review
→ explicit business confirmation
```

For native BPMN, perception is correctly recorded as not required for a structured source. This path does not replace the image trial; it remains a supported structured-source intake.

## Supported local execution boundary

The Docker host can execute the certified generic Temporal runtime for supported product plans. It deliberately fails closed instead of inventing semantics.

Important limits:

- `TalosGenericWorkflow` is the supported local workflow type.
- The configured Temporal namespace is `default` unless explicitly changed.
- The local host does not invent WAIT durations. If a reviewed plan contains `WAIT_COORDINATION` that has not been materialized into runtime semantics, the deployment attempt is rejected.
- Unsupported Temporal constructs remain rejected by the existing generic runtime compiler.
- No external capability transport is enabled automatically. Generic Activities produce local idempotent runtime effects unless a separately certified external transport is explicitly configured in another host.

A field trial that reaches one of these truthful boundaries is still useful evidence. Record the actual outcome as `BLOCKED_BY_OPERATOR`, `FAILED`, or `NOT_ATTEMPTED` as appropriate; do not convert a blocked run into `COMPLETED`.

## Run Trial 1 and Trial 2

Each qualifying trial must use a real process and an external participant for that trial. The two qualifying receipts must have different `processFingerprint` values.

Execution is not mandatory for a qualifying R1-11 receipt. The receipt contract accepts `COMPLETED`, `FAILED`, `NOT_ATTEMPTED`, and `BLOCKED_BY_OPERATOR`; record what actually happened.

## Persist or reset local state

Stop while preserving both Talos runtime evidence and the downloaded Ollama model:

```bash
docker compose --env-file .env.field-trial -f docker-compose.field-trial.yml down
```

Restart later without rebuilding or redownloading the model:

```bash
docker compose --env-file .env.field-trial -f docker-compose.field-trial.yml up
```

A full reset removes **both** the Talos runtime volume and the Ollama model volume:

```bash
docker compose --env-file .env.field-trial -f docker-compose.field-trial.yml down -v
```

Use `down -v` only when you intentionally want a complete reset; the next startup will download `qwen2.5vl:7b` again. Host receipt JSON files under `evidence/field-trials/` are not deleted by this command.

## Validate R1-11 receipts

After both real receipts exist under `evidence/field-trials/*.json`:

```bash
docker compose --env-file .env.field-trial -f docker-compose.field-trial.yml run --rm talos \
  node --experimental-strip-types ./scripts/r1-11-field-trial-gate.ts /workspace/evidence/field-trials
```

Closure requires:

```text
status: PASS
qualifyingTrialCount >= 2
distinctProcessCount >= 2
```

After R1-11 PASS, use the prepared R1-12 exact-SHA certification workflow. Local Docker testing alone does not authorize `Talos 1.0 — PRODUCT READY`.
