# TALOS — Build

Status: **REFERENCE VERTICAL SLICE v0.1 TRYABLE / BROAD PRODUCT BUILD CLOSED**

The only authorized implementation scope remains:

```text
build/reference-vertical-slice/
```

Current governance:

```text
plan/09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.3.md
plan/10-REFERENCE-VERTICAL-SLICE-BUILD-AUTHORIZATION-v0.2.md
plan/00-TALOS-ROADMAP-v0.31.md
```

# Current BUILD state

```text
B0 contract manifest / workspace / boundaries       ✅ CLOSED
B1 IDs / deterministic JSON / SQLite                ✅ CLOSED
B2 Canvas / source / intake                         ✅ CLOSED — 25/25
B3 canonical / provenance / validation              ✅ CLOSED — 27/27
B4 explanation / review / correction / freeze      ✅ CLOSED — 13/13
B5 capability / human / form / binding              ✅ CLOSED — 12/12
B6 ExecutionPlan / mapping / policy / deployment   ✅ CLOSED — 14/14
B7 Temporal Worker / reference provider             ✅ CLOSED
B8 minimal local API / browser                       ✅ CLOSED
B9 actual Temporal E2E / server evidence             ✅ CLOSED
B10 failure / restart / full-lineage hardening      🟢 NEXT
```

# Try it

```bash
cd build/reference-vertical-slice
npm ci
npm run demo
```

Open:

```text
http://127.0.0.1:8787
```

Full guide:

```text
build/reference-vertical-slice/TRY-ME.md
```

# What the reference app actually does

```text
Canvas source actor=UNKNOWN
→ source preservation / adapter
→ canonical / provenance / validation
→ missing-actor finding
→ explicit actor=Manager correction
→ new revision history
→ semantic freeze
→ capability / human-form / test-provider binding
→ ExecutionPlan
→ Temporal mapping
→ runtime policy
→ deployment design
→ compiled runtime program
→ real local Temporal server
→ real Worker
→ Workflow Update
→ Activity retry / idempotent test-provider effect
→ server-backed Workflow completion/history
```

The approved path intentionally injects one transient Activity/provider failure and proves Temporal retry with one logical provider effect.

The rejected path proves no email Activity is scheduled.

No real email is sent.

# Persistence isolation

```text
.runtime/talos-state.sqlite
.runtime/reference-email-sink.sqlite
```

The first is TALOS reference state. The second is TEST_ONLY provider-effect state. Workflow code accesses neither directly.

# Current evidence

```text
test/103-B7-B9-TEMPORAL-RUNTIME-CI-RESULT.md                 PASS
test/104-B8-TRYABLE-REFERENCE-APP-CI-RESULT-v0.1.md          PASS
test/105-B7-B8-B9-TRYABLE-REFERENCE-GATE-CLOSURE-v0.1.md    CLOSED
```

# Build principles

1. Source adapters do not depend on Temporal directly.
2. UI graph structures do not become domain truth.
3. Temporal runtime structures do not become canonical process truth.
4. Runtime execution pins immutable design identities.
5. Capability bindings remain explicit and versioned.
6. AI-produced semantics preserve truth/provenance classification.
7. Implementation ships with executable evidence for the stage it closes.
8. A frozen-contract defect stops the affected BUILD stage; code never silently patches architecture.
9. A downstream test is not pulled into an earlier stage by fabricating the downstream object it expects.
10. Runtime defaults, retries and environment observations never rewrite accepted business semantics.

# Still not authorized

```text
production BPMN/image/language/n8n adapter implementation
real Gmail/Drive/SaaS connectors
production IAM/secrets
production Temporal deployment
multi-user collaboration expansion
full product visual polish
broad provider/source expansion
```

The intended next action is the first user run of v0.1. B10 follows from observed runtime/usability evidence rather than preemptive feature expansion.
