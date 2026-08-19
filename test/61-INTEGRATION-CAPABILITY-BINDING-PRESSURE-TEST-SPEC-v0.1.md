# TALOS — Integration / Capability Binding Pressure-Test Spec v0.1

Status: **T4-03 PRESSURE-TEST SPEC**  
Date: **2026-08-19**

Targets:

```text
design/30-INTEGRATION-CAPABILITY-BINDING-CONTRACT-v0.1.md
arch/16-INTEGRATION-CAPABILITY-BINDING-ARCHITECTURE-v0.1.md
```

BUILD remains closed.

## Gate rule

```text
36 / 36 PASS required
```

# G01–G36

```text
G01  compatible match does not auto-bind
G02  explicit selection decision records authority/rationale
G03  binding pins exact CapabilityRequirement identity
G04  binding pins exact CapabilityOfferingRevision
G05  newer offering revision does not silently replace pinned revision
G06  provider switch creates new binding revision, not ProcessRevision automatically
G07  logical input maps explicitly to provider input
G08  logical output maps explicitly from provider output
G09  provider success code ≠ business outcome
G10  required outcome observability is validated
G11  rename mapping remains implementation mapping, not business rule
G12  structural/value transform does not silently alter business meaning
G13  unresolved input mapping blocks READY_FOR_EXECUTION_DESIGN
G14  unresolved output mapping blocks READY_FOR_EXECUTION_DESIGN when material
G15  safety incompatibility blocks binding readiness
G16  required provider/channel constraints are rechecked against selected offering
G17  static non-secret config value may be part of binding design when environment-independent
G18  environment-dependent config declares resolution contract without concrete deployment value
G19  credential contract ≠ secret value
G20  no password/token/secret bytes in binding records
G21  missing credential resolution contract may block binding design completeness
G22  actual missing deployment credential does not rewrite business semantics
G23  existing implementation reuse requires explicit selection
G24  n8n workflow offering may be bound without becoming orchestration authority
G25  human/form logical design remains provider-independent after supporting-service bindings
G26  same binding design may be realized in dev/staging/prod
G27  environment-specific credential handle must not live as one authoritative value on reusable BindingRevision
G28  secret rotation must not require a new CapabilityBindingRevision when design is unchanged
G29  environment endpoint/value rotation does not rewrite binding design when resolution strategy is unchanged
G30  binding design readiness ≠ deployment readiness
G31  READY_FOR_EXECUTION_DESIGN does not mean executable/deployable
G32  binding does not contain Temporal Activity/Workflow/Signal/Update mapping
G33  binding revision/history is immutable
G34  pure implementation change can occur without source/provenance rewrite
G35  semantic requirement change requires upstream semantic/capability redesign, not binding-only patch
G36  Phase-5 handoff pins exact semantic/capability/form/binding versions
```

## Critical fixtures

### G05

```text
OfferingRevision Gmail-v1
BindingRevision B1 → Gmail-v1
later Gmail-v2 exists
```

B1 remains pinned to v1 until explicit binding revision/migration.

### G09/G10

Business requirement:

```text
MESSAGE_DELIVERED
```

Provider evidence:

```text
HTTP 202 / accepted for processing
```

Binding cannot claim outcome observability unless it has evidence/mapping that establishes delivery as required.

### G17/G18

Environment-independent configuration:

```text
email template code = CUSTOMER_CONFIRMATION_V2
```

may be pinned when semantically a binding design constant.

Environment-dependent:

```text
base URL
sender account
folder ID
tenant-specific endpoint
```

should be represented as a resolution requirement/slot, not one production value inside reusable binding design.

### G27/G28 — credential environment separation

Same provider/offering/mapping design:

```text
BindingRevision B1
```

is used in:

```text
dev  → secret handle DEV-M365
prod → secret handle PROD-M365
```

v0.1 currently allows:

```text
CredentialRequirementBinding.secureReferenceRef
```

singular on `CapabilityBindingRevision` while also claiming the same binding can serve many environments.

If `secureReferenceRef` is an actual secure-store locator/handle, B1 becomes environment-specific and secret rotation/environment variation requires design mutation.

Required separation:

```text
CredentialRequirementBinding
→ symbolic credential slot/resolution contract only

later environment/deployment realization
→ environment-specific secureReferenceRef
```

A contract that stores the environment-specific credential handle directly on the reusable binding design fails G27.

### G29

Changing production base URL/tenant value while the offering and resolution contract remain the same must not generate a new binding design revision solely because runtime/deployment configuration changed.

### G31/G32

```text
BindingAssessment = READY_FOR_EXECUTION_DESIGN
```

means Phase 5 may begin execution design. It is not runnable, and T4-03 must still contain no Temporal primitive mappings.

# Decision

Any failure requires versioned evolution and full G01–G36 regression.
