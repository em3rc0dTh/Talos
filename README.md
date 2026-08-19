# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a source-aware process-intelligence and durable-execution system. Its central responsibility is to **normalize and standardize business processes while preserving truth, semantics, provenance, evidence and source-specific meaning**.

TALOS is not a BPMN converter, generic OCR/document summarizer, n8n clone, Temporal UI or simple diagramming product.

## Governing source-agnostic principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

## Full architecture path

```text
PROCESS EXPRESSION
        ↓
PRESERVE SOURCE + VERSIONED ADAPTER
        ↓
CANONICAL MODEL + PROVENANCE + SEMANTIC VALIDATION
        ↓
HUMAN EXPLANATION + VISUAL REVIEW
        ↓
CORRECTION / CONFIRMATION / SEMANTIC FREEZE
        ↓
CAPABILITY REQUIREMENTS / HUMAN-FORM DESIGN
        ↓
EXPLICIT CAPABILITY OFFERING BINDINGS
        ↓
EXECUTION PLAN
        ↓
TEMPORAL MAPPING
        ↓
RUNTIME SAFETY POLICY
        ↓
DEPLOYMENT REVISION / ENVIRONMENT REALIZATION
        ↓
DEPLOYMENT / RUNTIME OBSERVATION
```

Every bridge is explicit and versioned. No downstream runtime object may silently become upstream business truth.

# Closed design / architecture phases

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

## Phase 1 — Canonical Semantics

```text
T1-01 Canonical Process Model       ✅ FROZEN v0.1
T1-02 Provenance Model              ✅ FROZEN v0.3
T1-03 Semantic Validation           ✅ FROZEN v0.2
```

Core law:

```text
SOURCE TRUTH != confidence != readiness != execution
```

## Phase 2 — Input Understanding

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

Design/architecture proof does not mean those external adapters are implemented. The first BUILD is still restricted to native TALOS Canvas intake.

## Phase 3 — Explanation & Review

```text
T3-01 Human-readable Workflow Draft      ✅ FROZEN v0.2 — 30/30
T3-02 Visual Review Workspace            ✅ FROZEN v0.2 — 32/32
T3-03 Correction/Confirmation/Freeze     ✅ FROZEN v0.2 — 36/36
```

Critical laws:

```text
rendered explanation != semantic truth
text / Canvas / evidence / findings share one pinned baseline
one review workspace may contain multiple semantic scopes
review action != source rewrite
stale command != safe write
semantic change → new ProcessRevision + ValidationAssessment
business semantic freeze != automation readiness
```

## Phase 4 — Capability Model

```text
T4-01 Capability Contract                 ✅ FROZEN v0.2 — 32/32
T4-02 Forms / Human Interaction           ✅ FROZEN v0.2 — 36/36
T4-03 Integration / Capability Binding    ✅ FROZEN v0.2 — 36/36
```

Critical separation:

```text
BUSINESS MEANING
!= CapabilityRequirement
!= CapabilityOffering
!= MatchAssessment
!= SelectionDecision
!= CapabilityBindingRevision
!= EnvironmentBindingRealization
```

Reusable forms own form-local fields/actions; `FormUseBinding` owns process-context mappings. Reusable capability bindings own symbolic configuration/credential contracts, not environment values or secret handles.

## Phase 5 — Temporal Execution Model

```text
T5-01 ExecutionPlan Contract        ✅ FROZEN v0.2 — 40/40
T5-02 Temporal Mapping Strategy     ✅ FROZEN v0.2 — 46/46
T5-03 Runtime Safety / Policy       ✅ FROZEN v0.2 — 44/44
T5-04 DeploymentRevision            ✅ FROZEN v0.2 — 48/48
```

Consolidation:

```text
arch/22-PHASE-5-TEMPORAL-EXECUTION-MODEL-CONSOLIDATION-v0.1.md
```

Critical execution laws:

```text
semantic subject != ExecutionElement
ExecutionElement != Temporal primitive automatically
CapabilityBindingRevision != CapabilityUseOccurrence
ExecutionRegion != Workflow automatically
human interaction != Signal/Update automatically
wait != Timer automatically
Timer != Schedule != Start Delay
subprocess != Child Workflow automatically
business loop != retry / Continue-As-New
Temporal retry != idempotency guarantee
cancellation != compensation
Temporal default acceptance = explicit versioned design decision
DeploymentRevision != DeploymentAttempt != DeploymentObservation != WorkflowExecution
current/ramping/draining Worker state != immutable deployment-design truth
secure reference handle != secret value
```

Phase 5 was checked against current official Temporal concepts using versioned `TemporalFeatureProfile` and `TemporalDefaultBehaviorProfile` reference contexts so Temporal evolution does not rewrite historical Talos meaning.

# Phase 6 — Reference Vertical Slice

A post-Phase-5 BUILD-opening review re-audited the historical Canvas-only implementation plan against frozen Phases 1–5.

The old plan was preserved but found insufficient for end-to-end BUILD.

A new active plan was created and pressure-tested:

```text
plan/09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.2.md

v0.1 plan pressure test    36 / 40
v0.2 full regression       40 / 40
```

Final review decision:

```text
REFERENCE VERTICAL-SLICE BUILD      🟢 BOUNDED GO
BROAD PRODUCT BUILD                 ⛔ CLOSED
```

Evidence:

```text
test/86-POST-PHASE-5-BUILD-OPENING-REVIEW-FINAL-RESULT-v0.1.md
```

Authorization:

```text
plan/10-REFERENCE-VERTICAL-SLICE-BUILD-AUTHORIZATION-v0.1.md
```

Authorized implementation path only:

```text
build/reference-vertical-slice/
```

## Reference process

Initial native Canvas truth:

```text
Request submitted
        ↓
Review request [actor = UNKNOWN]
        ↓
Approved?
   ├── YES → Send confirmation email → Completed
   └── NO  → Rejected
```

Reference Talos loop:

```text
actor UNKNOWN
→ validation finding
→ explanation / visual review
→ explicit correction actor=Manager
→ new ProcessRevision / ValidationAssessment
→ automation-design freeze
→ capability requirement / explicit test offering binding
→ ExecutionPlan
→ TemporalMapping
→ RuntimePolicy
→ DeploymentRevision
→ actual local/test Temporal execution
→ runtime evidence / backward lineage
```

## Authorized BUILD stages

```text
B0 contract manifest / workspace / dependency boundaries    🟢 NEXT
B1 IDs / deterministic JSON / SQLite repositories            ⚪
B2 Canvas/source/intake + C01–C20                            ⚪
B3 canonical/provenance/validation                           ⚪
B4 explanation/review/correction/freeze                      ⚪
B5 capability/human/form/binding                             ⚪
B6 ExecutionPlan/mapping/policy/deployment domains           ⚪
B7 Temporal worker/reference provider                        ⚪
B8 minimal reference API/web                                 ⚪
B9 actual Temporal E2E runtime + evidence                     ⚪
B10 failure/retry/restart/lineage closure                    ⚪
```

## Still not authorized

```text
BPMN/image/language/n8n adapter implementation
real Gmail/Drive/SaaS connectors
production IAM/secrets
production Temporal deployment
multi-user collaboration
full product visual polish
broad provider/source expansion
```

Any frozen-contract defect found in BUILD closes the affected stage until versioned DESIGN/ARCH evolution and regression restore compatibility.

# Active planning

```text
plan/00-TALOS-ROADMAP-v0.19.md
plan/09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.2.md
plan/10-REFERENCE-VERTICAL-SLICE-BUILD-AUTHORIZATION-v0.1.md
```

## Immediate next move

```text
B0 — CONTRACT MANIFEST / WORKSPACE / DEPENDENCY BOUNDARIES
```

## Working definition

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.** It preserves source truth, normalizes without erasing origin, validates uncertainty/conflict, makes interpretation explainable and reviewable, freezes accepted semantics, separates capability requirements from implementations, derives explicit execution/Temporal/runtime/deployment design, and preserves lineage through observed runtime evidence.
