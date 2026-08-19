# TALOS — B2 C01–C20 Stage Ownership Matrix v0.1

Status: **B2 TEST OWNERSHIP BASELINE**  
Date: **2026-08-19**

## Purpose

The historical C01–C20 suite was designed end-to-end across native Canvas, source intake, Canonical normalization, Provenance and Semantic Validation.

Phase-6 staging deliberately separates:

```text
B2 — Canvas / Source / Intake
B3 — Canonical / Provenance / Validation
```

Therefore B2 must not fabricate B3 artifacts merely to claim the old whole-fixture expectation early.

The frozen contracts remain unchanged. This matrix only assigns executable BUILD responsibility.

## Matrix

| Fixture | B2-owned executable assertion | B3 downstream assertion |
|---|---|---|
| C01 Simple sequence | stable Canvas IDs; immutable snapshots; source occurrences/relationships; deterministic native adaptation | canonical IDs distinct; canonical sequence; validation |
| C02 Explicit guards | guard literal/structured state preserved as source relationship evidence | canonical conditional/default mapping where applicable |
| C03 Dangling branch | `UNKNOWN/UNCONNECTED` endpoint valid; branch evidence addressable; adapter invents no target | no fake `ProcessEdge`; `SV-CFL-002` finding/question |
| C04 Parallel + ALL join | native split/join kinds + explicit join policy/relationships preserved without geometry | canonical parallel/join semantics |
| C05 Incomplete wait | `waitKind=SCHEDULE` and `timezone=UNKNOWN` preserved distinctly | canonical WAIT + timing validation finding |
| C06 Human approval | `HUMAN_INTERACTION/APPROVAL` + actor source semantics; no Temporal/provider fields | canonical human interaction; later capability/execution design |
| C07 Actor/data/rule | ACTOR/DATA_OBJECT/BUSINESS_RULE source occurrences and relationship evidence remain non-action kinds | canonical Actor/DataObject/BusinessRule families |
| C08 Presentation-only edit | new CanvasRevision; native digest changes; semantic digest unchanged | no new semantic ProcessRevision required |
| C09 Semantic edit | new CanvasRevision; semantic digest changes; new adaptation fingerprint/attempt | new ProcessRevision candidate/assessment later |
| C10 Retirement | stable identity receives retirement history; prior revision/snapshot/source evidence still retrievable | prior canonical provenance remains explainable |
| C11 Subprocess membership | explicit `SUBPROCESS_SCOPE` membership is source evidence; geometry not consulted | canonical/source-extension normalization as applicable |
| C12 Annotation/group | annotation/group occurrences preserved; visual grouping marked non-process/context and excluded from process candidate scope | canonical business graph excludes non-process objects |
| C13 UNKNOWN vs absent | explicit `UNKNOWN` differs from missing property and `NOT_APPLICABLE` | validation interprets material unknown where applicable |
| C14 Clarification write-back | explicit ChangeSet creates N+1 CanvasRevision; old source revision unchanged | ProcessRevision N+1 + reassessment/disposition history |
| C15 Native + preview | NATIVE_STRUCTURED representation is primary; preview is secondary and derived | downstream mapping always traces native source, not screenshot reconstruction |
| C16 Idempotent adaptation | deterministic input fingerprint; same logical input can reuse immutable successful AdapterResult; attempts/retries remain auditable | no duplicate canonical semantic truth |
| C17 Same label/distinct IDs | equal labels retain distinct Canvas/source occurrence identities | distinct canonical provenance subjects |
| C18 Stable identity across revisions | same element identity; new snapshot + revision-local source occurrence | related/new canonical revision only if semantics change |
| C19 Semantic defaults | only explicit/schema-visible authored property values enter native source evidence; hidden implementation fallback is excluded | only eligible source-stated default can become semantic claim |
| C20 Adapter failure | source preserved first; FAILED attempt + diagnostic; retry links to prior attempt; same source reused | no fake canonical output from failed attempt |

## B2 gate vocabulary

B2 may report:

```text
C01–C20 SOURCE/INTAKE ASSERTIONS PASS
```

It may not report:

```text
C01–C20 END-TO-END PASS
```

until B3 executes the downstream Canonical/Provenance/Validation assertions.

## B2 non-goals

```text
ProcessRevision creation
Canonical ProcessEdge creation
ValidationAssessment/Finding creation
clarification-question issuance
Temporal mapping
capability/provider binding
UI rendering
```

## Gate rule

If a C fixture cannot preserve its required source/intake truth without constructing a B3 object, B2 fails and the implementation/staging plan must be reviewed. The code must not bypass the phase boundary.
