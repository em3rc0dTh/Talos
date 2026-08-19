# Quarry 05 — Transform 05

## Objective

Interpret `source-05` without flattening its participant boundaries, normalize the visible Ward/Pharmacy collaboration into TALOS concepts, compare the evidence against Quarries 01–04, and prepare `foundry-source-05`.

No executable code is produced here.

## 1. Collaboration structure

The source is not one flat sequence. It contains two participant-local control-flow domains:

```text
PARTICIPANT-01  Ward
PARTICIPANT-02  Pharmacy
```

Each participant has solid local sequence flow. Dashed flows cross the participant boundary.

This strengthens the Q02 evidence that TALOS must preserve `PARTICIPANT` separately from an internal role/lane, and sharpens a new rule:

```text
MESSAGE FLOW ≠ SEQUENCE FLOW
```

Cross-participant communication must not be normalized as if the two pools were one continuous local control-flow graph.

## 2. Ward local process

Canonical reading:

```text
WARD_DEMAND_FOR_DRUGS
  ↓
WARD_SEARCH_DRUGS
  ↓
WARD_IN_STOCK?
  ├── YES → WARD_RECEIVE_INTERNAL_ORDER_B
  │             ↓
  │         START_MEDICAL_TREATMENT
  │
  └── NO  → WARD_MAKE_SEND_INTERNAL_ORDER
                ⇢ INTERNAL_ORDER_MESSAGE
```

The names `WARD_*` are TALOS canonical identifiers used to preserve participant context. They are not source labels.

The source gives no evidence for the system, person, database or inventory mechanism behind the stock decision.

## 3. Pharmacy local process

The Ward out-of-stock path sends a dashed cross-participant flow into Pharmacy.

Canonical reading:

```text
INTERNAL_ORDER_MESSAGE
        ⇢
PHARMACY_RECEIVE_INTERNAL_ORDER
  ↓
PHARMACY_CHECK_INTERNAL_ORDER
  ↓
PHARMACY_SEARCH_DRUGS
  ↓
PHARMACY_IN_STOCK?
  ├── YES → PHARMACY_DELIVER_DRUGS
  │             ⇢ DRUGS_DELIVERED_MESSAGE
  │
  └── NO  → PHARMACY_MAKE_SEND_PURCHASE_ORDER
                ↓
           PURCHASE_ORDER_PLACED
```

`INTERNAL_ORDER_MESSAGE` and `DRUGS_DELIVERED_MESSAGE` are normalized communication concepts inferred from the visible dashed flows and adjacent task labels. The exact message schemas are unresolved.

## 4. Same business question, different context

Both participants contain a gateway labeled `in stock`.

TALOS must preserve two distinct decision identities:

```text
WARD_IN_STOCK?
PHARMACY_IN_STOCK?
```

They may represent the same general business rule family, but they are evaluated under different ownership/context.

Therefore:

```text
SAME LABEL ≠ SAME NODE
SAME QUESTION ≠ SAME AUTHORITY / DATA SOURCE
```

This is important for future canonical identity and provenance rules.

## 5. Duplicate activity labels inside Ward

The Ward contains two distinct activities both visibly labeled:

```text
receive internal order
```

One is the upper node reached from Pharmacy `deliver drugs`; the other is the lower node reached from:

- the Ward `in stock = yes` path; and
- the upper duplicate node.

TALOS must not collapse them by label.

Canonical source identities remain separate:

```text
WARD_RECEIVE_INTERNAL_ORDER_A
WARD_RECEIVE_INTERNAL_ORDER_B
```

Semantic difference: `UNRESOLVED`.

Possible explanations such as `receive drugs`, `receive internal request`, or a diagram typo are not source truth and must not be silently repaired.

This quarry therefore introduces a strong identity rule:

```text
SOURCE NODE IDENTITY ≠ DISPLAY LABEL
```

## 6. Cross-participant correlation requirement

A durable implementation would eventually need to connect:

```text
Ward demand
   ↔ internal order
   ↔ Pharmacy handling
   ↔ drug delivery
```

The source proves communication topology but does not provide a correlation key.

Candidate future correlation entities might include a demand ID, internal-order ID, patient/treatment request ID, or another business identifier. None is confirmed.

Foundry requirement:

```text
CROSS-PARTICIPANT MESSAGE
requires correlation semantics before execution readiness
```

## 7. Local terminal event versus collaboration completion

The Pharmacy out-of-stock branch ends at:

```text
Purchase order placed
```

But the Ward's original demand has not visibly reached `start medical treatment` on that branch.

The rendered source shows no continuation from `Purchase order placed` back to Pharmacy fulfillment or Ward treatment.

Therefore Talos must not infer:

```text
Purchase order placed = original drug demand completed
```

This introduces a critical distinction:

```text
PARTICIPANT-LOCAL END / MILESTONE
              ≠
GLOBAL COLLABORATION COMPLETION
```

The collaboration may be incomplete in the source, or `Purchase order placed` may intentionally end this modeled scope. Both remain possible.

## 8. Missing re-entry / long-running continuation

The Pharmacy out-of-stock path suggests a future external procurement phase, but no supplier participant, wait, delivery event, or re-entry path is shown.

TALOS records:

```text
SOURCE_TRUTH:
Pharmacy may place a purchase order and reach `Purchase order placed`.

MISSING:
How/if drugs later return and resume the Ward demand.
```

A future Foundry may suggest a durable wait for supply, an external supplier workflow, a message-driven re-entry, or a separate process. None is authorized by this quarry.

## 9. Candidate Temporal interpretation

Advisory only. Two plausible execution decompositions are visible, and the source does not choose between them.

### Candidate A — collaboration-level workflow

```text
MedicationDemandWorkflow
  ↓
Ward stock decision
  ├── available → local fulfillment → treatment-ready
  └── unavailable
        ↓
      pharmacy request
        ↓
      pharmacy stock decision
        ├── available → delivery → Ward continuation
        └── unavailable → purchase-order milestone → unresolved continuation
```

### Candidate B — participant workflows with messaging

```text
WardMedicationDemandWorkflow
        ⇢ INTERNAL_ORDER_REQUEST
PharmacyInternalOrderWorkflow
        ⇢ DRUGS_DELIVERED
WardMedicationDemandWorkflow resumes
```

Possible Temporal mechanisms later include Workflow start, Signal/Update, Child Workflow, Activities and durable waits. The Mining Site does not choose them.

The major Foundry question is not syntax. It is **where durable identity and authority live across participant boundaries**.

## 10. Comparison with Quarries 01–04

### Reinforced evidence

Q05 reinforces:

- exclusive decisions and branch outcomes;
- participant boundaries;
- cross-participant communication;
- business nodes not automatically mapping to Activities;
- incomplete source semantics must remain unresolved;
- process identity must be stronger than labels alone.

### New or sharpened evidence

Q05 introduces or materially sharpens:

- two participant-local control-flow domains in one collaboration;
- message-flow versus sequence-flow distinction;
- correlation requirements across participant workflows;
- repeated labels across contexts;
- duplicate labels for distinct source nodes inside the same participant;
- participant-local terminal/milestone versus collaboration completion;
- missing re-entry after external procurement;
- repeated domain decision (`in stock`) under different authorities.

## Transform verdict

```text
SOURCE READING                     ✅
PARTICIPANT BOUNDARIES             ✅
LOCAL CONTROL FLOWS                ✅
CROSS-PARTICIPANT MESSAGE FLOWS    ✅ SOURCE-LIMITED
DUPLICATE NODE IDENTITY            ✅ PRESERVED
REPEATED DECISION CONTEXT          ✅
LOCAL VS GLOBAL COMPLETION         ✅
MISSING RE-ENTRY                   ✅ EXPOSED
CORRELATION REQUIREMENT            ✅ DESIGN GAP
TEMPORAL CANDIDATES                ✅ SUGGESTED
TEMPORAL CODE                      ⛔ NOT NEEDED
```