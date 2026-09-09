# R1-11 — Field Trial Defect 03 — RuntimePolicy Activity Boundary

Status: **FIX IMPLEMENTED / LOCAL REGRESSION RETEST REQUIRED**  
Observed during: **Talos 1.0 real-user field trial**  
Classification: **GENERIC PRODUCT-SHELL CLASSIFICATION DEFECT**

## Observation

After an approved Temporal mapping containing Workflow-native human coordination, the product shell proposed RuntimePolicy as though every capability use were a Temporal Activity.

Observed product evidence included:

```text
Temporal mapping:
  humans: 11
  waits: 0

Product RuntimePolicy preview:
  Proposed visible policy for 11 Activity use(s)
```

The backend correctly rejected the request with:

```text
generic runtime policy requires exactly one explicit policy resolution per Activity capability use
```

The backend rejection was correct. The presentation layer had classified capability-use identity as Activity identity.

## Violated generic law

```text
CAPABILITY USE
!=
TEMPORAL ACTIVITY
```

A capability use can be realized as:

- Workflow-native human coordination;
- Workflow-native wait/condition coordination;
- an actual Activity invocation;
- another supported explicit Temporal construct.

Activity retry, timeout, idempotency and failure policy therefore applies only to capability uses represented by approved Temporal `ACTIVITY` mapping units.

## Repair

A product-shell runtime-policy boundary enhancement now derives exact Activity capability-use refs from the approved Temporal mapping.

Behavior:

```text
Temporal mapping units
↓
select constructKind === ACTIVITY
↓
exact executionSubjectRefs
↓
Activity RuntimePolicy proposal + request
```

Human/wait coordination is excluded from Activity policy without weakening the authority engine.

The backend remains fail-closed and unchanged.

## Product truth after repair

Human-only execution design:

```text
0 Temporal Activity policies
Workflow retry policy remains explicit
human/wait coordination remains Workflow-native
```

Mixed execution design:

```text
N exact ACTIVITY capability uses
→ N explicit Activity policies
human/wait capability uses
→ no Activity policies
```

System/Activity-only design:

```text
all mapped ACTIVITY capability uses
→ exact explicit Activity policies
```

## Regression

`build/reference-vertical-slice/tests/r1-11-runtime-policy-activity-boundary.test.ts`

The regression is deliberately domain-neutral and covers:

1. human-only mapping → zero Activity policies;
2. mixed Activity + human + wait mapping → only actual Activity policy survives;
3. mapped Activity without an explicit policy → client boundary fails closed before the request is sent.

No process names, actor names, business labels or fixture-specific IDs select behavior.

## Related field-trial rule

See:

`test/104-R1-11-DOMAIN-AGNOSTIC-FIELD-MATRIX-v0.1.md`

A single real process can discover this defect, but cannot by itself certify Talos as domain agnostic.
