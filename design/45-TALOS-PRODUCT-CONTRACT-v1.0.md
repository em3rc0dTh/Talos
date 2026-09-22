# TALOS — Product Contract v1.0

Status: **ACTIVE PRODUCT CONTRACT**  
Scope: **Talos process understanding, standardization, translation, export and optional execution**  
Contract rule: **product work MUST preserve this contract unless a new explicit contract revision supersedes it.**

## 1. Product promise

Talos captures, normalizes, reviews, represents and optionally executes business processes without requiring the user to know BPMN, Temporal, programming or software architecture.

```text
Show Talos how your business works.
Talos turns it into a clear, standard and executable process.
```

Execution is optional.

A valid user journey may end at Canvas, BPMN, Temporal export, or live Temporal execution.

## 2. Canonical truth

Talos is not an input-to-Temporal converter.

```text
IMAGE ─┐
BPMN ──┼──> Canonical Process ──> Canvas
CANVAS ─┘                      ├──> BPMN
                               └──> Temporal
```

The confirmed Canonical Process is the internal business truth. Canvas, BPMN and Temporal are representations of that truth.

Temporal-specific decisions must not leak backward into canonical business meaning.

## 3. Official input routes

Talos supports exactly these primary product routes:

1. **Image** — photo, screenshot, whiteboard or process diagram.
2. **Native BPMN** — BPMN XML / .bpmn.
3. **Talos Canvas** — a visual editor built from simple business blocks.

All routes converge through review and confirmation into the same Canonical Process path.

No interpretation source automatically becomes confirmed business truth.

## 4. Talos Canvas contract

Talos Canvas is a visual process workspace, not a form renamed as a canvas.

The visual editor must support the product concepts:

```text
Start
Step
Person / Approval
Decision
Wait
Event
Subprocess
End
```

The user must be able to compose visually through drag, move, connect, rename, remove and branch operations.

Forms remain useful only as an inspector for the selected visual item.

Internal identifiers and execution vocabulary such as `conditionRef`, `semanticSubjectRef`, `ExecutionElement` or `CONDITIONAL_FLOW` are technical details and are not required in Simple Mode.

## 5. Review and confirmation

Talos may interpret, suggest, translate, classify and normalize.

Talos must not silently invent business meaning.

The product path is:

```text
Interpretation
  -> Review
  -> Clarify only real uncertainty
  -> Explicit user confirmation
  -> Confirmed Canonical Process
```

Image perception, BPMN import and Canvas draft never authorize deployment or execution.

## 6. Translation workspace

After a process is confirmed, the primary workspace exposes three synchronized product views:

```text
[ Business Canvas ] [ BPMN ] [ Temporal ]
```

These views are not independent process copies. They are projections of the same confirmed process lineage.

### Business Canvas

Business language, visual structure, participants, decisions, waits and exceptions.

### BPMN

Must provide:
- visual BPMN representation;
- exact BPMN XML;
- Copy XML;
- Download .bpmn.

A BPMN-only outcome is a complete and valid Talos journey.

### Temporal

Must provide:
- visual workflow representation;
- generated workflow source;
- Copy source;
- Download workflow package;
- explicit optional **Implement with Temporal** action.

Generating or exporting Temporal design must not authorize deployment or execution.

## 7. Temporal readiness states

Talos distinguishes these states:

```text
PROCESS READY
BPMN READY
TEMPORAL DESIGN READY
TEMPORAL EXPORT READY
TEMPORAL EXECUTION READY
DEPLOYED
RUNNING
COMPLETED
```

They are never aliases.

### TEMPORAL DESIGN READY

Talos has a reviewed Temporal mapping for the confirmed execution semantics.

### TEMPORAL EXPORT READY

Talos can emit a portable workflow artifact.

### TEMPORAL EXECUTION READY

Required runtime integrations and execution details are resolved.

An unresolved external integration may block execution readiness without blocking design/export readiness.

## 8. Portable Temporal artifact

The minimum target export is:

```text
talos-temporal-workflow/
├── workflow.ts
├── activities.ts
├── workflow.manifest.json
├── process.bpmn
└── README.md
```

The export must:
- contain no credentials;
- preserve source/process lineage;
- identify unresolved integrations explicitly;
- preserve human tasks, decisions, waits, branches and completion semantics;
- remain separate from Talos deployment authority.

## 9. Optional implementation boundary

Only the explicit user action:

```text
Implement with Temporal
```

may enter the implementation journey.

That later journey may resolve:
- integrations;
- credentials;
- runtime policy;
- target environment;
- namespace;
- task queue;
- Worker;
- deployment authority;
- workflow execution authority.

These are hidden from the default business journey before implementation is chosen.

## 10. Authority invariants

The following implications are forbidden:

```text
Generate BPMN          != approve automation
Generate Temporal      != deploy
Download Temporal      != deploy
Prepare runtime        != deploy
Deploy Worker          != start Workflow
Temporal design ready  != execution ready
```

Every authority transition remains explicit and evidence-backed.

## 11. Simple Mode / Technical Mode

### Simple Mode

The normal journey should read approximately:

```text
1. Show Talos your process
2. Check what Talos understood
3. Confirm it
4. Get BPMN
5. Get Temporal Workflow
6. Implement it — optional
```

### Technical Mode

May expose Canonical Process revisions, ValidationAssessment, ExecutionPlan, CapabilityBinding, TemporalMapping, RuntimePolicy, DeploymentRevision, Worker, Namespace, Task Queue, digests, evidence and authority records.

Technical detail is never required merely to document or export a process.

## 12. Error contract

Business users receive human-readable errors and safety state.

Bad:
```text
undefined is not deterministic JSON
```

Expected:
```text
Talos could not prepare this part of the process.
Nothing was deployed or started.
```

Technical cause may be available under Technical details.

## 13. Portability contract

Talos must not trap user process work inside Talos.

BPMN:
- Copy XML
- Download .bpmn

Temporal:
- Copy workflow source
- Download workflow package

Canvas:
- maintain a portable Talos representation suitable for later save/import without making it the interoperability standard.

## 14. Valid completion points

All four are successful product outcomes:

```text
A. CANVAS
B. BPMN
C. TEMPORAL EXPORT
D. LIVE TEMPORAL
```

A, B and C are not failures for not continuing to D.

## 15. Contract acceptance criterion

A non-technical user must be able to:

```text
create/import
-> understand
-> correct visually
-> confirm
-> inspect BPMN
-> copy/download BPMN
-> inspect Temporal translation
-> copy/download Temporal workflow
-> stop
```

without needing to understand BPMN XML syntax, Temporal SDK, Workers, Activities, Task Queues, Namespaces, retry policies or deployment architecture.

A user who chooses implementation may then continue through guided configuration, deployment, execution, monitoring and durable recovery.

## 16. Product equation

```text
Talos =
Process Understanding
+ Canonical Normalization
+ Visual Modeling
+ BPMN Standardization
+ Temporal Translation
+ Optional Execution
```

Talos is not only a Temporal generator, BPMN editor or AI diagram reader.

This file is the active product contract for R1-13 and later work until explicitly superseded.
