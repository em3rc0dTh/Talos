# TALOS — B10 Restart / Idempotent Replay Safety Result v0.1

Status: **PASS — NODE 22.16 + NODE 24.11**

Date: **2026-08-19**

## Origin of this gate

The first user-operated Windows run of `TALOS Reference Vertical Slice v0.1` completed successfully. After the user stopped the app and restarted it against the same `.runtime/talos-state.sqlite`, startup failed with:

```text
TypeError: Reference actor correction failed: IDEMPOTENT_REPLAY
```

This was a real restart defect, not user error and not a persistence failure.

## Root cause

The persisted review command was correctly recognized by the review application layer as the same command:

```text
clientRequestKey = reference-correct-manager
→ IDEMPOTENT_REPLAY
```

However the reference bootstrap expected only a newly-applied correction and required fresh in-memory candidate outputs.

A first attempted fix rebuilt the full slice in an isolated staging repository. B10 pressure testing rejected that approach because the Canvas adapter intentionally creates a fresh immutable `AdapterAttempt` identity on each actual invocation. Rebuilding the historical slice therefore produced a new AdapterResult/attempt context and attempted to substitute that new context into a deterministic historical `ReviewWorkspaceRevision`.

The failing immutable record proved the defect precisely:

```text
ReviewWorkspaceRevision
same deterministic review revision ID
same ProcessRevision
same ValidationAssessment
same semantic digest
DIFFERENT adapterResultContextRefs
```

That staging strategy was removed.

## Final repair

The reference application now follows two explicit reuse rules.

### 1. Unchanged source / existing successful adapter result

Before invoking the Canvas adapter, the application computes the frozen adapter input fingerprint.

```text
same preserved SourceRepresentation
+ same adapter/version/mapping/canonical profile
        ↓
existing successful AdapterResult found
        ↓
reuse historical AdapterAttemptView / AdapterResult
        ↓
NO new adapter attempt merely because the app restarted
```

This preserves:

```text
NEW ADAPTER ATTEMPT ≠ OLD ADAPTER ATTEMPT
```

while avoiding a false new attempt when no interpretation attempt is actually needed.

### 2. Same review command replay

If `applyActorCorrection` returns:

```text
IDEMPOTENT_REPLAY
```

the application rehydrates the historical immutable outputs referenced by the original `ReviewCommandApplication`:

```text
candidate ProcessRevision
candidate ValidationBundle
resulting ReviewWorkspaceRevision / projection / baseline / scope binding
review-authored source context
confirmation/diff/finding-disposition evidence when present
```

The second bootstrap therefore reports `IDEMPOTENT_REPLAY` as historical truth while returning the same accepted semantic result needed by the downstream freeze/capability/execution chain.

It does **not** mutate the prior application from `APPLIED` to `IDEMPOTENT_REPLAY` in persistence.

## Regression assertions

The B10 restart suite proves:

```text
first bootstrap correction result             APPLIED
second bootstrap correction result            IDEMPOTENT_REPLAY
candidate ProcessRevision identity             SAME
candidate ValidationAssessment identity        SAME
resulting ReviewWorkspaceRevision identity     SAME
semantic/review/execution document count       STABLE
```

It also performs the full local lifecycle against one shared runtime directory:

```text
start HTTP + Temporal app
→ health READY
→ Worker RUNNING
→ close
→ keep talos-state.sqlite intact
→ start again with SAME runtime directory
→ health READY
→ Worker RUNNING
→ close
→ no duplicate semantic history
```

## Compatibility matrix

GitHub Actions workflow:

```text
.github/workflows/b10-restart-safety.yml
```

Results:

```text
Node 22.16.0
  npm ci                          PASS
  architecture guard             PASS
  restart/replay suite           PASS

Node 24.11.1
  npm ci                          PASS
  architecture guard             PASS
  restart/replay suite           PASS
```

The existing B7–B9 runtime gate also remained PASS on the same final change:

```text
Temporal dependency gate        PASS
architecture gate               PASS
real SDK Activity gate          PASS
tryable app smoke               PASS
real Temporal E2E               PASS
```

## Node support

The reference workspace now declares:

```text
>=22.16.0 <23 || >=24.0.0 <25
```

and the generated npm lock carries the same engine range.

## Verdict

```text
USER-FOUND IDEMPOTENT_REPLAY RESTART BUG      FIXED
PERSISTED .runtime REUSE                      PASS
REVIEW HISTORY REHYDRATION                    PASS
NO DUPLICATE SEMANTIC HISTORY                 PASS
NO FAKE DETERMINISTIC ADAPTER ATTEMPT         PASS
NODE 22.16 RESTART                            PASS
NODE 24.11 RESTART                            PASS
B7–B9 REGRESSION                              PASS
```

**B10 restart/replay subgate: CLOSED.**

B10 remains open for the broader failure/restart/full-lineage hardening set, including classification of local-development shutdown warnings and additional runtime recovery cases.
