# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a source-aware process-intelligence and durable-execution system. Its central responsibility is to **normalize and standardize business processes while preserving truth, semantics, provenance, evidence and source-specific meaning**.

TALOS is not a BPMN converter, not generic OCR/document summarization, not an n8n clone, not a Temporal UI, and not merely a diagramming product.

## Governing source-agnostic principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

## Architectural path

```text
PROCESS EXPRESSION
        ↓
PRESERVED SOURCE + VERSIONED ADAPTER
        ↓
CANONICAL + PROVENANCE + SEMANTIC VALIDATION
        ↓
HUMAN EXPLANATION / VISUAL REVIEW
        ↓
CORRECTION / CONFIRMATION / SEMANTIC FREEZE
        ↓
CAPABILITY REQUIREMENTS
        ↓
HUMAN / FORM DESIGN WHERE REQUIRED
        ↓
EXPLICIT CAPABILITY OFFERING BINDINGS
        ↓
NEXT: EXECUTION PLAN / TEMPORAL DESIGN
```

No adapter or capability binding may bypass semantic/provenance history or become Temporal execution truth directly.

# Closed foundations

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
```

# Phase 1 — Canonical Semantics

```text
T1-01 Canonical Process Model       ✅ FROZEN v0.1
T1-02 Provenance Model              ✅ FROZEN v0.3
T1-03 Semantic Validation           ✅ FROZEN v0.2
```

Key rule:

```text
SOURCE TRUTH != confidence != readiness != execution
```

# Phase 2 — Input Understanding

```text
P2-00 Common Source Intake          ✅ FROZEN v0.2
P2-01A Canvas Native Authoring      ✅ 20/20
P2-01B Canvas Review/Projection     ✅ 14/14
P2-02 BPMN Structured Adapter       ✅ 20/20
P2-03 Image/Perception Adapter      ✅ 28/28
P2-04 Language/Document Adapter     ✅ 30/30
P2-05 Existing Automation Adapter   ✅ 32/32
P2-06 Cross-Adapter Conformance     ✅ 24/24
```

Core source laws include:

```text
source identity != canonical identity
pixels != perceived structure != interpreted semantics
text span != semantic claim != process node
implemented behavior != business intent
definition config != deployment observation != runtime observation
```

# Build-opening review

The Phase-2 build-opening review formally closed:

```text
DECISION                            ❌ NO-GO
BUILD                               ⛔ CLOSED
```

because the architecture-first sequence still required human review, capability design and Temporal execution design before implementation.

# Phase 3 — Explanation & Review

```text
T3-01 Human-readable Workflow Draft      ✅ FROZEN v0.2 — 30/30
T3-02 Visual Review Workspace            ✅ FROZEN v0.2 — 32/32
T3-03 Correction/Confirmation/Freeze     ✅ FROZEN v0.2 — 36/36
```

Phase 3 proves:

```text
explanation may preserve property-level evidence facets
text / Canvas / evidence / findings share one pinned baseline
one review workspace may contain multiple semantic scopes
review action != source rewrite
stale command != safe write
semantic change → new ProcessRevision + ValidationAssessment
business semantic freeze != automation readiness
AUTOMATION_DESIGN_HANDOFF requires READY_FOR_AUTOMATION_DESIGN
```

Consolidation:

```text
arch/13-PHASE-3-EXPLANATION-REVIEW-CONSOLIDATION-v0.1.md
```

# Phase 4 — Capability Model

## T4-01 Capability Contract

```text
✅ FROZEN v0.2 — 32/32
```

Core boundary:

```text
CapabilityRequirement
!= CapabilityOfferingRevision
!= CapabilityMatchAssessment
!= CapabilityBinding
!= Temporal execution mapping
```

`CapabilityRequirementFacet` preserves property-level design basis/state, so current providers/suggestions cannot become hard requirements accidentally.

## T4-02 Forms / Human Interaction

```text
✅ FROZEN v0.2 — 36/36
```

Core boundary:

```text
human interaction != form
logical form != renderer
role != runtime assignee
identity assurance != identity provider
business deadline != Temporal timer
form submit != business completion
```

Reusable form law:

```text
FormRevision owns form-local fields/actions/rules
FormUseBinding owns process-context information/outcome mappings
```

## T4-03 Integration / Capability Binding

```text
✅ FROZEN v0.2 — 36/36
```

Core boundary:

```text
MatchAssessment
!= SelectionDecision
!= CapabilityBindingRevision
!= EnvironmentBindingRealization
!= Temporal execution mapping
```

Reusable binding design now contains:

```text
logical/provider I/O mappings
business outcome mappings
ConfigurationResolutionSlot(s)
CredentialResolutionContract(s)
```

but not concrete environment values or secret handles.

Therefore:

```text
secret rotation != binding design mutation
environment value rotation != binding design mutation
provider/mapping design change → new binding revision
business semantic change → upstream review/capability redesign
```

## Phase-4 consolidation

```text
arch/17-PHASE-4-CAPABILITY-MODEL-CONSOLIDATION-v0.1.md
plan/06-PHASE-4-CAPABILITY-MODEL-GATE-v0.1.md
```

```text
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
```

# Phase 5 — Temporal Execution Model

```text
T5-01 ExecutionPlan Contract        🟢 NEXT
T5-02 Temporal Mapping Strategy     ⚪ PENDING
T5-03 Runtime Safety / Policy       ⚪ PENDING
T5-04 DeploymentRevision            ⚪ PENDING
PHASE 5                             🟡 NEXT / OPEN
```

Phase-5 governing boundary:

```text
ProcessRevision
!= CapabilityDesignRevision
!= CapabilityBindingRevision
!= ExecutionPlan
!= TemporalMapping
!= DeploymentRevision
!= WorkflowExecution
```

The next question is:

> **How does TALOS convert one pinned semantic + capability + binding design into a separate immutable execution plan, choosing durable orchestration structures only where semantics/design justify them, without making every process node a Temporal Activity?**

# BUILD policy

```text
BUILD = CLOSED
```

Before implementation, frozen Phases 1–5 must be re-audited and an explicit end-to-end BUILD authorization must close successfully.

# Active plan

```text
plan/00-TALOS-ROADMAP-v0.16.md
```

## Immediate next move

```text
T5-01 — EXECUTION PLAN CONTRACT
```

## Working definition

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.** It preserves source truth, normalizes without erasing origin, validates uncertainty/conflict, makes interpretation reviewable, freezes accepted semantics, designs capabilities independently from providers, binds implementations explicitly and only then designs durable execution.