# TALOS — Reference Vertical Slice Implementation Plan v0.1

Status: **BUILD-OPENING CANDIDATE / NOT BUILD AUTHORIZATION**  
Date: **2026-08-19**

BUILD remains closed until this plan passes its pressure test and the post-Phase-5 review explicitly returns GO.

## Objective

Implement the smallest real TALOS vertical slice that proves the frozen Phase-1–5 architecture end to end while keeping every future expansion boundary open.

The slice proves **one source family, one reviewed process, one human interaction, one bound external-side-effect capability, one Temporal execution path, one deployment lineage and full backward trace**.

It does not attempt broad product completeness.

---

# 1. Reference process fixture

Native TALOS Canvas source:

```text
Request submitted
        ↓
Review request
        ↓
Approved?
   ├── YES → Send confirmation email → Completed
   └── NO  → Rejected
```

Initial source revision deliberately contains:

```text
review actor/responsibility = UNKNOWN
```

The slice therefore exercises:

```text
initial semantic validation finding
human-readable explanation
visual review baseline
explicit user correction: actor = Manager
new immutable CanvasRevision / ProcessRevision
revalidation
AUTOMATION_DESIGN_HANDOFF freeze
```

The original revision remains preserved.

---

# 2. Reference capability design

## Human interaction

```text
Review request
→ HUMAN_INTERACTION capability requirement
→ participant = Manager
→ outcomes = APPROVED / REJECTED
→ reusable logical review form
   fields: optional comment
   actions: approve / reject
```

The form remains logical/provider-independent.

## Notification

Accepted semantic action:

```text
Send confirmation email
```

Capability requirement:

```text
family = COMMUNICATION
operationIntent = SEND_NOTIFICATION
channel = EMAIL
```

Reference offering:

```text
REFERENCE_EMAIL_SINK v1
implementationKind = INTERNAL_SERVICE / reference-test only
```

It writes a durable test-side-effect record rather than sending a real external email.

This offering is explicit implementation/test evidence and is **not** promoted into business meaning.

No Gmail/Microsoft/provider credential is required for the first slice.

---

# 3. Reference Temporal design

Execution design:

```text
one root durable orchestration region
human review coordination
conditional branch
notification capability-use occurrence
completion
```

Accepted Temporal mapping for this slice:

```text
root execution region
→ Workflow boundary

human approval submission
→ Update handler
  because reference UI/client requires tracked validation/result

wait for approved/rejected human outcome
→ Workflow state / condition

REFERENCE_EMAIL_SINK invocation
→ Activity

branch/join/completion
→ deterministic Workflow logic
```

Explicitly not used in this slice:

```text
Nexus
Child Workflow
Schedule
Start Delay
Continue-As-New
compensation
multi-worker version ramp
```

Their frozen architecture remains untouched.

---

# 4. Reference runtime policy

Notification Activity policy must be explicit and testable.

Initial reference policy candidate:

```text
retry mode = EXPLICIT_CUSTOM
bounded attempts
explicit StartToClose timeout
idempotency requirement = required
idempotency strategy = stable reference message key
failure classification = transient vs permanent reference errors
```

Exact numeric policy values are implementation-plan configuration fixtures and must be recorded in `RuntimePolicyRevision`, not hard-coded invisibly inside Worker code.

Workflow-level retry remains explicit/no hidden default acceptance.

---

# 5. Reference deployment target

Local/test Temporal target only.

Conceptual target:

```text
DeploymentTargetProfile
  environmentClass = TEST
  Temporal local development/test service

TemporalNamespaceBinding
  explicit namespace locator

TaskQueueBinding
  explicit reference task queue

WorkflowTypeBinding
  explicit reference Workflow Type

ActivityTypeBinding
  explicit reference notification Activity Type

WorkerArtifactBinding
  exact build/artifact digest
```

No production Cloud/self-hosted provisioning is authorized.

`DeploymentRevision` must remain separate from:

```text
DeploymentAttempt
DeploymentObservation
WorkflowExecutionObservation
```

---

# 6. Implementation language / workspace

Reference implementation:

```text
LANGUAGE: TypeScript
RUNTIME: Node.js
SERIALIZATION: deterministic versioned JSON
DOMAIN STYLE: framework-independent packages
TEMPORAL: official Temporal TypeScript SDK in runtime/worker boundary only
```

TypeScript remains appropriate because:

- native Canvas/review product is browser-facing;
- domain contracts can be shared browser/server-side;
- Temporal has an official TypeScript SDK;
- one language reduces first-slice translation surface while frozen contracts remain language-neutral.

No Temporal SDK type may cross into source/canonical/provenance/review/capability domain contracts.

---

# 7. Proposed build boundary

```text
build/reference-vertical-slice/
  package.json
  tsconfig.json
  README.md

  packages/
    ids/
    deterministic-json/
    contract-manifest/

    source-domain/
    intake-domain/
    adapters/
      talos-canvas/

    canonical-domain/
    provenance-domain/
    validation-domain/

    explanation-domain/
    review-domain/

    capability-domain/
    human-form-domain/
    binding-domain/

    execution-plan-domain/
    temporal-mapping-domain/
    runtime-policy-domain/
    deployment-domain/

    persistence/
    application/

  apps/
    reference-api/
    reference-web/

  workers/
    reference-temporal-worker/

  fixtures/
    canvas/
    reference-process/
    temporal-reference/

  tests/
    unit/
    contract/
    integration/
    e2e/
```

The old `build/t2-01-canvas-adapter/` plan is superseded for active implementation planning, not deleted.

---

# 8. Branded identity boundary

Source/canonical/review/capability/execution/deployment IDs must not be interchangeable by accident.

Reference code must use distinct branded/opaque ID types or equivalent runtime-safe identity wrappers for at least:

```text
CanvasElementId
SourceOccurrenceId
ProcessNodeId
ProcessRevisionId
ReviewWorkspaceRevisionId
CapabilityRequirementId
CapabilityBindingRevisionId
ExecutionElementId
TemporalMappingUnitId
DeploymentRevisionId
WorkflowExecutionObservationId
```

Persistence keys remain explicitly mapped.

---

# 9. Runtime schema boundary

Compile-time TypeScript types are not sufficient evidence.

Every persisted/external serialized contract must have versioned runtime validation.

Library choice may be implementation-specific, but validators must remain adapters to frozen Talos contract versions rather than becoming domain authority.

Unknown/source-defined extension values must survive round trip where contracts permit them.

---

# 10. Contract version manifest

One immutable/versioned implementation manifest must pin the frozen contract versions used by the reference build:

```text
Canonical v0.1
Provenance v0.3
Semantic Validation v0.2
Source Intake v0.2
Canvas Native v0.2
Canvas Review v0.2
T3-01 v0.2
T3-02 v0.2
T3-03 v0.2
T4-01 v0.2
T4-02 v0.2
T4-03 v0.2
T5-01 v0.2
T5-02 v0.2
T5-03 v0.2
T5-04 v0.2
```

The build must never silently consume `latest` design files.

---

# 11. Persistence strategy

Use repository interfaces for every domain boundary.

For the reference vertical slice, use a durable local transactional persistence implementation suitable for deterministic integration tests and process restart/reopen tests.

Recommended reference choice:

```text
SQLite
```

Database schema is an implementation adapter, not the domain model.

Persist immutable records append-only wherever frozen contracts require history.

Mutable convenience indexes/pointers are allowed only where contracts explicitly permit them and must never replace historical truth.

---

# 12. Source/intake implementation

Implement shared source/intake contracts before Canvas-specific mapping.

Pipeline:

```text
CanvasRevision
→ SourceOrigin/Capture/Artifact/Representation
COMMIT
→ AdapterAttempt
→ SourceEvidenceGraph
→ CandidateSemanticScope
→ claims/provenance
→ Canonical normalization
```

Required executable Canvas conformance includes historical C01–C20.

No BPMN/image/language/automation adapter implementation is authorized.

However all adapter interfaces must remain source-family neutral and should support synthetic conformance stubs proving a future adapter can emit the common contract without importing Canvas types.

---

# 13. Canonical / provenance / validation implementation

Implement frozen contracts directly.

Requirements:

```text
no source ID reused as canonical ID
no fake canonical edge for unresolved source relationship
property-level provenance preserved
truth/confidence/perspective separated
ValidationAssessment immutable
finding/question immutable
new semantic meaning → new ProcessRevision
new validation → new ValidationAssessment
```

The initial reference fixture must fail/need confirmation because actor is unknown.

After user correction to Manager, a new semantic revision must be produced and revalidated.

---

# 14. Explanation / review implementation

Implement:

```text
ExplanationDraftSnapshot
ExplanationEvidenceFacet
ReviewBaselineBundle
ReviewScopeSurfaceBinding
visual review read model
source/evidence inspector read model
ReviewCommand
stale-baseline precondition
SemanticDiffGuard
baseline transition history
SemanticFreezeRecord / ScopeFreezeRecord
```

Reference web UI may be visually minimal but must actually expose:

```text
human-readable draft
visual process representation
evidence/status for material item/property
validation finding/question
correction/confirmation affordance
freeze/handoff action
```

No polished design-system work is part of acceptance.

UI cannot mutate persisted domain records directly; all semantic actions go through application commands.

---

# 15. Capability / form / binding implementation

Implement only the capability families needed by the fixture, through the shared generic model.

Required:

```text
CapabilityRequirement / Facets
CapabilityOfferingRevision
CapabilityMatchAssessment
explicit CapabilitySelectionDecision
HumanInteractionDesignRevision
FormDefinition / FormRevision
FormUseBinding / mappings
CapabilityBindingRevision
CapabilityBindingAssessment
```

`REFERENCE_EMAIL_SINK` must be registered as an offering and explicitly selected; it cannot be hard-wired directly from canonical action to Activity.

Human form renderer/UI remains application-layer realization of the logical form contract.

---

# 16. ExecutionPlan implementation

Implement generic T5-01 structures before the reference mapper.

Fixture must materialize:

```text
ExecutionPlanRevision
one EXECUTABLE_PRIMARY scope
root ExecutionRegion
human coordination ExecutionElement
Decision/branch coordination
one CapabilityUseOccurrence for email binding
completion coordination
ExecutionSemanticMappingTrace
ExecutionScopeAssessment
ExecutionPlanAssessment
```

No canonical node becomes an execution element by identity reuse.

---

# 17. Temporal mapping implementation

Implement T5-02 mapping-domain structures independent from SDK objects.

For the fixture, explicitly create/accept mappings:

```text
root → Workflow boundary
human submission → Update handler
human wait → Workflow condition/state
email capability use → Activity
branch/completion → Workflow logic
```

`TemporalFeatureProfile` fixture must be explicit and versioned.

Mapping decisions/rationale must be persisted before Worker code uses them.

Worker registration names are deployment artifacts and must not become mapping identity.

---

# 18. Runtime policy implementation

Implement T5-03 structures independent from Temporal SDK option objects.

For the email Activity, persist explicit:

```text
RetryPolicyDesign
TimeoutPolicyDesign
IdempotencyPolicyDesign
FailureClassificationPolicy
```

Application compiler/assembler converts frozen policy design into Temporal SDK options at the runtime boundary.

Tests must prove the emitted runtime options correspond to persisted policy values.

No invisible SDK defaults for material policy.

---

# 19. Deployment implementation

Implement T5-04 desired/observed separation:

```text
DeploymentRevision
DeploymentAssessment
DeploymentAttempt
DeploymentObservation
WorkflowExecutionObservation
WorkflowExecutionRuntimeSegmentObservation
```

For the local/test target, create explicit:

```text
Namespace binding
Task Queue binding
Workflow Type binding
Activity Type binding
Worker artifact digest
```

No secret values are needed for the reference offering.

Test runner must record actual Workflow ID / Run ID from real Temporal execution and correlate it back to the frozen `DeploymentRevision` with explicit evidence from the runner/runtime context.

---

# 20. Reference web/API boundary

`reference-web` is a **proof interface**, not product UI completion.

Minimum flows:

```text
A. open/create reference Canvas source
B. inspect initial explanation + validation issue
C. correct actor to Manager
D. inspect new revision/assessment
E. freeze for automation-design handoff
F. inspect generated capability/execution design
G. start local reference execution
H. submit human approval/rejection
I. inspect execution result + backward lineage
```

`reference-api` exposes application use cases, not direct repository CRUD as domain authority.

---

# 21. Actual Temporal integration requirement

The end-to-end acceptance test must run against an **actual Temporal test/development service**, not a fake Workflow interpreter.

Allowed reference approaches include an official Temporal local development/test server suitable for the TypeScript SDK.

A mocked Temporal adapter is permitted for unit tests but cannot satisfy the vertical-slice acceptance gate.

No production Temporal Cloud deployment is required.

---

# 22. Deterministic Workflow boundary

Temporal Workflow implementation must be deterministic.

No direct inside-Workflow calls to:

```text
SQLite
HTTP/provider service
filesystem
random external source
mutable latest TALOS design
```

Workflow starts from a pinned deployment/execution design snapshot needed for deterministic execution, while external side effects execute through mapped runtime constructs such as Activities.

---

# 23. Reference side-effect/idempotency

`REFERENCE_EMAIL_SINK` Activity writes one durable side-effect record with a deterministic idempotency key.

The test must simulate/retry the Activity path sufficiently to prove duplicate Activity execution cannot create duplicate logical notification effects under the selected idempotency strategy.

This validates the distinction:

```text
Temporal retry != idempotency guarantee
```

---

# 24. Failure-injection requirements

Executable tests must inject at least:

```text
adapter failure after source preservation
stale review command
invalid/collateral semantic correction
capability offering mismatch/no-match
Activity transient failure/retry
Activity permanent failure classification
side-effect duplicate attempt
DeploymentAttempt failure without DeploymentRevision loss
```

Every failure preserves upstream immutable history.

---

# 25. Test architecture

## Unit

Domain invariants, serializers, validators, branded IDs, hashing, mapping/policy assemblers.

## Contract

Executable versions of foundational frozen fixture families relevant to implemented domains, including:

```text
C01–C20 Canvas
selected Phase-1 provenance/validation regressions
Phase-3 review/freeze invariants
Phase-4 capability/binding invariants
Phase-5 execution/mapping/policy/deployment invariants
```

## Architecture conformance

Dependency tests/lint rules prove forbidden imports, including:

```text
source/canonical/review/capability packages → Temporal SDK  FORBIDDEN
canonical domain → provider SDK              FORBIDDEN
Temporal worker → direct mutable latest design lookup FORBIDDEN
```

## Integration

SQLite-backed source→freeze→capability→execution design pipeline.

## Temporal integration

Actual local/test Temporal service:

```text
DeploymentRevision
→ start Workflow
→ wait for human review Update
→ execute notification Activity
→ complete
```

## End-to-end

Reference web/API or executable client drives the entire A–I user flow and verifies persisted lineage.

---

# 26. Cross-phase lineage acceptance

For the completed approved branch, automated assertion must traverse:

```text
WorkflowExecutionObservation
→ runtime segment
→ DeploymentRevision
→ RuntimePolicyRevision
→ TemporalMappingRevision
→ ExecutionPlanRevision
→ CapabilityBindingRevision
→ CapabilityRequirement
→ ScopeFreezeRecord / SemanticFreezeRecord
→ ProcessRevision
→ ProvenanceLink / SemanticClaim
→ SourceOccurrence
→ SourceRepresentation
→ CanvasRevision / SourceOrigin
```

and the reverse design path where applicable.

No link may be reconstructed merely by matching display labels.

---

# 27. Restart / durability proof

At least one integration test must:

1. create source/review/freeze/design history;
2. close the application/persistence process;
3. reopen the SQLite-backed repositories;
4. recover exact immutable identities/digests/history;
5. continue into Temporal execution without selecting `latest` incorrectly.

This prevents an in-memory-only demo from masquerading as durable Talos state.

---

# 28. Explicit non-scope

Not authorized in the first BUILD:

```text
BPMN parser
image/OCR/perception implementation
language/LLM adapter implementation
n8n import adapter implementation
Gmail / Drive / Slack / real SaaS connectors
production secret manager integration
production IAM
multi-user collaboration
full visual design system
production Kubernetes/cloud deployment
advanced Child Workflow/Nexus/Schedule/Continue-As-New use
process mining / analytics
broad source expansion
```

Interfaces/contracts may exist only where required by frozen architecture.

---

# 29. Build staging

```text
B0 — workspace + contract manifest + dependency rules
B1 — IDs / deterministic serialization / persistence skeleton
B2 — Source/Canvas/Intake + C01–C20
B3 — Canonical/Provenance/Validation
B4 — Explanation/Review/Correction/Freeze
B5 — Capability/Human/Form/Binding
B6 — ExecutionPlan/TemporalMapping/RuntimePolicy/Deployment domain
B7 — Temporal worker + reference offering
B8 — minimal reference API/web review flow
B9 — full end-to-end Temporal execution + lineage
B10 — failure injection / restart / evidence closure
```

Each stage has its own test gate. A frozen-contract defect discovered during build stops the affected stage and returns to versioned DESIGN/ARCH evolution.

---

# 30. BUILD acceptance criteria

The reference vertical slice closes only when automated evidence proves:

```text
native source preserved before interpretation
old source/revision never overwritten
initial unresolved actor visibly blocks/needs confirmation
user correction creates new immutable semantic history
review/explanation/visual baseline stays synchronized
semantic freeze requires validator readiness
capability provider/test offering selected explicitly
logical form != renderer/runtime user
ExecutionPlan identity separated from canonical
Temporal mappings are explicit persisted design
runtime policies are explicit persisted design
actual Temporal execution occurs
Activity side effect is idempotency-safe under retry test
Deployment desired state separated from observations
restart preserves immutable Talos state
full runtime→source lineage traversal passes
zero forbidden cross-layer dependency violations
```

---

# 31. Evidence artifacts during BUILD

Create under versioned `test/` / `evidence/` paths:

```text
reference build stage results
executable contract/conformance results
Temporal integration result
end-to-end lineage result
failure-injection result
restart/durability result
final Phase-6 reference vertical-slice gate closure
```

No fake metrics or unsupported production claims.

---

# 32. BUILD opening recommendation

This plan **does not authorize BUILD by itself**.

Next:

```text
pressure-test this plan against frozen Phases 1–5
```

Only if that plan pressure test passes may the post-Phase-5 BUILD review explicitly authorize:

```text
build/reference-vertical-slice/
```

and nothing broader.
