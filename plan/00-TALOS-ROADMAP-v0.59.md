# TALOS — Gated Roadmap v0.59

Status: **I9 + R0-01/02/03/04 CLOSED / R0-05 FINAL RELEASE CERTIFICATION ACTIVE**  
Date: **2026-08-24**

## Closed

```text
I0–I7    source/canonical/BPMN/image productization                  ✅
I8       automation-design authority                                ✅
I9-01–07 one-app design → deployment → real workflow execution      ✅
R0-01    private-preview access boundary                            ✅
R0-02    fail-closed configuration + secret contract                ✅
R0-03    operator startup/shutdown/durable evidence recovery        ✅
R0-04A   real Temporal Activity → real GitHub external effect       ✅
R0-04B   real PNG → pinned SmolVLM/CV → Talos BPMN review           ✅
```

## R0-04 certified receipts

### R0-04A

```text
TalosGenericWorkflow
→ executeGenericCapability
→ GitHub issue-comment transport
→ GitHub REST
→ concrete external comment id
→ fresh Worker ledger
→ same effect resolved / no duplicate
```

### R0-04B

Certified PR #49 product head:

```text
991b254774428a6e2e4f07f1ec7fe3cebb8c2388
```

Merged by:

```text
55c670d3ad86803edfecd20dae1d12b3771b12f2
```

Live path:

```text
exact real PNG
→ credential-safe provider binding
→ HuggingFaceTB/SmolVLM-500M-Instruct@a7da5b98…
→ one real literal-text inference
+ deterministic source-pixel BPMN geometry
→ exact response correlation
→ common source evidence
→ INFERRED canonical process
→ non-executable DRAFT BPMN review candidate
```

R0-04B preserves the invariant:

```text
MODEL/PERCEPTION EVIDENCE
    !=
BUSINESS PROCESS CONFIRMATION
    !=
SEMANTIC FREEZE
    !=
EXECUTION AUTHORITY
```

## Current and final gate

```text
R0-05 — FINAL PRIVATE TECHNICAL PREVIEW RELEASE CERTIFICATION   ← NOW
```

R0-05 adds no new product semantics. It must certify one immutable merged-main artifact.

## R0-05 release story

```text
exact SHA checkout
→ exact dependency install
→ architecture + B1–B9
→ complete image I0–I9 authority chain
→ R0-01/02/03 private-preview shell
→ B10 restart/durable recovery
→ explicit workflow-execution authority
→ R0-04A real Temporal → real external effect
→ R0-04B real PNG → real pinned model/CV → admitted review
→ secret-safe evidence proof
→ exact SHA receipt
```

The workflow runs twice:

```text
pull_request run
    → candidate certification only

push to main run
    → exact merged-main certification
    → final release authority
```

## Release target

```text
Scope: TALOS_V0_1_PRIVATE_TECHNICAL_PREVIEW
Tag:   v0.1.0-private-preview
```

Target capabilities:

```text
1 configured workspace
1 authenticated private-preview user
image + BPMN input
process review / correction / confirmation
automation design
explicit integration/capability decisions
ExecutionPlan review + explicit automation approval
runtime/deployment/execution authority separation
real Temporal workflow execution
real external effect + evidence
restart-safe durable persistence
one certified real vision/model pipeline
one certified real external capability transport
```

## Non-goals for v0.1

```text
public-production exposure
multi-tenant IAM
unrestricted hosting
vendor-wide integration certification
autonomous business confirmation
autonomous deployment/execution authority
```

## Remaining gates

```text
R0-05 candidate exact-head certification      🟡
R0-05 merge                                   ⚪
R0-05 exact merged-main certification         ⚪
release tag/notes on certified SHA            ⚪
```

Only after the exact merged-main R0-05 run is green may the repository state:

> **Talos v0.1 — Private Technical Preview READY**
