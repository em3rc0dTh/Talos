# TALOS — Forms / Human Interaction Capability Architecture v0.1

Status: **ARCHITECTURE CANDIDATE / T4-02 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

Target: `design/28-FORMS-HUMAN-INTERACTION-CONTRACT-v0.1.md`

BUILD remains closed.

## 1. Entry boundary

T4-02 specializes a frozen T4-01 capability requirement such as:

```text
HUMAN_INTERACTION
DATA_COLLECTION
```

No accepted ProcessRevision or T4-01 requirement mutates.

## 2. End-to-end design architecture

```text
CapabilityRequirement
+ CapabilityRequirementFacet[]
        ↓
HumanInteractionDesigner
        ↓
HumanInteractionDesignRevision
        ├── ParticipantRequirement
        ├── HumanInformationContract[]
        ├── HumanOutcomeContract
        ├── Authority / Identity requirements
        ├── Evidence requirements
        ├── Business timing / escalation / delegation
        └── FormUseBinding[]
                 ↓ optional
            FormRevision(s)
```

Forms are optional logical interaction artifacts, not the human interaction itself.

## 3. HumanInteractionDesigner

Derives/designs interaction properties from:

```text
accepted semantic subjects/claims
T4-01 requirement facets
scope freeze
validation context
explicit Phase-4 design authority
```

Every material design property remains property/facet traceable.

## 4. Participant boundary

`ParticipantRequirement` expresses:

```text
role/responsibility
eligibility
business authority
assignment cardinality
```

It does not resolve a runtime user/account.

Concrete assignment services/directories belong later binding/runtime design.

## 5. Identity/authority boundary

```text
AuthorityRequirement
IdentityAssuranceRequirement
```

state required business/governance properties without selecting an IAM/SSO provider.

## 6. Information boundary

`HumanInformationContract` and item requirements define information the human must receive/provide in semantic terms.

```text
semantic information != renderer field payload
```

## 7. Outcome/completion boundary

`HumanOutcomeContract` and `HumanCompletionRule` define observable business interaction result/completion.

UI submission/button state is not completion authority automatically.

## 8. Evidence boundary

`HumanEvidenceRequirement` expresses required evidence such as reason, signature, attachment or attestation without choosing capture/storage/signature providers.

## 9. Form registry boundary

```text
FormDefinition
        ↓
FormRevision
        ├── FormFieldContract[]
        ├── FormRule[]
        └── FormOutcomeAction[]
```

A logical form is reusable and independently versioned.

Renderer implementations are downstream.

## 10. Form use boundary

```text
HumanInteractionDesignRevision
        ↓
FormUseBinding
        ↓
FormRevision
```

`FormUseBinding` maps process-context human information/outcomes to reusable form-local fields/actions.

One interaction may use 0..N forms; one form revision may be reused across many interaction designs.

## 11. Formless interaction path

No form is required for:

```text
manual physical action
phone approval
externally observed signature
in-person inspection
```

Outcome/evidence requirements remain modelable.

## 12. Form rules boundary

Logical form rules may control:

```text
requiredness
visibility
enablement
cross-field consistency
business data constraint
```

They do not create process routing automatically.

## 13. Timing/escalation/delegation boundary

Business-level:

```text
BusinessTimingRequirement
EscalationRequirement
DelegationRequirement
```

Execution mechanism is deferred.

```text
business deadline != Temporal timer
business escalation != scheduler implementation
```

## 14. Outcome-to-process boundary

Interaction outcomes may later map to canonical/process transitions only where frozen semantics establish that relation.

T4-02 cannot synthesize decision edges from form actions.

## 15. Form versioning

Logical form changes create new `FormRevision`.

Presentation-only renderer changes do not.

Later execution/deployment must pin a revision; T4-02 itself defines no runtime deployment.

## 16. Privacy/security boundary

Logical sensitivity/retention/assurance constraints may be designed without embedding credentials or choosing storage/encryption providers.

## 17. Source/design provenance

Interaction design traces:

```text
HumanInteractionDesignRevision
← T4-01 CapabilityRequirement / facets
← accepted ScopeFreezeRecord
← ProcessRevision / claims / provenance
```

Reusable form design has its own design history and is connected to a process occurrence through `FormUseBinding`.

## 18. No implementation leakage

Forbidden as semantic/domain authorities in T4-02:

```text
React component types
HTML input types
CSS/layout coordinates
task inbox IDs
runtime user IDs
OAuth provider IDs
Temporal Signal/Update names
Temporal timer/retry config
storage bucket/provider
signature SaaS IDs
```

## 19. Anti-goals

Do not:

- force every human interaction to use a form;
- treat form submission as business completion automatically;
- treat form field order as process sequence;
- treat visibility rules as business branches automatically;
- resolve roles directly to runtime users;
- make forms provider/UI-specific contracts;
- let reusable forms erase process-context requirement identity;
- introduce Temporal mechanics.

## 20. Gate

T4-02 passes only if human interaction and reusable logical forms survive the pressure suite while preserving T4-01 and Phase-1/2/3 boundaries.

BUILD remains closed.
