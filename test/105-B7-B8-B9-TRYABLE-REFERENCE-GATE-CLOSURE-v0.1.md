# TALOS — B7 / B8 / B9 Tryable Reference Gate Closure v0.1

Status: **CLOSED — PASS**  
Date: 2026-08-19

## Decision

The bounded TALOS Reference Vertical Slice has crossed the first user-try gate.

```text
B7 Temporal Worker / Reference Provider    ✅ CLOSED
B8 Minimal Reference API / Browser UI      ✅ CLOSED
B9 Actual Temporal E2E / Server Evidence   ✅ CLOSED
```

This closure does **not** authorize broad TALOS product BUILD.

## B7 evidence

- exact Temporal TypeScript SDK family locked at `1.22.0`
- real npm transitive lock with `resolved` and `integrity` metadata
- real `TalosReferenceApprovalWorkflow`
- real Workflow Update + validator
- real Workflow condition
- real `sendReferenceConfirmation` Activity
- real `ApplicationFailure` retry/non-retryable translation
- real `Worker.create(...)`
- reference provider remains physically isolated from TALOS state

Historical/provider/pre-SDK evidence remains preserved in `test/96` through `test/102`.

## B8 evidence

Tryable local application:

```text
build/reference-vertical-slice/apps/reference-api/
```

User command:

```text
npm run demo
```

Browser surface:

```text
http://127.0.0.1:8787
```

The application reconstructs the actual reference Talos chain before starting runtime execution:

```text
Canvas source actor=UNKNOWN
→ preserve / adapt
→ canonical / provenance / validation
→ explicit actor=Manager correction
→ new semantic history
→ automation-design freeze
→ capability / human / form / binding
→ ExecutionPlan
→ TemporalMapping
→ RuntimePolicy
→ Deployment design
→ compiled immutable runtime program
→ real Temporal Workflow
```

The B8 smoke test executes both APPROVED and REJECTED paths through the HTTP application.

Authoritative CI result:

```text
test/104-B8-TRYABLE-REFERENCE-APP-CI-RESULT-v0.1.md
Status: PASS
```

## B9 evidence

Authoritative CI result:

```text
test/103-B7-B9-TEMPORAL-RUNTIME-CI-RESULT.md
Status: PASS
```

It proves, against `@temporalio/testing` `TestWorkflowEnvironment.createLocal()`:

- real local Temporal server
- real Worker bundle and polling
- real Workflow start
- real tracked Workflow Update
- approved/rejected deterministic branch
- retryable Activity failure on first approved attempt
- Temporal retry to a later Activity attempt
- one idempotent reference-provider effect
- server-backed Workflow completion/history evidence
- rejected branch schedules no email Activity

## Pull-request verification

The transaction-safe B8 startup fix was independently verified through PR #1.

Green observable PR workflow runs included:

```text
run 32307282508 — PASS
run 32307383515 — PASS
```

The final run passed every step:

```text
npm ci                         PASS
Temporal lock gate             PASS
architecture guard             PASS
real SDK Activity boundary     PASS
tryable local app smoke test   PASS
real local Temporal E2E        PASS
runtime/app enforcement        PASS
```

PR #1 was squash-merged to `main` as:

```text
994d0fecca55c637d96a2facbd24c180c045d91a
```

## Important corrections discovered during the gate

### 1. Runtime retry history

TALOS originally expected one persisted `ActivityTaskStarted` history event per retry. Actual Temporal server history represented the retry through the Activity attempt number instead.

The proof now reads the server-backed Activity attempt (`>= 2`) rather than inventing a history shape Temporal does not promise.

### 2. Reference-app startup rollback

The first B8 wrapper could leak a running Worker if startup failed after runtime creation but before the app handle was returned.

The final version is transactional: startup failure rolls back HTTP, Worker, provider, local Temporal environment and TALOS SQLite before rethrowing.

### 3. Native Canvas snapshot access

The app initially read a nonexistent mutable-style `CanvasRevision.elements` collection. The frozen Canvas contract correctly uses immutable `elementSnapshots`.

The final app reads the immutable snapshot model.

## User-try contract

The first tryable version is now named:

> **TALOS Reference Vertical Slice v0.1**

It is a reference proof, not production.

Still outside authorization:

```text
production BPMN/image/language/n8n adapters
real Gmail / Drive / SaaS providers
production IAM / secrets
production Temporal deployment
multi-user collaboration
broad provider expansion
full product visual polish
```

## Next gate

```text
B10 — failure / restart / lineage closure
```

B10 is **not required before a user tries v0.1**. It is the next hardening/evidence stage after feedback from the first hands-on run.
