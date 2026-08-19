# TALOS — P2-05 Existing Automation Adapter Gate Closure v0.1

Status: **GATE CLOSED — DESIGN / ARCHITECTURE**  
Date: **2026-08-19**

## Gate

```text
P2-05 — EXISTING AUTOMATION ADAPTER
```

Gate question:

> Can TALOS ingest an existing executable automation as evidence of implemented behavior, preserve provider/runtime-specific structure and configuration, infer only supportable business semantics, and prevent existing technical implementation from being promoted into business intent or future execution design automatically?

Answer:

```text
YES — for the frozen v0.2 design/architecture and A01–A32 evidence set.
```

---

# Evidence chain

```text
Common Source Intake v0.2
Canvas Authoring v0.2
Canvas Review / Projection v0.2
BPMN Structured Adapter v0.1
Image / Perception Adapter v0.2
Language / Document Adapter v0.2
        ↓
Existing Automation Adapter v0.1
        ↓
A01–A32 pressure test
        ↓
31 PASS / 1 FAIL
        ↓
A27 definition/deployment/runtime-state defect
        ↓
Existing Automation Adapter v0.2
        ↓
full A01–A32 regression
        ↓
32 PASS / 0 FAIL
        ↓
exact design/architecture blobs frozen
```

---

# Frozen artifacts

```text
design/16-EXISTING-AUTOMATION-ADAPTER-CONTRACT-v0.2.md
arch/08-EXISTING-AUTOMATION-ADAPTER-ARCHITECTURE-v0.2.md
design/17-EXISTING-AUTOMATION-ADAPTER-v0.2-FREEZE-DECLARATION.md

test/33-EXISTING-AUTOMATION-ADAPTER-PRESSURE-TEST-SPEC-v0.1.md
test/34-EXISTING-AUTOMATION-ADAPTER-PRESSURE-TEST-RESULT-v0.1.md
test/35-EXISTING-AUTOMATION-ADAPTER-REGRESSION-RESULT-v0.1.md
```

---

# Final fixture result

```text
A01 PASS source definition vs canonical model
A02 PASS provider node ID vs canonical ID
A03 PASS node label vs business meaning
A04 PASS implemented behavior vs business intent
A05 PASS technical routing vs business decision
A06 PASS technical retry vs business loop
A07 PASS technical error handler vs business exception
A08 PASS credential reference vs canonical data
A09 PASS webhook trigger vs business trigger intent
A10 PASS schedule/polling vs business timing
A11 PASS unresolved sub-workflow reference
A12 PASS merge/fan-in vs semantic join policy
A13 PASS expression/template vs business rule
A14 PASS provider/API binding vs capability contract
A15 PASS disabled node remains source evidence
A16 PASS editor metadata vs process semantics
A17 PASS provider-specific subtype preservation
A18 PASS unsupported node preservation
A19 PASS partial parser success
A20 PASS 0..N semantic scopes
A21 PASS technical side-effect candidate
A22 PASS HTTP request vs business action
A23 PASS AI/agent node vs business actor
A24 PASS code/script node opacity
A25 PASS webhook auth vs business authorization
A26 PASS definition vs runtime observation
A27 PASS definition vs deployment vs runtime truth
A28 PASS runtime trace as OPERATIONAL_OBSERVATION
A29 PASS multiple definition revisions
A30 PASS Canvas review correction
A31 PASS adapter/provider-registry upgrade
A32 PASS no direct Temporal compilation
```

---

# What P2-05 proves

The common intake architecture now survives a source family whose strongest evidence is **existing implementation**.

Talos can preserve:

```text
AUTOMATION DEFINITION / CONFIGURATION
        ↓
IMPLEMENTED_BEHAVIOR CLAIMS
```

while independently preserving:

```text
DEPLOYMENT / ACTIVATION OBSERVATION
```

and:

```text
RUNTIME EXECUTION OBSERVATION
```

and comparing all of them with:

```text
BUSINESS_INTENT
```

without collapsing evidence perspectives.

---

# Critical law

```text
WHAT THE SYSTEM IS CONFIGURED TO DO
        ≠
WHAT IS OBSERVED DEPLOYED
        ≠
WHAT ACTUALLY RAN
        ≠
WHAT THE BUSINESS WANTS
        ≠
HOW TALOS SHOULD EXECUTE IT LATER
```

---

# What P2-05 does not prove

```text
n8n parser implementation
provider API integration
credential-vault implementation
runtime-log connector
production n8n support
Temporal migration/compiler
```

No BUILD claim is made.

---

# Phase-2 status after closure

```text
COMMON SOURCE INTAKE            ✅ FROZEN
CANVAS NATIVE AUTHORING         ✅ PROVEN
CANVAS REVIEW / PROJECTION      ✅ PROVEN
BPMN STRUCTURED ADAPTER         ✅ DESIGN/ARCH PROVEN
IMAGE / PERCEPTION ADAPTER      ✅ DESIGN/ARCH PROVEN
LANGUAGE / DOCUMENT ADAPTER     ✅ DESIGN/ARCH PROVEN
EXISTING AUTOMATION ADAPTER     ✅ DESIGN/ARCH PROVEN
CROSS-ADAPTER CONFORMANCE       🟢 NEXT

PHASE 2 INPUT ARCHITECTURE      🟡 OPEN
BUILD                           ⛔ CLOSED
```

---

# Next gate

```text
P2-06 — CROSS-ADAPTER CONFORMANCE
```

The next question is no longer source-family-specific:

> Do all proven source families obey the same common intake, provenance, semantic-validation, review and history laws without requiring hidden special cases or contradictory adapter behavior?
