# TALOS R1-11 — AI Automation Designer & One-App Compaction Plan v0.1

Status: **ACTIVE / IMPLEMENTATION IN PROGRESS**

## Why this plan exists

Real One-App field use exposed two product-level defects that are generic rather than fixture-specific:

1. internal evidence volume grows linearly in the primary UI, creating unnecessary scroll;
2. unresolved capability design is pushed to the business user as one technical integration form per business task.

Neither issue changes the Canonical Process Model, review authority, ExecutionPlan contract or Temporal runtime architecture.

## Product correction

### UX lane

Keep all evidence but apply progressive disclosure:

```text
PRIMARY
- process summary
- BPMN/canvas review
- blockers requiring user action
- business confirmation
- automation proposal
- plan/runtime/execution status

ADVANCED / EVIDENCE
- complete questions
- complete findings
- raw BPMN/XML
- provenance
- provider diagnostics
- evidence trace
- execution logs
```

### Automation-design lane

Insert a governed proposal layer:

```text
Confirmed ProcessRevision
  ↓
Generic CapabilityDesign
  ↓
Gemini Automation Designer
  ↓ insufficient/failure
Ollama Automation Designer fallback
  ↓
AutomationProposal [SUGGESTED]
  ↓
Talos admission/policy validation
  ↓
User review / adjust / approve
  ↓
Explicit Capability Selection
  ↓
ExecutionPlan
  ↓
TemporalMapping / RuntimePolicy
```

## Work packages

### A — Progressive disclosure

- [x] Collapse Questions by default.
- [x] Collapse Findings by default.
- [x] Collapse raw BPMN/XML by default.
- [x] Collapse evidence trace by default.
- [x] Collapse runtime evidence by default.
- [x] Compact capability requirement technical details by default.
- [ ] Browser field verification on an arbitrary real process.

### B — Provider-independent AutomationProposal

- [x] Define immutable proposal contract.
- [x] Enforce exact ProcessRevision / CapabilityDesign lineage.
- [x] Enforce exact capability requirement refs and semantic subject refs.
- [x] Reject model-generated authority fields.
- [x] Reject incompatible orchestration reinterpretation.
- [x] Reject unavailable offering references.
- [x] Preserve proposals as `SUGGESTED` / `createsBinding:false` / `grantsAuthority:false`.

### C — AI providers

- [x] Gemini 3.6 Flash primary provider.
- [x] Ollama local opt-in fallback provider.
- [x] Shared provider-independent output contract.
- [x] Secret-free persisted proposal output.
- [x] Gemini low-thinking structured design request.
- [x] Ollama non-thinking JSON fallback request.

### D — Routing

- [x] COMPLETE primary → primary proposal accepted for review.
- [x] PARTIAL/provider failure/policy rejection → one independent fallback attempt.
- [x] COMPLETE fallback → fallback proposal accepted for review.
- [x] both insufficient → safe stop at design.
- [x] no model voting or output merging.
- [x] routing grants no binding/approval/deployment/execution authority.

### E — Application service and persistence

- [x] Persist `AutomationProposal` evidence.
- [x] Persist `AutomationProposalRouting` evidence.
- [x] Add One-App application service for proposal generation.
- [x] Prevent proposal generation after capability selection freeze.
- [ ] Wire application service into protected One-App HTTP route.

### F — Product interaction

Target interaction:

```text
4. Automation proposal

Talos designed a proposed implementation from the confirmed process.

Summary
- N business work steps
- H proposed human interactions
- S proposed system/integration steps
- W durable waits
- B deterministic branch points

Needs your attention
- grouped material unresolved questions only

[Review proposal]
[Adjust]
[Redesign with constraints]
[Approve design]

Advanced
[Technical capability details]
[Provider evidence]
```

- [ ] Add protected `POST /api/automation/proposal/generate`.
- [ ] Store routing result by exact Automation Design Workspace.
- [ ] Render proposal summary rather than manual form matrix.
- [ ] Keep manual per-requirement offering editor under Advanced.
- [ ] Add per-item Accept / Replace / Reject / Defer decisions.
- [ ] Convert accepted proposal items into existing explicit selection decision path.
- [ ] Never convert proposal to binding without recorded user authority.

### G — Regression and field proof

- [x] Add contract/provider/routing/UX static regression surface.
- [ ] Execute targeted test on exact branch SHA.
- [ ] Test at least three structurally different process domains before claiming generic UX closure.
- [ ] Include image-origin and native-BPMN-origin witnesses.
- [ ] Verify identical proposal policy contract across both source routes.

## Anti-overfit rules

A change fails this plan if any deterministic Talos code:

- matches a task name such as `Wash`, `Invoice`, `Manager`, `Email`, or any field fixture;
- assigns an execution family because of a domain-specific label;
- creates actor/business meaning not present in Canonical;
- special-cases image-origin processes differently from BPMN-origin processes after Canonical confirmation;
- treats an AI proposal as an approved binding;
- emits provider-generated Temporal code as execution authority.

## Gate to close

This work package is complete only when an arbitrary confirmed process can reach a concise, AI-generated automation proposal in One-App, users see only material decisions by default, accepted proposal decisions flow through existing explicit capability selection, and the resulting approved ExecutionPlan still compiles through Talos' deterministic Temporal mapping.
