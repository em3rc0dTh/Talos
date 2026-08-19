# TALOS — Existing Automation Adapter Regression Result v0.1

Status: **REGRESSION PASS**  
Date: **2026-08-19**

Regression target:

```text
design/16-EXISTING-AUTOMATION-ADAPTER-CONTRACT-v0.2.md
arch/08-EXISTING-AUTOMATION-ADAPTER-ARCHITECTURE-v0.2.md
```

Suite:

```text
A01–A32
```

Result:

```text
TOTAL 32
PASS  32
FAIL   0
PASS RATE 100%

P2-05 REGRESSION PASS
FREEZE ALLOWED
BUILD CLOSED
```

---

# Full fixture result

```text
A01 PASS  source definition vs canonical model
A02 PASS  provider node ID vs canonical ID
A03 PASS  node label vs business meaning
A04 PASS  implemented behavior vs business intent
A05 PASS  technical routing vs business decision
A06 PASS  technical retry vs business loop
A07 PASS  technical error handler vs business exception
A08 PASS  credential reference vs canonical data
A09 PASS  webhook trigger vs business trigger intent
A10 PASS  schedule/polling vs business timing
A11 PASS  unresolved sub-workflow reference
A12 PASS  merge/fan-in vs semantic join policy
A13 PASS  expression/template vs business rule
A14 PASS  provider/API binding vs capability contract
A15 PASS  disabled node remains source evidence
A16 PASS  editor metadata vs process semantics
A17 PASS  provider-specific subtype preservation
A18 PASS  unsupported node preservation
A19 PASS  partial parser success
A20 PASS  0..N semantic scopes
A21 PASS  technical side-effect candidate
A22 PASS  HTTP request vs business action
A23 PASS  AI/agent node vs business actor
A24 PASS  code/script node opacity
A25 PASS  webhook auth vs business authorization
A26 PASS  definition vs runtime observation
A27 PASS  definition state vs deployment/runtime truth
A28 PASS  runtime trace as OPERATIONAL_OBSERVATION
A29 PASS  multiple definition revisions
A30 PASS  Canvas review correction
A31 PASS  adapter/provider-registry upgrade
A32 PASS  no direct Temporal compilation
```

---

# A27 regression proof

v0.2 now has three independent historical evidence layers:

```text
AutomationDefinitionSnapshot
        ↓ separate relation only
AutomationDeploymentObservation
        ↓ separate relation only
RuntimeObservation
```

Therefore Talos can preserve simultaneously:

```text
D1 export says active=true at T1
O2 provider/admin observation says inactive at T2
R3 no runtime execution evidence supplied
```

without rewriting D1 or inventing R3.

Likewise:

```text
DEPLOYED_ACTIVE
```

does not imply:

```text
EXECUTED
```

and an observed execution does not automatically imply business success.

---

# Phase-1 conformance

Regression confirms no change is required to frozen:

```text
Canonical Process Model v0.1
Provenance v0.3
Semantic Validation v0.2
Common Source Intake v0.2
Canvas Review / Projection v0.2
```

Automation-specific deployment evidence remains source-family specialization and enters common provenance/claim boundaries normally.

---

# Freeze decision

```text
P2-05 Existing Automation Adapter v0.2
DESIGN / ARCHITECTURE FREEZE ALLOWED
```

This is not implementation or production n8n support.

BUILD remains closed pending cross-adapter conformance and Phase-2 design/architecture closure.
