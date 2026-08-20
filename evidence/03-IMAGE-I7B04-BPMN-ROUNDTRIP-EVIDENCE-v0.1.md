# IMAGE I7B-04 — BPMN XML / BPMN-DI Round-Trip Evidence v0.1

## Gate
I7B-04 closes the BPMN model interchange boundary required before Talos may expose an editable Process Confirmation workspace.

## Verified invariants
- Exact received BPMN XML identity remains separately pinned by SHA-256.
- `bpmn-moddle@10.1.0` is isolated to the review/BPMN boundary.
- Canonicalized BPMN model → XML → BPMN model is idempotent for both business semantics and BPMN-DI.
- Native BPMN import does not fabricate a Talos Canonical ProcessRevision identity.
- Layout-only BPMN-DI edits may retain the exact canonical business pin.
- Semantic BPMN edits invalidate the old canonical pin and require explicit canonical reconciliation.
- A semantic BPMN edit cannot be confirmed for automation while `canonicalAlignmentStatus = REQUIRES_CANONICAL_RECONCILIATION`.
- Malformed/non-process BPMN fails before a review revision can exist.

## Exact tested head
`7be708a32720a0fb8d91598506f5c2d0e0461f95`

## CI evidence
- Image vertical slice run 190 — PASS
- B7-B9 Temporal reference runtime run 209 — PASS
- B10 Restart safety run 127 — PASS

## Merge
PR #18 merged as:
`2865a31adce0b9bd19ff25d73f581c466cdbdb62`

## Safety law
`BPMN SEMANTIC EDIT != OLD CANONICAL BUSINESS TRUTH`

The next product gate is I7B-05: a real browser BPMN workspace in which the graphical model and XML are synchronized views of the same BPMN revision, with confirmation controlled by the canonical alignment state.
