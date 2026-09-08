# R1-11 FIELD TRIAL DEFECT 09 — DISCONNECTED IMAGE GRAPH SAFE-STOP v0.1

Date: 2026-09-08
Gate: R1-11 domain-agnostic real-user field trial
Status: FIX IMPLEMENTED — FIELD RE-TEST REQUIRED

## Observation

A real handwritten `Create customer` process image was submitted through the Talos One-App image path.

Visible source flow:

```text
START
  -> Request name
  -> Request Phone number
  -> Request ID (optional)
  -> Save Data
  -> END
```

The generated review candidate instead contained:

```text
EVENT
  -> Request name
  -> Request Phone number
  -> Request ID (optional)

END   [disconnected]
```

`Save Data` was absent from the review canvas and the END node had no incoming flow. The product nevertheless exposed the candidate as ready for review; after business confirmation the AI Automation Designer was allowed to start.

This is not an acceptable release behavior. A perception provider may be wrong, but Talos must not convert structurally insufficient perception into canonical business meaning or automation authority.

## Root cause A — deterministic sufficiency was conditional on fallback configuration

`buildImageBpmnReviewCandidate` used `runCorrelatedImagePerceptionWithFallback` only when a fallback binding existed.

With no fallback configured, the historical single-provider path admitted `ADMITTED_FOR_REVIEW` evidence directly and did not call `assessImagePerceptionSufficiency`.

Therefore the runtime claim `deterministicPrimarySufficiencyGate: true` was stronger than the actual single-provider implementation.

## Root cause B — sufficiency inspected reported relations, not whole-graph connectivity

The v0.1 sufficiency policy verified:

- provider status;
- visibility;
- occurrence evidence;
- relation endpoint resolution;
- relation direction;
- confidence;
- alternatives and uncertainty diagnostics.

It did not verify that all BUSINESS_GRAPH occurrences belonged to one connected process flow or that an explicit END had an incoming relation.

A provider could therefore return internally valid individual relations while omitting a material connector/node and still be judged sufficient.

## Root cause C — automation handoff trusted the validated baseline without an independent topology assertion

The semantic-freeze handoff correctly pinned the exact confirmed canonical revision and exact validation assessment. However, if an upstream validation gap allowed a disconnected canonical graph to be considered ready, the handoff had no independent structural assertion before creating automation-design authority.

A business confirmation must not repair or legitimize graph topology by itself.

## Fix

### 1. Sufficiency gate is now mandatory even with one provider

Single-provider image execution now performs deterministic Talos sufficiency assessment after provider admission.

Continuation requires all three:

```text
provider admission == ADMITTED_FOR_REVIEW
adapter result exists
Talos sufficiency == SUFFICIENT
```

Otherwise:

```text
SAFE_STOP_BEFORE_CANONICAL
```

No ProcessRevision and no BPMN review candidate may be created from insufficient evidence.

### 2. Business-graph connectivity is now part of sufficiency v0.2

New fail-closed reason codes include:

```text
DISCONNECTED_BUSINESS_GRAPH
END_WITHOUT_INCOMING_RELATION
NON_TERMINAL_WITHOUT_OUTGOING_RELATION
```

The check is provider-independent and uses only the structured evidence contract. It does not infer missing nodes or manufacture connectors.

### 3. Canonical automation handoff now has an independent topology safety net

Before semantic freeze may open Automation Design, `assessAutomationHandoffTopology` evaluates the exact confirmed canonical `ProcessRevision`.

It rejects structurally unsafe graphs with diagnostics such as:

```text
AUTOMATION_HANDOFF_PROCESS_GRAPH_EMPTY
AUTOMATION_HANDOFF_EDGE_ENDPOINT_OUTSIDE_CANONICAL_GRAPH
AUTOMATION_HANDOFF_REQUIRES_SINGLE_CONNECTED_PROCESS_ENTRY
AUTOMATION_HANDOFF_REJECTS_DISCONNECTED_PROCESS_GRAPH
AUTOMATION_HANDOFF_END_REQUIRES_INCOMING_FLOW
AUTOMATION_HANDOFF_NON_TERMINAL_DEAD_END
```

This gate is source-agnostic. It protects image input, native BPMN and corrected canvas revisions at the same automation-design authority boundary.

Business confirmation remains a separate authority and cannot override this structural gate.

### 4. No process-specific repair

The fix contains no `Create customer`, `Save Data`, CRM, customer, phone, ID, or screenshot-specific execution rule.

Talos does not synthesize the missing `Save Data` step. The correct behavior when the evidence is structurally incomplete is to retry through a configured independent fallback or safe-stop for user correction.

## Regression evidence added

`build/reference-vertical-slice/tests/r1-11-image-disconnected-business-graph-safe-stop.test.ts`

It proves:

1. a provider result that claims `SUCCEEDED` but contains a disconnected END is `INSUFFICIENT`;
2. the reason set includes disconnected graph, END-without-incoming, and non-terminal-without-outgoing;
3. the single-provider One-App image path applies the gate even without fallback;
4. insufficient perception creates neither a canonical `ProcessRevision` nor a `BpmnProcessRevision`.

`build/reference-vertical-slice/tests/r1-11-automation-handoff-topology-gate.test.ts`

It proves:

1. one connected entry-to-END canonical graph passes the handoff topology gate;
2. the exact structural shape observed in the field trial is rejected even after business confirmation;
3. a disconnected canonical island is rejected even when every node in the island has local relations.

## Field re-test acceptance

Re-run the same handwritten source on the exact post-fix SHA.

Acceptable outcomes are:

### A — primary evidence is complete

```text
START -> Request name -> Request Phone number -> Request ID (optional) -> Save Data -> END
```

and Talos presents it for human review.

### B — primary evidence remains incomplete

Talos must safe-stop before canonical normalization. It must not show a misleading `Ready for review` graph and must not allow Automation Design to open from that insufficient interpretation.

### C — an incomplete graph reaches canonical state through another source/correction path

Even if it is explicitly business-confirmed, the automation-design handoff must return `REJECTED_VALIDATION_GATE`; Gemini Automation Designer must not be opened from that disconnected canonical graph.

A safe-stop is a PASS for the governance boundary even though perception quality would remain a separate improvement target.

## Release implication

This defect does not close R1-11. It strengthens both the image perception boundary and the source-agnostic automation-design authority boundary discovered by a real non-fixture process. R1-11 still requires continued structurally varied field evidence, and R1-12 must certify one exact final SHA after the field matrix is closed.
