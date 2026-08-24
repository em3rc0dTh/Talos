# R0-02 — Private Preview Configuration + Secret Contract — Closure Plan v0.1

Status: ACTIVE  
Date: 2026-08-24

## Objective

Close the private-preview startup/configuration boundary without modifying the frozen I9 authority engine.

## Build checklist

```text
R0-02-A  environment schema + safe descriptor                ✅
R0-02-B  closure-held secret materialization                 ✅
R0-02-C  DESIGN_ONLY vs TEMPORAL_EXECUTION coherence         ✅
R0-02-D  DISABLED vs REQUIRED image-provider coherence       ✅
R0-02-E  Host/Origin/request/image policy                    ✅
R0-02-F  adversarial tests                                   ✅ code added
R0-02-G  dedicated CI gate                                   ✅ code added
R0-02-H  exact-head regression certification                 ⏳
R0-02-I  clean PR merge                                      ⏳
```

## Required adversarial proof

- missing workspace/actor/secret blocks config
- weak preview bearer blocks config
- non-loopback bind host blocks config
- non-loopback Host allowlist blocks config
- malformed origin blocks config
- JSON/image limit inconsistency blocks config
- image provider variables conflict with `DISABLED`
- partial provider configuration blocks `REQUIRED`
- provider and access secrets are absent from safe descriptor
- Temporal coordinates conflict with `DESIGN_ONLY`
- partial Temporal target blocks `TEMPORAL_EXECUTION`
- runtime adapters conflict with `DESIGN_ONLY`
- missing runtime adapters block `TEMPORAL_EXECUTION`
- Host/Origin policy rejects out-of-scope requests
- oversized JSON/image request is rejected before I9 forwarding

## Merge gates

```text
R0-01 access regression                 ✅ required
R0-02 config/secret adversarial         ✅ required
Image / full authority regression       ✅ required
B7–B9 real Temporal regression          ✅ required
B10 restart safety                      ✅ required
exact diff / evidence-only audit        ✅ required
```

Unknown is not pass.

## Completion statement allowed only when green

> Talos v0.1 private-preview startup configuration is explicit, fail-closed, loopback-scoped, secret-safe, and cannot claim executable runtime capability without the required runtime contract.

This statement does not claim production IAM, public deployment, multi-tenant security, or live external-provider certification.

## Next gate

R0-03 — Operator Startup / Recovery / Runbook Certification.
