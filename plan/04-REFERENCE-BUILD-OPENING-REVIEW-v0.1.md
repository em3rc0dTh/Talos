# TALOS — Reference Build Opening Review v0.1

Status: **ACTIVE POST-PHASE-2 GATE**  
Date: **2026-08-19**

## Purpose

Phase 2 design/architecture is closed, but BUILD remains closed.

Before implementation starts, TALOS must revalidate the previously drafted reference Canvas/intake implementation plan against the full set of frozen Phase-2 contracts.

This gate exists to prevent an older implementation plan—written before BPMN, image, language, automation and cross-adapter proofs—from silently steering BUILD toward a Canvas-only architecture.

---

# Inputs to review

At minimum:

```text
plan/02-T2-01-CANVAS-ADAPTER-IMPLEMENTATION-PLAN-v0.1.md

design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.2.md
design/06-PROCESS-SOURCE-INTAKE-CONTRACT-v0.2.md
design/08-CANVAS-REVIEW-PROJECTION-CONTRACT-v0.2.md
design/10-BPMN-STRUCTURED-ADAPTER-CONTRACT-v0.1.md
design/12-IMAGE-PERCEPTION-ADAPTER-CONTRACT-v0.2.md
design/14-LANGUAGE-DOCUMENT-ADAPTER-CONTRACT-v0.2.md
design/16-EXISTING-AUTOMATION-ADAPTER-CONTRACT-v0.2.md
design/18-CROSS-ADAPTER-CONFORMANCE-CONTRACT-v0.1.md

arch/09-PHASE-2-INPUT-ARCHITECTURE-CONSOLIDATION-v0.1.md
```

---

# Review questions

The implementation plan must prove it will not lock TALOS to one source family.

Verify:

```text
1. Domain packages express common source/intake contracts first.
2. Canvas remains one adapter, not the core data model.
3. Review/projection is a separate read/write boundary.
4. Source-family extensions can be added without changing canonical identity rules.
5. AdapterAttempt and immutable history are first-class.
6. UNKNOWN/partial/source-only evidence is representable in code.
7. Multiple candidate semantic scopes are supported.
8. Truth/confidence/perspective remain separate types/concepts.
9. Source and canonical IDs cannot be accidentally unified by types/ORM keys.
10. Framework types do not leak into domain contracts.
11. No Temporal SDK types enter Phase-2 source/intake domain.
12. Provider secrets are excluded from canonical/domain serialization.
13. Adapter retries/version upgrades remain historical.
14. Review baseline transitions are immutable.
15. Automation definition/deployment/runtime evidence remain separate.
16. Test architecture can later reuse the cross-adapter conformance suite.
```

---

# Gate outcomes

```text
OUTCOME A — PLAN VALID
```

The existing plan already satisfies the complete frozen architecture. Record evidence and explicitly authorize BUILD.

```text
OUTCOME B — PLAN EVOLUTION REQUIRED
```

Create a new implementation-plan version, preserve v0.1, pressure-test the updated plan, then make an explicit BUILD opening decision.

---

# Current state

```text
PHASE 1                         ✅ CLOSED
PHASE 2 INPUT ARCHITECTURE      ✅ CLOSED
BUILD OPENING REVIEW            🟢 ACTIVE
BUILD                           ⛔ CLOSED
```

No implementation begins until this gate explicitly closes with authorization.
