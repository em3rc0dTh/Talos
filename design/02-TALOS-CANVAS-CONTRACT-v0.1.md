# TALOS — Canvas Contract v0.1

Status: **DESIGN DRAFT / ACTIVE**

## Purpose

The TALOS Canvas is the shared visual surface for both:

1. creating a process from scratch;
2. reviewing and editing a process reconstructed from an imported source.

It is not required to look like BPMN and should not require process-engineering expertise.

## User mental model

The user should be able to express:

> When this happens, do these things, ask this person, connect to this system, wait for this event, and then continue.

The canvas translates that intent into the canonical TALOS Process Model.

## Component families

### Trigger

Examples:

- Manual start
- Form submitted
- Email received
- Webhook received
- Schedule reached
- File uploaded
- Message received
- Database/business event

### Action

Examples:

- Call API
- Create record
- Update record
- Query data
- Generate document
- Send email
- Run AI task
- Invoke integration
- Start subprocess

### Logic

Examples:

- Condition
- Route
- Merge
- Parallel split
- Synchronization
- Loop
- Wait
- Timeout
- Error path

### Human interaction

Examples:

- Review
- Approve
- Reject
- Correct
- Fill form
- Upload
- Choose
- Sign
- Provide data

### Integration

Examples:

- Gmail
- Google Drive
- Google Sheets
- Slack
- Teams
- n8n
- CRM
- ERP
- Payment provider
- AI provider
- MCP capability
- Custom API

### Advanced execution

Examples:

- Child Workflow
- Signal
- Update
- Durable Timer
- Compensation
- Cancellation
- Continue-As-New

Advanced Temporal concepts should be available progressively and should not dominate the default business-facing experience.

## Imported-source rendering

When TALOS renders an imported process, the canvas must show provenance status.

Conceptually each element can surface:

```text
SOURCE
INFERRED
SUGGESTED
CONFIRMED
UNRESOLVED
EXECUTABLE
```

The user should be able to inspect the source evidence behind a node.

## Suggested changes

AI-generated or rule-generated refinements must appear as proposals, not as silently inserted truth.

Example:

```text
[Check invoice]  SOURCE
        ↓
[Detect duplicate]  SUGGESTED
        ↓
[Manager approval]  SUGGESTED
```

The user can accept, reject, edit or leave the suggestion unresolved.

## Dual-view synchronization

The visual canvas and human-readable step list must represent the same canonical revision.

Editing a step in the list should update the process model and then re-render the canvas.

Editing the canvas should update the process model and then regenerate the list.

Neither view is authoritative by itself.

## Forms

Forms are first-class process capabilities.

A form may:

- start a process;
- collect information during a human task;
- resolve missing data;
- capture approval/rejection;
- request correction;
- gather attachments.

Form schemas should be versioned and bound to process nodes/capabilities explicitly.

## Integration binding UX

A business node may start as:

```text
Send confirmation
```

TALOS can propose bindings:

```text
Gmail
Microsoft 365
Twilio
WhatsApp provider
Custom Notification API
n8n workflow
```

The process meaning and the integration implementation are distinct.

Changing the implementation should not automatically change the business semantics.

## Execution readiness indicators

The canvas should eventually communicate whether each node is:

```text
SEMANTICALLY UNDERSTOOD
IMPLEMENTATION BOUND
VALIDATED
EXECUTABLE
BLOCKED
```

Examples of blockers:

- unresolved condition;
- missing actor;
- missing required input;
- unbound integration;
- undefined timeout;
- non-idempotent external action without strategy;
- unresolved source conflict.

## Canvas anti-goal

Do not turn TALOS into a low-code drawing tool where connecting boxes is treated as sufficient evidence for production execution.

The Canvas is a user interface over semantic contracts, provenance and execution design.
