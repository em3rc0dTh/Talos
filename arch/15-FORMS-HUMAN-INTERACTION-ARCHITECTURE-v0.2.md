# TALOS — Forms / Human Interaction Capability Architecture v0.2

Status: **ARCHITECTURE CANDIDATE / T4-02 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T4-02 architecture: `15-FORMS-HUMAN-INTERACTION-ARCHITECTURE-v0.1.md`

Target: `design/28-FORMS-HUMAN-INTERACTION-CONTRACT-v0.2.md`

BUILD remains closed.

## Why v0.2 exists

Initial result:

```text
U01–U36
34 PASS / 2 FAIL
```

U05/U06 proved that reusable form-local structures cannot contain authoritative process-occurrence information/outcome identities.

v0.2 moves those semantics to explicit `FormUseBinding` mappings.

## 1. End-to-end architecture

```text
CapabilityRequirement / Facets
        ↓
HumanInteractionDesigner
        ↓
HumanInteractionDesignRevision
        ├── participant / authority / identity requirements
        ├── information / outcome / evidence contracts
        ├── timing / escalation / delegation
        └── FormUseBinding[]
                 ↓
        FormInformationItemMapping[]
        FormOutcomeMapping[]
                 ↓
             FormRevision
              reusable
```

## 2. Reusable form registry

```text
FormDefinition
        ↓
FormRevision
  ├── FormFieldContract[]
  ├── FormRule[]
  ├── FormOutcomeAction[]
  └── FormDesignFacet[]
```

Reusable form-local objects contain no authoritative process-occurrence IDs.

## 3. Form use mapper

Conceptual service:

```text
FormUseMapper
```

Consumes:

```text
HumanInteractionDesignRevision
HumanInformationItemRequirement[]
HumanOutcome[]
chosen logical FormRevision
```

Produces immutable:

```text
FormUseBinding
FormInformationItemMapping[]
FormOutcomeMapping[]
```

It does not mutate the reused `FormRevision`.

## 4. Information mapping boundary

```text
process-context information requirement
        ≠
reusable form field
```

`FormInformationItemMapping` is the explicit bridge.

Different interactions may map distinct process data identities to the same form-local field.

## 5. Outcome mapping boundary

```text
form-local action intent
        ≠
process-context HumanOutcome
```

`FormOutcomeMapping` is the explicit bridge.

Different uses may map the same form action to different business outcomes without form mutation.

## 6. Form design provenance

`FormDesignFacet` stores reusable form design history/property basis independently from active process-use mapping.

Originating process/design references may remain explanatory provenance only.

## 7. Human interaction architecture retained

v0.1 boundaries remain for:

```text
ParticipantRequirement
AuthorityRequirement
IdentityAssuranceRequirement
HumanInformationContract
HumanOutcomeContract
HumanCompletionRule
HumanEvidenceRequirement
BusinessTimingRequirement
EscalationRequirement
DelegationRequirement
```

## 8. Formless interactions retained

A human interaction may have no `FormUseBinding`.

Business outcomes/evidence remain modelable.

## 9. Form rule boundary retained

Form-local visibility/requiredness/validation rules do not create process routing automatically.

Use-specific overrides may live on the form-use design mapping without mutating the reusable form revision.

## 10. Versioning

```text
logical reusable form change → new FormRevision
human interaction change      → new HumanInteractionDesignRevision
form use semantic mapping     → new mapping/use design history
renderer-only change          → no logical form revision
```

## 11. Provider/runtime separation retained

T4-02 still does not select:

```text
renderer
identity provider
task inbox
runtime user
storage provider
signature provider
Temporal Signal/Update/timer
```

## 12. Anti-goals

Do not:

- embed process occurrence IDs as reusable form-local identity;
- clone/mutate a shared form per process use merely to change mappings;
- infer business outcomes from rendered button labels;
- make logical forms UI-framework contracts;
- make deadlines/escalations execution policies;
- introduce T4-03 provider binding or Phase-5 runtime mechanics.

## 13. Gate

v0.2 must pass full U01–U36 regression.

BUILD remains closed.
