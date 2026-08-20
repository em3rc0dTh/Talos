# TALOS — Gated Roadmap v0.32

Status: **ACTIVE PLAN — TRYABLE REFERENCE VERSION / B10 HARDENING**  
Date: **2026-08-19**  
Supersedes `00-TALOS-ROADMAP-v0.31.md` for active planning. Historical roadmap versions remain preserved.

# System architecture status

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

# Phase 6 — Reference Vertical Slice

Authorized implementation scope remains only:

```text
build/reference-vertical-slice/
```

Broad product BUILD remains closed.

## Stage status

```text
B0 Contract manifest / boundaries                 ✅ CLOSED
B1 IDs / deterministic JSON / SQLite              ✅ CLOSED
B2 Canvas / Source / Intake                       ✅ CLOSED — 25/25
B3 Canonical / Provenance / Validation            ✅ CLOSED — 27/27
B4 Explanation / Review / Correction / Freeze     ✅ CLOSED — 13/13
B5 Capability / Human / Form / Binding             ✅ CLOSED — 12/12
B6 Execution / Mapping / Policy / Deployment      ✅ CLOSED — 14/14
B7 Temporal Worker / Reference Provider            ✅ CLOSED
B8 Minimal Reference API / Browser UI              ✅ CLOSED
B9 Actual Temporal E2E / Server Evidence           ✅ CLOSED
B10 Failure / Restart / Full Lineage Hardening     🟡 OPEN
    restart + persisted review replay              ✅ CLOSED
    Node 22.16 / Node 24.11 restart matrix          ✅ PASS
    shutdown-warning classification/hardening       🟡 NEXT
    additional failure/recovery cases               ⚪ PENDING
    full runtime-to-source lineage closure           ⚪ PENDING
```

# Hands-on evidence

First user-operated approved path:

```text
source actor UNKNOWN                 ✅
SV-ACT-001 / INSUFFICIENT_DETAIL     ✅
explicit actor = Manager correction  ✅
semantic freeze                       ✅
real Temporal Workflow                ✅
first Activity transient failure      ✅
Temporal retry to attempt 2           ✅
one provider effect                    ✅
Workflow COMPLETED                    ✅
```

Evidence:

```text
test/106-USER-HANDS-ON-APPROVED-RUNTIME-RESULT-v0.1.md
```

# B10 restart defect found by hands-on use

After the first successful Windows run, restarting against the same persisted `.runtime/talos-state.sqlite` exposed:

```text
Reference actor correction failed: IDEMPOTENT_REPLAY
```

The persistence/review layer was correct: the same review command had already been applied. The reference bootstrap was wrong because it only accepted a fresh `APPLIED` in-memory result.

A staging-rebuild approach was pressure-tested and rejected because a genuine adapter invocation creates a new immutable AdapterAttempt identity. Talos must not substitute a new adapter-attempt context into an old deterministic review revision merely because the app process restarted.

Final restart law:

```text
UNCHANGED PRESERVED SOURCE
+ existing successful adapter fingerprint
→ reuse existing AdapterResult / historical attempt

SAME REVIEW COMMAND
→ IDEMPOTENT_REPLAY
→ hydrate historical ProcessRevision / Validation / ReviewContext
→ continue from the same accepted semantic history
```

No prior `APPLIED` record is mutated.

# B10 restart regression

```text
Node 22.16.0
  npm ci                        ✅
  architecture guard           ✅
  bootstrap replay             ✅
  full app stop/start          ✅

Node 24.11.1
  npm ci                        ✅
  architecture guard           ✅
  bootstrap replay             ✅
  full app stop/start          ✅
```

Existing B7–B9 runtime/app/E2E gate also remained green on the final restart-safe implementation.

Evidence:

```text
test/107-B10-RESTART-REPLAY-SAFETY-RESULT-v0.1.md
```

# Supported local Node lines

Reference workspace engine range:

```text
>=22.16.0 <23 || >=24.0.0 <25
```

The generated npm lock carries the same range.

# Immediate hands-on move

The user should keep the existing `.runtime` directory and verify the repaired restart path itself:

```powershell
git pull
npm ci
npm run demo
```

If already inside `Talos\build\reference-vertical-slice`, do not `cd build/reference-vertical-slice` again.

After the restarted app reaches READY:

```text
start a second request
→ REJECTED
→ Workflow REJECTED
→ email Activity never scheduled
→ zero provider effects for that request
```

# Next B10 work after the user retry

```text
1. capture user restart evidence
2. capture user REJECTED-path evidence
3. classify Windows local Temporal shutdown warning
4. pressure-test stop/restart with pending Workflow state where appropriate
5. close full runtime → execution design → semantic freeze → source lineage evidence
6. only then decide the next bounded expansion
```

Do not expand BPMN/image/language/n8n/SaaS product scope before this B10 hardening set is closed.
