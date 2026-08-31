# Talos Three-Stage Product Experience v0.1

Status: **FROZEN PRODUCT UX CONTRACT — release-candidate implementation**

## Product promise

Talos turns a real business process into a governed running workflow without requiring the business user to understand BPMN XML, capability revisions, ExecutionPlan internals, Temporal mapping records, runtime policies, deployment revisions, or authority-record plumbing.

The product experience has three visible stages:

```text
PROCESS
  Image / BPMN / Canvas
  → visual BPMN review
  → Correct / Confirm

AUTOMATION
  confirmed process
  → AI automation design
  → Temporal workflow canvas
  → suggested capabilities / integrations
  → Redesign / Approve

RUN
  approved automation
  → Deploy
  → Run
  → Monitor
```

## 1. PROCESS — “This is what Talos understood”

Talos preserves the submitted source before interpretation.

- Image sources are perception evidence and do not become business truth automatically.
- BPMN sources are imported as source truth but still require business confirmation before automation design.
- Canvas sources, when enabled, must enter through the same Canonical Process boundary.

All routes converge on the Canonical Process Model and are projected into a visual BPMN review canvas.

Normal user controls:

- `Understand process`
- `Correct` when necessary
- `Confirm process`

Only material ambiguity should interrupt this stage. Questions, findings, provenance, raw BPMN/XML and immutable revision details remain available as Advanced evidence.

## 2. AUTOMATION — “This is how Talos proposes to run it”

Business confirmation is the boundary that allows automation design to begin.

The normal product path automatically opens the governed AI Automation Designer after the process is confirmed.

The designer receives:

- exact confirmed Canonical Process semantics;
- capability requirements;
- configured capability catalog / offerings;
- orchestration constraints;
- runtime constraints.

It may propose:

- human work;
- direct/internal services;
- APIs;
- MCP tools;
- n8n workflows;
- AI services;
- databases/storage;
- webhooks;
- waits/timers;
- workflow conditions;
- subprocess / child-workflow candidates;
- other explicit integration candidates supported by the generic contracts.

Every proposed tool or integration is **SUGGESTED**, never source truth.

Talos deterministically validates the proposal before it can be approved. Talos must not silently complete missing business meaning.

The normal user sees:

- Temporal workflow canvas;
- suggested tools / capabilities and their role in the process;
- material unresolved questions only;
- `Redesign`;
- `Approve automation`.

The normal user does **not** configure a capability form per task.

### One visible approval, multiple internal records

After the user approves the exact Temporal/capability proposal, Talos may perform the deterministic compilation chain underneath the UI:

```text
accepted AI design
→ capability selection/binding
→ ExecutionPlan review/build
→ automation approval record
→ TemporalMapping
→ RuntimePolicy
```

This does not collapse authority boundaries. The single user action is the visible automation-design approval; Talos records the required internal lineage and must fail closed if the deterministic compilation cannot preserve the approved proposal.

Deployment authority and workflow-start authority remain separate and are never inferred from automation approval.

## 3. RUN — “Deploy and execute”

After automation compilation is ready, the product exposes the runtime stage.

Normal controls:

- `Deploy approved workflow`
- `Run workflow`
- runtime/human-work status and durable evidence

A single visible Deploy action may create the required internal deployment-design, realization, one-attempt approval and Worker-deployment records for the exact visible target. It may not authorize a business workflow start.

A single visible Run action may approve and consume one exact workflow-start authority for the visible execution ID/input. It may not grant reusable or wildcard execution authority.

## Internal engine remains unchanged in principle

Talos still keeps these boundaries separate:

```text
SOURCE TRUTH
!= PERCEPTION EVIDENCE
!= INFERRED MEANING
!= BUSINESS CONFIRMATION
!= DESIGN SUGGESTION
!= AUTOMATION APPROVAL
!= DEPLOYMENT AUTHORITY
!= WORKFLOW-START AUTHORITY
!= HUMAN OUTCOME AUTHORITY
```

The difference is presentation: the engine owns complexity; the business user owns meaningful decisions.

## Advanced mode

Advanced evidence may expose:

- questions/findings;
- raw BPMN/XML;
- Canonical IDs/revisions;
- provenance/evidence trace;
- capability requirements, offerings and bindings;
- ExecutionPlan;
- TemporalMapping;
- RuntimePolicy;
- deployment/recovery evidence;
- manual capability configuration for intentional expert override.

Advanced mode must never be required for a normal complete process + complete AI design.

## Release discipline

This UX contract defines the release-candidate product surface. It does **not** by itself certify Talos 1.0 as Product Ready.

Final release claims remain gated by:

- R1-11 domain-agnostic real-user field evidence across structurally distinct processes;
- R1-12 exact-SHA executable certification.

No visual simplification may manufacture a PASS for either gate.
