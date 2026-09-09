# TALOS — AI Automation Design & Progressive Disclosure v0.1

Status: **DESIGN CONTRACT / ACTIVE**

## Purpose

TALOS must not make a business user manually translate every confirmed process step into execution-family, implementation-kind, adapter-reference and Temporal decisions.

The product promise is stronger:

> Give Talos the process. Review what Talos understood. Confirm the business meaning. Talos then proposes a complete governed automation design that can be reviewed, corrected, validated and compiled toward Temporal.

This contract is domain-agnostic. It applies regardless of whether the source began as an image, BPMN, Canvas, text, an existing automation, or another supported process representation.

## Non-negotiable authority boundary

AI is permitted to **design a proposal**. AI is not permitted to create business truth, bind capabilities, approve automation, authorize deployment or start execution.

```text
SOURCE TRUTH
    ↓
PERCEPTION / SOURCE INTERPRETATION
    ↓
CANONICAL PROCESS
    ↓
SEMANTIC VALIDATION
    ↓
HUMAN BUSINESS CONFIRMATION
    ↓
AI AUTOMATION DESIGNER
Gemini primary / governed local fallback
    ↓
AutomationProposal [SUGGESTED]
    ↓
TALOS DETERMINISTIC POLICY + CONTRACT VALIDATION
    ↓
HUMAN REVIEW / ADJUST / APPROVE
    ↓
APPROVED AUTOMATION DESIGN
    ↓
ExecutionPlan
    ↓
TemporalMapping + RuntimePolicy
    ↓
DeploymentRevision
    ↓
Workflow-start authority
    ↓
Temporal execution
```

The existing truth law remains unchanged:

```text
SOURCE_TRUTH != PERCEPTION_EVIDENCE != INFERRED_MEANING
!= BUSINESS_CONFIRMATION != DESIGN_SUGGESTION
!= AUTOMATION_APPROVAL != DEPLOYMENT_AUTHORITY
!= WORKFLOW_START_AUTHORITY != HUMAN_OUTCOME_AUTHORITY
```

## Why the generic capability guardrail remains

The current generic capability designer is correct to refuse this transformation:

```text
"Send invoice"
   → assume Gmail
```

or:

```text
"Check vehicle"
   → assume human mechanic
```

A label alone is not authoritative execution meaning.

What changes is the product response to unresolved execution design.

Old UX failure:

```text
Generic requirement unresolved
    ↓
User receives one large manual form per task
    ↓
User acts as integration architect
```

New contract:

```text
Generic requirement unresolved
    ↓
AI Automation Designer receives frozen canonical semantics + available capability catalog
    ↓
AI returns explicit SUGGESTED alternatives and uncertainties
    ↓
Talos validates them
    ↓
User reviews meaningful choices only
```

The guardrail stays. The burden moves from the user to a governed proposal layer.

## AutomationProposal

Candidate structure:

```text
AutomationProposal
- id
- processRevisionRef
- capabilityDesignRevisionRef
- providerId
- modelRef
- pipelineVersion
- proposalDigest
- createdAt
- state: SUGGESTED
- createsBinding: false
- grantsAuthority: false
- steps[]
- integrations[]
- humanCoordinations[]
- waits[]
- branchTreatments[]
- subprocessTreatments[]
- runtimePolicySuggestions[]
- unresolvedQuestions[]
- assumptions[]
- diagnostics[]
```

Each proposed executable step must be linked to exact canonical semantic subjects.

```text
AutomationProposalStep
- semanticSubjectRefs[]
- proposedExecutionFamily
- proposedCapabilityRef?
- proposedImplementationKind?
- proposedImplementationRef?
- proposedHumanContract?
- proposedInputContract?
- proposedOutputContract?
- rationale
- confidence?
- evidenceRefs[]
- assumptionRefs[]
- state: SUGGESTED
```

## What the AI designer receives

The AI designer may receive only governed design context, for example:

- exact confirmed `ProcessRevision`;
- semantic nodes, relationships, actors, data, rules and waits;
- provenance summaries where material;
- frozen validation assessment;
- generic capability requirements;
- available capability catalog and schemas;
- installed integration descriptors;
- policy constraints;
- risk/idempotency requirements;
- supported Temporal semantic targets.

It must not receive secrets as proposal context.

## What the AI designer may do

The AI may propose:

- human vs system vs AI execution family;
- capability category;
- a compatible available capability;
- integration approach such as direct API, MCP, n8n, database, human task, AI service or internal service;
- forms/human-task surfaces;
- data collection and transformation steps;
- external effects;
- waits/timers;
- child-workflow candidates;
- retry/timeout/idempotency policy candidates;
- compensation candidates;
- unresolved questions when safe design is impossible;
- explanations of why each choice maps to the confirmed process.

## What the AI designer may not do

It may not:

- rewrite source truth;
- silently change confirmed business semantics;
- invent missing branch meaning and call it confirmed;
- fabricate actors, credentials, systems or integrations as facts;
- bind an implementation automatically;
- grant automation approval;
- grant deployment authority;
- grant workflow-start authority;
- generate uncontrolled Temporal code that bypasses Talos validation;
- make non-deterministic runtime decisions inside Temporal workflow logic.

## Gemini / local fallback behavior

The preferred design is provider-independent:

```text
AI Automation Designer Provider Contract
        ├── Gemini primary
        └── governed local fallback (for example Ollama-backed model)
```

Provider output is always parsed into the same `AutomationProposal` contract.

Fallback follows deterministic Talos routing policy. It must not become model voting or authority by consensus.

If both providers are insufficient:

```text
SAFE STOP AT DESIGN
```

with explicit unresolved questions.

## Talos validation after AI proposal

Talos, not the model, decides whether a proposal is structurally admissible for review.

Validation includes at least:

- every proposed step references real canonical subjects;
- no semantic subject is silently dropped;
- no proposed capability exists outside the allowed capability contract/catalog unless explicitly marked unresolved/custom;
- human work has a valid coordination contract or remains unresolved;
- waits remain workflow-native waits/timers;
- branch behavior maps only from confirmed branch semantics;
- side-effect work has idempotency/retry analysis;
- secrets are referenced, never embedded;
- Temporal workflow determinism is preserved;
- capability calls happen through approved Activity/Nexus/integration boundaries;
- unresolved design remains unresolved rather than coerced into a pass.

## User interaction model

The normal user should review a **proposal**, not fill an integration form for every task.

Primary UI:

```text
Automation proposal

9 business steps
6 human/manual
1 durable wait
1 decision
1 completion

Proposed execution
✓ Manual vehicle preparation — Human coordination
✓ Wet vehicle — Human coordination
✓ Wait 5 minutes — Durable timer
✓ ...

Needs your attention
! No responsible participant was present in the source

[Review proposal] [Adjust] [Approve design]
```

Detailed implementation fields are progressive disclosure for users who need them.

The user may:

- approve a proposal as a design decision;
- replace one proposal item;
- reject one proposal item;
- ask Talos to redesign with constraints;
- manually choose a capability when desired;
- open technical detail.

Approval still does not grant deployment or execution authority.

## Progressive disclosure contract

TALOS must distinguish the **operational product path** from the **audit/evidence path**.

### Primary product view

Show:

- source status;
- visual process/BPMN review;
- concise process summary;
- only unresolved questions that require user action;
- business confirmation;
- AI automation proposal;
- proposal blockers;
- ExecutionPlan summary;
- Temporal/runtime summary;
- deployment/execution authority status.

### Advanced / Evidence view

Preserve but collapse by default:

- all semantic findings;
- all reviewer questions;
- raw BPMN/XML;
- complete provenance;
- perception diagnostics;
- runtime profile;
- evidence trace;
- execution logs;
- raw provider/model metadata.

Nothing is deleted. Evidence remains inspectable and exportable.

## Noise-control rules

1. Repeated findings of the same code must be grouped in the primary UI.
2. A finding that requires no user decision must not consume a full primary-screen row.
3. Resolved findings move to audit history rather than remain expanded.
4. `N` internal evidence items should render as a summary such as `60 evidence findings · 0 blockers`.
5. Raw JSON must never be the default presentation for a business user.
6. XML remains available as an advanced technical editor, not a required interaction surface.
7. One-App must prioritize the current decision the user needs to make.

## Source-agnostic rule

No implementation may detect domain labels such as car wash, invoice, manager, vehicle, email or any fixture name to manufacture an automation design.

Allowed design inputs are semantic structure and governed context:

```text
node kind
actor kind/ref
data/rule semantics
relationship role
wait semantics
confirmed branch condition
capability catalog
integration contracts
runtime constraints
```

Domain words may be passed to an AI as context, but no Talos invariant or deterministic rule may depend on a fixture/domain-specific name.

## Temporal compilation boundary

The AI proposal does not emit authoritative Temporal workflow code.

```text
AutomationProposal [SUGGESTED]
      ↓
Talos validated design
      ↓
Approved capability bindings
      ↓
ExecutionPlan
      ↓
Deterministic Talos Temporal mapping
      ↓
RuntimePolicy
      ↓
DeploymentRevision
```

Semantic mapping remains governed:

```text
SYSTEM / EXTERNAL WORK → Activity or approved Nexus/capability operation
HUMAN COORDINATION      → Workflow state + Update/Signal + human-task surface
WAIT                    → Durable Timer / workflow-native wait
BRANCH                  → Deterministic Workflow control flow
PARALLEL                → Workflow concurrency + join policy
SUBPROCESS              → Inline coordination or Child Workflow per approved design
EXTERNAL EVENT          → Signal / Update / callback boundary
```

## Acceptance criteria

This contract is satisfied only when field tests show that:

1. an arbitrary confirmed process can request an AI automation proposal without manual per-step capability forms;
2. proposal output is always `SUGGESTED` and creates no binding or execution authority;
3. Talos rejects malformed, unsupported or semantically ungrounded proposal items;
4. users can adjust individual proposed items without editing internal JSON/XML;
5. a proposal can be converted into explicit capability selections only through a recorded approval decision;
6. the same engine works across structurally different domains and source routes;
7. questions/findings/logs remain available but the primary path no longer grows linearly with internal evidence count;
8. Temporal mapping remains deterministic and derives only from an approved ExecutionPlan.
