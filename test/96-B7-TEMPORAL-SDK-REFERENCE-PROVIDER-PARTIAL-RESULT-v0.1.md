# TALOS — B7 Temporal SDK Verification + Reference Provider Partial Result v0.1

Status: **B7 PARTIAL PASS / TEMPORAL WORKER IMPORT GATE BLOCKED**  
Date: **2026-08-19**

## Purpose

B7 is the first bounded BUILD stage allowed to introduce the official Temporal TypeScript SDK and an executable reference provider.

This checkpoint records two independent lanes:

```text
A. REFERENCE PROVIDER RUNTIME     ✅ IMPLEMENTED / TESTED
B. TEMPORAL SDK WORKER           ⛔ SOURCE-IMPORT GATE NOT YET OPEN
```

B7 is **not closed** by this result.

---

# 1. Official Temporal SDK verification

Before any `@temporalio/*` source import, the implementation baseline was checked against the official `temporalio/sdk-typescript` project.

Verified on 2026-08-19:

```text
current official TypeScript SDK release = v1.21.1
@temporalio/worker                    = 1.21.1
@temporalio/testing                   = 1.21.1
supported Node family includes Node 22
all @temporalio/* packages in one project must use the same version
```

The previous B0 planned value:

```text
1.22.0
```

was therefore not promoted into implementation dependencies.

The dependency baseline now uniformly pins:

```text
@temporalio/common    1.21.1
@temporalio/client    1.21.1
@temporalio/worker    1.21.1
@temporalio/workflow  1.21.1
@temporalio/activity  1.21.1
@temporalio/testing   1.21.1
```

Source verification also confirmed the v1.21.1 Workflow Update API pattern required by the frozen B6 mapping:

```text
defineUpdate(...)
setHandler(...)
```

The provider/Worker design continues to follow Temporal's deterministic Workflow boundary: provider/database side effects belong outside Workflow code.

---

# 2. Dependency-lock gate

Talos BUILD governance requires:

```text
exact dependency baseline
+ package.json promotion
+ trustworthy package-manager lock
BEFORE first source import
```

The current execution environment could not reach the npm registry reliably enough to generate a trustworthy transitive npm lock.

Therefore B7 deliberately did **not**:

```text
add @temporalio/* to package.json
fabricate transitive package-lock entries
import @temporalio/* in source code
claim a Worker artifact exists
```

This is a dependency-governance stop, not a frozen Talos contract defect.

The Worker lane remains open pending an environment that can generate/verify the exact `1.21.1` npm dependency graph.

---

# 3. Reference provider implementation

Implemented under the already-isolated provider package:

```text
build/reference-vertical-slice/packages/reference-email-sink/
```

New service:

```text
ReferenceEmailSinkService
```

Request contract:

```text
referenceRequestId
capabilityUseOccurrenceId
to
subject
body
effectCreatedAt
```

The concrete test address exists only in B7 runtime/test fixtures. It does not rewrite B5/B6 semantic, capability, or execution-design truth.

---

# 4. Idempotency contract

Provider idempotency key exactly implements the frozen B6 design:

```text
sha256(referenceRequestId + ":" + capabilityUseOccurrenceId)
```

The provider writes through the physically isolated:

```text
reference-email-sink.sqlite
```

store whose `reference_email_effects.idempotency_key` is unique/primary and append-only.

This remains separate from:

```text
talos-state.sqlite
```

The provider never writes Talos semantic/provenance/review/capability/execution/deployment records.

---

# 5. Provider failure classes

Reference provider-domain failures:

```text
TRANSIENT_REFERENCE_FAILURE
→ transient / retryable by later Temporal Activity policy

INVALID_REFERENCE_REQUEST
→ permanent / non-retryable by later Temporal Activity policy
```

B7 provider code itself does not import Temporal and therefore does not create Temporal `ApplicationFailure` objects yet.

The future Activity wrapper must translate these provider-domain failures into the exact Temporal failure types/policies after the SDK import gate opens.

---

# 6. Failure injection and single-effect behavior

The provider supports bounded transient failure injection before success.

Reference proof:

```text
attempt 1 → TRANSIENT_REFERENCE_FAILURE
attempt 2 → provider effect inserted

provider attempts = 2
logical effect rows = 1
```

Repeated identical request:

```text
INSERTED
then DUPLICATE_IDENTICAL
logical effect rows = 1
```

Same idempotency key with changed payload:

```text
ReferenceEmailIdempotencyConflictError
```

Invalid request:

```text
INVALID_REFERENCE_REQUEST
logical effect rows = 0
```

---

# 7. Executable provider result

Executed locally on:

```text
Node v22.16.0
```

Command:

```text
node --experimental-strip-types --test \
  build/reference-vertical-slice/tests/b7-reference-provider.test.ts
```

Result:

```text
TOTAL 6
PASS  6
FAIL   0
```

Coverage:

```text
exact idempotency-key derivation
transient failure injection
single logical effect after retry-like re-invocation
identical duplicate deduplication
payload conflict rejection
permanent invalid-request failure
provider database restart durability
```

Architecture boundary check after provider implementation:

```text
MODULE BOUNDARIES 16
STATUS            PASS
ERRORS            0
```

---

# 8. Current B7 gate state

```text
Temporal SDK official version verified       ✅
Dependency baseline corrected to 1.21.1     ✅
Reference provider implemented              ✅
Reference provider executable tests         ✅ 6/6
Provider SQLite isolation retained          ✅
Architecture boundary retained              ✅

Trustworthy npm transitive lock              ⛔ PENDING
@temporalio/* package.json promotion         ⛔ PENDING LOCK
Temporal SDK source imports                  ⛔ CLOSED
Workflow implementation                     ⛔ NOT STARTED
Activity wrapper                             ⛔ NOT STARTED
Worker artifact                              ⛔ NOT CREATED
Temporal runtime execution                   ⛔ NOT CLAIMED
```

## Verdict

**B7 remains OPEN / PARTIAL.**

Next allowed move:

```text
obtain trustworthy exact npm lock for Temporal 1.21.1 family
→ promote exact packages
→ verify architecture/dependency gate
→ implement reference Workflow / Activity wrapper / Worker
```

No BUILD stage after B7 is opened by this checkpoint.
