# TALOS — Gated Roadmap v0.57

Status: **I9 CLOSED / R0-01–R0-02 CLOSED / R0-03 OPERATOR RECOVERY ACTIVE**  
Date: **2026-08-24**

## Closed

```text
I0–I7   source/canonical/BPMN/image productization                 ✅
I8      automation-design authority                               ✅
I9-01–07 one-app design → deployment → real workflow execution    ✅
R0-01   private-preview access boundary                           ✅
R0-02   fail-closed configuration + secret contract               ✅
```

## Current gate

```text
R0-03 — OPERATOR STARTUP / SHUTDOWN / DURABLE RECOVERY   ← NOW
```

R0-03 release law:

```text
PROCESS RESTART
    != AUTHORITY REPLAY
    != MID-SESSION RESUMPTION

DURABLE DOMAIN EVIDENCE
    → SAFE RECOVERY INSPECTION
    → FRESH SERVER START
```

R0-03 target:
- one required durable runtime directory
- single-writer operator lock
- stale-lock recovery
- graceful shutdown
- read-only durable evidence inspection
- startup that appends no domain/authority evidence by itself
- explicit `midSessionResumption: NOT_SUPPORTED_V0_1`
- operator runbook usable without developer-only source knowledge

## Private Technical Preview target

```text
1 workspace
1 authenticated preview user
image + BPMN input
process review / correction
automation design
explicit capability decisions
Temporal execution
execution status / evidence
restart-safe durable persistence
one certified real vision provider
one certified real external integration
```

## Remaining release gates

```text
R0-03  Operator startup/shutdown/durable recovery      🟡 ACTIVE
R0-04  Live provider + integration + execution adapters 🔴
R0-05  Final Private Technical Preview certification    🔴
```

## R0-04 target

Certify on real external systems:
1. one commercial/model image-perception provider through the existing credential-safe provider contract
2. one external capability/integration transport invoked by a Talos workflow
3. packaged `TEMPORAL_EXECUTION` operator adapters that use the certified runtime boundaries

Fixture/reference adapters are insufficient.

## R0-05 target

Final candidate must prove one continuous supported preview story:

```text
fresh checkout
→ exact install
→ configure private preview
→ inspect/start operator
→ input BPMN or image
→ review/correct/confirm
→ automation design + explicit decisions
→ runtime/deployment/execution approvals
→ real Temporal workflow
→ real external effect/evidence
→ stop
→ inspect durable evidence
→ restart
→ verify release invariants
```

Only then:

> **Talos v0.1 — Private Technical Preview READY**

The v0.1 preview remains intentionally single-workspace/single-actor and does not claim multi-tenant SaaS or mid-session authority-session resumption.
