# Talos v0.1 — Private Technical Preview — Operator Runbook v0.1

Status: R0-03 CERTIFICATION CANDIDATE  
Date: 2026-08-24

This runbook covers the **DESIGN_ONLY** private-preview operator path certified by R0-01/R0-02/R0-03. Full `TEMPORAL_EXECUTION` operator packaging is gated by R0-04 real external/runtime adapter certification.

## 1. Prerequisites

- Node.js `22.16.0` within the repository-supported engine range
- repository checkout
- exact npm lock installed
- a dedicated writable runtime directory

From:

```text
build/reference-vertical-slice
```

install exact dependencies:

```bash
npm ci
```

## 2. Configure DESIGN_ONLY preview

Set these environment variables in the operator shell. Never commit real bearer values.

```bash
export TALOS_PRIVATE_PREVIEW_WORKSPACE_ID='workspace:private-preview-01'
export TALOS_PRIVATE_PREVIEW_ACTOR_ID='actor:private-preview-owner'
export TALOS_PRIVATE_PREVIEW_BEARER_TOKEN='<private token at least 24 characters>'
export TALOS_PRIVATE_PREVIEW_BIND_HOST='127.0.0.1'
export TALOS_PRIVATE_PREVIEW_ALLOWED_HOSTNAMES='127.0.0.1,localhost'
export TALOS_PRIVATE_PREVIEW_ALLOWED_ORIGINS='NONE'
export TALOS_PRIVATE_PREVIEW_MAX_JSON_BYTES='2097152'
export TALOS_PRIVATE_PREVIEW_MAX_IMAGE_BYTES='1048576'
export TALOS_PRIVATE_PREVIEW_IMAGE_MODE='DISABLED'
export TALOS_PRIVATE_PREVIEW_RUNTIME_MODE='DESIGN_ONLY'
export TALOS_PRIVATE_PREVIEW_RUNTIME_DIR='<absolute or relative durable runtime directory>'
```

If image mode is changed to `REQUIRED`, the complete existing `TALOS_IMAGE_PERCEPTION_*` provider contract must also be configured. R0-02 rejects partial provider configuration.

Do not configure Temporal coordinates in `DESIGN_ONLY` mode.

## 3. Inspect before start

Read-only inspection:

```bash
node --experimental-strip-types ./apps/reference-api/src/private-preview-operator.ts --inspect
```

Expected on a new runtime directory:

```text
stage: EMPTY
authorityReplayPerformed: false
startupMutationPerformed: false
midSessionResumption: NOT_SUPPORTED_V0_1
recoveryContract: DURABLE_EVIDENCE_ONLY
```

No bearer secret is printed.

## 4. Start Talos

```bash
node --experimental-strip-types ./apps/reference-api/src/private-preview-operator.ts
```

The startup JSON prints:
- `status: READY`
- `releaseGate: R0-03_OPERATOR_STARTUP_RECOVERY`
- loopback `baseUrl`
- runtime directory
- runtime mode
- safe configuration fingerprint
- pre-start recovery descriptor

The runtime directory receives `.talos-private-preview.lock.json`. A second live operator using the same directory is rejected.

## 5. Request authentication

Every protected API request must carry:

```text
Authorization: Bearer <configured preview token>
X-Talos-Workspace-Id: <configured workspace id>
X-Talos-Actor-Id: <configured actor id>
```

R0-01 rejects mismatched bearer/workspace/actor identity before I9 domain actions.

## 6. Normal DESIGN_ONLY use

The certified product path permits:

```text
BPMN/image intake according to image configuration
→ process review/correction
→ explicit process confirmation
→ automation design/review
```

All I8/I9 authority steps remain explicit. R0 operator configuration never grants process, automation, deployment, or execution authority.

## 7. Stop Talos

Preferred: send `SIGINT` with Ctrl+C.

`SIGTERM` is also handled.

Shutdown closes the private-preview app and removes the operator lock. Do not manually delete a lock belonging to a live process.

## 8. Inspect after stop

Run:

```bash
node --experimental-strip-types ./apps/reference-api/src/private-preview-operator.ts --inspect
```

The output summarizes persisted immutable evidence by kind and a coarse recovery stage.

Examples:

```text
PROCESS_EVIDENCE
AUTOMATION_EVIDENCE
DEPLOYMENT_EVIDENCE
WORKFLOW_EXECUTION_EVIDENCE
```

Inspection is read-only and does not replay authority commands.

## 9. Restart

Start the same operator command with the same `TALOS_PRIVATE_PREVIEW_RUNTIME_DIR`.

The startup output includes `recoveryBeforeStart`. Startup itself must not add domain/authority records merely because the server restarted.

### v0.1 limitation

The durable evidence survives, but the current one-app routing/session maps are process-memory state.

Therefore:

> **An interrupted in-progress HTTP authority session is not resumed after process restart in v0.1.**

Talos reports:

```text
midSessionResumption: NOT_SUPPORTED_V0_1
recoveryContract: DURABLE_EVIDENCE_ONLY
```

Do not interpret a persisted approval/confirmation document as an automatically reactivated session. Restart never replays authority to manufacture continuation.

## 10. Stale lock behavior

If Talos terminated without graceful cleanup and the recorded PID is no longer alive, the next operator startup may remove the stale lock and acquire a new one.

If the recorded PID is alive, startup fails closed with:

```text
R0_OPERATOR_RUNTIME_ALREADY_LOCKED
```

## 11. Before reporting a preview issue

Capture only safe data:
- Git commit SHA
- operator release gate
- configuration fingerprint
- recovery descriptor/digest
- HTTP status/code
- relevant immutable document IDs

Never paste preview/provider bearer secret values into evidence or issues.

## 12. R0-04 boundary

Do not call this runbook a full external execution release yet.

R0-04 must certify:
- one real commercial/model image-perception provider
- one real external capability/integration transport
- full `TEMPORAL_EXECUTION` operator adapters using those certified boundaries

Only after R0-04 and R0-05 may the repository declare **Talos v0.1 — Private Technical Preview READY**.
