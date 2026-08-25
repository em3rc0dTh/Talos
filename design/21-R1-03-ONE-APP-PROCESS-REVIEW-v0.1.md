# TALOS — R1-03 One-App Process Review & Correction v0.1

Status: **ACTIVE / EVIDENCE GATED**  
Date: **2026-08-25**  
Target: **R1-03 — real end-user review and correction over One-App state**

## Decision

R1-03 does not launch a second Process Confirmation backend.

The product review workspace operates on the exact One-App repository, BPMN workspace, reconciliation bindings and authority chain established by R1-02.

```text
real source
  ↓
One-App intake
  ↓
inferred BPMN + Canonical + Validation
  ↓
PROCESS REVIEW
  ↓
user correction
  ↓
append-only BPMN revision
  ↓
structured BPMN → Canonical reconciliation
  ↓
new Canonical/Validation review baseline
  ↓
explicit business confirmation still required
```

## R1-03A correction contract

The first productized correction primitive is BPMN review editing. This is intentionally generic: it can express task/gateway/flow/name/structure corrections without manufacturing a second semantic mutation language.

Semantic edits MUST:

1. pin an active DRAFT BPMN review revision;
2. create a new immutable BPMN revision;
3. preserve backward source artifact/representation references;
4. re-enter `BpmnCanonicalReconciliationService`;
5. produce a new inferred Canonical ProcessRevision and Validation bundle;
6. retire the old active review head so stale confirmation cannot bypass the correction;
7. require business-process confirmation/reconfirmation;
8. keep automation, deployment and execution authority false.

If reconciliation is blocked, the attempted BPMN revision remains evidence but the prior review head remains active.

Visual-only edits may create a new BPMN revision while retaining the exact Canonical binding. They do not silently confirm business meaning.

## Review read model

`GET /api/process-review?revisionId=...` exposes the current review basis:

- BPMN revision;
- Canonical ProcessRevision;
- ValidationAssessment/findings/questions;
- Review workspace/baseline IDs;
- source representation references;
- allowed review actions;
- explicit authority status.

Superseded review heads remain inspectable as history, but cannot be edited or confirmed through the active One-App binding map.

## Truth boundary

```text
source bytes                 immutable
perception evidence          immutable
inferred BPMN                reviewable
inferred Canonical meaning   reviewable
user correction              new revision, never overwrite
business confirmation        separate authority
semantic freeze              separate authority
automation approval          separate authority
deployment                   separate authority
execution                    separate authority
```

A user correction does not rewrite the image/source truth and does not convert model inference into source truth.

## R1-03 certification

R1-03 closes only when product-level regression proves:

```text
A. review state can be read from One-App
B. image-derived inferred BPMN can be corrected
C. semantic correction creates a new BPMN revision
D. semantic correction creates a new Canonical/Validation review state
E. original source identity remains unchanged
F. old review head becomes stale and cannot be confirmed
G. corrected review still requires explicit business confirmation
H. no automation/deployment/execution authority is gained
I. full Image / B7-B10 regression remains green
```

## Next slices

R1-03B may add ergonomic guided/claim-level Accept, Reject and Defer decisions using the already-certified review/semantic-resolution primitives. Those decisions must be persisted and authority-enforced; they must not be UI-only state.

R1-04 remains the explicit whole-business-process confirmation gate.
