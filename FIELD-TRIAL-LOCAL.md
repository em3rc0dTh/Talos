# Talos R1-11 — Local Field-Trial Docker

Status: LOCAL FIELD-TRIAL ENVIRONMENT
Purpose: run qualifying R1-11 product trials on a developer machine without requiring a public deployment.

This environment does not change the R1-11 evidence contract. A localhost run counts only when it uses a real operational/customer process and a participant external to the Talos implementation team for that trial.

## What this stack starts

```text
Browser
  ↓ http://localhost:8787
Talos One-App product
  ↓ trusted local deployment/execution host
Temporal dev server
  ├─ gRPC: host localhost:17233 → container 7233
  └─ UI:   http://localhost:18233
```

Talos durable product state is stored in the named Docker volume `talos_field_trial_runtime`. Field-trial receipt files remain on the host under `evidence/field-trials/`.

## Prerequisites

- Docker Desktop or Docker Engine with Docker Compose v2.
- Repository checked out at the current `main` used for the trial.
- Ports `8787`, `17233`, and `18233` available.

## Start

From the repository root:

```bash
docker compose -f docker-compose.field-trial.yml up --build
```

Open:

```text
Talos:       http://localhost:8787
Temporal UI: http://localhost:18233
```

The Talos container retries the Temporal connection during startup, so a fresh stack does not require manual ordering.

## Verify before a trial

In another terminal:

```bash
curl http://localhost:8787/api/status
```

For this field-trial host the status must report:

```text
deploymentAttemptExecutorConfigured: true
workflowExecutionExecutorConfigured: true
```

Those flags mean the product is wired to the trusted local Temporal host. They do not mean deployment or execution is pre-authorized; the R1 authority gates still require the operator to approve each step explicitly.

## Supported local execution boundary

The Docker host can execute the certified generic Temporal runtime for supported product plans. It deliberately fails closed instead of inventing semantics.

Important limits:

- `TalosGenericWorkflow` is the supported local workflow type.
- The configured Temporal namespace is `default` unless explicitly changed.
- The local host does not invent WAIT durations. If a reviewed plan contains `WAIT_COORDINATION` that has not been materialized into runtime semantics, the deployment attempt is rejected.
- Unsupported Temporal constructs remain rejected by the existing generic runtime compiler.
- No external capability transport is enabled automatically. Generic Activities produce local idempotent runtime effects unless a separately certified external transport is explicitly configured in another host.

A field trial that reaches one of these truthful boundaries is still useful evidence. Record the actual outcome as `BLOCKED_BY_OPERATOR`, `FAILED`, or `NOT_ATTEMPTED` as appropriate; do not convert a blocked run into `COMPLETED`.

## BPMN versus image input

Native BPMN works without an external perception provider and is available directly in the One-App browser surface:

```text
Choose BPMN
→ select a real .bpmn/.xml source
→ Preserve BPMN
→ Canonical reconciliation
→ Process review
→ explicit business confirmation
```

For native BPMN, Talos records perception as **not required for structured source**. It does not claim that image perception ran. The BPMN source still enters the same immutable review/correction/confirmation chain used by the rest of One-App.

Image input remains fail-closed unless the existing real image-perception provider environment is configured. The compose file can pass through these host variables when they are present:

```text
TALOS_IMAGE_PERCEPTION_PROVIDER_URL
TALOS_IMAGE_PERCEPTION_PROVIDER_ID
TALOS_IMAGE_PERCEPTION_PROVIDER_VERSION
TALOS_IMAGE_PERCEPTION_MODEL_REF
TALOS_IMAGE_PERCEPTION_MODEL_VERSION
TALOS_IMAGE_PERCEPTION_PIPELINE_VERSION
TALOS_IMAGE_PERCEPTION_TIMEOUT_MS
TALOS_IMAGE_PERCEPTION_BEARER_TOKEN
TALOS_IMAGE_PERCEPTION_PROVIDER_CLASS
TALOS_IMAGE_PERCEPTION_EVIDENCE_MODE
```

Do not place bearer tokens or other credentials in this repository. Set them only in the local shell/environment used to start Compose.

## Run Trial 1 and Trial 2

Each qualifying trial must use a real process and an external participant for that trial. The two qualifying receipts must have different `processFingerprint` values.

Recommended operator flow:

```text
real source/input
→ process understanding/review
→ corrections
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
→ record observations/ratings/friction
```

Execution is not mandatory for a qualifying R1-11 receipt. The receipt contract accepts `COMPLETED`, `FAILED`, `NOT_ATTEMPTED`, and `BLOCKED_BY_OPERATOR`; record what actually happened.

## Persist or reset local state

Stop while preserving Talos runtime evidence:

```bash
docker compose -f docker-compose.field-trial.yml down
```

Restart later with the same Talos durable volume:

```bash
docker compose -f docker-compose.field-trial.yml up
```

Delete the local Talos runtime volume and start clean:

```bash
docker compose -f docker-compose.field-trial.yml down -v
```

`down -v` intentionally deletes the Docker-held local Talos runtime. It does not delete host receipt JSON files under `evidence/field-trials/`.

## Validate R1-11 receipts

After both real receipts exist under `evidence/field-trials/*.json`:

```bash
docker compose -f docker-compose.field-trial.yml run --rm talos \
  node --experimental-strip-types ./scripts/r1-11-field-trial-gate.ts /workspace/evidence/field-trials
```

Closure requires:

```text
status: PASS
qualifyingTrialCount >= 2
distinctProcessCount >= 2
```

After R1-11 PASS, use the prepared R1-12 exact-SHA certification workflow. Local Docker testing alone does not authorize `Talos 1.0 — PRODUCT READY`.
