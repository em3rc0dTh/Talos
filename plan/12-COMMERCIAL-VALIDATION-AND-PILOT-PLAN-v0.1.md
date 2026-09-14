# TALOS — Commercial Validation and Pilot Plan v0.1

**Date:** 2026-09-14  
**Track:** Commercial validation  
**Scope:** Productization evidence only. Does not authorize broad feature expansion.  
**Depends on:** Current Talos technical truth + commercial audit v0.1.

# 1. Objective

Move Talos from:

```text
CR1 — FRAMEWORK WORKS
```

toward:

```text
CR3 — DESIGN PARTNER READY
CR4 — PAID PILOT READY
```

without changing the product thesis merely to satisfy one customer.

The plan prioritizes **evidence** over feature volume.

---

# 2. Commercial validation gates

## CV-00 — Commercial baseline frozen

Required:

- commercial audit stored;
- source capture stored;
- evidence register stored;
- readiness matrix stored;
- README points to the track;
- claims explicitly labeled fact vs hypothesis.

Exit:

```text
PASS when another engineer, product reviewer or LLM can reconstruct:
- what Talos is;
- what is technically proven;
- what is only commercially hypothesized;
- what the next commercial proof must be.
```

## CV-01 — Current product journey audit

Exercise:

```text
Create/enter workspace
→ provide source
→ preserve
→ interpret
→ review
→ correct
→ confirm/freeze
→ validate
→ capability bind
→ compile
→ run
→ observe
→ explain
```

For every stage record:

```text
EXISTS
PARTIAL
CLI_ONLY
INTERNAL_API
REFERENCE_ONLY
MISSING
BROKEN
NOT_PRODUCTIZED
CERTIFIED
```

No implementation expansion is authorized merely because a stage is inconvenient.

First classify.

## CV-02 — Pilot safety boundary

Minimum review:

```text
authentication
authorization
tenant/customer isolation strategy
secret/credential boundary
audit events
data retention
backup/recovery
environment separation
deployment reproducibility
support/runbook boundary
```

Exit is not “enterprise complete.”

Exit is:

> Safe enough to expose a bounded pilot to an explicitly scoped external design partner.

## CV-03 — Pilot package

Define one bounded offer:

# PROCESS-TO-EXECUTION AUDIT PILOT

Inputs:

- one real process;
- available sources;
- named process owner/reviewer;
- bounded integration surface;
- agreed data sensitivity;
- agreed success metrics.

Outputs:

- source inventory;
- claims/evidence/conflict map;
- canonical revision;
- validation assessment;
- capability map;
- ExecutionPlan;
- bounded execution;
- traceability report;
- pilot findings.

## CV-04 — Design Partner A

Select a process with:

```text
at least 2 materially different sources
at least 1 ambiguity or conflict
at least 1 human authority point
at least 1 external capability
meaningful durable or multi-step behavior
```

Measure:

- discovery time;
- ambiguities surfaced;
- corrections required;
- reviewer effort;
- time to freeze;
- time to ExecutionPlan;
- execution defects;
- traceability completeness.

Do not optimize solely for a beautiful demo.

## CV-05 — Paid Pilot A

The commercial test is:

```text
Does a buyer pay for the outcome?
```

Record:

- buyer role;
- budget owner;
- buying reason;
- rejected alternatives;
- price / structure;
- implementation/support effort;
- measurable value;
- renewal/continuation signal.

Pricing remains an experiment.

## CV-06 — Distinct Customer / Process B

Customer/process B must differ materially from A.

Pass conditions:

```text
NO new Core semantic type solely for the customer
NO domain-specific condition embedded in generic runtime
NO special review authority bypass
NO customer-specific truth rule inside compiler
```

Allowed:

```text
new adapter
new capability offering
new vertical vocabulary/pack
new configuration
new forms/UI hints
```

## CV-07 — Repeatability verdict

Compare A and B.

Classify every customer-specific change:

```text
DATA
CONFIG
ADAPTER
CAPABILITY
VERTICAL_PACK
CORE_CHANGE
```

Commercial product evidence strengthens only if the majority of variation stays outside Core.

---

# 3. Buyer discovery track

Run discovery separately from implementation.

Questions must test the problem, not sell the solution.

Examples:

1. How do you currently determine the authoritative version of a process?
2. What happens when BPMN/SOP/software behavior disagree?
3. Who decides which interpretation becomes implementation?
4. Where is that decision recorded?
5. Can you trace a production behavior back to an approved requirement?
6. How costly is process discovery before automation?
7. How often does implementation need rework because requirements were ambiguous?
8. Who owns the budget for fixing this?
9. What tools are already used?
10. What event would justify paying for a new system?

Avoid leading questions such as:

```text
"Would provenance be valuable?"
```

Prefer:

```text
"Tell me about the last time you had to explain why an automated decision existed."
```

---

# 4. Candidate ICP order

Current hypothesis order:

```text
1. Automation consultancies / system integrators
2. Software / platform teams
3. High-cost-of-error operational teams
4. Process excellence / transformation organizations
```

This order is not a market conclusion.

It exists to prioritize discovery.

---

# 5. Product constraints during validation

Do not build by default:

- broad connector catalog;
- own workflow runtime;
- process-mining platform;
- generic RPA;
- agent marketplace;
- large vertical catalog;
- billing platform;
- enterprise admin suite unrelated to pilot safety.

Every proposed feature must answer:

> Which commercial hypothesis does this test?

If the answer is none, defer it.

---

# 6. Pilot readiness checklist

Before CV-04 external exposure:

```text
[ ] target process approved
[ ] data classification known
[ ] source handling boundary known
[ ] user/role access bounded
[ ] secrets not hard-coded
[ ] runtime failure path understood
[ ] restart/recovery behavior documented
[ ] audit evidence retained
[ ] support owner identified
[ ] rollback/stop procedure defined
[ ] limitations disclosed
[ ] no production-readiness overclaim
```

---

# 7. Success criteria

Talos does not pass commercial validation because a workflow executes.

A successful validation cycle should produce evidence for at least:

```text
PROBLEM VALUE
PROCESS RECONSTRUCTION VALUE
AMBIGUITY / CONFLICT VALUE
TRACEABILITY VALUE
IMPLEMENTATION VALUE
WILLINGNESS TO PAY
REPEATABILITY
```

## Minimum useful outcome

Even if the pilot does not convert commercially, it is useful if it clearly falsifies or narrows a hypothesis.

Example:

```text
"Engineering teams do not pay for provenance,
but automation consultancies do because it reduces discovery/rework."
```

That is a productive result.

---

# 8. Commercial decision after two pilots

Choose one:

```text
GO — PRODUCTIZE
The same core solves repeated paid problems.

GO — SERVICE-LED
Talos creates value but requires high-touch delivery; productize gradually.

NARROW ICP
Value is strong only for a specific buyer/process class.

PIVOT PROPOSITION
Technical platform is useful but the hypothesized commercial value is wrong.

STOP COMMERCIAL EXPANSION
No meaningful willingness to pay or repeatable value.
```

No result should be hidden to protect the original thesis.

---

# 9. Exit from this plan

This plan is complete only when Talos can answer with evidence:

```text
Who pays?
For which problem?
Why Talos instead of the current method?
What measurable value is created?
What must Talos do itself?
What can remain service-assisted?
Can a second customer use the same Core?
What are the minimum safety/product requirements?
```

Until then, commercialization remains an active experiment.
