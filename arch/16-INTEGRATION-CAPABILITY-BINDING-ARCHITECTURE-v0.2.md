# TALOS — Integration / Capability Binding Architecture v0.2

Status: **ARCHITECTURE CANDIDATE / T4-03 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T4-03 architecture: `16-INTEGRATION-CAPABILITY-BINDING-ARCHITECTURE-v0.1.md`

Target: `design/30-INTEGRATION-CAPABILITY-BINDING-CONTRACT-v0.2.md`

BUILD remains closed.

## Why v0.2 exists

Initial result:

```text
G01–G36
35 PASS / 1 FAIL
```

G27 proved that an environment-specific secure-reference handle cannot live on a reusable binding design revision.

v0.2 separates binding design slots/contracts from later environment/deployment realization.

## 1. End-to-end architecture

```text
CapabilityRequirement
+ OfferingRevision candidates
        ↓
CapabilitySelectionDecision
        ↓
CapabilityBindingRevision
        ├── input/output/outcome mappings
        ├── ConfigurationResolutionSlot[]
        ├── CredentialResolutionContract[]
        └── binding constraints
        ↓
CapabilityBindingAssessment
        ↓
READY_FOR_EXECUTION_DESIGN
        ↓
Phase 5
        ↓
EnvironmentBindingRealization / execution mapping later
```

## 2. Binding design boundary

`CapabilityBindingRevision` pins:

```text
requirement
selected OfferingRevision
selection decision
logical/provider mappings
configuration resolution contracts
credential resolution contracts
constraints
```

It does not pin concrete environment values, secure-store handles or Temporal runtime coordinates.

## 3. ConfigurationResolutionSlot

Reusable design contract for one offering configuration need.

```text
STATIC_NON_SECRET
ENVIRONMENT_CONFIGURATION
DEPLOYMENT_CONFIGURATION
RUNTIME_CONTEXT
SECRET_DERIVED_CONFIGURATION
```

Only genuinely environment-independent non-secret constants may be embedded in the binding design.

## 4. CredentialResolutionContract

Reusable symbolic contract:

```text
credential class
permission scopes
resolution strategy
environment dependency
```

It contains no actual secure reference handle or secret material.

## 5. Environment realization boundary

Conceptual downstream:

```text
BindingRevision B1
        ├── DEV realization
        ├── STAGING realization
        └── PROD realization
```

Each may resolve different:

```text
configuration values
credential handles
runtime endpoints
```

without mutating B1.

T4-03 names this boundary but Phase 5/deployment architecture owns its full contract.

## 6. Selection/matching boundaries retained

```text
MatchAssessment != SelectionDecision != BindingRevision
```

Best/only match never auto-binds.

## 7. Mapping boundaries retained

```text
logical input   != provider input
logical output  != provider output
business outcome != provider status
```

Explicit mappings remain required and versioned.

## 8. Outcome observability retained

A binding cannot be ready for execution design if required business outcome evidence cannot be established through the selected offering.

## 9. Binding assessment semantics

`READY_FOR_EXECUTION_DESIGN` means:

```text
selection complete
material mappings complete
outcome observability sufficient
safety compatibility sufficient
configuration resolution contracts complete
credential resolution contracts complete
```

It does not require actual dev/prod values or secrets and does not mean deployment-ready.

## 10. Rotation/change law

```text
secret rotation                       → environment realization change
base URL/tenant value rotation        → environment realization change
provider/offering selection change    → new BindingRevision
mapping strategy change               → new BindingRevision
business semantic requirement change  → upstream semantic/capability redesign
```

## 11. Existing implementation/n8n boundary

Existing automation may support explicit reuse and offer mapping hints. n8n remains an offering implementation, not durable orchestration authority.

## 12. Human/form support boundary

T4-02 logical human/form artifacts remain untouched when task/identity/signature/storage offerings are later selected for supporting capability requirements.

## 13. Phase-5 handoff

Phase 5 receives exact immutable capability/form/binding artifacts plus resolution slots/contracts, then designs:

```text
Temporal execution mapping
retry/timeout/runtime policies
concrete environment realization
DeploymentRevision
```

## 14. Anti-goals

Do not:

- store actual environment secure references in reusable binding design;
- create a new binding revision for secret rotation alone;
- create a new binding revision for environment value change alone;
- auto-bind matcher results;
- equate provider success with business outcome;
- introduce Temporal mappings or deployment state into T4-03.

## 15. Gate

v0.2 must pass full G01–G36 regression.

BUILD remains closed.
