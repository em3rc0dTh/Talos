# TALOS — Problem & Product Hypothesis v0.1

Status: **ACTIVE BRAINSTORM / NOT FROZEN**

## Problem

Business processes already exist, but their knowledge is fragmented across representations and people.

The same operational truth may be distributed across:

- formal process notations;
- screenshots and diagrams;
- whiteboards;
- standard operating procedures;
- automation tools;
- API implementations;
- employee knowledge;
- emails and documents;
- workflow engines;
- ERP and CRM configuration.

Existing tools usually optimize for one layer:

- diagramming;
- documentation;
- automation;
- workflow orchestration;
- process mining;
- integration;
- AI assistance.

The missing system is the semantic bridge between them.

## Product hypothesis

If TALOS can preserve source provenance while normalizing heterogeneous process representations into one canonical semantic model, then it can provide a common foundation for:

1. understanding a process;
2. comparing different representations of the same process;
3. exposing ambiguity and missing execution semantics;
4. designing an automation safely;
5. binding actions to reusable capabilities;
6. generating/executing durable Temporal workflows;
7. observing actual execution;
8. improving the process using evidence from reality.

## Target interaction

A user should be able to begin in any of these ways:

```text
A. Upload an existing process artifact
B. Paste or describe a process in natural language
C. Import an existing workflow definition
D. Draw directly in the TALOS Canvas
```

TALOS should then produce:

```text
1. Interpreted process
2. Source/provenance map
3. Missing-information report
4. Proposed standardized process model
5. Human-readable workflow draft
6. Visual execution canvas
7. Proposed integrations/capability bindings
8. Temporal execution design
9. Validation findings
```

## Whiteboard hypothesis

The TALOS Canvas is not only a renderer. It is also an input surface.

Users should be able to drag components such as:

### Triggers
- form submitted;
- email received;
- webhook;
- scheduled time;
- file uploaded;
- manual start;
- external event.

### Logic
- condition;
- parallel branch;
- wait;
- loop;
- approval;
- human decision;
- transformation;
- route/merge.

### Actions
- call API;
- update database;
- send email;
- create record;
- generate document;
- AI task;
- call child workflow.

### Human interactions
- fill form;
- review;
- approve;
- reject;
- upload;
- correct;
- sign;
- choose.

### Integrations
- Gmail;
- Drive;
- Sheets;
- Slack;
- Teams;
- n8n;
- CRM;
- ERP;
- payments;
- AI;
- MCP;
- custom API.

The user should think in business terms while TALOS translates the design into durable orchestration concepts.

## Explanation hypothesis

Every generated automation should be explainable in two synchronized forms:

### Business explanation

```text
Trigger: Customer submitted onboarding form.
1. Validate submission.
2. Create CRM customer.
3. Verify documents with AI.
4. If review is required, wait for a human decision.
5. Create Drive folder.
6. Send welcome email.
7. Notify account owner.
```

### Execution canvas

```text
FORM
  ↓
TEMPORAL WORKFLOW
  ├─ validateSubmission
  ├─ CRM.createCustomer
  ├─ AI.verifyDocuments
  ├─ requiresReview?
  │    └─ Human Review → Signal/Update
  ├─ Drive.createFolder
  ├─ Gmail.sendWelcome
  └─ Slack.notifyOwner
```

Both representations refer to the same canonical model.

## AI hypothesis

AI participates in four distinct roles and must not be treated as one opaque feature:

1. **Perception** — interpret images, diagrams, documents and text.
2. **Semantic reasoning** — identify tasks, actors, decisions, data and events.
3. **Gap analysis** — identify what is missing for execution.
4. **Design assistance** — suggest process refinements, integrations and execution mappings.

AI suggestions remain suggestions until confirmed.

## Standardization hypothesis

Standardization should occur in the canonical TALOS model, not by forcing the user to redraw everything in one notation.

This allows TALOS to answer questions such as:

- Are these two diagrams describing the same logical process?
- What business semantics exist in one source but not the other?
- Which steps have been standardized?
- Which parts remain source-specific?
- Which source supplied the truth behind this execution step?

## Long-term hypothesis

Once TALOS can observe real executions, the system can compare:

```text
DESIGNED PROCESS
       vs
OBSERVED PROCESS
```

This opens a future process-intelligence loop:

```text
EXPRESS
  ↓
UNDERSTAND
  ↓
STANDARDIZE
  ↓
DESIGN
  ↓
EXECUTE
  ↓
OBSERVE
  ↓
COMPARE
  ↓
IMPROVE
```

This is future scope, not justification to weaken the initial semantic core.
