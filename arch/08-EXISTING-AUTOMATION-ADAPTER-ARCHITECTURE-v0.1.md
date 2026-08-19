# TALOS — Existing Automation Adapter Architecture v0.1

Status: **ARCHITECTURE CANDIDATE / P2-05 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

Target design:

```text
design/16-EXISTING-AUTOMATION-ADAPTER-CONTRACT-v0.1.md
```

## Purpose

Define the system boundary for ingesting an existing automation definition as implementation evidence without allowing provider configuration to become business intent, canonical truth or Temporal design automatically.

---

# 1. End-to-end architecture

```text
AUTOMATION SOURCE / EXPORT
        ↓
SOURCE PRESERVATION
        ↓
AdapterAttempt(AUTOMATION_PARSE)
        ↓
PROVIDER SOURCE MODEL
        ↓
SOURCE OCCURRENCES / CONNECTIONS / REFS
        ↓
IMPLEMENTED_BEHAVIOR CLAIMS
        ↓
0..N CANDIDATE SEMANTIC SCOPES
        ↓
CANONICAL NORMALIZATION WHERE SAFE
        ↓
PROVENANCE
        ↓
SEMANTIC VALIDATION
        ↓
CANVAS REVIEW / SOURCE MERGE
```

No direct provider→Temporal path is allowed.

---

# 2. Provider parser boundary

Conceptual component:

```text
AutomationProviderParser
```

Responsibilities:

```text
preserve provider-native IDs/types/config
extract node/connection occurrences
preserve source references
preserve disabled/editor metadata
preserve credential references safely
emit diagnostics for unsupported constructs
```

It does not own canonical semantics.

---

# 3. Source-model boundary

Provider-specific data is materialized into source-family structures:

```text
AutomationDefinitionSnapshot
AutomationNodeOccurrence
AutomationConnectionOccurrence
AutomationWorkflowReference
```

These remain adapter-side evidence structures and integrate through common `sourceExtensionRefs`.

---

# 4. Semantic interpretation boundary

Conceptual component:

```text
AutomationSemanticInterpreter
```

Consumes source evidence and produces property-scoped `SemanticClaim`s with default perspective:

```text
IMPLEMENTED_BEHAVIOR
```

It may propose business/canonical meaning, but it cannot promote implementation evidence to business intent.

---

# 5. Routing interpretation

Technical routing is decomposed into independently interpretable properties:

```text
condition/expression
branch topology
provider routing mode
error/fallback semantics
business-meaning candidate
```

A provider IF/router does not automatically become a canonical decision.

---

# 6. Retry/error boundary

Retry, backoff, continue-on-error and error-workflow semantics remain implementation evidence.

If they encode business policy, a separate semantic claim must establish that relation.

```text
technical retry ≠ business loop
technical error path ≠ business exception
```

---

# 7. Credential boundary

Conceptual component:

```text
AutomationCredentialBoundary
```

Allows safe metadata/reference preservation while preventing secret payloads from entering canonical process semantics.

No adapter is allowed to normalize passwords/tokens/API secrets as business process data.

---

# 8. Reference-resolution boundary

Sub-workflow/external references are resolved through:

```text
AutomationWorkflowReference
```

Unresolved references remain evidence + diagnostics.

A call node does not become a canonical subprocess merely because it references another workflow.

---

# 9. Runtime observation boundary

Automation definition evidence and runtime execution evidence are separate source artifacts/perspectives:

```text
AUTOMATION DEFINITION
  perspective = IMPLEMENTED_BEHAVIOR

EXECUTION TRACE / LOG / RUN
  perspective = OPERATIONAL_OBSERVATION
```

They may support or conflict with one another.

No definition snapshot may be rewritten by runtime evidence.

---

# 10. Provider-reported active-state boundary

If a source export includes an active/disabled state, it is preserved on the definition snapshot as source evidence.

However:

```text
providerReportedActiveState
      ≠
proven current deployment/runtime state
```

The architecture currently relies on provenance/claim discipline for that distinction; P2-05 pressure testing must determine whether a stronger first-class deployment/activation evidence model is required.

---

# 11. Multiple version boundary

Different workflow exports/revisions create independent preserved representations and adapter attempts.

No newer export silently overwrites an older definition snapshot.

---

# 12. Candidate-scope discovery

The adapter may produce:

```text
PROCESS_CANDIDATE
EXECUTABLE_SLICE_CANDIDATE
TECHNICAL_ORCHESTRATION_SCOPE
INTEGRATION_TOPOLOGY_SCOPE
BUSINESS_RULE_SCOPE
NON_EXECUTABLE_CONTEXT
SOURCE_DEFINED
```

One workflow definition does not guarantee one business process.

---

# 13. Canonical normalizer boundary

Provider-specific semantics never leak into canonical identity by direct assignment.

```text
provider node occurrence
      ↓ claims/provenance
canonical candidate
```

not:

```text
provider node ID = canonical node ID
```

---

# 14. Capability-design deferral

Provider bindings can become later evidence for capability discovery, but P2-05 does not create capability contracts.

```text
HTTP request node
Gmail node
DB node
AI node
```

are implementation bindings, not provider-neutral capability contracts by themselves.

---

# 15. Canvas review integration

Canvas may project:

```text
canonical meaning
source-only automation nodes
technical conditions/retries/errors
provider bindings
implemented-behavior perspective
business-intent conflicts
unsupported nodes
credential refs without secrets
validation findings
```

User corrections create new review-authored evidence and never edit the source automation snapshot.

---

# 16. Cross-source merge

Example:

```text
SOP / human statement      BUSINESS_INTENT
n8n automation             IMPLEMENTED_BEHAVIOR
runtime trace              OPERATIONAL_OBSERVATION
```

All may describe the same process differently.

Merge/conflict resolution uses frozen Phase-1 provenance and review rules.

---

# 17. Failure isolation

```text
source import failure       → no false preservation claim
parser failure              → preserved source survives
unsupported node            → partial result may survive
normalization failure       → source/provider model survives
validation blocker          → candidate remains explainable
review failure              → source/provenance survives
```

---

# 18. Architecture gate

P2-05 may close only after A01–A32 prove:

```text
implementation vs intent separation
provider identity/type/label preservation
routing/retry/error discipline
credential/secret safety boundary
trigger/subworkflow/merge/expression semantics
inactive/editor metadata handling
unsupported/partial preservation
side-effect semantics
runtime-observation separation
active/deployment-state discipline
multiple revision history
0..N scopes
Canvas review lineage
no direct Temporal output
```

BUILD remains closed.
