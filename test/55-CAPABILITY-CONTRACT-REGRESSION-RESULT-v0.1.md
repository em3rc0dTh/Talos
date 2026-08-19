# TALOS — Capability Contract Regression Result v0.1

Status: **FULL REGRESSION PASS / T4-01 FREEZE ALLOWED**  
Date: **2026-08-19**

Targets:

```text
design/26-CAPABILITY-CONTRACT-v0.2.md
arch/14-CAPABILITY-MODEL-ARCHITECTURE-v0.2.md
```

Result:

```text
TOTAL        32
PASS         32
FAIL          0
PASS RATE   100%

T4-01 FREEZE ALLOWED
BUILD CLOSED
```

## Full fixture result

```text
K01 PASS  formal entry requires accepted AUTOMATION_DESIGN_HANDOFF scope
K02 PASS  pure deterministic decision may need zero external capability
K03 PASS  simple external action → requirement
K04 PASS  one semantic action → multiple requirements
K05 PASS  same family/label ≠ same requirement identity
K06 PASS  one offering may serve many requirement occurrences
K07 PASS  generic notification does not imply channel/provider
K08 PASS  explicit email semantics → channel constraint
K09 PASS  explicit provider policy → constraint, not binding
K10 PASS  existing Gmail implementation ≠ business-required provider
K11 PASS  requirement ≠ offering
K12 PASS  property/facet-level design basis preserved
K13 PASS  logical input ≠ provider request payload
K14 PASS  business outcome ≠ provider technical success
K15 PASS  idempotency requirement ≠ implementation support
K16 PASS  compensation requirement ≠ retry policy
K17 PASS  auth/credential contract ≠ secret value
K18 PASS  offering contract ≠ mutable health/availability
K19 PASS  offering revision history immutable
K20 PASS  compatible match ≠ binding
K21 PASS  compatible-with-design-work preserves gaps
K22 PASS  incompatible offering stays unbound
K23 PASS  zero match leaves unresolved requirement
K24 PASS  best/only match does not auto-bind
K25 PASS  n8n may be offering without durable-authority transfer
K26 PASS  Temporal primitives excluded from capability offering kinds
K27 PASS  human approval requirement stops before form/UI/Signal mechanics
K28 PASS  complex cognition does not imply AI
K29 PASS  explicit accepted AI requirement supported
K30 PASS  provider change does not rewrite frozen business meaning
K31 PASS  one offering may later be bound to many requirements
K32 PASS  CapabilityDesignRevision/history immutable
```

## K12 regression proof

v0.2 now preserves:

```text
CapabilityRequirement
  + CapabilityRequirementFacet[]
```

For one requirement TALOS can separately explain:

```text
family             SEMANTIC_DERIVED / REQUIRED
operationIntent    SEMANTIC_DERIVED / REQUIRED
channel=EMAIL      SEMANTIC_EXPLICIT / REQUIRED
Gmail candidate    IMPLEMENTED_BEHAVIOR_EVIDENCE / SUGGESTED
```

without laundering the current provider into a hard business requirement.

## T4-01 boundary proof

```text
CapabilityRequirement
        ≠
CapabilityOfferingRevision
        ≠
CapabilityMatchAssessment
        ≠
CapabilityBinding (T4-03)
        ≠
Temporal execution mapping (Phase 5)
```

## Decision

```text
T4-01 DESIGN/ARCH      PASS
T4-01 FREEZE           ALLOWED
BUILD                  CLOSED
```
