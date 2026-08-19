# TALOS — Existing Automation Adapter Contract v0.2

Status: **DESIGN CANDIDATE / P2-05 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active P2-05 design: `16-EXISTING-AUTOMATION-ADAPTER-CONTRACT-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

Initial P2-05 pressure test:

```text
A01–A32
31 PASS
 1 FAIL
```

Failure:

```text
A27 — definition active flag vs deployment/runtime truth
```

v0.1 separated automation definition from runtime observation, but did not give deployment/activation evidence its own first-class immutable record.

v0.2 adds:

```text
AutomationDeploymentObservation
```

and freezes the three-layer distinction:

```text
DEFINITION CONFIGURATION
        ≠
DEPLOYMENT / ACTIVATION OBSERVATION
        ≠
RUNTIME EXECUTION OBSERVATION
```

No frozen Phase-1 or common-intake contract is reopened.

---

# 1. Fundamental invariants

All v0.1 invariants remain, plus:

```text
AUTOMATION DEFINITION SNAPSHOT        ≠ DEPLOYMENT OBSERVATION
DEPLOYMENT OBSERVATION                ≠ RUNTIME EXECUTION OBSERVATION
PROVIDER active=true                  ≠ CURRENT DEPLOYMENT PROOF
DEPLOYED / ACTIVATED                  ≠ EXECUTED
EXECUTED                              ≠ BUSINESS SUCCESS
CURRENT DEPLOYED REVISION             ≠ LATEST SOURCE EXPORT AUTOMATICALLY
DEPLOYMENT ENVIRONMENT                ≠ BUSINESS PARTICIPANT
NEW DEPLOYMENT OBSERVATION            ≠ MUTATION OF OLD OBSERVATION
```

Primary law:

> TALOS must be able to explain separately what an automation definition says, what deployment state was observed, and what executions were actually observed.

---

# 2. Source family and perspective

Source family:

```text
EXISTING EXECUTABLE / AUTOMATION DEFINITION
```

Extraction mode:

```text
AUTOMATION_PARSE
```

Implementation-derived semantic claims normally use:

```text
IMPLEMENTED_BEHAVIOR
```

Runtime traces remain:

```text
OPERATIONAL_OBSERVATION
```

Deployment-state evidence is source-family evidence about implementation state; it does not become business intent.

---

# 3. Provenance profile

Preserve before interpretation:

```text
SourceOrigin
SourceCapture
SourceArtifact(EXISTING_AUTOMATION)
SourceRepresentation(NATIVE_STRUCTURED | NATIVE_DIGITAL)
```

Provider exports, connector fetches and API imports remain immutable source representations.

---

# 4. AdapterAttempt

Use frozen common `AdapterAttempt`:

```text
adapterId = ExistingAutomationAdapter
adapterVersion = versioned
extractionMode = AUTOMATION_PARSE
```

Input fingerprint includes:

```text
source representation digest
adapter/version
provider mapping registry version
canonical version where relevant
semantic parser configuration digest
```

---

# 5. AutomationDefinitionSnapshot

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

This answers:

```text
What configuration did the supplied definition/export contain?
```

It does **not** answer:

```text
Was that exact definition deployed?
Was it active in environment E?
Did it execute?
```

---

# 6. AutomationDeploymentObservation — new in v0.2

```text
AutomationDeploymentObservation
- id
- sourceOriginId
- sourceArtifactId?
- definitionSnapshotRef?
- nativeWorkflowId?
- observedDefinitionVersionRef?
- environmentRef?
- deploymentTargetRef?
- observedState
- observationMethod
- observationSourceRef?
- evidenceFragmentRefs[]
- truthClass
- confidence?
- observedAt
- recordedAt
- notes?
```

`observedState`:

```text
DEPLOYED_ACTIVE
DEPLOYED_INACTIVE
DEPLOYED_STATE_UNKNOWN
NOT_DEPLOYED_OBSERVED
UNKNOWN
SOURCE_DEFINED
```

`observationMethod`:

```text
PROVIDER_API
CONNECTOR_FETCH
ADMIN_UI_CAPTURE
CONFIG_EXPORT_METADATA
HUMAN_ATTESTATION
SOURCE_DEFINED
UNKNOWN
```

Rules:

```text
CONFIG_EXPORT_METADATA
      may support a deployment-state claim
      but does not outrank independent provider/runtime observation automatically
```

Each observation is immutable.

A later state creates a new observation, not a mutation.

---

# 7. Deployment observation vs definition metadata

Example:

```text
DefinitionSnapshot D1
providerReportedActiveState = true
exportedAt = T1
```

Later:

```text
DeploymentObservation O2
observedState = DEPLOYED_INACTIVE
observedAt = T2
```

Both remain true historical evidence for different times/sources.

TALOS does not rewrite D1 to `false`.

---

# 8. Runtime observation

Actual execution/run/log evidence remains separate:

```text
SourceArtifact(RUNTIME_OBSERVATION)
perspective = OPERATIONAL_OBSERVATION
```

Possible execution evidence may establish:

```text
execution occurred
node/path observed
input/output/event metadata where safely preserved
failure/success technical state
```

but does not automatically establish business success/outcome.

```text
DEPLOYED_ACTIVE ≠ EXECUTED
EXECUTED        ≠ BUSINESS SUCCESS
```

---

# 9. AutomationNodeOccurrence

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

Provider node type/label/ID remain source implementation evidence, not canonical identity/meaning automatically.

---

# 10. AutomationConnectionOccurrence

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

Provider graph structure does not automatically equal business sequence/control flow.

---

# 11. Routing, retry and error discipline

```text
technical routing       ≠ business decision automatically
retry/backoff            ≠ business loop/policy automatically
error workflow/handler   ≠ business exception automatically
continue-on-error        ≠ business acceptance automatically
```

Business meaning requires separate semantic evidence.

---

# 12. Trigger discipline

Webhook/schedule/manual/polling/provider-event trigger configuration is implementation truth.

Business trigger meaning is a separate candidate claim.

Polling cadence does not automatically become business timer/wait semantics.

---

# 13. Expressions / code / templates

Preserve literal implementation evidence where available.

Candidate classifications:

```text
business rule
technical transform
routing predicate
data mapping
opaque implementation logic
mixed logic
```

No arbitrary expression/code becomes business rule source truth automatically.

---

# 14. Provider/API binding vs capabilities

Preserve provider operations/endpoints/configuration as implementation evidence.

```text
provider binding ≠ Capability Contract automatically
```

Capability discovery/binding remains later work.

---

# 15. Credentials / secrets

Safe references may be preserved; secret values never become canonical process semantics/data.

```text
credential reference ≠ business data
secret value          ≠ process meaning
```

---

# 16. Disabled nodes and editor metadata

Disabled nodes remain source occurrences.

Editor layout/sticky notes/positions/annotations remain authoring/annotation evidence unless separately meaningful.

---

# 17. Sub-workflows / external references

Use immutable `AutomationWorkflowReference` with resolution states:

```text
RESOLVED_LOCAL
RESOLVED_EXTERNAL_AVAILABLE
EXTERNAL_NOT_AVAILABLE
UNRESOLVED
INVALID
SOURCE_DEFINED
```

No unavailable child/sub-workflow body is invented.

---

# 18. Merge/fan-in/fan-out

Provider graph shape + provider mode + data behavior + business evidence are required before canonical split/join semantics are asserted.

Multiple inputs do not prove ALL/ANY/N_OF_M by themselves.

---

# 19. Side effects

Provider operation may support side-effect candidate, but business outcome, compensation, idempotency and failure policy remain separate.

Frozen Semantic Validation handles missing business recovery semantics where material.

---

# 20. Multiple definition revisions

Different exports/versions remain immutable historical representations/snapshots.

No source freshness rule silently overwrites prior evidence.

A deployment observation may reference a specific observed version or remain unresolved when version identity is unknown.

---

# 21. Candidate semantic scopes

One automation may produce 0..N:

```text
PROCESS_CANDIDATE
EXECUTABLE_SLICE_CANDIDATE
TECHNICAL_ORCHESTRATION_SCOPE
INTEGRATION_TOPOLOGY_SCOPE
BUSINESS_RULE_SCOPE
NON_EXECUTABLE_CONTEXT
SOURCE_DEFINED
```

Pure infrastructure automation may yield zero business-process candidates.

---

# 22. Evidence perspective discipline

```text
AUTOMATION DEFINITION / CONFIG
→ IMPLEMENTED_BEHAVIOR

DEPLOYMENT OBSERVATION
→ implementation-state evidence; never BUSINESS_INTENT automatically

RUN / TRACE / LOG
→ OPERATIONAL_OBSERVATION

SOP / human confirmed policy
→ BUSINESS_INTENT where evidence supports it
```

These perspectives can coexist and conflict.

---

# 23. Conflict example

```text
SOP: manager approval required                  BUSINESS_INTENT
automation: auto-approve when score > threshold IMPLEMENTED_BEHAVIOR
runtime: 42 cases auto-approved                  OPERATIONAL_OBSERVATION
```

TALOS preserves all three.

No executable/current source wins automatically.

---

# 24. Canvas review compatibility

Canvas can project:

```text
canonical meaning
source-only provider nodes/connections
implementation detail
providerReportedActiveState
deployment observations
runtime observations
implemented-behavior vs business-intent conflicts
unsupported nodes
safe credential refs
validation findings
```

User correction creates review-authored lineage, not source rewrite.

---

# 25. Adapter/version history

New adapter/provider mapping version creates a new immutable attempt/result/claims.

New deployment observations and runtime observations also append history rather than modifying old evidence.

---

# 26. Common intake compatibility

All specialization flows through frozen:

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

Automation-specific objects remain source extensions/evidence structures.

---

# 27. No direct Temporal path

Required:

```text
AUTOMATION SOURCE
→ IMPLEMENTATION EVIDENCE
→ SEMANTIC CLAIMS / 0..N SCOPES
→ CANONICAL
→ PROVENANCE
→ VALIDATION
→ later capability/execution design
```

Forbidden:

```text
n8n/provider export → Temporal directly
```

---

# 28. Regression target

v0.2 must pass full A01–A32, especially:

```text
A27 — definition active flag vs deployment/runtime truth
A28 — runtime observation separation
A29 — immutable definition revision history
A30 — review correction without source rewrite
A31 — adapter reinterpretation history
```

BUILD remains closed.
