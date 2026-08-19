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

# Design / architecture

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

Core frozen laws include:

```text
SOURCE TRUTH != confidence != readiness != execution
source identity != canonical identity
pixels != perceived structure != interpreted semantics != confirmed truth
document order != process execution order
implemented behavior != business intent
review action != source rewrite
CapabilityRequirement != Offering != Binding
human interaction != form
ExecutionElement != Temporal primitive automatically
Timer != Schedule != Start Delay
business loop != retry / Continue-As-New
Temporal retry != idempotency guarantee
DeploymentRevision != Attempt != Observation != WorkflowExecution
```

Phase-5 compatibility is mediated through versioned `TemporalFeatureProfile` and `TemporalDefaultBehaviorProfile` artifacts rather than treating one Temporal release's behavior as timeless Talos business truth.

# Phase 6 — Reference Vertical Slice

The post-Phase-5 BUILD review returned a bounded GO for only:

```text
build/reference-vertical-slice/
```

Broad product BUILD remains closed.

Reference process:

```text
Request submitted
        ↓
Review request [actor = UNKNOWN]
        ↓
Approved?
   ├── YES → Send confirmation email → Completed
   └── NO  → Rejected
```

Reference proof target:

```text
native source
→ preserved intake
→ canonical/provenance/validation
→ explanation/review
→ explicit correction actor=Manager
→ new semantic revision/reassessment
→ semantic freeze
→ capability requirement/binding
→ ExecutionPlan
→ TemporalMapping
→ RuntimePolicy
→ DeploymentRevision
→ actual local/test Temporal execution
→ server-backed runtime observation
→ full backward lineage to source
```

## BUILD state

```text
B0 contract manifest / workspace / dependency boundaries    ✅ CLOSED
B1 IDs / deterministic JSON / SQLite repositories            ✅ CLOSED
B2 Canvas/source/intake + C01–C20                            🟢 NEXT / OPEN
B3 canonical/provenance/validation                           ⚪
B4 explanation/review/correction/freeze                      ⚪
B5 capability/human/form/binding                             ⚪
B6 ExecutionPlan/mapping/policy/deployment domains           ⚪
B7 Temporal worker/reference provider                        ⚪
B8 minimal reference API/web                                 ⚪
B9 actual Temporal E2E runtime + evidence                     ⚪
B10 failure/retry/restart/lineage closure                    ⚪
```

B0 evidence:

```text
test/87-B0-CONTRACT-MANIFEST-WORKSPACE-BOUNDARY-RESULT-v0.1.md
```

B1 evidence:

```text
test/88-B1-FOUNDATION-SQLITE-RESULT-v0.1.md
```

B1 now proves opaque cross-layer identities, deterministic/versioned JSON and digests, append-only file-backed SQLite durability, DB-level history guards, restart/reopen behavior and physical separation between Talos state and the reference provider-effect database.

## B2 boundary

B2 implements native Canvas source/intake mechanics only. It does **not** pull Canonical normalization or Semantic Validation forward from B3.

Before implementing B2, the historical C01–C20 suite must be reread and decomposed into:

```text
B2-owned source/intake assertions
B3-owned canonical/validation assertions
```

This prevents Talos from manufacturing downstream objects merely to make an earlier stage appear complete.

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

# Active planning

```text
plan/00-TALOS-ROADMAP-v0.21.md
plan/09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.2.md
plan/10-REFERENCE-VERTICAL-SLICE-BUILD-AUTHORIZATION-v0.1.md
```

## Immediate next move

```text
B2 — CANVAS / SOURCE / INTAKE
```

## Working definition

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.** It preserves source truth, normalizes without erasing origin, validates uncertainty/conflict, makes interpretation explainable and reviewable, freezes accepted semantics, separates capability requirements from implementations, derives explicit execution/Temporal/runtime/deployment design, and preserves lineage through observed runtime evidence.
