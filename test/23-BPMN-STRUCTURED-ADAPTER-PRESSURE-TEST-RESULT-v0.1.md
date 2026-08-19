# TALOS — BPMN Structured Adapter Pressure Test Result v0.1

Status: **DESIGN/ARCH CONFORMANCE PASS / P2-02**  
Date: **2026-08-19**

## Targets

```text
design/10-BPMN-STRUCTURED-ADAPTER-CONTRACT-v0.1.md
arch/05-BPMN-STRUCTURED-ADAPTER-ARCHITECTURE-v0.1.md
test/22-BPMN-STRUCTURED-ADAPTER-PRESSURE-TEST-SPEC-v0.1.md
```

## Important scope

This result proves the **design/architecture contract** can represent the B01–B20 semantic fixtures.

It does not prove:

```text
XML parser implementation
BPMN schema validation implementation
vendor-extension implementation
production interoperability
runtime execution
```

Therefore BPMN is not yet an implemented/supported adapter.

---

# Result

```text
B01  PASS
B02  PASS
B03  PASS
B04  PASS
B05  PASS
B06  PASS
B07  PASS
B08  PASS
B09  PASS
B10  PASS
B11  PASS
B12  PASS
B13  PASS
B14  PASS
B15  PASS
B16  PASS
B17  PASS
B18  PASS
B19  PASS
B20  PASS

TOTAL
20 PASS
 0 FAIL
```

---

# Fixture synthesis

## B01 — PASS

Native BPMN ID, TALOS source occurrence ID and canonical ID remain distinct and traceable.

## B02 — PASS

One definitions document may yield multiple candidate process scopes without forced merge.

## B03 — PASS

Collaboration/participants/processRef are source-distinct; black-box participant is representable.

## B04 — PASS

Lane membership is responsibility evidence and remains distinct from participant/message/task-queue semantics.

## B05 — PASS

Sequence flow and message flow are independent source relationship families.

## B06 — PASS

Gateway canonical role is derived from subtype + direction/topology/context rather than subtype alone.

## B07 — PASS

Parallel split/converge semantics preserve parallel activation and ALL synchronization candidates.

## B08 — PASS

Inclusive/event-based/complex gateway source semantics survive; complex/unsupported meaning can remain source-defined.

## B09 — PASS

Event class and event definition remain separately addressable; event→canonical mapping remains context-sensitive.

## B10 — PASS

Boundary attachment and `cancelActivity` are first-class source evidence; unsupported nuance survives source extensions/claims.

## B11 — PASS

Subprocess, event subprocess, transaction and call activity are not collapsed at source level.

## B12 — PASS

Data/association/annotation evidence cannot be flattened into process control edges.

## B13 — PASS

Condition/default semantics preserve literal expressions/refs without executing expressions during intake.

## B14 — PASS

BPMN DI is preserved separately and cannot override structured semantic references.

## B15 — PASS

Vendor extension metadata survives without automatic promotion from implementation configuration to business intent.

## B16 — PASS

`isExecutable` source metadata remains independent from TALOS Semantic Validation readiness.

## B17 — PASS

Unsupported BPMN constructs may produce preserved evidence + diagnostics + zero canonical mapping.

## B18 — PASS

Native QName/ID references have explicit resolution state; missing/external targets are not fabricated.

## B19 — PASS

Malformed/partial BPMN uses preserved source + AdapterAttempt diagnostics; failed parsing never destroys source.

## B20 — PASS

BPMN canonical and source-only evidence can enter Canvas Review/Projection v0.2 while keeping BPMN provenance; review correction creates separate lineage.

---

# Cross-contract conformance

B01–B20 found no required change to the frozen common contracts:

```text
Canonical Process Model v0.1          PASS
Provenance Model v0.3                 PASS
Semantic Validation v0.2              PASS
Process Source Intake v0.2            PASS
Canvas Native Source v0.2             PASS / not violated
Canvas Review / Projection v0.2       PASS
```

The BPMN adapter remains a versioned specialization over the common source-intake law.

---

# New source-family laws reinforced

```text
EXTERNAL STRUCTURED SOURCE       ≠ CANONICAL MODEL
BPMN ID                          ≠ CANONICAL ID
BPMN PROCESS                     ≠ TEMPORAL WORKFLOW
BPMN TASK                        ≠ TEMPORAL ACTIVITY
BPMN PARTICIPANT                 ≠ LANE
SEQUENCE FLOW                    ≠ MESSAGE FLOW
DATA ASSOCIATION                 ≠ CONTROL FLOW
BPMN DI                          ≠ BUSINESS SEMANTICS
GATEWAY TYPE                     ≠ CANONICAL ROLE WITHOUT CONTEXT
BOUNDARY EVENT                   ≠ FREE EVENT
BPMN isExecutable                ≠ TALOS READINESS
UNSUPPORTED BPMN                 ≠ DROPPED EVIDENCE
```

---

# P2-02 gate decision

```text
BPMN DESIGN / ARCH CONTRACT      ✅ PRESSURE-TESTED 20/20
BPMN IMPLEMENTATION              ⛔ NOT BUILT
BPMN SUPPORTED SOURCE FAMILY     ❌ NOT CLAIMED YET
BUILD                            ⛔ CLOSED
```

The exact tested design/architecture artifacts are eligible for Phase-2 design freeze.
