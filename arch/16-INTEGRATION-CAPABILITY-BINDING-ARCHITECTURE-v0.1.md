# TALOS — Integration / Capability Binding Architecture v0.1

Status: **ARCHITECTURE CANDIDATE / T4-03 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

Target: `design/30-INTEGRATION-CAPABILITY-BINDING-CONTRACT-v0.1.md`

BUILD remains closed.

## 1. Entry boundary

T4-03 consumes:

```text
CapabilityDesignRevision
CapabilityRequirement / facets
CapabilityOfferingRevision candidate(s)
CapabilityMatchAssessment(s)
T4-02 human/form designs where relevant
```

No ProcessRevision mutation occurs from implementation selection alone.

## 2. End-to-end architecture

```text
CapabilityRequirement
+ compatible OfferingRevision(s)
        ↓
CapabilitySelectionService
        ↓ explicit authority
CapabilitySelectionDecision
        ↓
CapabilityBindingRevision
        ├── input mappings
        ├── output mappings
        ├── outcome mappings
        ├── configuration requirement bindings
        ├── credential requirement bindings
        └── constraints
        ↓
CapabilityBindingValidator
        ↓
CapabilityBindingAssessment
        ↓
READY_FOR_EXECUTION_DESIGN
        ↓
Phase 5 execution design
```

## 3. Selection service

`CapabilitySelectionService` may present match evidence/ranking but cannot auto-accept an offering.

Selection creates immutable `CapabilitySelectionDecision` with authority/rationale.

## 4. Binding revision repository

```text
CapabilityBindingDefinition
        ↓
CapabilityBindingRevision V1
CapabilityBindingRevision V2
...
```

Every revision pins one exact `CapabilityOfferingRevision`.

No `latest offering` lookup is binding truth.

## 5. Mapping architecture

```text
logical requirement input/output/outcome
        ↓ explicit mapping
provider/offering schema/evidence
```

Components:

```text
CapabilityInputMapping
CapabilityOutputMapping
CapabilityOutcomeMapping
MappingTransformContract
```

Mappings never rewrite T4-01 logical contracts.

## 6. Outcome observability

`CapabilityOutcomeMapping` proves how implementation evidence can establish a required logical/business outcome.

If the required outcome cannot be observed, binding cannot become `READY_FOR_EXECUTION_DESIGN`.

Provider success code alone is insufficient when stronger business evidence is required.

## 7. Configuration contract architecture

Offering declares configuration requirements.

Binding design resolves their *source/strategy* through `ConfigurationRequirementBinding`.

Environment-dependent concrete values remain downstream.

## 8. Credential boundary

Credential/auth needs flow:

```text
CapabilityAuthContract
        ↓
CredentialRequirementBinding
        ↓
symbolic secure-resolution requirement
        ↓
Phase-5/deployment environment realization later
```

No secret material enters T4-03.

## 9. Environment/deployment boundary

T4-03 design may mark requirements environment-dependent but does not create concrete deployment state.

The same immutable binding design should be reusable in:

```text
development
staging
production
```

when provider/offering/mapping semantics are the same and only environment realization differs.

## 10. Existing implementation reuse

Existing automation/provider evidence may support selection rationale and mappings.

Reuse still requires explicit selection and compatibility validation.

It does not upgrade provider choice into business semantic truth.

## 11. Human/form supporting services

T4-03 may bind separate capability requirements for task services, identity, signature, storage, notifications, etc., while T4-02 logical human/form artifacts remain provider-independent.

## 12. n8n boundary

n8n may be selected as an offering implementation. The binding pins its offering revision and mappings/configuration requirements.

Durable orchestration ownership remains with later Phase-5 design.

## 13. Binding assessment

`CapabilityBindingValidator` evaluates:

```text
selection completeness
mapping completeness
required outcome observability
safety compatibility
configuration contract completeness
credential contract completeness
required requirement facets/constraints
```

It does not require concrete deployment secrets or Temporal runtime values.

## 14. Binding history vs environment history

Provider/mapping/configuration-strategy changes create new `CapabilityBindingRevision`.

Environment value changes/secret rotation/health changes should not require binding-design mutation when design semantics are unchanged.

## 15. Phase-5 handoff

Phase 5 gets immutable business/capability/form/binding designs and then decides:

```text
Temporal mapping
runtime wrappers
retries/timeouts
workflow/task queues
concrete deployment environment configuration
DeploymentRevision
```

## 16. Anti-goals

Do not:

- auto-bind the best match;
- store provider secrets/tokens/passwords;
- make environment-specific values part of reusable binding identity unnecessarily;
- use provider API fields as business data identities;
- equate provider success with business outcome;
- silently adopt a newer offering revision;
- rewrite ProcessRevision on pure implementation switch;
- define Temporal Activity/Workflow mappings in T4-03.

## 17. Gate

T4-03 passes only if offering selection, mappings, symbolic config/credential contracts and version history remain cleanly separated from environment/deployment realization and Temporal execution design.

BUILD remains closed.
