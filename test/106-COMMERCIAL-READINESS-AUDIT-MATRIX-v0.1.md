# TALOS — Commercial Readiness Audit Matrix v0.1

**Date:** 2026-09-14  
**Purpose:** Human-readable and machine-readable checklist for the gap between a strong technical framework and a sellable product.  
**Verdict rule:** `UNKNOWN` is never treated as `PASS`.

## Status vocabulary

```text
PASS
PARTIAL
UNKNOWN
MISSING
NOT_REQUIRED_YET
REJECTED_CLAIM
```

## Evidence vocabulary

```text
REPO
TEST
REFERENCE_RUN
INTERNAL_USE
EXTERNAL_USE
PAID_USE
NONE
```

# A. Product identity and semantics

| ID | Criterion | Current | Evidence | Commercial meaning |
|---|---|---:|---|---|
| CR-A01 | Product identity is more than BPMN→Temporal | PASS | REPO | Differentiated architectural thesis exists |
| CR-A02 | Canonical meaning is separated from source identity | PASS | REPO/TEST | Supports source-preserving normalization |
| CR-A03 | Business intent can differ from implemented behavior | PASS | REPO/TEST | Enables drift/conflict reasoning |
| CR-A04 | Truth/confidence/readiness/execution are distinct | PASS | REPO/TEST | Prevents unsafe certainty collapse |
| CR-A05 | Vertical-specific semantics do not leak into Core | PARTIAL | REPO/REFERENCE_RUN | Must be challenged by more distinct real processes |
| CR-A06 | Canonical revision freeze is reproducible | PARTIAL | TEST | Re-audit against current product surface |
| CR-A07 | Evidence/claim/conflict model survives real customer ambiguity | UNKNOWN | NONE | Core commercial thesis not externally proven |

# B. Source → runtime chain

| ID | Criterion | Current | Evidence | Commercial meaning |
|---|---|---:|---|---|
| CR-B01 | Source preserved before interpretation | PASS | REPO/TEST | Trust boundary exists |
| CR-B02 | Review/correction creates new governed history | PASS | REPO/TEST | Human authority is explicit |
| CR-B03 | Validation is separate from source mutation | PASS | REPO/TEST | Safer governance |
| CR-B04 | ExecutionPlan is explicit | PASS | REPO/TEST | Compiler boundary exists |
| CR-B05 | Runtime executes a plan rather than inventing business meaning | PARTIAL | REFERENCE_RUN | Needs current boundary audit |
| CR-B06 | Runtime→source lineage exists under normal run | PARTIAL | REFERENCE_RUN | Strong value hypothesis |
| CR-B07 | Lineage survives restart/recovery/failure | UNKNOWN | NONE | Important trust gap |
| CR-B08 | External user can understand lineage without internal help | UNKNOWN | NONE | Product UX requirement |

# C. Product surface

| ID | Criterion | Current | Evidence | Commercial meaning |
|---|---|---:|---|---|
| CR-C01 | Tryable browser/reference app exists | PASS | REPO/REFERENCE_RUN | Not only library/CLI |
| CR-C02 | One-App source intake exists | PASS | REPO | Product surface progressing |
| CR-C03 | One-App review/correction workspace exists | PASS | REPO | Human review surface exists |
| CR-C04 | End-to-end external user journey is coherent | UNKNOWN | NONE | Must be audited hands-on |
| CR-C05 | Product explains limitations clearly | PARTIAL | REPO | Required before external pilot |
| CR-C06 | Full visual polish | MISSING | REPO | Not a pilot blocker if usability is sufficient |
| CR-C07 | Non-technical operations user can use it | UNKNOWN | NONE | Important for Ops ICP |

# D. Capability and integrations

| ID | Criterion | Current | Evidence | Commercial meaning |
|---|---|---:|---|---|
| CR-D01 | Capability requirement is distinct from provider binding | PASS | REPO/TEST | Avoids connector-driven Core |
| CR-D02 | Input/output contract is modeled | PASS/PARTIAL | REPO/TEST | Audit current coverage |
| CR-D03 | Retry/timeout semantics are modeled | PASS/PARTIAL | REPO/TEST | Execution reliability |
| CR-D04 | Idempotency is demonstrated in reference provider | PASS | REFERENCE_RUN | Strong runtime evidence |
| CR-D05 | Real external provider integration is certified | MISSING | REPO | Explicitly outside current reference claim |
| CR-D06 | Capability reuse is proven across customers | UNKNOWN | NONE | Commercial repeatability test |
| CR-D07 | Large connector catalog | NOT_REQUIRED_YET | NONE | Do not build before proof |

# E. Durability and runtime

| ID | Criterion | Current | Evidence | Commercial meaning |
|---|---|---:|---|---|
| CR-E01 | Real Temporal worker/reference execution exists | PASS | REFERENCE_RUN | Durable backend is real |
| CR-E02 | Retry behavior is exercised | PASS | REFERENCE_RUN | Reference durability evidence |
| CR-E03 | Human workflow update path exists | PASS | REFERENCE_RUN | Long-running human interaction path |
| CR-E04 | Restart/recovery behavior is certified | PARTIAL/UNKNOWN | REPO | Full hardening audit required |
| CR-E05 | Production Temporal deployment is certified | MISSING | REPO | Explicitly outside current claim |
| CR-E06 | Runtime evolution policy is ready for external pilots | PARTIAL | REPO | Must be reviewed |

# F. Customer access and operational boundaries

| ID | Criterion | Current | Evidence | Commercial meaning |
|---|---|---:|---|---|
| CR-F01 | Customer access boundary | UNKNOWN | REPO | Must be explicitly bounded before external pilot |
| CR-F02 | Role/permission model | UNKNOWN | REPO | Required for multi-user operation |
| CR-F03 | Credential handling boundary | UNKNOWN | REPO | Required for real integrations |
| CR-F04 | Customer/tenant isolation | UNKNOWN | NONE | Required before multi-customer production |
| CR-F05 | Operational audit events | UNKNOWN | NONE | Required for governance story |
| CR-F06 | Environment separation | UNKNOWN | NONE | Required for repeatable pilots |

# G. Operations and packaging

| ID | Criterion | Current | Evidence | Commercial meaning |
|---|---|---:|---|---|
| CR-G01 | Reproducible local run guide | PASS | REPO | Reference usability |
| CR-G02 | Reproducible pilot deployment | UNKNOWN | NONE | Required before paid pilot |
| CR-G03 | Operator-facing observability | PARTIAL/UNKNOWN | REPO | Must exceed debug-only visibility |
| CR-G04 | Recovery procedure | UNKNOWN | NONE | Customer trust |
| CR-G05 | External support runbook | UNKNOWN | REPO | Required for external support |
| CR-G06 | Support ownership boundary | MISSING | NONE | Commercial operations |
| CR-G07 | Versioned release/package process | PARTIAL | REPO | Needs commercial packaging |

# H. Market evidence

| ID | Criterion | Current | Evidence | Commercial meaning |
|---|---|---:|---|---|
| CR-H01 | Real external process onboarded | UNKNOWN | NONE | Design-partner gate |
| CR-H02 | Material ambiguity found and accepted by stakeholder | UNKNOWN | NONE | Proves discovery value |
| CR-H03 | Buyer identified | UNKNOWN | NONE | Go-to-market |
| CR-H04 | Budget owner identified | UNKNOWN | NONE | Monetization |
| CR-H05 | Buyer paid | MISSING | NONE | Commercial proof |
| CR-H06 | Measurable business value improvement | UNKNOWN | NONE | Pricing/value proof |
| CR-H07 | Second distinct customer/process completed | MISSING | NONE | Repeatability |
| CR-H08 | No Core rewrite for second customer | UNKNOWN | NONE | Product architecture |
| CR-H09 | Renewal/continuation signal | MISSING | NONE | Product value |
| CR-H10 | Product-market fit | REJECTED_CLAIM | NONE | Far beyond current evidence |

# I. Current readiness verdict

The matrix does **not** certify a percentage. A percentage would hide that some missing items matter much more than others.

```text
CR0 Architecture Research      PASSED historically for bounded spine
CR1 Framework Works            STRONG EVIDENCE
CR2 Internal Product           PARTIAL / advancing
CR3 Design Partner Ready       NOT CERTIFIED
CR4 Paid Pilot Ready           NOT CERTIFIED
CR5 Repeatable Pilot           NOT PROVEN
CR6 Commercial Product         NOT PROVEN
CR7 Scale Ready                NOT EVALUATED
```

## Highest-value next proof

```text
REAL EXTERNAL PROCESS
→ MULTIPLE REAL SOURCES
→ REAL AMBIGUITY
→ HUMAN RESOLUTION
→ FROZEN CANONICAL
→ CAPABILITY BINDING
→ EXECUTION PLAN
→ BOUNDED RUN
→ TRACEABILITY
→ MEASURED VALUE
```

Then repeat with a materially different process.

# J. Explicit non-claims

Until evidence changes, do not state:

```text
Talos is production ready.
Talos is enterprise ready.
Talos is multi-tenant certified.
Talos supports any business process.
Talos automatically knows business truth.
Talos replaces Temporal/Camunda/n8n/process mining.
Talos has proven product-market fit.
Talos reduces cost by X%.
Talos reduces implementation time by X%.
```

These may become valid later. They are not repository-certified product truths today.
