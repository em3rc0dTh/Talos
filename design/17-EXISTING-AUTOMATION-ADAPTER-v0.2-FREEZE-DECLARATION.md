# TALOS — Existing Automation Adapter v0.2 Freeze Declaration

Status: **FROZEN — P2-05 DESIGN / ARCHITECTURE**  
Date: **2026-08-19**

## Frozen contract

```text
path:
design/16-EXISTING-AUTOMATION-ADAPTER-CONTRACT-v0.2.md

blob:
52b25689e3f365f05bd516d38bbf334db2223ef6
```

## Frozen architecture

```text
path:
arch/08-EXISTING-AUTOMATION-ADAPTER-ARCHITECTURE-v0.2.md

blob:
2065d8e77a8588acc9aec30c5f9e3aa497b8c871
```

## Regression evidence

```text
test/33-EXISTING-AUTOMATION-ADAPTER-PRESSURE-TEST-SPEC-v0.1.md
test/34-EXISTING-AUTOMATION-ADAPTER-PRESSURE-TEST-RESULT-v0.1.md
test/35-EXISTING-AUTOMATION-ADAPTER-REGRESSION-RESULT-v0.1.md

A01–A32
32 PASS / 0 FAIL
```

Initial v0.1 result was:

```text
31 PASS / 1 FAIL
A27 definition active flag vs deployment/runtime truth
```

v0.2 closed the defect by separating:

```text
AutomationDefinitionSnapshot
        ≠
AutomationDeploymentObservation
        ≠
RuntimeObservation
```

---

# Frozen laws

```text
AUTOMATION DEFINITION              ≠ TALOS CANONICAL PROCESS
IMPLEMENTED BEHAVIOR               ≠ BUSINESS INTENT
IMPLEMENTED BEHAVIOR               ≠ FUTURE TALOS EXECUTION DESIGN
DEFINITION CONFIGURATION           ≠ DEPLOYMENT OBSERVATION
DEPLOYMENT OBSERVATION             ≠ RUNTIME EXECUTION OBSERVATION
PROVIDER active=true               ≠ CURRENT DEPLOYMENT PROOF
DEPLOYED / ACTIVE                  ≠ EXECUTED
EXECUTED                           ≠ BUSINESS SUCCESS
TECHNICAL ROUTING                  ≠ BUSINESS DECISION AUTOMATICALLY
TECHNICAL RETRY                    ≠ BUSINESS LOOP AUTOMATICALLY
ERROR HANDLER                      ≠ BUSINESS EXCEPTION AUTOMATICALLY
PROVIDER NODE                      ≠ BUSINESS ACTIVITY AUTOMATICALLY
MERGE NODE                         ≠ CANONICAL JOIN AUTOMATICALLY
SUB-WORKFLOW CALL                  ≠ CANONICAL SUBPROCESS AUTOMATICALLY
EXPRESSION / SCRIPT                ≠ BUSINESS RULE AUTOMATICALLY
PROVIDER BINDING                   ≠ CAPABILITY CONTRACT AUTOMATICALLY
CREDENTIAL / SECRET                ≠ CANONICAL PROCESS DATA
AUTOMATION SOURCE                  ≠ TEMPORAL DESIGN
```

---

# Future change policy

Any semantic change to this frozen contract requires:

```text
new version
+ preserved v0.2
+ new/updated fixtures
+ full A01–A32 regression or explicitly expanded successor suite
+ explicit freeze decision
```

No silent edits to the exact frozen blobs.

BUILD remains closed.
