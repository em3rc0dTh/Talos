# TALOS — Gated Roadmap v0.56

Status: **I9 CLOSED / R0 PRIVATE TECHNICAL PREVIEW ACTIVE**  
Date: **2026-08-24**

## Closed engineering chain

```text
I0–I7   source intake / canonical / BPMN / confirmation / arbitrary image    ✅
I8      automation design authority                                           ✅
I9-01   one-app native BPMN E2E                                               ✅
I9-02   image input through same one-app shell                                ✅
I9-03   explicit RuntimePolicy                                                ✅
I9-04   Deployment Design                                                     ✅
I9-05   Environment Realization                                               ✅
I9-06   explicit deployment approval + real Worker attempt                    ✅
I9-07   explicit workflow execution authority + real Temporal execution       ✅
R0-01   private-preview bearer/workspace/actor access boundary                ✅
```

## Current gate

```text
R0-02 — PRIVATE PREVIEW CONFIGURATION + SECRET CONTRACT   ← NOW
```

Goal:

```text
operator environment
        ↓
fail-closed configuration resolver
        ↓
safe immutable descriptor
        +
closure-held secret material
        ↓
coherent DESIGN_ONLY or TEMPORAL_EXECUTION startup
        ↓
R0-01 access boundary
        ↓
certified I9 engine
```

R0-02 must prove:

1. access configuration is complete and secret-safe
2. preview server remains loopback scoped
3. Host/Origin policy is exact and fail-closed
4. request/image limits are explicit and enforced
5. image provider is explicitly DISABLED or completely REQUIRED
6. provider bearer material never appears in safe configuration/status
7. DESIGN_ONLY cannot silently receive execution adapters/coordinates
8. TEMPORAL_EXECUTION cannot start without complete target coordinates/adapters
9. configuration validity never creates any I9 authority
10. R0-01 + Image + Temporal + restart regressions remain green

## Private Technical Preview target

```text
Talos v0.1 — PRIVATE TECHNICAL PREVIEW

1 workspace
1 authenticated preview user
image + BPMN input
process review / correction
automation design
explicit capability decisions
Temporal execution
execution status / evidence
restart-safe persistence
one certified real vision provider
one certified real external integration
```

## Remaining release gates

```text
R0-02  Config + secrets                                       🟡 ACTIVE
R0-03  Operator startup / shutdown / restart / recovery       🔴
R0-04  Live external provider + integration proof             🔴
R0-05  Final Private Technical Preview certification          🔴
```

## R0-03 target

A fresh operator can follow one runbook to:

```text
install
→ configure
→ start Talos
→ verify readiness
→ submit BPMN/image
→ complete explicit authority chain
→ run a workflow
→ inspect evidence
→ stop
→ restart
→ recover durable state
```

## R0-04 target

Certify at least:
- one real commercial/model image-perception provider using the existing credential-safe provider contract
- one real external capability/integration transport used by a Talos workflow

Reference/fixture adapters are not sufficient for R0-04.

## R0-05 release statement

Only after all gates are green may the repository state:

> **Talos v0.1 — Private Technical Preview READY**

This release is deliberately not a public multi-tenant SaaS release.
