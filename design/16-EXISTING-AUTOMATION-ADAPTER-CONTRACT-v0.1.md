# TALOS — Existing Automation Adapter Contract v0.1

Status: **DESIGN CANDIDATE / P2-05 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

## Purpose

Define how TALOS receives an existing executable automation definition—using n8n as the initial reference family—without confusing implementation configuration with business intent, operational observation or future TALOS/Temporal design.

The adapter family is:

```text
EXISTING EXECUTABLE / AUTOMATION DEFINITION
```

Extraction mode:

```text
AUTOMATION_PARSE
```

Default evidence perspective for implementation-derived semantic claims:

```text
IMPLEMENTED_BEHAVIOR
```

This default never upgrades implementation evidence into `BUSINESS_INTENT`.

---

# 1. Fundamental invariants

```text
AUTOMATION DEFINITION              ≠ TALOS CANONICAL PROCESS
AUTOMATION NODE                    ≠ BUSINESS ACTIVITY AUTOMATICALLY
PROVIDER NODE TYPE                 ≠ CANONICAL NODE TYPE
PROVIDER NODE ID                   ≠ CANONICAL ID
NODE DISPLAY LABEL                 ≠ BUSINESS MEANING AUTOMATICALLY
IMPLEMENTED BEHAVIOR               ≠ BUSINESS INTENT
IMPLEMENTED BEHAVIOR               ≠ FUTURE TALOS EXECUTION DESIGN
DEFINITION CONFIGURATION           ≠ RUNTIME OBSERVATION
DEFINITION PRESENT                 ≠ DEPLOYED / ACTIVE AUTOMATION PROOF
TRIGGER CONFIGURATION              ≠ BUSINESS TRIGGER INTENT AUTOMATICALLY
TECHNICAL ROUTING                  ≠ BUSINESS DECISION AUTOMATICALLY
TECHNICAL RETRY                    ≠ BUSINESS LOOP / POLICY AUTOMATICALLY
ERROR HANDLER                      ≠ BUSINESS EXCEPTION AUTOMATICALLY
MERGE / SPLIT NODE                 ≠ SEMANTIC JOIN / SPLIT AUTOMATICALLY
SUB-WORKFLOW CALL                  ≠ CANONICAL SUBPROCESS AUTOMATICALLY
EXPRESSION / TEMPLATE              ≠ BUSINESS RULE AUTOMATICALLY
HTTP/API BINDING                   ≠ CAPABILITY CONTRACT AUTOMATICALLY
CREDENTIAL REFERENCE               ≠ CANONICAL PROCESS DATA
SECRET VALUE                       ≠ PROCESS SEMANTICS
DISABLED / INACTIVE NODE           ≠ ABSENT SOURCE EVIDENCE
EDITOR NOTE / POSITION             ≠ PROCESS SEMANTICS
VALID AUTOMATION EXPORT            ≠ COMPLETE BUSINESS PROCESS
UNSUPPORTED NODE TYPE              ≠ LICENSE TO DROP EVIDENCE
AUTOMATION ADAPTER OUTPUT          ≠ TEMPORAL DESIGN
```

Core law:

> Existing automation is evidence about **what a system is configured to do**, not authority about why the business wants it or how TALOS must implement it later.

---

# 2. Provenance profile

Recommended source profile:

```text
SourceOrigin
  originKind = DIGITAL_NATIVE_ARTIFACT | SYSTEM_ARTIFACT
  mediumKind = AUTOMATION_DEFINITION

SourceCapture
  captureMethod = AUTOMATION_IMPORT | DIRECT_UPLOAD | CONNECTOR_FETCH | API_IMPORT | SOURCE_DEFINED

SourceArtifact
  artifactClass = EXISTING_AUTOMATION
  evidencePerspective = IMPLEMENTED_BEHAVIOR

SourceRepresentation
  representationKind = NATIVE_STRUCTURED | NATIVE_DIGITAL
```

The exact supplied export/configuration is preserved before adaptation.

---

# 3. AdapterAttempt

Use frozen `AdapterAttempt`:

```text
adapterId = ExistingAutomationAdapter
adapterVersion = versioned
extractionMode = AUTOMATION_PARSE
```

Input fingerprint includes at minimum:

```text
source representation digest
adapter/version
provider mapping registry version
canonical model version where mapping depends on it
semantic parser configuration digest
```

Failure never deletes the source definition.

---

# 4. AutomationDefinitionSnapshot

One preserved automation definition is interpreted into an immutable source-family snapshot.

```text
AutomationDefinitionSnapshot
- id
- adapterAttemptId
- sourceRepresentationId
- providerFamily
- nativeWorkflowId?
- nativeWorkflowName?
- sourceVersionRef?
- exportedAt?
- providerReportedActiveState?
- nodeOccurrenceIds[]
- connectionOccurrenceIds[]
- referencedWorkflowRefs[]
- variableOrParameterRefs[]
- credentialReferenceRefs[]
- editorMetadataRefs[]
- sourceExtensionRefs[]
- snapshotDigest
```

`providerReportedActiveState` is preserved exactly when supplied, but v0.1 does not yet claim it proves deployment/current runtime state.

---

# 5. AutomationNodeOccurrence

```text
AutomationNodeOccurrence
- sourceOccurrenceId
- nativeNodeId?
- providerNodeType
- providerNodeTypeVersion?
- literalName?
- disabledState?
- parameters{}
- credentialReferenceIds[]
- positionMetadata?
- notesMetadata?
- sourceExtensionRefs[]
```

The exact provider node type is source evidence.

Canonical meaning is separate.

Examples:

```text
provider HTTP/request node  ≠ canonical ACTION automatically
provider IF/router node      ≠ business DECISION automatically
provider Merge node          ≠ JOIN automatically
provider Code node           ≠ one business task automatically
provider AI node             ≠ business actor automatically
```

---

# 6. AutomationConnectionOccurrence

```text
AutomationConnectionOccurrence
- sourceRelationshipId
- nativeConnectionId?
- sourceNodeRef?
- targetNodeRef?
- sourcePort?
- targetPort?
- connectionKind?
- branchIndex?
- sourceEndpointState
- targetEndpointState
- providerMetadata{}
- sourceExtensionRefs[]
```

Connections prove provider graph structure, not business control-flow semantics automatically.

---

# 7. Node labels vs meaning

A label such as:

```text
"Approve invoice"
```

is preserved as literal source text.

It may support a business-action candidate, but the provider node's actual configuration may reveal that it only sends an email, writes a flag or calls an API.

TALOS must preserve both:

```text
literalName
provider implementation behavior
```

and express business meaning as an evidence-backed claim, not as source truth merely from the label.

---

# 8. Technical routing vs business routing

Provider routing constructs may implement:

```text
technical branching
filtering
default/fallback paths
rate-limit handling
transport decisions
business policy
mixed technical + business logic
```

Therefore a routing node may become:

```text
technical topology evidence
+ condition/expression evidence
+ possible canonical decision candidate
```

Only if the condition expresses business meaning may normalization safely propose a business decision/rule.

---

# 9. Retry / loop discipline

Preserve provider retry/backoff/re-execution configuration as implementation evidence.

Rules:

```text
retry-on-failure       ≠ business loop
backoff delay          ≠ business wait policy automatically
max technical attempts ≠ business attempt limit automatically
```

If a business policy explicitly depends on retry outcome, that meaning requires separate evidence/claim.

---

# 10. Error / failure paths

Preserve technical error paths, error workflows, continue-on-error behavior and fallback routes as provider/runtime implementation semantics.

Do not automatically classify them as:

```text
business rejection
business cancellation
compensation
business exception
```

Those require semantic evidence.

---

# 11. Trigger sources

Preserve trigger configuration, including source family such as:

```text
webhook/event
schedule/timer
manual
polling
provider event
sub-workflow invocation
source-defined
```

but:

```text
configured trigger
      ≠
confirmed business trigger intent
```

A schedule may be technical polling rather than the business event that actually matters.

---

# 12. Expressions / templates / code

Automation definitions may contain:

```text
expressions
templates
scripts/code
mapping expressions
conditions
```

Preserve literal implementation text/AST/source reference where available.

Candidate interpretation may classify:

```text
business rule
technical transformation
routing predicate
data mapping
opaque implementation logic
mixed logic
```

No executable expression is promoted directly into canonical business rule truth.

---

# 13. API/provider bindings

Preserve:

```text
provider/service type
operation name
endpoint/template refs
request method/configuration
data mappings
response handling
```

These can be useful later for capability discovery, but:

```text
provider binding
      ≠
canonical Capability Contract
```

Capability binding is a later gate.

---

# 14. Credentials / secrets

Credentials and secret-bearing fields are evidence-boundary data.

Preserve safe metadata such as:

```text
credential reference ID/name/type where supplied and policy allows
provider binding relationship
presence/absence of secret reference
```

Do not copy secret values into canonical process semantics.

```text
SECRET / TOKEN / PASSWORD ≠ canonical process data
```

Concrete secret-storage/redaction implementation is later work.

---

# 15. Disabled / inactive nodes

A disabled node remains a source occurrence.

Interpretation must distinguish at least:

```text
configured in definition
currently disabled in supplied definition
participates in active path candidate
historical/editor-only unknown
```

Disabled does not mean source evidence should be deleted.

---

# 16. Editor / authoring metadata

Examples:

```text
node positions
sticky notes
annotations
viewport
tags/editor metadata
```

may be preserved in authoring/annotation planes.

They do not automatically become process semantics.

---

# 17. Sub-workflows / referenced automations

```text
AutomationWorkflowReference
- id
- ownerNodeOccurrenceId
- literalReference
- referenceKind
- resolutionState
- resolvedSourceArtifactRef?
- resolvedSourceRepresentationRef?
- externalLocator?
- evidenceRefs[]
```

Resolution states:

```text
RESOLVED_LOCAL
RESOLVED_EXTERNAL_AVAILABLE
EXTERNAL_NOT_AVAILABLE
UNRESOLVED
INVALID
SOURCE_DEFINED
```

A sub-workflow call does not automatically become canonical `SUBPROCESS`; referenced workflow semantics may be unavailable or technically scoped.

---

# 18. Merge / fan-out / fan-in

Provider graph topology may show multiple incoming/outgoing connections.

Candidate semantic roles require:

```text
provider node mode/configuration
+ graph topology
+ data/control behavior
+ business-semantic evidence
```

Do not infer:

```text
ALL join
ANY merge
N_OF_M
parallel split
```

from geometry/count alone.

---

# 19. Side effects

Provider nodes may perform side effects such as:

```text
send message
write database
create/update record
charge/payment call
upload file
invoke external service
```

TALOS may infer a side-effect candidate from provider operation evidence, but business outcome, idempotency, compensation and failure policy remain separate semantic questions.

---

# 20. Runtime/configuration distinction

v0.1 preserves provider-reported active/inactive state when included in the definition.

It also enforces:

```text
AUTOMATION DEFINITION
      ≠
RUNTIME EXECUTION HISTORY
```

Actual execution traces/logs, if supplied, must enter as separate `RUNTIME_OBSERVATION` evidence with perspective:

```text
OPERATIONAL_OBSERVATION
```

They do not overwrite the definition artifact.

---

# 21. Multiple automation revisions

Different exports/versions are independent representations/snapshots.

```text
workflow export A
workflow export B
```

must not overwrite each other.

A provider/version relationship may be preserved, but equivalence/supersession requires explicit evidence.

---

# 22. Candidate semantic scopes

One automation definition may yield 0..N scopes:

```text
PROCESS_CANDIDATE
EXECUTABLE_SLICE_CANDIDATE
TECHNICAL_ORCHESTRATION_SCOPE
INTEGRATION_TOPOLOGY_SCOPE
BUSINESS_RULE_SCOPE
NON_EXECUTABLE_CONTEXT
SOURCE_DEFINED
```

A purely technical integration workflow may legitimately yield zero business-process candidates.

---

# 23. IMPLEMENTED_BEHAVIOR perspective

Automation-derived semantic claims default to:

```text
perspective = IMPLEMENTED_BEHAVIOR
```

Examples:

```text
"this workflow currently calls endpoint X"
→ IMPLEMENTED_BEHAVIOR

"business requires endpoint X"
→ NOT established
```

A business owner may later confirm business intent through separate evidence/confirmation records.

---

# 24. Canvas review compatibility

Canvas review may display:

```text
canonical process meaning
source-only automation nodes/connections
provider implementation details
technical routing
unsupported nodes
credential references without secrets
implemented-behavior perspective
conflicts with business-intent sources
validation findings
```

Review corrections create review-authored lineage and do not rewrite the imported automation definition.

---

# 25. Conflicts with other sources

Example:

```text
SOP says: manager approval required
automation says: direct auto-approval under condition X
```

Preserve both claims:

```text
BUSINESS_INTENT
IMPLEMENTED_BEHAVIOR
```

and create/retain conflict evidence when material.

Do not choose one automatically because it is executable or newer.

---

# 26. Common intake compatibility

Automation-specialized structures integrate through frozen:

```text
AdapterAttempt
AdapterResult
ArtifactClassification
SourceEvidenceGraph
SourceOccurrenceDescriptor
SourceRelationshipDescriptor
CandidateSemanticScope
InterpretationClaimSet
SemanticClaim
ProvenanceLink
```

No private Canonical or Temporal path exists.

---

# 27. Canonical mapping discipline

Examples:

```text
provider email node
→ candidate ACTION / communication side effect
```

but:

```text
email provider selection
→ implementation detail
```

and:

```text
provider IF condition
→ candidate decision/rule only when business semantics are supportable
```

and:

```text
technical retry node/config
→ source implementation evidence, not canonical business loop automatically
```

---

# 28. Validation integration

Potential semantic findings remain handled by frozen Semantic Validation v0.2.

Examples:

```text
business meaning of technical routing unresolved
business intent conflicts with implemented behavior
completion semantics not established
post-side-effect failure policy missing
correlation semantics unresolved
```

Implementation-specific provider choices are not automatically T1-03 blockers.

---

# 29. Adapter reinterpretation/version history

A newer adapter/provider mapping registry creates a new immutable `AdapterAttempt` and interpretation candidate.

It never edits old source occurrences/claims.

If accepted meaning changes in an active review workspace, frozen baseline transition/reconciliation applies.

---

# 30. No direct execution compilation

P2-05 does not design Temporal.

Forbidden path:

```text
n8n/provider automation
→ Temporal Workflow / Activity directly
```

Required path:

```text
AUTOMATION SOURCE
→ SOURCE EVIDENCE
→ IMPLEMENTED_BEHAVIOR CLAIMS
→ 0..N SEMANTIC SCOPES
→ CANONICAL
→ PROVENANCE
→ VALIDATION
→ later automation/capability/Temporal design
```

---

# 31. Pressure-test target

P2-05 v0.1 must survive A01–A32 covering:

```text
source/canonical separation
provider ID/label/type separation
implemented behavior vs intent
technical routing/retry/error handling
credentials/secrets
trigger semantics
sub-workflow refs
merge/split interpretation
expressions/code
provider/capability boundary
disabled/editor metadata
partial/unsupported nodes
side effects
runtime observation separation
provider-reported active state
definition/deployment distinction
multiple revisions
0..N scopes
Canvas review
adapter reinterpretation
no direct Temporal output
```

BUILD remains closed.
