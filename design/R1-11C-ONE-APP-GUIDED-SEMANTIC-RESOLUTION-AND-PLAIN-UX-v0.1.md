# R1-11C — One-App Guided Semantic Resolution + Freeze-blocker UX

Status: IMPLEMENTED FOR CERTIFICATION  
Date: 2026-09-18  
Scope: One-App product path only

## Problem observed in the real field-trial path

A real PNG reached Gemini perception, Talos evidence admission, Canonical normalization and BPMN Process Review. The review correctly retained material blockers such as:

- unresolved wait semantics;
- unresolved conditional branch rules;
- image-derived business meaning still requiring explicit confirmation.

The authority model behaved safely: business confirmation did not imply automation authority, and the automation-design freeze refused to cross unresolved semantic blockers.

The product UX did not behave well enough. It exposed internal terms, identifiers, validation codes and a generic Automation Design failure without guiding a normal business user to the missing information.

## Product objective

R1-11C turns that safe technical stop into a guided business interaction:

PROCESS SOURCE
→ TALOS UNDERSTANDS
→ USER REVIEWS
→ TALOS ASKS ONLY FOR MISSING BUSINESS MEANING
→ USER REVIEWS THE CLARIFICATIONS
→ USER EXPLICITLY APPLIES THEM
→ NEW IMMUTABLE PROCESS REVISION
→ USER RECONFIRMS THE UPDATED PROCESS
→ SEMANTIC FREEZE MAY BE RETRIED
→ AUTOMATION DESIGN

No step grants downstream authority automatically.

## Functional contract

### Guided semantic resolution in One-App

The One-App authority backend exposes:

- POST /api/semantic-resolution/propose
- POST /api/semantic-resolution/decide

A proposal:
- is pinned to one exact ProcessRevision and ValidationAssessment;
- creates no Canonical revision;
- confirms no business process;
- grants no Automation Design authority;
- grants no execution authority.

An accepted decision:
- creates a new HUMAN_CONFIRMATION ProcessRevision;
- revalidates it;
- realigns BPMN to the new Canonical revision;
- creates a new review baseline;
- requires explicit process reconfirmation;
- grants no Automation Design, deployment or execution authority.

### Supported guided blockers

R1-11C supports the existing guided resolution types:
- conditional branch rule;
- subprocess boundary meaning;

and adds:
- wait semantics.

Wait semantics include:
- fixed duration;
- scheduled time;
- deadline;
- message;
- external event;
- human response;
- business condition.

A fixed duration is represented as waitKind=DURATION plus an explicit business expression such as "5 minutes". This clears the ambiguous wait-kind blocker without inventing a precise schedule or timezone.

### Freeze blocker response

When Automation Design cannot open because the semantic freeze is not admissible, One-App now returns a product-safe blocker summary:
- current readiness;
- blocker title and explanation;
- target references;
- whether guided resolution supports the blocker;
- next safe action;
- automaticAuthorityGranted=false.

The UI must route the user back to clarification instead of presenting a terminal technical error.

## UX contract

### Default mode: business user

Technical implementation details are not the primary interface.

The normal user sees:
- Upload process image / BPMN
- Analyze process
- Review your process
- A few details need your confirmation
- Review my answers
- Apply clarifications
- Confirm this process
- Prepare automation

The user answers business questions such as:
- When should Talos follow this path?
- What should Talos wait for before continuing?
- How long?
- When is this subprocess complete?

### Technical details mode

Canonical revision IDs, validation codes, XML editing, raw findings, durable-document details and internal authority language remain available through an explicit "Technical details" control.

Technical truth is preserved; technical complexity is not forced on the normal user.

## Authority invariants

R1-11C must preserve:

SOURCE TRUTH != INFERRED MEANING != CONFIRMED PROCESS != AUTOMATION APPROVAL != DEPLOYMENT AUTHORITY != EXECUTION AUTHORITY

Specifically:
- clarifying a process does not confirm it;
- accepting a clarification creates a new revision and requires reconfirmation;
- process confirmation does not authorize Automation Design;
- a blocked freeze does not silently relax validation;
- no UI convenience path creates deployment or workflow authority.

## Acceptance criteria

R1-11C is acceptable when:
1. One-App exposes guided semantic proposal/decision routes.
2. A fixed-duration WAIT can be resolved without XML editing.
3. Accepted clarification produces a new revision and requires reconfirmation.
4. Automation Design freeze blockers are returned as actionable product information.
5. The normal UI hides technical diagnostics by default.
6. Technical details remain available explicitly.
7. Tests prove that no clarification step grants Automation Design or execution authority.
8. Existing image/Temporal/restart gates remain green.

## Release boundary

R1-11C improves the live field-trial product path. It does not close R1-11 by itself and does not declare Talos 1.0 Product Ready. External field-trial receipts and R1-12 release certification remain separate gates.
