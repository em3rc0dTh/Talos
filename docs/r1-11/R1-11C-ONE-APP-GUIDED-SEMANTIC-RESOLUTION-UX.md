# R1-11C — One-App Guided Semantic Resolution + Freeze-blocker UX

Status: ACTIVE IMPLEMENTATION CONTRACT

## Why this ticket exists

The first successful real Gemini image trial proved that Talos can preserve a real PNG, admit perception evidence, derive a canonical process candidate and reach Process Review. It also exposed the next product gap: a non-technical user can confirm the inferred process while Automation Design still refuses to open because semantic blockers remain, yet the One-App does not explain those blockers in plain language or provide a guided way to resolve them.

The same trial also showed that the default One-App surface exposes too much internal terminology: validator codes, canonical revision identifiers, execution-readiness enums, freeze language, capability binding terminology and raw authority states dominate a flow intended for ordinary business users.

R1-11C fixes both problems without weakening Talos truth or authority boundaries.

## Product objective

A user should be able to move a real process from source intake to Automation Design without understanding BPMN XML, canonical revision IDs, validator codes, freeze records, capability bindings or Temporal.

The default journey becomes:

1. Upload the real process.
2. Review what Talos understood.
3. Answer plain-language questions where Talos is unsure.
4. Review the proposed meaning changes.
5. Explicitly accept or reject those changes.
6. Reconfirm the process when a new immutable revision was created.
7. Continue to Automation Design only when the exact confirmed revision is semantically ready.

Advanced technical evidence remains available under a disclosure and never disappears from the product.

## Truth and authority boundary

R1-11C must preserve the existing separation of truth and authority.

- Guided answers create a proposal only.
- A proposal does not mutate the active Canonical ProcessRevision.
- Accepting a proposal creates a new canonical revision and a new BPMN-aligned draft.
- Accepting a proposal does not confirm the process.
- Reconfirmation is mandatory after any accepted semantic change.
- Automation Design opening remains an explicit action against the exact confirmed revision.
- A blocked freeze never silently downgrades validation requirements.
- Automation Design does not imply capability selection, ExecutionPlan approval, deployment or execution authority.
- Recovery may reconstruct durable evidence but never resurrect consumable authority.

## Guided blockers

The One-App guided path supports the blockers observed in the live image trial and the existing I8 semantic-resolution contract.

### Branch condition — `SV-CFL-001`

User question: **When should this path be used?**

The answer becomes a confirmed natural-language business rule for the exact conditional edge.

### Subprocess boundary — `SV-SUB-002`

User question: **How does this subprocess behave, and when is it finished?**

The user selects a boundary meaning and provides completion meaning.

### Wait kind — `SV-EVT-003`

User question: **What are we waiting for here?**

Friendly choices:

- A duration or scheduled time
- A deadline
- A message from another system/person
- An external event
- A human response
- A business condition

The selected answer is written only to the new revision after explicit acceptance.

### Wait timing — `SV-EVT-002`

When a schedule/deadline wait is selected, Talos asks for the exact time expression and timezone rather than forcing XML editing.

### Wait resume meaning — `SV-EVT-001`

For message/event/human/condition waits, Talos asks what exactly resumes the process.

### Material inferred meaning — `SV-SRC-001`

User question: **Talos inferred this meaning from the source. Is it correct?**

The user may accept the inferred value as business intent. Acceptance supersedes the inferred claim with a human-confirmed claim in a new revision. It does not alter the original evidence or source artifact.

## Freeze-blocker API projection

When Automation Design cannot open because the semantic freeze is blocked, the One-App API returns a stable `freezeBlockers` projection. It contains user-actionable information only and is separate from the canonical validation bundle:

- `findingRef`
- `code`
- `targetRef`
- `title`
- `question`
- `targetLabel` when resolvable

The canonical validation bundle remains unchanged and authoritative. `freezeBlockers` is a product projection, not a second validator.

## One-App UX contract

The primary surface uses task-oriented language. Internal terminology is secondary.

Examples:

- `Execution readiness: INSUFFICIENT_DETAIL` → **A few details still need your confirmation**
- `SV-CFL-001 · Branch condition unresolved` → **When should this path be used?**
- `SV-EVT-003 · Wait kind unresolved` → **What are we waiting for here?**
- `SV-SRC-001` → **Talos inferred this meaning. Is it correct?**
- `Automation Design did not open for the exact confirmed process` → **Before we design the automation, confirm the missing process details below.**
- `CONFIRMED · AUTOMATION NOT AUTHORIZED` → **Process confirmed · automation setup not started**

The following remain available only in Advanced / Technical evidence by default:

- validator codes
- opaque revision IDs
- canonical IDs
- raw JSON
- freeze record IDs
- internal authority references
- raw readiness enums

## One-App interaction rules

- The user sees one primary next action at a time.
- The review surface groups unresolved items by process step, not by validator code.
- Guided questions open automatically when a freeze attempt is blocked by supported semantic findings.
- The first unresolved question receives focus.
- Downstream controls remain disabled until the exact required authority exists.
- A failed freeze attempt must not emit `Process source/review changed` because the source did not change.
- A real source change or accepted semantic revision must invalidate later authority and clearly explain why reconfirmation is required.
- XML editing remains an Advanced action, not the default correction path.

## Acceptance criteria

R1-11C closes only when tests prove all of the following:

1. Branch, subprocess, wait and material inferred-meaning blockers can be represented as guided answers without changing canonical truth before acceptance.
2. Accepted answers derive a new canonical revision, revalidate it and require business reconfirmation.
3. One-App exposes propose/decide routes pinned to the exact active BPMN and Canonical ProcessRevision.
4. A blocked Automation Design handoff returns actionable blocker data and creates no automation authority.
5. The browser opens the guided-resolution surface from a blocked handoff instead of surfacing an opaque freeze error.
6. The browser does not emit the false `source/review changed` message after a failed freeze attempt.
7. The default UI renders friendly copy first and hides technical identifiers behind an Advanced disclosure.
8. Existing R1-04 through R1-07 authority boundaries remain unchanged.
9. Existing image, Temporal and restart-safety regression gates remain green.
