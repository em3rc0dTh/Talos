# TALOS — Existing Automation Adapter Pressure-Test Result v0.1

Status: **P2-05 GATE FAILED / CONTRACT EVOLUTION REQUIRED**  
Date: **2026-08-19**

Target:

```text
design/16-EXISTING-AUTOMATION-ADAPTER-CONTRACT-v0.1.md
arch/08-EXISTING-AUTOMATION-ADAPTER-ARCHITECTURE-v0.1.md
```

Suite:

```text
A01–A32
```

Result:

```text
TOTAL 32
PASS  31
FAIL   1
PASS RATE 96.9%

P2-05 GATE FAIL
BUILD CLOSED
```

---

# Fixture results

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
A27 FAIL  definition active flag vs deployment/runtime truth
A28 PASS  runtime trace as OPERATIONAL_OBSERVATION
A29 PASS  multiple definition revisions
A30 PASS  Canvas review correction
A31 PASS  adapter/provider-registry upgrade
A32 PASS  no direct Temporal compilation
```

---

# Failure analysis — A27

v0.1 correctly states:

```text
providerReportedActiveState
      ≠
proven current deployment/runtime state
```

but it only stores the provider-reported active state on `AutomationDefinitionSnapshot` and relies on general provenance/claims for the rest.

That is insufficient for a durable source-family contract because three materially different facts can otherwise be conflated:

```text
1. DEFINITION CONFIGURATION STATE
   "the export says active=true"

2. DEPLOYMENT / ACTIVATION OBSERVATION
   "this definition/version was observed deployed/activated in environment E at time T"

3. RUNTIME EXECUTION OBSERVATION
   "an execution actually occurred and produced events/outcomes"
```

These have different authority, timestamps and source origins.

A historical export may contain `active=true` while:

```text
current deployment is different
workflow has since been disabled
another revision is deployed
no runtime executions occurred
export environment is unknown
```

Therefore the v0.1 model cannot yet answer reliably:

```text
What did the definition claim?
What deployment state was independently observed?
What actually executed?
```

without overloading generic claims.

---

# Required evolution

Introduce an automation-specific immutable deployment/activation evidence boundary, separate from both definition snapshot and runtime observation.

Expected shape:

```text
AutomationDefinitionSnapshot
        ≠
AutomationDeploymentObservation
        ≠
RuntimeObservation
```

The deployment observation should preserve at minimum:

```text
definition/source reference
environment/deployment target when known
observed activation state
observed revision/version when known
observation source/method
time
confidence/truth/provenance
```

It must remain immutable and must not rewrite the definition snapshot.

No new frozen Phase-1 enum is required; deployment evidence can remain source-family specialization using existing provenance/truth/perspective mechanisms.

---

# Gate decision

```text
P2-05 v0.1      ❌ NOT FREEZABLE
BUILD           ⛔ CLOSED
```

Next:

```text
Existing Automation Adapter v0.2
+ deployment/activation evidence separation
+ full A01–A32 regression
```
