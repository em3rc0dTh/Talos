# TALOS — Existing Automation Adapter Architecture v0.2

Status: **ARCHITECTURE CANDIDATE / P2-05 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active P2-05 architecture: `08-EXISTING-AUTOMATION-ADAPTER-ARCHITECTURE-v0.1.md`

Target design:

```text
design/16-EXISTING-AUTOMATION-ADAPTER-CONTRACT-v0.2.md
```

## Why v0.2 exists

Initial pressure test:

```text
A01–A32
31 PASS / 1 FAIL
```

A27 proved that automation definitions, deployment/activation observations and actual runtime observations require separate immutable boundaries.

---

# 1. End-to-end architecture

```text
AUTOMATION DEFINITION SOURCE
        ↓
SOURCE PRESERVATION
        ↓
AdapterAttempt(AUTOMATION_PARSE)
        ↓
AutomationDefinitionSnapshot
        ↓
PROVIDER OCCURRENCES / CONNECTIONS / REFS
        ↓
IMPLEMENTED_BEHAVIOR CLAIMS
        ↓
0..N SEMANTIC SCOPES
        ↓
CANONICAL / PROVENANCE / VALIDATION
```

Independent evidence lanes may later attach:

```text
AutomationDeploymentObservation
RuntimeObservation
Business-intent source(s)
```

without mutating the definition snapshot.

---

# 2. Three-state evidence architecture

```text
DEFINITION CONFIGURATION
AutomationDefinitionSnapshot
        │
        │ optional identity/version relation
        ▼
DEPLOYMENT / ACTIVATION EVIDENCE
AutomationDeploymentObservation
        │
        │ may correlate to executions
        ▼
RUNTIME EXECUTION EVIDENCE
RuntimeObservation source artifacts/events
```

None is substituted for another.

---

# 3. Definition parser boundary

`AutomationProviderParser` preserves:

```text
native workflow IDs
node IDs/types/versions
connection topology
parameters/configuration
disabled state
provider-reported active metadata
workflow references
credential references
editor metadata
provider extensions
```

It emits source evidence, not canonical process truth.

---

# 4. Deployment observation boundary — new in v0.2

Conceptual service:

```text
AutomationDeploymentEvidenceService
```

Consumes explicit deployment/activation evidence from supported capture channels such as provider API/connector/admin evidence/human attestation.

Produces immutable:

```text
AutomationDeploymentObservation
```

It cannot update:

```text
AutomationDefinitionSnapshot
```

or runtime history.

---

# 5. Deployment identity/correlation

A deployment observation may correlate to:

```text
nativeWorkflowId
observedDefinitionVersionRef
AutomationDefinitionSnapshot
source artifact / environment
```

but unresolved version identity is allowed.

No observation is forced to reference a definition snapshot when the evidence cannot establish exact version identity.

---

# 6. Runtime observation boundary

Actual run/log/trace evidence uses separate provenance with perspective:

```text
OPERATIONAL_OBSERVATION
```

It may prove that a path executed but cannot rewrite configuration or establish business success automatically.

---

# 7. Semantic interpretation boundary

`AutomationSemanticInterpreter` turns provider evidence into property-scoped claims, normally:

```text
perspective = IMPLEMENTED_BEHAVIOR
```

Business intent remains independent.

---

# 8. Routing/retry/error boundary

Preserve technical routing/retry/error semantics before any business mapping.

```text
technical IF/router       ≠ business decision automatically
retry/backoff             ≠ business loop automatically
error workflow            ≠ business exception automatically
```

---

# 9. Credentials/security boundary

`AutomationCredentialBoundary` exposes safe references/metadata only.

Secret values are excluded from canonical semantics and review projections by contract.

---

# 10. Reference-resolution boundary

`AutomationWorkflowReference` handles external/sub-workflow references.

Unavailability is preserved; child semantics are never fabricated.

---

# 11. Provider binding / capability boundary

Provider nodes/endpoints/operations remain implementation bindings.

Later capability design may consume this evidence, but P2-05 creates no `Capability Contract` automatically.

---

# 12. Candidate scope discovery

Possible scopes:

```text
PROCESS_CANDIDATE
EXECUTABLE_SLICE_CANDIDATE
TECHNICAL_ORCHESTRATION_SCOPE
INTEGRATION_TOPOLOGY_SCOPE
BUSINESS_RULE_SCOPE
NON_EXECUTABLE_CONTEXT
SOURCE_DEFINED
```

One automation definition may produce zero business-process scopes.

---

# 13. Cross-source evidence merge

```text
Automation definition      IMPLEMENTED_BEHAVIOR
Deployment observation     implementation-state evidence
Runtime trace              OPERATIONAL_OBSERVATION
SOP / user clarification   BUSINESS_INTENT
```

Frozen provenance/conflict rules preserve disagreement.

No evidence family wins solely due to executability, deployment or recency.

---

# 14. Canvas review integration

Projection may show all layers together while preserving provenance ownership:

```text
business/canonical meaning
provider source detail
definition active metadata
deployment observations
runtime observations
conflicts/findings
```

Review correction writes new review-authored evidence only.

---

# 15. Failure isolation

```text
parser failure                 → source survives
deployment observation failure → definition survives
runtime import failure          → definition/deployment evidence survives
normalization failure           → source family evidence survives
validation blocker              → no execution readiness laundering
```

---

# 16. Version/history discipline

Each of these is append-only historical evidence:

```text
AutomationDefinitionSnapshot
AutomationDeploymentObservation
RuntimeObservation
AdapterAttempt / result
Review correction / baseline transition
```

No “current” convenience pointer may replace historical identity.

---

# 17. Common architecture compatibility

P2-05 still terminates at frozen common boundaries:

```text
SourceEvidenceGraph
CandidateSemanticScope
CanonicalNormalizer
Provenance
SemanticValidator
Canvas Review
```

No private provider runtime or Temporal compiler path is introduced.

---

# 18. Regression gate

Must pass all A01–A32, especially the new distinction:

```text
DefinitionSnapshot
      ≠
DeploymentObservation
      ≠
RuntimeObservation
```

BUILD remains closed.
