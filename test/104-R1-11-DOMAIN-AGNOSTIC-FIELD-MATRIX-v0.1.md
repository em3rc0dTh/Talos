# R1-11 — Domain-Agnostic Field Matrix v0.1

Status: **REQUIRED FOR TALOS 1.0 FIELD-TRIAL CLOSURE**  
Purpose: prevent Talos from becoming accidentally tuned to one source, one domain, one process vocabulary or one execution shape.

## Release law

A successful journey for one business process is useful defect discovery, but it is **not sufficient evidence that Talos is domain agnostic**.

Talos 1.0 must not contain behavior whose correctness depends on process names, domain labels, fixture identifiers, actor names or known business vocabulary.

```text
process-specific success
!=
domain-agnostic product evidence
```

Every field-trial repair must be justified by a generic semantic/runtime contract and must remain correct when the same structural rule is exercised by a different process.

## What we vary

R1-11 varies **process structure first**, not merely industry name.

Changing from a car wash to a restaurant while keeping the same execution shape is weak evidence. The matrix therefore requires materially different orchestration patterns.

### A — Human-dominant coordination

Representative characteristics:

- multiple human/manual activities;
- explicit participant responsibility;
- frozen allowed outcomes where applicable;
- zero or very few external Activities;
- no Activity retry/timeout/idempotency policy attached to Workflow-native human coordination.

Evidence target:

```text
human capability use
→ HUMAN_COORDINATION
→ UPDATE/SIGNAL or equivalent explicit Temporal construct
→ no fake Activity policy
```

### B — Straight-through system execution

Representative characteristics:

- one or more actual system/API/tool capability invocations;
- minimal human coordination;
- concrete Temporal Activities;
- explicit retry, timeout, failure classification and idempotency policy for each Activity capability use.

Evidence target:

```text
system capability use
→ CAPABILITY_INVOCATION
→ ACTIVITY
→ exact Activity RuntimePolicy
```

### C — Mixed human + external effect

Representative characteristics:

- human decision or approval;
- at least one concrete external side effect;
- execution resumes after the human outcome;
- only true Activity capability uses receive Activity policy;
- human/wait constructs remain Workflow-native.

Evidence target:

```text
human coordination
+
Activity side effect
+
correct authority separation
+
no cross-classification
```

### D — Durable coordination / branching

Representative characteristics:

- wait/timer/condition and/or non-trivial branch;
- optionally subprocess or ambiguous relation requiring an explicit execution-design decision;
- restart/recovery where supported by the runtime candidate;
- no semantic shortcut manufactured to make the plan executable.

Evidence target:

```text
reviewed business semantics
→ explicit execution-design treatment
→ durable Workflow coordination
→ same governed lineage after resume/restart
```

## Source diversity

Across the matrix, use more than one supported source route where practicable:

- native BPMN;
- image/perception when a real provider is configured;
- other supported authored inputs when admitted by the product.

Source diversity does not permit weaker truth rules. Source truth, inferred meaning and human confirmation remain separate.

## Anti-overfit acceptance rules

A release-blocking repair fails review if it does any of the following:

- matches a known process name;
- matches a known task label or actor label to choose runtime behavior;
- special-cases one uploaded file, fixture ID or revision ID;
- converts unsupported semantics into a known-good shape merely to continue the journey;
- assigns Activity policy to human/wait coordination because a capability-use record exists;
- skips a required authority gate because a previous field-trial source already passed it;
- changes a generic engine invariant only to accommodate one example without a cross-shape regression.

## Required evidence before R1-11 PASS

R1-11 closes only when the supported product journey has been exercised against the structural matrix above with no unresolved P0/P1/P2 release blocker.

At minimum the evidence set must prove:

1. a human-dominant process;
2. a system/Activity-dominant process;
3. a mixed human + external-effect process;
4. a durable coordination / branching process.

One process may cover more than one category only when the evidence clearly exercises each distinct structural behavior. A single source cannot be the only field-trial witness for Talos 1.0.

## Current field-trial implication

The first real process remains valuable as a defect-discovery witness. It does **not** become a golden implementation template.

Any defect found through that witness is classified by the generic contract it violated, then regressed with domain-neutral fixtures or structurally different examples.

## Product-ready rule

```text
R1-11 STRUCTURAL FIELD MATRIX PASS
+
R1-12 EXACT-SHA EXECUTABLE CERTIFICATION
=
Talos 1.0 may claim PRODUCT READY
```

Until both close, Talos remains a release candidate.
