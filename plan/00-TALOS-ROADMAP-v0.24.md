# TALOS — Gated Roadmap v0.24

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes `00-TALOS-ROADMAP-v0.23.md` for active planning. Historical versions remain preserved.

## Design / architecture

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

## Phase 6 — Reference Vertical Slice

Authorized implementation path only:

```text
build/reference-vertical-slice/
```

Broad product BUILD remains closed.

### Closed BUILD stages

```text
B0 Contract manifest / boundaries                 ✅ CLOSED
B1 IDs / deterministic JSON / SQLite              ✅ CLOSED
B2 Canvas / Source / Intake                       ✅ CLOSED — 25/25
B3 Canonical / Provenance / Validation            ✅ CLOSED — 27/27
B4 Explanation / Review / Correction / Freeze     ✅ CLOSED — 13/13
```

Full B2→B4 local regression:

```text
65 / 65 PASS
```

B4 now proves the first real semantic acceptance loop:

```text
PR1 actor UNKNOWN
→ explanation / visual review baseline
→ explicit reviewer correction actor=Manager
→ new Canvas/source history
→ PR2 / new ValidationAssessment
→ READY_FOR_AUTOMATION_DESIGN
→ SemanticFreezeRecord(AUTOMATION_DESIGN_HANDOFF)
```

without mutating PR1, the original source or the old finding.

Evidence:

```text
test/92-B4-EXPLANATION-REVIEW-CORRECTION-FREEZE-IMPLEMENTATION-RESULT-v0.1.md
```

## B5 — Capability / Human / Form / Binding

```text
STATUS                              🟢 NEXT / OPEN
```

B5 consumes only the accepted frozen semantic handoff from B4.

Reference capability requirements:

```text
1. Manager review
   family = HUMAN_INTERACTION
   participant = Manager
   outcomes = APPROVED / REJECTED

2. Confirmation notification
   family = COMMUNICATION
   operation = SEND_NOTIFICATION
   channel = EMAIL
```

Reference designs must preserve:

```text
HumanInteractionDesign != FormRevision
FormRevision owns form-local fields/actions
FormUseBinding owns process-context mappings
CapabilityRequirement != Offering != MatchAssessment
MatchAssessment != SelectionDecision
SelectionDecision != CapabilityBindingRevision
CapabilityBindingRevision contains symbolic config/credential slots
no environment values / secret handles
no Temporal primitive in capability truth
```

Reference offering:

```text
REFERENCE_EMAIL_SINK v1
implementationKind = INTERNAL_SERVICE
lifecycle = TEST_ONLY
```

B5 must prove explicit selection/binding rather than canonical→provider shortcut.

## Remaining authorized stages

```text
B6 ExecutionPlan/mapping/policy/deployment       ⚪
B7 Temporal worker/reference provider            ⚪
B8 minimal reference API/web                     ⚪
B9 actual Temporal E2E runtime + evidence        ⚪
B10 failure/retry/restart/lineage closure        ⚪
```

## Immediate next move

```text
B5 — CAPABILITY / HUMAN / FORM / BINDING
```
