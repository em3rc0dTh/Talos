# TALOS I7B-04 Closure / I7B-05 Opening v0.1

I7B-04 closes the BPMN XML/BPMN-DI round-trip boundary.

Next atomic product gate: **I7B-05 — PROCESS CONFIRMATION BROWSER WORKSPACE**.

## Required user-visible surface

```text
┌─────────────────────────────────────────────────────────────────────┐
│ TALOS — PROCESS CONFIRMATION                                       │
├─────────────────────────┬───────────────────────────────────────────┤
│ ORIGINAL SOURCE         │ BPMN — WHAT TALOS UNDERSTOOD              │
│ [source preview]        │ [editable BPMN modeler]                   │
├─────────────────────────┴───────────────────────────────────────────┤
│ BPMN XML                                      [ View / Edit XML ]  │
├─────────────────────────────────────────────────────────────────────┤
│ Talos found:                                                        │
│ ✅ activities   ✅ gateways   🟡 uncertainties                      │
│                                                                     │
│ [ Edit BPMN ] [ Tell Talos what's wrong ] [ Confirm Process ]      │
└─────────────────────────────────────────────────────────────────────┘
```

## I7B-05 acceptance
- browser BPMN 2.0 modeler uses the same XML revision as the XML pane;
- graph edits export XML and create immutable BPMN review revisions;
- XML edits are validated before being imported into the modeler;
- semantic edits visibly require canonical reconciliation;
- layout-only edits preserve canonical alignment where valid;
- source preview remains available beside Talos interpretation;
- confirmation is disabled unless exact BPMN revision is aligned and confirmable;
- no Temporal/deployment action is exposed by this gate;
- existing runtime regressions remain green.
