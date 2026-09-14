# BRAINSTORMING AUDITORIA - ANÁLISIS COMERCIAL TALOS

**Version:** v0.1  
**Date:** 2026-09-14  
**Document class:** BRAINSTORMING + COMMERCIAL AUDIT  
**Audience:** Humans and LLMs  
**Repository truth baseline:** `main` at `b37f754033c6252e6041d1ca25a299419320cd07` when this document was authored.  
**Status:** ACTIVE COMMERCIAL HYPOTHESIS — NOT A SALES CLAIM, NOT A RELEASE CERTIFICATION.

## 0. How to read this document

This document deliberately separates what Talos **already proves technically** from what we **believe may have commercial value**.

Use these labels:

- **FACT_REPO** — directly supported by the repository state inspected for this audit.
- **SOURCE_DERIVED** — inherited from the preserved `CURRENT TALOS AUDIT` source.
- **COMMERCIAL_HYPOTHESIS** — plausible value proposition that must be tested with real users/buyers.
- **DECISION** — current Talos product-direction decision.
- **OPEN_QUESTION** — must not be promoted to truth until evidence exists.
- **DO_NOT_CLAIM** — statement that would exceed current evidence.

Companion documents:

```text
evidence/sources/2026-09-14-CURRENT-TALOS-AUDIT-SOURCE.md
evidence/commercial/00-COMMERCIAL-AUDIT-EVIDENCE-REGISTER-v0.1.md
plan/12-COMMERCIAL-VALIDATION-AND-PILOT-PLAN-v0.1.md
test/106-COMMERCIAL-READINESS-AUDIT-MATRIX-v0.1.md
```

---

# 1. Executive summary — 100 words

Talos has a **strong commercial thesis**, but it is not yet a fully sellable product. Its value is not replacing Temporal, Camunda or n8n; it is turning messy business processes into **trustworthy, traceable, validated and executable models** while preserving origin, evidence, conflict and human authority. The most promising initial buyers are software/platform teams, automation consultancies and organizations with complex operations. Before broad commercial release Talos still needs productization, security, UX, multi-tenancy, packaging and real pilots. The decisive test is repeatability: different customers and verticals must reach reliable ExecutionPlans **without requiring Talos Core to be rewritten**.

---

# 2. Starting point: what Talos is

**FACT_REPO**

The repository defines TALOS as a source-aware process-intelligence and durable-execution system whose responsibility is to normalize and standardize business processes while preserving truth, semantics, provenance, evidence, uncertainty, conflict and source-specific meaning.

Its system law is stronger than “convert a diagram into a workflow”:

```text
PROCESS EXPRESSION
        ↓
PRESERVE SOURCE + VERSIONED ADAPTER
        ↓
CANONICAL MODEL + PROVENANCE + SEMANTIC VALIDATION
        ↓
HUMAN EXPLANATION + REVIEW
        ↓
CORRECTION / CONFIRMATION / SEMANTIC FREEZE
        ↓
CAPABILITY / HUMAN-FORM / EXPLICIT BINDING
        ↓
EXECUTION PLAN
        ↓
TEMPORAL MAPPING
        ↓
RUNTIME POLICY
        ↓
DEPLOYMENT / RUNTIME OBSERVATION
```

The repository also explicitly rejects collapsing important semantic distinctions:

```text
SOURCE TRUTH != confidence != readiness != execution
source identity != canonical identity
implemented behavior != business intent
review correction != source rewrite
CapabilityRequirement != Offering != Binding
DeploymentRevision != Attempt != Observation != WorkflowExecution
```

This matters commercially because Talos is not merely selling workflow execution. It is attempting to create **trust between process knowledge and execution**.

---

# 3. Current technical truth that affects the commercial analysis

**FACT_REPO**

At the repository baseline inspected for this audit:

1. Canonical semantics, input understanding, explanation/review, capability model and Temporal execution model are documented as closed architectural phases for the bounded reference work.
2. A Reference Vertical Slice exists and is tryable.
3. The reference slice exercises source preservation, canonical/provenance/validation, explicit correction, semantic freeze, capability binding, ExecutionPlan generation, Temporal mapping and durable execution.
4. Later `main` commits go beyond the older v0.31 roadmap and add a One-App process review/correction workspace.
5. The active repository still contains explicit boundaries against claiming production IAM/secrets, broad real provider integrations, full multi-user collaboration, broad source/provider expansion or full product polish.
6. The v0.31 roadmap still names B10 failure/restart/full-lineage hardening as next. Later commits do not, by themselves, prove B10 closure.

**DECISION**

The commercial audit must therefore avoid two false extremes:

```text
FALSE EXTREME A
"Talos is only an idea."

FALSE EXTREME B
"Talos is already a finished commercial platform."
```

The more accurate position is:

```text
Talos has a materially implemented and testable technical spine,
but commercial repeatability and product readiness remain separate gates.
```

---

# 4. The commercial problem Talos may solve

**COMMERCIAL_HYPOTHESIS**

Organizations rarely possess one clean, authoritative, executable description of a real process.

The process may be distributed across:

```text
BPMN
SOP / PDF
screenshots
whiteboards
interviews
existing code
legacy automation
email / messages
forms
API behavior
database rules
operator knowledge
actual runtime behavior
```

Those sources can represent different perspectives:

```text
what policy says
what a manager believes
what employees actually do
what software currently implements
what a diagram modeled months ago
what the organization now wants
```

The resulting commercial problem is not simply “how do we automate?”

It is:

> **How do we know what should be automated, what evidence supports it, what remains uncertain, who has authority to resolve conflicts, and what exact approved meaning became runtime behavior?**

Call this the:

# PROCESS DEFINITION → EXECUTION TRUST GAP

Talos is potentially valuable if it can reduce that gap measurably.

---

# 5. What Talos should NOT position itself as

**DECISION**

Talos should not be positioned primarily as:

```text
BPMN → Temporal converter
Temporal UI
generic low-code builder
generic RPA platform
n8n replacement
generic chatbot
"AI automates everything"
process mining engine
own durable execution runtime
```

Those frames either understate the architecture or force Talos into categories where existing products are already optimized around a narrower problem.

Talos may integrate with, compile toward, ingest from or coexist with those categories without needing to replace them.

---

# 6. The core commercial proposition

**COMMERCIAL_HYPOTHESIS**

The strongest current proposition is:

> **Talos turns messy business processes into trustworthy executable workflows.**

A more precise technical-commercial formulation:

> **Talos transforms heterogeneous business-process evidence into governed, validated and executable process definitions while preserving provenance and human authority.**

A third formulation focused on explainability:

> **Know what your automation is doing, why it is doing it, who authorized the rule, and where that rule came from.**

These are hypotheses until customer evidence exists.

---

# 7. Why the provenance chain matters commercially

**SOURCE_DERIVED + FACT_REPO**

The historical audit identified complete lineage as an architectural test:

```text
Runtime Event
    ↓
Capability Binding
    ↓
ExecutionPlan Node
    ↓
Canonical Node
    ↓
Canonical Revision
    ↓
Claim
    ↓
Evidence
    ↓
Source
```

Commercially, this could become one of Talos' strongest product moments.

A buyer should eventually be able to select a runtime step and ask:

```text
WHY DOES THIS EXIST?
```

Talos should be capable of answering with a trace such as:

```text
This runtime action came from ExecutionPlan P-12.
P-12 compiled Canonical Node N-22.
N-22 is supported by Claim C-103.
C-103 is based on Source S-07.
The source and another artifact disagreed.
The conflict was reviewed by an authorized human.
Canonical Revision R-12 incorporated that decision.
```

**OPEN_QUESTION**

Does this traceability save enough time, risk or audit effort that customers will pay for it?

That must be measured, not assumed.

---

# 8. Human authority is part of the product

**DECISION**

Human-in-the-loop is not a temporary defect to remove.

Talos should distinguish:

```text
Can AI infer this?
```

from:

```text
Does AI have authority to decide this?
```

AI may propose:

```text
"Approval threshold appears to be $10,000."
```

AI must not silently convert that proposal into:

```text
"Approval threshold is now $10,000."
```

without a valid authority path.

This is particularly relevant when Talos later coordinates agents. An AI agent can be powerful while remaining constrained by:

```text
process context
current state
allowed capabilities
authority boundaries
validated semantics
durable execution
```

---

# 9. Who may pay first

The following are **commercial hypotheses**, not validated ICPs.

## ICP-1 — Software / Platform teams

Potential buyers:

```text
VP Engineering
Head of Platform
Principal Engineer
Software Architect
Engineering Manager
CTO in smaller organizations
```

Typical process characteristics:

```text
long-running work
human approval
external APIs
durable waits
timeouts
retries
compensation
multiple systems
audit requirements
AI + human coordination
```

Possible value:

- less semantic ambiguity before implementation;
- stronger traceability from requirement to runtime;
- fewer business semantics embedded directly in workflow/runtime code;
- safer change review.

**Priority hypothesis:** HIGH.

## ICP-2 — Automation consultancies / system integrators

These organizations repeatedly reconstruct a client's “real process” before implementation.

The input frequently looks like:

```text
old diagram
new manager explanation
ERP behavior
spreadsheet rules
existing n8n flow
consultant notes
tribal knowledge
```

Talos could become a repeatable delivery system:

```text
client evidence
→ governed process model
→ validated automation design
→ execution
```

One consultancy can reuse the platform across multiple clients.

**Priority hypothesis:** VERY HIGH FOR PILOT EXPLORATION.

## ICP-3 — Process Excellence / Operations Transformation

Potential buyers:

```text
COO
Head of Operations
Process Excellence Lead
Automation CoE
Business Transformation
```

This segment may be strategically large but requires much stronger end-user UX. These users should not need Temporal vocabulary.

Their journey should feel like:

```text
PROVIDE SOURCE
→ UNDERSTAND
→ REVIEW
→ CONFIRM
→ VALIDATE
→ AUTOMATE
→ OBSERVE
```

**Priority hypothesis:** MEDIUM/HIGH after product surface hardening.

## ICP-4 — High-cost-of-error processes

This is a cross-industry hypothesis rather than one vertical.

Talos may be especially valuable where organizations repeatedly need to answer:

```text
Why did the system do this?
Which approved revision authorized it?
Who confirmed this interpretation?
What evidence supported the rule?
What changed?
```

**Priority hypothesis:** HIGH VALUE, but market proof required.

---

# 10. Who should NOT be the first customer

**DECISION**

Do not optimize the first commercial release for a microbusiness that only needs:

```text
form
→ webhook
→ email
→ spreadsheet
```

If the buying criterion is “the cheapest way to connect two SaaS products,” Talos enters the wrong competition.

Simple workflow automation can be an integration target or downstream use case. It should not define Talos' initial product identity.

---

# 11. The product journey that must exist

The audit should judge the complete user journey, not only backend capability.

```text
NEW USER
   ↓
Create workspace
   ↓
Provide source
   ↓
Talos preserves and interprets
   ↓
Review ambiguity
   ↓
Resolve conflicts
   ↓
Confirm model
   ↓
Validate
   ↓
Bind capabilities
   ↓
Compile
   ↓
Deploy
   ↓
Run
   ↓
Observe
   ↓
Explain execution
```

Each stage should receive one product status:

```text
EXISTS
PARTIAL
CLI_ONLY
INTERNAL_API
REFERENCE_ONLY
MOCK
MISSING
BROKEN
NOT_PRODUCTIZED
CERTIFIED
```

A technically working backend is not enough if an external user cannot understand or safely operate the journey.

---

# 12. Product surfaces — conceptual packaging

These are conceptual responsibilities, not commitments to separate SKUs.

## TALOS Intake

- source ingestion;
- source identity;
- immutable source preservation;
- adapter boundary;
- interpretation entry point.

## TALOS Review

- claims;
- ambiguities;
- conflicts;
- confidence;
- human authority;
- corrections;
- confirmation.

## TALOS Canvas

Not merely a diagram editor.

A process element should eventually answer:

```text
What am I?
Why do I exist?
Where did I come from?
What depends on me?
Am I confirmed?
Am I executable?
```

## TALOS Validate

- semantic assessment;
- missing information;
- unresolved conflicts;
- execution-readiness blockers;
- unsupported assumptions.

## TALOS Capabilities

- capability requirements;
- offerings;
- bindings;
- input/output schemas;
- retry and timeout semantics;
- idempotency boundary;
- side effects;
- compensation;
- credentials references.

## TALOS Compile

```text
Frozen Canonical Revision
+
Validation Assessment
+
Capability Bindings
        ↓
ExecutionPlan Revision
```

## TALOS Run

- deployment;
- start;
- durable waits;
- signals/updates;
- cancellation;
- restart/recovery;
- runtime observation.

## TALOS Trace

- runtime → plan → canonical → evidence;
- revision explanation;
- change impact;
- audit/export.

---

# 13. The commercial demo

**DECISION**

The demo should start with disorder, not with a blank canvas.

Input example:

```text
SOP.pdf
old BPMN
screenshot
existing automation
manager explanation
```

Expected Talos narrative:

```text
17 process statements found
11 directly supported
3 inferred
2 conflict with another source
1 required rule missing
1 implemented behavior not supported by documented business intent
```

Then:

```text
REVIEW
→ resolve conflicts
→ confirm authority
→ freeze canonical revision
→ validate
→ bind capabilities
→ compile
→ execute
→ inspect lineage
```

The final “wow” moment should be runtime explainability:

```text
RUNNING ACTIVITY
→ ExecutionPlan
→ Canonical meaning
→ Claim
→ Evidence
→ Source
→ Human decision
```

---

# 14. Commercial readiness ladder

Talos should not be classified only as READY / NOT READY.

Use:

| Level | Meaning |
|---|---|
| **CR0** | Architecture Research |
| **CR1** | Framework Works |
| **CR2** | Internal Product |
| **CR3** | Design Partner Ready |
| **CR4** | Paid Pilot Ready |
| **CR5** | Repeatable Pilot |
| **CR6** | Commercial Product |
| **CR7** | Scale Ready |

### CR1 — Framework Works

Core invariants are demonstrated in bounded technical evidence.

### CR2 — Internal Product

The Talos team can complete the full journey itself.

### CR3 — Design Partner Ready

An external organization can complete a bounded real-process engagement with intensive support.

### CR4 — Paid Pilot Ready

Security, packaging, scope, deployment and support are sufficient to charge for a bounded pilot.

### CR5 — Repeatable Pilot

Second and third customers can be delivered without rebuilding Talos.

### CR6 — Commercial Product

Onboarding, UX, security, support and deployment are repeatable.

### CR7 — Scale Ready

Operational and commercial economics support growth.

**CURRENT AUDIT POSITION**

The repository has evidence consistent with **CR1 and movement toward CR2**, but this document does not certify CR2 closure. The One-App work strengthens product surface evidence, while commercial repeatability remains unproven.

---

# 15. Commercial model hypotheses

## Model A — Platform

Subscription/product usage.

Possible future value metrics:

```text
workspace
active process
execution
seat
capability
environment
```

**Status:** premature to select a pricing metric.

## Model B — Platform + implementation

Potential early model:

```text
Talos
+
process onboarding
+
source normalization
+
capability binding
+
deployment assistance
```

This allows revenue while the product learns from real deployments.

## Model C — Talos-powered delivery

Talos may initially operate as the internal delivery system behind consulting/implementation work.

The customer buys an outcome:

```text
process discovery
+
automation design
+
implementation
+
governance
```

Talos creates repeatability behind the engagement.

**Commercial hypothesis:** this may be the fastest path to paid evidence without pretending the product is already fully self-service.

---

# 16. Pricing is NOT yet a product truth

**DO_NOT_CLAIM**

No pricing in this document is approved.

The correct first question is not “What monthly tier should Talos have?”

It is:

> **Will a real buyer pay to reduce this process-definition-to-execution trust gap?**

A paid pilot should be scoped around one meaningful process and measurable outcomes.

Pricing should be derived after learning:

- buyer;
- budget owner;
- cost of current process discovery/automation;
- value created;
- support effort;
- deployment cost;
- repeatability.

---

# 17. What the first paid pilot should prove

Conceptual offer:

# PROCESS-TO-EXECUTION AUDIT PILOT

Input:

```text
one meaningful real business process
multiple available sources
real stakeholders
real process ambiguity
bounded integrations
```

Deliverables:

```text
SOURCE INVENTORY
        ↓
CLAIM / EVIDENCE MAP
        ↓
CONFLICT MAP
        ↓
CANONICAL PROCESS REVISION
        ↓
VALIDATION ASSESSMENT
        ↓
CAPABILITY MAP
        ↓
EXECUTION PLAN
        ↓
BOUNDED EXECUTABLE PATH
        ↓
TRACEABILITY REPORT
```

A successful pilot is not “Temporal completed a workflow.”

It should prove measurable business value.

---

# 18. Pilot success measures

Candidate metrics:

| Metric | What it asks |
|---|---|
| Source reconciliation | Did Talos expose meaningful differences across sources? |
| Ambiguity reduction | How many material ambiguities were resolved before implementation? |
| Requirement traceability | Can critical rules be justified? |
| Implementation drift | Did Talos detect behavior that differs from intent? |
| Change impact | Can a revision expose affected meaning/execution? |
| Time-to-model | How long to reach a trustworthy canonical revision? |
| Time-to-execution | How long to reach a valid ExecutionPlan? |
| Reviewer effort | How much human review was required? |
| Runtime traceability | Can runtime behavior be traced back? |
| Capability reuse | What was reusable across processes? |

The most interesting initial metric may be:

> **Material ambiguities caught before implementation.**

---

# 19. The repeatability test

The decisive commercial test is not one impressive demo.

It is:

```text
CUSTOMER A
different sources
different process
different capabilities
        ↓
same Talos Core

CUSTOMER B
different industry
different sources
different process
different capabilities
        ↓
same Talos Core
```

Allowed variation:

```text
new data
new source adapters
new capability offerings
new configuration
new vertical pack
```

Warning sign:

```text
new customer
→ change Talos Core semantics
→ special-case runtime
→ rebuild review model
```

If each new customer creates a new Talos, the business behaves like bespoke consulting.

If Talos remains stable and customer differences are expressed as data/configuration/adapters/capabilities, the product thesis strengthens.

---

# 20. Do not build

Until the commercial thesis is tested:

```text
DO NOT BUILD

hundreds of connectors
full process-mining engine
general-purpose RPA
generic chatbot
agent marketplace
large vertical catalog
own durable workflow runtime
ERP
CRM
huge billing system
low-code platform for everything
```

Each may be useful eventually.

None is required to prove the core commercial thesis.

---

# 21. Must before a serious paid pilot

Target capabilities:

```text
audited canonical/core boundary
reproducible semantic freeze
validation boundary
capability abstraction
pinned ExecutionPlan
runtime subordinated to ExecutionPlan
minimum source→runtime lineage
authentication
authorization
secrets boundary
customer/tenant isolation strategy
audit events
reproducible deployment
coherent product journey
failure/recovery runbook
pilot scope and support boundary
data-handling statement
```

These are tracked more formally in the companion readiness matrix.

---

# 22. Evidence discipline

Every commercial statement should be stored as:

```text
CLAIM
STATUS
EVIDENCE
TEST
SUCCESS CONDITION
OWNER / NEXT GATE
```

Example:

```text
CLAIM:
Talos reduces process discovery time.

STATUS:
UNPROVEN

EVIDENCE:
None yet.

TEST:
Compare a bounded manual reconstruction with Talos-assisted reconstruction.

SUCCESS CONDITION:
Meaningful time reduction without material semantic loss.
```

This prevents product enthusiasm from becoming unsupported marketing.

---

# 23. North Star metrics

Before broad revenue metrics, use technical-commercial North Stars.

### North Star 1

> **Number of independently sourced real-world business processes transformed into validated executable plans without Talos Core modification.**

### North Star 2

> **Percentage of runtime behavior explainable back to approved business meaning and source evidence.**

### North Star 3

> **Measured customer value per process onboarded.**

These are more aligned with Talos' unique thesis than counting nodes, connectors or workflows.

---

# 24. Go / No-Go questions

A commercial gate should answer:

```text
01 Real customer problem?                  YES / NO / UNKNOWN
02 Buyer identified?                       YES / NO / UNKNOWN
03 Budget owner identified?                YES / NO / UNKNOWN
04 Meaningful process accepted?            YES / NO / UNKNOWN
05 Value measured?                         YES / NO / UNKNOWN
06 Buyer willing to pay?                   YES / NO / UNKNOWN
07 Pilot repeatable?                       YES / NO / UNKNOWN
08 Second vertical works?                  YES / NO / UNKNOWN
09 No Core rewrite required?               YES / NO / UNKNOWN
10 Security acceptable?                    YES / NO / UNKNOWN
11 Deployment repeatable?                  YES / NO / UNKNOWN
12 Support model defined?                  YES / NO / UNKNOWN
```

Interpretation:

```text
01–05 YES
→ useful research/product capability

01–06 YES
→ commercial potential

01–09 YES
→ product architecture evidence

01–12 YES
→ candidate commercial product
```

---

# 25. Final audit verdict

**COMMERCIAL_HYPOTHESIS**

Talos has a credible commercial thesis because its strongest value is not merely durable workflow execution.

Its potential value is the combined chain:

```text
UNDERSTANDING
+
NORMALIZATION
+
PROVENANCE
+
CONFLICT
+
HUMAN GOVERNANCE
+
VALIDATION
+
CAPABILITY BINDING
+
COMPILATION
+
DURABLE EXECUTION
+
LINEAGE
```

**FACT_REPO**

A significant portion of this chain is already represented and exercised in the bounded technical work.

**OPEN_QUESTION**

The repository does not yet prove that external organizations receive enough economic value from this chain to make Talos a repeatable commercial product.

Therefore the correct next commercial motion is not feature explosion.

It is:

```text
AUDIT CURRENT PRODUCT TRUTH
        ↓
CLOSE MINIMUM PILOT SAFETY / PACKAGING GAPS
        ↓
RUN DESIGN-PARTNER PROCESS
        ↓
MEASURE VALUE
        ↓
RUN SECOND DISTINCT PROCESS / CUSTOMER
        ↓
VERIFY NO CORE REWRITE
        ↓
DECIDE PRODUCTIZATION / PRICING / SCALE
```

The ultimate commercial thesis is:

> **Talos converts dispersed operational knowledge into governed executable processes while preserving the chain of evidence and authority from source to runtime.**

That thesis is strong enough to test.

It is not yet strong enough to declare commercially proven.

That distinction must remain explicit in every future Talos document, demo and sales claim.
