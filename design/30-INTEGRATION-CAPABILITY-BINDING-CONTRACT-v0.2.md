# TALOS — Integration / Capability Binding Contract v0.2

Status: **DESIGN CANDIDATE / T4-03 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T4-03 design: `30-INTEGRATION-CAPABILITY-BINDING-CONTRACT-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

Initial T4-03 pressure test:

```text
G01–G36
35 PASS
 1 FAIL
```

Failure:

```text
G27 — environment-specific credential handle leaks into reusable binding design
```

v0.2 makes environment-independent binding design and later environment/deployment realization explicit.

No frozen Phase-1/2/3/T4-01/T4-02 contract is reopened.

---

# 1. Fundamental invariants

All v0.1 invariants remain, plus:

```text
CREDENTIAL REQUIREMENT SLOT              != ENVIRONMENT CREDENTIAL HANDLE
CONFIGURATION RESOLUTION SLOT             != ENVIRONMENT CONFIGURATION VALUE
BINDING DESIGN                            != ENVIRONMENT REALIZATION
SECRET ROTATION                           != BINDING DESIGN CHANGE
ENVIRONMENT VALUE ROTATION                != BINDING DESIGN CHANGE
SAME BINDING DESIGN                       may have MANY environment realizations later
STATIC DESIGN CONSTANT                    != ENVIRONMENT VALUE
```

Primary law:

> T4-03 freezes **what implementation is selected and how it must be mapped/configured**, not the concrete secret/account/tenant/environment values used by a deployment.

---

# 2. CapabilityBindingDefinition / Revision

Retain v0.1:

```text
CapabilityBindingDefinition
CapabilityBindingRevision
CapabilitySelectionDecision
```

A `CapabilityBindingRevision` still pins exact:

```text
CapabilityRequirement
CapabilityOfferingRevision
MatchAssessment
SelectionDecision
logical mappings
configuration resolution contracts
credential resolution contracts
binding constraints
```

It does not pin environment realization values.

---

# 3. Selection / history / state

Retain v0.1:

```text
CapabilitySelectionDecision
BindingState
```

No auto-binding and no silent offering-version upgrade.

---

# 4. Input/output/outcome mappings

Retain:

```text
CapabilityInputMapping
CapabilityOutputMapping
CapabilityOutcomeMapping
MappingTransformContract
```

Logical business/capability contracts remain separate from provider payloads/status codes.

Required business outcome observability remains mandatory for binding readiness.

---

# 5. OfferingConfigurationRequirement

Retain offering-side slot declaration:

```text
OfferingConfigurationRequirement
- id
- offeringRevisionId
- key
- valueClass
- requiredness
- sensitivityClass
- allowedValueContractRef?
- environmentDependent?
```

This says what the offering needs, not any environment's actual value.

---

# 6. ConfigurationResolutionSlot — new in v0.2

Binding-design-level resolution contract:

```text
ConfigurationResolutionSlot
- id
- bindingRevisionId
- offeringConfigurationRequirementRef
- slotKey
- resolutionKind
- environmentDependent
- valueContractRef?
- staticNonSecretValue?
- resolutionState
- designFacetRefs[]?
```

`resolutionKind`:

```text
STATIC_NON_SECRET
ENVIRONMENT_CONFIGURATION
DEPLOYMENT_CONFIGURATION
RUNTIME_CONTEXT
SECRET_DERIVED_CONFIGURATION
SOURCE_DEFINED
```

Rules:

```text
STATIC_NON_SECRET
→ value may be pinned only when environment-independent

ENVIRONMENT_CONFIGURATION / DEPLOYMENT_CONFIGURATION
→ actual value forbidden from BindingRevision
```

---

# 7. ConfigurationRequirementBinding — revised

```text
ConfigurationRequirementBinding
- id
- bindingRevisionId
- offeringConfigurationRequirementRef
- configurationResolutionSlotRef
- bindingState
```

Removed as active environment-realization fields:

```text
valueSourceRef
staticNonSecretValue
```

Static design constants live on a slot only when explicitly environment-independent.

---

# 8. CredentialResolutionContract — new in v0.2

```text
CredentialResolutionContract
- id
- bindingRevisionId
- capabilityAuthContractRef
- credentialSlotKey
- credentialClassRef
- requiredPermissionScopes[]?
- environmentDependent
- resolutionKind
- resolutionState
- designFacetRefs[]?
```

`resolutionKind`:

```text
ENVIRONMENT_SECURE_REFERENCE
DEPLOYMENT_SECURE_REFERENCE
WORKLOAD_IDENTITY
MANAGED_IDENTITY
RUNTIME_AUTH_CONTEXT
SOURCE_DEFINED
```

No actual secret-store locator or credential material is stored here.

---

# 9. CredentialRequirementBinding — revised

```text
CredentialRequirementBinding
- id
- bindingRevisionId
- capabilityAuthContractRef
- credentialResolutionContractRef
- bindingState
```

Removed:

```text
secureReferenceRef
```

from reusable binding design.

---

# 10. EnvironmentBindingRealization — downstream boundary only

T4-03 names but does not fully design the downstream realization boundary:

```text
EnvironmentBindingRealization
```

Later Phase-5/deployment work may bind:

```text
binding revision + environment
→ concrete configuration values
→ secure reference handles
→ runtime/deployment coordinates
```

These later records do not mutate T4-03 binding design.

---

# 11. G27 canonical example

Reusable design:

```text
CapabilityBindingRevision B1
Offering = Microsoft365-send-mail-v3
CredentialResolutionContract C1
  credentialSlotKey = mail-sender-auth
  credentialClass = OAUTH_CLIENT_OR_WORKLOAD_IDENTITY
  environmentDependent = true
  resolutionKind = ENVIRONMENT_SECURE_REFERENCE
```

Later realizations:

```text
DEV realization
  C1 → secure handle DEV-M365

PROD realization
  C1 → secure handle PROD-M365
```

Neither handle appears in B1.

Secret rotation changes the environment realization only.

---

# 12. Environment-dependent configuration example

Reusable binding:

```text
ConfigurationResolutionSlot S1
  key = senderMailbox
  resolutionKind = ENVIRONMENT_CONFIGURATION
```

Later:

```text
DEV  → sandbox@company.test
PROD → notifications@company.com
```

No new `CapabilityBindingRevision` is required solely for the environment value difference.

---

# 13. Environment-independent constants

A design constant may remain on the reusable binding when it is genuinely part of the selected integration design:

```text
templateKey = CUSTOMER_CONFIRMATION_V2
```

provided:

```text
environmentDependent = false
resolutionKind = STATIC_NON_SECRET
```

Changing the design constant may create a new binding revision because the integration design changed.

---

# 14. CapabilityBindingAssessment — revised interpretation

Retain readiness vocabulary:

```text
INCOMPLETE_SELECTION
INCOMPLETE_MAPPING
INCOMPLETE_CONFIGURATION_CONTRACT
INCOMPLETE_CREDENTIAL_CONTRACT
OUTCOME_UNOBSERVABLE
SAFETY_INCOMPATIBLE
READY_FOR_EXECUTION_DESIGN
SOURCE_DEFINED
```

Important:

```text
READY_FOR_EXECUTION_DESIGN
```

requires configuration/credential **resolution contracts** to be complete, not actual deployment values/secrets.

Actual environment realization is a Phase-5/deployment readiness concern.

---

# 15. Binding constraints / compatibility recheck

Retain v0.1:

```text
BindingConstraint
exact OfferingRevision pinning
requirement facet snapshot compatibility
MatchAssessment reference/re-evaluation
```

---

# 16. Existing implementation / n8n / human support

All v0.1 boundaries remain:

```text
existing implementation reuse requires explicit selection
n8n offering != orchestration authority
human/form logical contracts remain provider-independent
```

---

# 17. Provider/binding change vs semantic change

Retain:

```text
pure provider/mapping change → new CapabilityBindingRevision
business semantic change     → upstream semantic review/capability redesign
```

Environment-only realization change does not create either automatically.

---

# 18. Phase-5 handoff

Phase 5 receives exact immutable:

```text
ProcessRevision / SemanticFreeze
CapabilityDesignRevision
CapabilityBindingRevision(s)
HumanInteractionDesignRevision / FormRevision(s)
CapabilityBindingAssessment(s)
ConfigurationResolutionSlot(s)
CredentialResolutionContract(s)
```

and then designs execution/deployment realization.

No Temporal primitives are introduced by T4-03.

---

# 19. Regression target

v0.2 must pass all G01–G36, especially:

```text
G27 environment credential separation
G28 secret rotation without binding mutation
G29 environment value rotation without binding mutation
G30/G31 binding-design readiness != deployment/execution readiness
G32 no Temporal mapping
```

BUILD remains closed.
