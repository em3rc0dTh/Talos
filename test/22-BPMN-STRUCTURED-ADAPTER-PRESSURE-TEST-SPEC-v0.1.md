# TALOS — BPMN Structured Adapter Pressure Test Spec v0.1

Status: **TEST DESIGN / P2-02**  
Date: **2026-08-19**

## Targets

```text
design/10-BPMN-STRUCTURED-ADAPTER-CONTRACT-v0.1.md
arch/05-BPMN-STRUCTURED-ADAPTER-ARCHITECTURE-v0.1.md
```

## Gate question

> Can BPMN enter TALOS as an external structured source with exact native identities and notation-specific semantics while still obeying the same source-intake, canonical, provenance, validation and review/projection boundaries?

This is a DESIGN/ARCH conformance test. It does not prove parser implementation.

BUILD remains closed.

---

# B01 — Native BPMN ID vs canonical ID

Fixture:

```text
<bpmn:task id="Task_42" name="Check order" />
```

Required:

- literal/native `Task_42` preserved;
- TALOS `SourceOccurrence` identity separate;
- canonical node identity separate;
- mapping/provenance links all three layers.

---

# B02 — Multiple processes in one definitions document

Fixture:

```text
definitions
├── process P1
└── process P2
```

Required:

- one source artifact/representation;
- separate candidate process scopes;
- no forced merge into one ProcessDefinition;
- definitions/document evidence preserved.

---

# B03 — Collaboration / participant / processRef

Fixture:

```text
collaboration C1
participant Customer (black-box)
participant Company processRef=P1
```

Required:

- collaboration scope preserved;
- participants distinct from processes;
- black-box participant valid;
- processRef represented as source reference evidence;
- participant does not become Temporal Workflow automatically.

---

# B04 — Lanes vs participants

Fixture:

Company process contains lanes:

```text
Sales
Finance
```

Required:

- lane IDs/membership preserved;
- participant Company remains separate;
- lane crossing remains local process flow unless message semantics separately exist;
- no lane→participant or lane→Task Queue collapse.

---

# B05 — Sequence flow vs message flow

Fixture:

```text
sequenceFlow S1 inside P1
messageFlow M1 across collaboration participants
```

Required:

- distinct source occurrence/relationship roles;
- message flow never normalized as ordinary sequence merely because both are arrows;
- collaboration evidence/correlation gaps remain reviewable.

---

# B06 — Exclusive gateway split vs merge

Fixture:

Two `exclusiveGateway` elements:

```text
G1: one incoming / two outgoing
G2: two incoming / one outgoing
```

Required:

- exact BPMN subtype preserved for both;
- G1 may become DECISION(EXCLUSIVE) candidate;
- G2 may become merge/JOIN(ANY) candidate;
- same source type does not force same canonical role.

---

# B07 — Parallel split + synchronization

Fixture:

```text
parallelGateway split
  ├── A
  └── B
parallelGateway converge
```

Required:

- split candidate `PARALLEL_SPLIT`;
- convergence candidate `JOIN(ALL)` when supported by source topology;
- no flattening to sequence;
- branch completion may still require T1-03 execution-detail findings.

---

# B08 — Inclusive / event-based / complex gateways

Fixture contains:

```text
inclusiveGateway
eventBasedGateway
complexGateway
```

Required:

- source subtypes preserved;
- safe canonical candidates only where supported;
- complex gateway may remain source-defined extension/unresolved;
- unsupported semantics not dropped.

---

# B09 — Event semantic families

Fixture contains:

```text
message start
intermediate timer catch
error end/boundary-related event evidence
escalation event
signal event
```

Required:

- event class + event definition preserved separately;
- wait/event/end mapping context-sensitive;
- no `endEvent = SUCCESS` rule;
- no Temporal primitive selection.

---

# B10 — Boundary event attachment + interrupting behavior

Fixture:

```text
boundaryEvent BE1
attachedToRef=SubProcess_1
cancelActivity=false
message/timer/error definition
```

Required:

- attachment reference preserved/resolved;
- `cancelActivity` source truth preserved;
- non-interrupting vs interrupting semantics survive source extension if canonical cannot fully encode;
- boundary event not treated as free-standing event.

---

# B11 — Subprocess vs call activity vs event subprocess

Fixture contains:

```text
subProcess SP1
subProcess SP2 triggeredByEvent=true
callActivity CA1 calledElement=OtherProcess
transaction TX1
```

Required:

- all source distinctions preserved;
- callActivity reference not mistaken for embedded body;
- event subprocess semantics retained;
- transaction nuance retained even if canonical core uses SUBPROCESS candidate.

---

# B12 — Data/object associations vs control flow

Fixture:

```text
dataObjectReference
input/output data association
textAnnotation + association
```

Required:

- no association becomes control flow;
- data evidence may map to canonical data concepts safely;
- annotation remains annotation/source evidence.

---

# B13 — Condition expressions + default flows

Fixture:

```text
sequenceFlow cond: amount > 10000
gateway.default = Flow_Default
```

Required:

- literal expression preserved;
- conditional/default relationship candidates distinguished;
- expression not executed during intake;
- default ownership preserved as source ref.

---

# B14 — BPMN DI vs semantic graph

Fixture semantic task `Task_1` with BPMNShape bounds and BPMNEdge waypoints.

Required:

- DI preserved separately;
- coordinates not used to override source refs;
- moving shape in source editor does not change task semantic type;
- DI can support review layout without becoming business truth.

---

# B15 — Vendor extension metadata / implemented behavior

Fixture:

```text
service task + vendor connector/job/retry metadata
```

Required:

- extension metadata preserved;
- provider/runtime config not promoted to business intent;
- evidence perspective may be IMPLEMENTED_BEHAVIOR/SOURCE_DEFINED;
- secrets/sensitive values not copied into canonical semantics by default.

---

# B16 — `isExecutable` vs TALOS readiness

Fixture:

```text
process isExecutable=true
```

but business completion/correlation semantics are incomplete.

Required:

- source flag preserved;
- TALOS Semantic Validation may still report INSUFFICIENT_DETAIL/NEEDS_CONFIRMATION;
- source execution flag cannot override readiness algorithm.

---

# B17 — Unsupported BPMN construct survives

Fixture:

Definitions contains a source construct not normalized by initial adapter vocabulary (for example choreography/conversation or vendor-specific semantic element).

Required:

- source occurrence/type/attributes/refs preserved;
- diagnostic/source extension created;
- 0 canonical mapping allowed;
- nearest convenient canonical type not fabricated.

---

# B18 — Unresolved / cross-document references

Fixture:

```text
callActivity.calledElement = QName not available locally
participant.processRef = missing target
```

Required:

- literal references preserved;
- namespace/reference context preserved;
- resolution state explicit (`EXTERNAL_NOT_AVAILABLE`, `UNRESOLVED`, etc.);
- source graph may remain partial;
- no fabricated target.

---

# B19 — Malformed/partial BPMN

Fixture:

Source bytes are preserved but parse/reference validity is incomplete.

Required:

- preserved source remains authoritative evidence;
- AdapterAttempt is FAILED or PARTIAL with diagnostics according to extraction progress;
- no source recapture required for retry;
- no silent repair of missing IDs/refs/ends/branches.

---

# B20 — Canvas review projection without provenance transfer

Fixture:

Imported BPMN produces canonical nodes plus BPMN-specific source-only evidence.

Required:

- both can be projected through Canvas Review/Projection v0.2;
- BPMN source origin remains BPMN;
- rendering does not create Talos-native origin for imported items;
- reviewer correction creates separate review-authored lineage;
- adapter reinterpretation uses explicit baseline transition/reconciliation.

---

# Acceptance

```text
20 / 20 PASS
```

is required to freeze P2-02 v0.x design/architecture.

If a failure exposes a common-intake defect, version the common contract and rerun Canvas regressions before continuing.

BUILD remains closed.
