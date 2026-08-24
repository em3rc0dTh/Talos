# TALOS — Gated Roadmap v0.58

Status: **I9 + R0-01/02/03 CLOSED / R0-04 EXTERNAL REALITY ACTIVE**  
Date: **2026-08-24**

## Closed

```text
I0–I7    source/canonical/BPMN/image productization                  ✅
I8       automation-design authority                                ✅
I9-01–07 one-app design → deployment → real workflow execution      ✅
R0-01    private-preview access boundary                            ✅
R0-02    fail-closed configuration + secret contract                ✅
R0-03    operator startup/shutdown/durable evidence recovery        ✅
```

## Current gate

```text
R0-04 — LIVE EXTERNAL PROVIDER + INTEGRATION PROOF   ← NOW
```

R0-04 is two required sub-gates:

```text
R0-04A  real Temporal Activity → real external capability effect    🟡 LIVE PROOF OBSERVED / FINAL HEAD PENDING
R0-04B  real image → real supported model/provider inference         🔴 ACTIVE
```

## R0-04A candidate proof

```text
TalosGenericWorkflow
→ executeGenericCapability
→ GitHub issue-comment transport
→ GitHub REST
→ real PR comment
→ fresh Worker ledger
→ same external comment / no duplicate
```

Observed on PR #48 at head `a6ffd80e2166326a61103a026b671f9e0885271a`, external comment id `5399583362`.

GitHub is a replaceable certification adapter, not process semantics or a product-default integration.

## R0-04B target

```text
real PNG
→ credential-safe provider runtime binding
→ live supported model/provider
→ correlated provider response
→ provider/model evidence
→ common source evidence
→ BPMN/process review candidate
```

No fixture, fake receipt, retired provider, or hand-authored model response can close this gate.

## Private Technical Preview target

```text
1 workspace
1 authenticated preview user
image + BPMN input
process review / correction
automation design
explicit capability decisions
real Temporal execution
execution status / evidence
restart-safe durable persistence
one certified real vision provider
one certified real external integration
```

## Remaining gates

```text
R0-04A  Live external integration          🟡 final exact-head merge pending
R0-04B  Live vision provider               🔴
R0-05   Final release certification        🔴
```

## R0-05 release story

```text
fresh checkout
→ exact install
→ configure private preview
→ inspect/start operator
→ input real image or BPMN
→ review/correct/confirm process
→ automation design + explicit decisions
→ runtime/deployment/execution approvals
→ real Temporal Workflow
→ real external effect + evidence
→ stop
→ inspect durable evidence
→ restart
→ verify release invariants
```

Only after R0-04A + R0-04B + R0-05 are green may the repository state:

> **Talos v0.1 — Private Technical Preview READY**
