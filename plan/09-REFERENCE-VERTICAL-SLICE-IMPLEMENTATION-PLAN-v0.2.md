# TALOS — Reference Vertical Slice Implementation Plan v0.2

Status: **BUILD-OPENING REGRESSION CANDIDATE**  
Date: **2026-08-19**  
Supersedes for active implementation planning: `09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.1.md`  
Historical v0.1 remains preserved.

BUILD remains closed until the v0.2 plan regression passes and the post-Phase-5 review explicitly returns GO.

## Why v0.2 exists

Initial plan pressure result:

```text
V01–V40
36 PASS / 4 FAIL
```

Failures:

```text
V07 initial source leaked future correction value
V22 runtime policy test values remained unspecified
V28 reference provider side-effect storage isolation unspecified
V34 runtime observation evidence could be self-asserted by runner
```

v0.2 fixes those four planning defects while retaining every v0.1 cross-phase boundary.

---

# 1. Reference process — corrected source truth

**Initial native Canvas source**:

```text
Request submitted
        ↓
Review request
        ↓
Approved?
   ├── YES → Send confirmation email → Completed
   └── NO  → Rejected
```

Initial property truth:

```text
Review request.actor = UNKNOWN
```

The initial source must not contain `Manager` in actor, role, label, hidden fixture metadata, generated canonical value or expected result.

Initial validation must expose the missing material responsibility.

Only the explicit Phase-3 review command introduces:

```text
actor = Manager
```

That command creates new review-authored/source history, a new semantic revision, reassessment and later freeze.

---

# 2. Reference source/intake implementation

Retain v0.1:

```text
CanvasRevision
→ preserved SourceOrigin/Capture/Artifact/Representation
→ AdapterAttempt
→ SourceEvidenceGraph
→ CandidateSemanticScope
→ claims/provenance
→ Canonical normalization
→ Validation
```

Implement shared source/intake contracts before Canvas-specific mapping.

Executable Canvas conformance:

```text
C01–C20
```

No BPMN/image/language/automation adapter implementation is authorized.

---

# 3. Canonical / provenance / validation

Retain all v0.1 requirements:

```text
source IDs != canonical IDs
no fake edge for incomplete source
property-level provenance
truth != confidence != perspective
immutable ProcessRevision / Assessment / Finding / Question history
```

Reference sequence:

```text
PR1 / actor UNKNOWN
→ Assessment A / needs confirmation or insufficient detail
→ review correction actor=Manager
→ PR2
→ Assessment B
→ READY_FOR_AUTOMATION_DESIGN when all reference blockers are resolved
```

---

# 4. Explanation / review / freeze

Implement frozen Phase-3 structures including:

```text
ExplanationDraftSnapshot
ExplanationEvidenceFacet
ReviewBaselineBundle
ReviewScopeSurfaceBinding
ReviewCommand
ReviewCommandApplication
stale-baseline guard
SemanticDiffGuard
BaselineTransitionCandidate / Decision
SemanticFreezeRecord / ScopeFreezeRecord
```

Minimal web review surface must show:

```text
human-readable explanation
visual process representation
actor UNKNOWN state / validation finding
source/provenance detail
correction control
new revision after correction
freeze/handoff control
```

All semantic writes use application commands, never direct UI persistence mutation.

---

# 5. Capability / form / binding

Reference capability designs:

## Human review

```text
CapabilityRequirement family = HUMAN_INTERACTION
participant requirement = Manager
outcomes = APPROVED / REJECTED
logical FormRevision = reference-review-form-v1
field = comment (optional)
actions = approve / reject
```

`FormUseBinding` maps form-local actions to process-context HumanOutcome identities.

## Confirmation email

```text
CapabilityRequirement
  family = COMMUNICATION
  operationIntent = SEND_NOTIFICATION
  channel = EMAIL
```

Explicit reference offering:

```text
REFERENCE_EMAIL_SINK v1
implementationKind = INTERNAL_SERVICE
lifecycle = TEST_ONLY
```

It is selected through:

```text
CapabilityMatchAssessment
→ CapabilitySelectionDecision
→ CapabilityBindingRevision
```

No direct canonical→provider shortcut.

---

# 6. Reference provider isolation — V28 repair

Use two logically and physically separate local SQLite databases:

```text
build/reference-vertical-slice/.runtime/talos-state.sqlite
build/reference-vertical-slice/.runtime/reference-email-sink.sqlite
```

Rules:

```text
Talos repositories
→ talos-state.sqlite only

REFERENCE_EMAIL_SINK Activity/provider adapter
→ reference-email-sink.sqlite only
```

The reference provider Activity may not write Talos semantic/provenance/review/capability/execution/deployment tables.

Talos may observe/reference the provider result through Activity output/runtime evidence, not shared-table mutation.

Both files are test/runtime artifacts and must be ignored from Git.

---

# 7. ExecutionPlan

Retain v0.1 generic T5-01 implementation.

Reference fixture must create distinct identities for:

```text
ExecutionPlanRevision
ExecutionScopeBinding(EXECUTABLE_PRIMARY)
root ExecutionRegion
human coordination ExecutionElement
Decision/branch coordination
CapabilityUseOccurrence(email)
completion coordination
ExecutionSemanticMappingTrace
ExecutionScopeAssessment
ExecutionPlanAssessment
```

No canonical ID is reused as execution identity.

---

# 8. Temporal mapping

Persist domain mapping before Worker runtime assembly:

```text
root region → Workflow boundary
human submission → Update handler
human outcome wait → Workflow condition/state
email CapabilityUseOccurrence → Activity
branch/completion → Workflow logic
```

Why `Update` for the reference human submission:

> the reference UI/client sends approve/reject and requires tracked validation plus an acknowledgement/result that the submission was accepted by Workflow state.

This is reference runtime design, not a universal rule that human approvals use Updates.

`TemporalFeatureProfile` is versioned fixture/reference data and pins:

```text
platform family
SDK family used by BUILD
constructs required by this slice
official Temporal reference/documentation identifiers used during BUILD
```

Package lockfile pins actual SDK package version.

---

# 9. Temporal default profile — V25 explicit closure

Even though the reference slice uses explicit material retry policy, BUILD must create/persist a compatible:

```text
TemporalDefaultBehaviorProfile
```

for the selected `TemporalFeatureProfile`/SDK reference context.

No material policy may depend on it silently.

Any `TemporalDefaultAcceptance` in this slice must be explicit; expected count may be zero if every material policy field is explicit.

---

# 10. Concrete reference RuntimePolicy — V22 repair

These are **reference-test runtime design values**, not business truth or production recommendations.

For `REFERENCE_EMAIL_SINK` Activity:

```text
RetryPolicyDesign
  retryMode = EXPLICIT_CUSTOM
  initialInterval = 250ms
  backoffCoefficient = 2.0
  maximumInterval = 1s
  maximumAttempts = 3

TimeoutPolicyDesign
  startToClose = 5s
  scheduleToClose = 10s

IdempotencyPolicyDesign
  requirement = REQUIRED
  strategyKind = IDEMPOTENCY_KEY
  key contract = sha256(referenceRequestId + ":" + capabilityUseOccurrenceId)

FailureClassificationPolicy
  TRANSIENT_REFERENCE_FAILURE = retryable
  INVALID_REFERENCE_REQUEST = non-retryable
```

Reference Workflow execution retry policy:

```text
EXPLICIT_CUSTOM
maximumAttempts = 1
```

so the slice does not depend on an omitted Workflow retry default.

Human Update validation rejects duplicate/finalized contradictory submissions through deterministic Workflow state; this is interaction logic, not Activity retry.

All values above must exist in persisted `RuntimePolicyRevision` artifacts and the Temporal SDK assembler must consume those persisted values.

Worker code may not contain separate hidden policy constants.

---

# 11. Reference deployment constants

These are local/test deployment identities only and may be namespaced per test run where collision avoidance requires a deterministic suffix.

Base fixture values:

```text
environmentClass = TEST
namespace key     = talos-reference
Task Queue key    = talos-reference-main
Workflow Type     = TalosReferenceApprovalWorkflow
Activity Type     = sendReferenceConfirmation
Worker logical    = talos-reference-worker
```

If the local Temporal test service only exposes a pre-created/default Namespace, `TemporalNamespaceBinding` must record the **actual** namespace used and the fixture's target-profile resolution, rather than pretending `talos-reference` was provisioned.

Task Queue/runtime IDs may use deterministic test-run suffixes while preserving their exact realized values in `DeploymentRevision`.

No production target is authorized.

---

# 12. Deployment desired/observed separation

Implement:

```text
DeploymentRevision
DeploymentAssessment
DeploymentAttempt
DeploymentObservation
EnvironmentRealizationObservation where relevant
WorkflowExecutionObservation
WorkflowExecutionRuntimeSegmentObservation
```

Reference slice may use unversioned/single Worker deployment behavior; it must not fake Current/Ramping observations.

---

# 13. Temporal runtime evidence — V34 repair

An end-to-end test does **not** create successful runtime observations merely from the values it intended to start.

After starting the actual Temporal Workflow, acceptance must obtain runtime evidence through official Temporal client/service APIs appropriate to the pinned SDK, including at minimum:

```text
actual Workflow ID
actual Run ID
Workflow describe/status or equivalent server-backed metadata
Workflow completion result
server/history evidence sufficient to verify the expected human Update was accepted
server/history evidence sufficient to verify the notification Activity was scheduled and completed on the approved path
```

The implementation may use SDK high-level APIs and/or official service/history APIs depending on current TypeScript SDK support.

Talos test evidence records must preserve:

```text
observer/source type
timestamp
raw-evidence reference or permitted normalized snapshot
evidence digest
correlation to WorkflowExecutionObservation / runtime segment
```

A runner variable saying `deploymentRevisionId=D1` is design correlation context, not proof by itself that Temporal executed D1's artifact/mapping. Correlation must be backed by exact runtime registration/configuration evidence produced by the test worker/runner plus Temporal server evidence.

---

# 14. Reference side effect / retry proof

`REFERENCE_EMAIL_SINK` Activity writes to `reference-email-sink.sqlite` using:

```text
UNIQUE(idempotency_key)
```

or equivalent transactional uniqueness guarantee.

Transient failure injection must force at least one Activity retry while proving:

```text
Activity attempts > 1
logical provider effect rows = 1
```

A permanent failure fixture must prove non-retryable classification stops repeated attempts as designed.

---

# 15. Workspace / language / dependency boundaries

Retain v0.1 structure:

```text
build/reference-vertical-slice/
  packages/
  apps/reference-api/
  apps/reference-web/
  workers/reference-temporal-worker/
  fixtures/
  tests/
```

Reference language/runtime:

```text
TypeScript / Node.js
official Temporal TypeScript SDK only in runtime boundary
deterministic versioned JSON
```

Runtime validators are required for persisted/external contracts.

Branded/opaque IDs prevent cross-layer identity reuse.

---

# 16. Durable Talos persistence

Use repository interfaces with SQLite reference implementation:

```text
.runtime/talos-state.sqlite
```

Append-only immutable history where contracts require it.

Restart/reopen test is mandatory.

Database schema/ORM types never become Talos domain contracts.

---

# 17. Frozen contract manifest / dependency lock — V39

BUILD begins by creating a machine-readable contract manifest that pins the exact frozen Phase-1–5 contract versions/blobs the implementation targets.

Also pin via package lock:

```text
Node runtime support range
Temporal TypeScript SDK packages
runtime validation library
SQLite adapter/dependencies
web/runtime dependencies
```

Dependency upgrades are explicit build changes and cannot silently reinterpret frozen mapping/default profiles.

---

# 18. Deterministic Workflow boundary

No direct Workflow access to:

```text
Talos SQLite
reference provider SQLite
HTTP/provider calls
filesystem
random external state
latest Talos design
```

Workflow receives/uses a pinned compiled execution/deployment snapshot necessary for deterministic behavior.

External side effects remain Activities/accepted runtime mechanisms.

---

# 19. Failure injection

Mandatory executable failures:

```text
adapter failure after preserved source
stale review command
collateral/unexpected semantic diff
capability no-match/mismatch
Activity transient failure with retry
Activity permanent failure
provider duplicate-effect attempt
DeploymentAttempt failure
app restart/reopen
```

No failure may delete or mutate valid upstream history.

---

# 20. User-facing reference flow

Minimal functional reference UI/API, not visual polish:

```text
A. create/open initial Canvas source
B. see actor UNKNOWN + explanation/finding
C. correct actor to Manager
D. see PR2 + reassessment
E. freeze automation-design handoff
F. inspect capability/execution/mapping/policy/deployment design
G. start actual local Temporal Workflow
H. submit approve/reject through reference human form/Update
I. inspect result and full runtime→source lineage
```

Design review correction (C) and runtime business approval (H) are distinct interactions and must not share identity/history accidentally.

---

# 21. Test architecture

Retain v0.1 layers:

```text
unit
contract
architecture dependency
SQLite integration
actual Temporal integration
end-to-end user flow
```

Required executable assertions include:

```text
C01–C20 Canvas
selected frozen provenance/validation/review/capability/execution invariants
forbidden imports
restart durability
idempotent side effect under retry
server-backed Temporal runtime evidence
full backward lineage
```

---

# 22. Full backward lineage acceptance

Approved runtime path must traverse exact identities:

```text
WorkflowExecutionObservation
→ WorkflowExecutionRuntimeSegmentObservation
→ DeploymentRevision
→ RuntimePolicyRevision
→ TemporalMappingRevision
→ ExecutionPlanRevision
→ CapabilityBindingRevision
→ CapabilityRequirement
→ ScopeFreezeRecord / SemanticFreezeRecord
→ corrected ProcessRevision
→ prior review/source lineage
→ SemanticClaim / ProvenanceLink
→ SourceOccurrence
→ SourceRepresentation
→ initial/new CanvasRevision / SourceOrigin
```

No label matching is accepted as lineage.

---

# 23. Staging

```text
B0 contract manifest / workspace / dependency boundaries
B1 IDs / deterministic JSON / SQLite repositories
B2 Canvas/source/intake + C01–C20
B3 canonical/provenance/validation
B4 explanation/review/correction/freeze
B5 capability/human/form/binding
B6 ExecutionPlan/mapping/policy/deployment domains
B7 Temporal worker/reference provider
B8 minimal reference API/web
B9 actual Temporal end-to-end runtime + evidence
B10 failure/retry/restart/lineage closure
```

Every stage must pass before the next.

If implementation reveals a frozen contract defect:

```text
STOP affected BUILD stage
→ version DESIGN/ARCH contract
→ rerun required regressions
→ resume only after re-freeze
```

---

# 24. Explicit non-scope

Still forbidden:

```text
BPMN/image/language/n8n adapter implementations
real Gmail/Drive/SaaS connectors
production IAM/secrets
production Temporal Cloud deployment
multi-user collaboration
visual-design polish
broad provider catalog
advanced Nexus/Child/Schedule/Continue-As-New implementation
process analytics/mining
```

---

# 25. BUILD acceptance

The bounded reference slice closes only when automated evidence proves:

```text
source preservation / immutable correction history
semantic validation before/after correction
explanation + visual review baseline synchronization
freeze/readiness discipline
explicit capability matching/selection/binding
form/process-use separation
ExecutionPlan/canonical separation
persisted mapping/policy/deployment design
actual Temporal Workflow/Update/Activity execution
idempotent provider effect under retry
server-backed runtime observations
SQLite restart durability
runtime→source lineage
zero forbidden dependency violations
```

---

# 26. BUILD-opening candidate decision

If the full V01–V40 regression passes against this v0.2 plan, the post-Phase-5 review may authorize only:

```text
build/reference-vertical-slice/
```

No broader product BUILD is implied.
