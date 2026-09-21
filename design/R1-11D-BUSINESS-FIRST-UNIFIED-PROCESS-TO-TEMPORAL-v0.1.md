# R1-11D — Business-first Unified Process-to-Temporal Product Contract

**Status:** IMPLEMENTED FOR CERTIFICATION  
**Date:** 2026-09-21  
**Scope:** Talos One-App product journey

## Product objective

A person should be able to show Talos how their business works without first learning how Talos works.

The primary product journey is:

```text
1 PROCESS
2 REVIEW
3 CONFIRM
4 AUTOMATE
5 RUN
```

The internal architecture remains richer and authoritative:

```text
SOURCE
→ PROVENANCE / EVIDENCE
→ CANONICAL PROCESS
→ SEMANTIC VALIDATION
→ GUIDED RESOLUTION
→ PROCESS REVISION
→ HUMAN CONFIRMATION
→ SEMANTIC FREEZE
→ CAPABILITY REQUIREMENTS / BINDINGS
→ EXECUTION PLAN
→ TEMPORAL MAPPING
→ RUNTIME / DEPLOYMENT / EXECUTION AUTHORITY
→ DURABLE EVIDENCE
```

R1-11D hides complexity; it does not remove it.

## Unified source contract

Talos exposes three normal-user entry modes:

- image;
- BPMN;
- native Talos Canvas.

They remain different SourceArtifacts and preserve source-specific identity. They converge only after their adapter/evidence boundary.

```text
IMAGE  ─┐
BPMN   ├─→ source evidence → Canonical → validation → Review
CANVAS ─┘
```

No source route may bypass Canonical semantics, Review, or explicit process confirmation.

### Canvas

Canvas is a source expression, not the Canonical Process Model.

The business palette is intentionally small:

- Start
- Step
- Decision
- Wait
- Person / approval
- Subprocess
- End

The native Canvas revision is preserved before adaptation. Canvas then uses the same source-evidence, normalization, validation, BPMN review and authority chain used by the rest of Talos.

## Business-first view versus Technical details

The normal user should not need:

- Canonical IDs;
- validation codes;
- raw BPMN XML;
- ProcessRevision identifiers;
- ExecutionPlan IDs;
- Temporal namespaces/task queues;
- RuntimePolicy internals;
- worker/artifact metadata;
- authorityRef values.

These facts remain available through **Technical details**.

The product layer therefore translates technical truth into product language instead of weakening the technical model.

## Guided semantic resolution

The physical R1-11C trial exposed an ephemeral proposal defect: the UI could show valid clarification questions, but Apply Clarifications could fail with `proposal not found`.

R1-11D makes guided-resolution proposals and decisions durable and idempotent.

A proposal is pinned to:

- exact BPMN/review revision;
- exact Canonical ProcessRevision;
- exact ValidationAssessment;
- exact clarification answers.

A proposal and an accepted decision survive a Talos process restart. Replaying the same accepted decision returns the already-created revision rather than creating another revision.

Conflicting second decisions are rejected.

Clarification still does **not** confirm the process or authorize automation.

## Authority invariants

```text
CLARIFY
!= CONFIRM PROCESS

CONFIRM PROCESS
!= APPROVE AUTOMATION

APPROVE AUTOMATION
!= DEPLOY

DEPLOY
!= START WORKFLOW
```

The simplified UI must never turn convenience into implicit authority.

## Automation facade

The normal user sees automation directions and a human-readable automation plan.

Internally, the facade still uses:

- explicit Automation Design decisions;
- explicit capability selection/binding;
- ExecutionPlan review;
- explicit automation approval.

Automation approval authorizes Temporal design only. It does not authorize deployment or workflow execution.

## Temporal boundary

The business journey may prepare the approved Temporal workflow design without showing raw Temporal primitives.

Deployment/runtime administration and single-use workflow execution authority remain separate.

The Technical details surface preserves the complete advanced controls and evidence.

## Recovery

Durable process knowledge may be reconstructed after restart.

Consumable authority is never rehydrated merely because evidence exists.

Guided semantic review state is recoverable because it is review evidence, not deployment/execution authority.

## Release boundary

R1-11D is a productization gate.

It does not manufacture:

- R1-11 external field-trial evidence;
- R1-12 exact-SHA release certification;
- paid-pilot readiness;
- market repeatability.

Those remain separate evidence gates.
