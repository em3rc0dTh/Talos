# TALOS — Gated Roadmap v0.55

Status: **I9 CLOSED / R0 PRIVATE TECHNICAL PREVIEW OPEN**  
Date: **2026-08-24**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.54.md`  
Historical roadmap versions remain preserved.

## Product law

> **Talos normalizes and standardizes business processes without erasing their origin.**

## Closed technical authority chain

```text
SOURCE ARTIFACT
    ↓
SOURCE-AWARE INTERPRETATION
    ↓
CANONICAL PROCESS MODEL
    ↓
SEMANTIC VALIDATION
    ↓
PROCESS CONFIRMATION
    ↓
AUTOMATION-DESIGN FREEZE
    ↓
AUTOMATION DESIGN WORKSPACE
    ↓
EXPLICIT CAPABILITY SELECTION / BINDING
    ↓
EXECUTION PLAN REVIEW
    ↓
EXPLICIT AUTOMATION APPROVAL
    ↓
APPROVED TEMPORAL MAPPING
    ↓
EXPLICIT RUNTIME POLICY
    ↓
DEPLOYMENT DESIGN
    ↓
ENVIRONMENT REALIZATION
    ↓
EXPLICIT DEPLOYMENT APPROVAL
    ↓
DEPLOYMENT ATTEMPT
    ↓
EXPLICIT WORKFLOW EXECUTION APPROVAL
    ↓
REAL TEMPORAL EXECUTION
    ↓
DURABLE EXECUTION OBSERVATION
```

No upstream state silently grants downstream authority.

## Closed phases

```text
PHASE 1 — CANONICAL SEMANTICS                 ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING                 ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW                ✅ CLOSED
PHASE 4 — CAPABILITY MODEL                    ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL            ✅ CLOSED
PHASE 6 — REFERENCE VERTICAL SLICE            ✅ CLOSED
I7 — ARBITRARY-IMAGE PRODUCTIZATION           ✅ CLOSED
I8 — AUTOMATION DESIGN AUTHORITY              ✅ CLOSED
I9 — ONE-APP AUTHORITY + REAL TEMPORAL E2E    ✅ CLOSED
```

## I9 closure

```text
I9-01 Native BPMN one-app E2E                  ✅
I9-02 Image input through same one-app shell   ✅
I9-03 Explicit RuntimePolicy                   ✅
I9-04 Explicit Deployment design               ✅
I9-05 Environment realization                  ✅
I9-06 Deployment approval + Worker attempt     ✅
I9-07 Workflow execution authority             ✅
```

I9-07 exact-head certification:

```text
Image / full authority edge   ✅
B7–B9 real Temporal           ✅
B10 restart safety            ✅
```

# R0 — TALOS v0.1 PRIVATE TECHNICAL PREVIEW

Status: **OPEN**

R0 is release hardening, not semantic expansion. The objective is to expose the proven engine through a controlled, reproducible preview boundary while preserving every frozen authority law.

## R0-01 — Private Preview Access Boundary

Status: **🟡 ACTIVE**

Required properties:

- certified I9 engine remains loopback-only behind the preview shell;
- exact bearer credential required;
- exact configured workspace required;
- exact configured actor required;
- caller-supplied authority-actor impersonation rejected before domain side effects;
- bearer material never forwarded to I9 or returned by status/health;
- no multi-tenant, public IAM or production-security claim;
- all I8/I9 business/automation/deployment/execution authority gates remain explicit.

Certification target:

```text
R0 access/adversarial gate      ⏳
Image / authority regression    ⏳
B7–B9 Temporal regression       ⏳
B10 restart regression          ⏳
```

## R0-02 — Preview Configuration + Secret Contract

Status: **PENDING**

Define fail-closed runtime configuration for preview access, secret references, provider enablement, allowed host/origin policy, request/file limits, deployment coordinates and secret-safe diagnostics.

## R0-03 — Preview Operator UX / Runbook

Status: **PENDING**

One invited operator must have a reproducible path to:

```text
start Talos
→ provide image/BPMN
→ review/confirm process
→ design automation
→ explicitly select capabilities
→ review/approve execution design
→ explicitly design runtime/deployment policy
→ authorize deployment
→ authorize workflow execution
→ inspect durable execution evidence
```

## R0-04 — Live External Boundary Certification

Status: **PENDING**

Before a broader preview claim, certify at least:

- one live commercial vision-provider credential path; and
- one real external capability transport;

with secret-safe evidence and exact runtime/provider identity.

## R0-05 — Release Certification

Status: **PENDING**

Release requires:

```text
all required R0 gates green
exact build SHA identified
runtime profile identified
preview limitations documented
operator runbook reproducible
no UNKNOWN represented as PASS
```

# Current authoritative state

```text
Talos technical engine               ✅ CLOSED through I9-07
R0 Private Technical Preview         🟡 OPEN
R0-01 Access Boundary                🟡 ACTIVE
R0-02 Configuration/Secret Contract  ⚪ PENDING
R0-03 Operator UX/Runbook            ⚪ PENDING
R0-04 Live External Certification    ⚪ PENDING
R0-05 Release Certification          ⚪ PENDING
```

## Immediate next move

```text
CLOSE R0-01 WITH EXACT-HEAD CI EVIDENCE
```
