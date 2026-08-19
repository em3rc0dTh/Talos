# TALOS — Capability Contract Pressure-Test Spec v0.1

Status: **T4-01 PRESSURE-TEST SPEC**  
Date: **2026-08-19**

Targets:

```text
design/26-CAPABILITY-CONTRACT-v0.1.md
arch/14-CAPABILITY-MODEL-ARCHITECTURE-v0.1.md
```

BUILD remains closed.

## Gate rule

```text
32 / 32 PASS required
```

A fixture fails if T4-01 must confuse business semantics, capability requirements, reusable offerings, provider binding, secure configuration or Temporal execution mechanics.

---

# K01–K32

```text
K01  formal capability design requires accepted AUTOMATION_DESIGN_HANDOFF scope
K02  pure deterministic decision may require zero external capabilities
K03  simple external action produces one requirement
K04  one semantic action may require multiple capability requirements
K05  same capability family/label in two contexts remains distinct requirement identity
K06  one offering may satisfy many requirement occurrences
K07  generic notification does not imply provider/channel
K08  explicit email semantics produce channel=email constraint
K09  explicit accepted provider policy may create provider constraint without binding
K10  existing Gmail implementation does not become business-required provider
K11  CapabilityRequirement ≠ CapabilityOffering
K12  one requirement contains properties with different design/evidence bases
K13  logical input contract ≠ provider request payload
K14  business outcome ≠ HTTP/provider technical success
K15  idempotency requirement ≠ implementation support
K16  compensation business requirement ≠ technical retry policy
K17  auth/credential contract ≠ secret value
K18  offering contract ≠ current health/availability
K19  offering revision update is immutable/versioned
K20  compatible offering produces match assessment, not binding
K21  compatible-with-design-work preserves mapping gaps
K22  incompatible offering remains unbound
K23  zero matching offerings leaves unresolved requirement
K24  highest-ranked/only match does not auto-bind
K25  n8n workflow may be offering without becoming TALOS durable authority
K26  Temporal Activity/Workflow is not T4-01 capability offering kind
K27  human approval requirement does not yet define form/UI/Signal mechanics
K28  cognitively complex action does not imply AI
K29  explicit accepted AI requirement may use AI_TASK family
K30  changing later provider/offering does not rewrite frozen business semantics
K31  many process requirements may reuse one offering revision after explicit bindings later
K32  CapabilityDesignRevision/history remains immutable
```

---

# Critical fixtures

## K01 — Phase-4 entry

A scope frozen only as:

```text
BUSINESS_SEMANTIC_BASELINE
```

with readiness not assessed cannot enter formal T4 capability design as if automation-ready.

Required formal input:

```text
AUTOMATION_DESIGN_HANDOFF
+ ACCEPTED ScopeFreezeRecord
+ READY_FOR_AUTOMATION_DESIGN
```

## K04 — one node, many requirements

Example accepted semantic action:

```text
Generate invoice, store it, and notify customer
```

may produce separate process-context requirements:

```text
DOCUMENT_FILE / GENERATE_DOCUMENT
STORAGE / STORE_DOCUMENT
COMMUNICATION / SEND_NOTIFICATION
```

No one-node/one-capability assumption.

## K07/K08/K10 — provider discipline

```text
"Notify customer"
→ COMMUNICATION / SEND_NOTIFICATION
→ channel/provider unresolved
```

```text
"Send confirmation email"
→ channel = EMAIL constraint
```

Existing automation:

```text
Gmail node
```

may suggest Gmail offering availability but does not make Gmail a required provider unless accepted business semantics say so.

## K09 — explicit provider constraint

If an accepted business policy explicitly states:

```text
All customer confirmations must be sent through Microsoft 365
```

TALOS may preserve:

```text
provider/system constraint = Microsoft 365
```

but must still keep:

```text
constraint ≠ CapabilityBinding
```

## K12 — mixed property-level design basis

Accepted semantics:

```text
"Send confirmation email"
```

Capability design may contain:

```text
family = COMMUNICATION
  basis = SEMANTIC_DERIVED

operationIntent = SEND_NOTIFICATION
  basis = SEMANTIC_DERIVED

channel = EMAIL
  basis = SEMANTIC_EXPLICIT

provider = Gmail
  basis = DESIGN_SUGGESTION or IMPLEMENTED_BEHAVIOR-derived candidate, not requirement truth
```

A contract with only one authoritative requirement-wide:

```text
CapabilityRequirement.requirementBasis
```

cannot preserve these property-level distinctions and fails K12 unless property/facet-level basis is first-class for all material requirement properties.

## K14 — outcome

Provider returns HTTP 200 after accepting a message, but business semantics require confirmed delivery.

Required:

```text
technical response ≠ required business outcome
```

## K15 — idempotency

Requirement may say duplicate side effects must be prevented. Offering may or may not support an idempotency key. Match assesses compatibility; T4-01 does not define Temporal retry policy.

## K18 — health

An offering revision remains immutable while health/availability changes over time. Health is operational observation, not contract mutation.

## K24 — match ≠ binding

Even if exactly one compatible offering exists:

```text
CapabilityMatchAssessment = COMPATIBLE
```

must not create accepted binding automatically.

## K25 — n8n

```text
implementationKind = N8N_WORKFLOW
```

is allowed as an offering implementation, but TALOS business semantics and later durable orchestration remain separate.

## K26 — Temporal

The capability registry must not encode `TEMPORAL_ACTIVITY` as the real-world capability. Phase 5 decides execution wrappers/mappings.

## K27 — human

```text
HUMAN_INTERACTION / COLLECT_APPROVAL
role = Manager
outcomes = APPROVED | REJECTED
```

is enough for T4-01. Form schema, assignment service and durable signal/wait design remain later gates.

---

# Decision rule

Any failure requires versioned contract/architecture evolution and full K01–K32 regression before T4-01 freeze.
