# TALOS — T5-02 Temporal Mapping Pressure Test Spec v0.1

Status: **ACTIVE PRESSURE-TEST SPEC**  
Date: **2026-08-19**

Targets:

```text
design/34-TEMPORAL-MAPPING-STRATEGY-CONTRACT-v0.1.md
arch/19-TEMPORAL-MAPPING-STRATEGY-ARCHITECTURE-v0.1.md
```

Reference vocabulary verified against current official Temporal documentation.

BUILD remains closed.

## Fixtures

```text
Y01  root durable orchestration boundary
Y02  ExecutionRegion does not imply Workflow automatically
Y03  pure deterministic coordination maps to workflow logic/no direct primitive
Y04  external capability invocation may map to Activity
Y05  canonical ACTION does not map to Activity automatically
Y06  provider/API use does not imply Nexus automatically
Y07  cross-Temporal-app service contract may map to Nexus
Y08  Activity vs Nexus preserved as alternatives when both viable
Y09  mapper preference is not accepted decision
Y10  asynchronous state-changing message may map to Signal
Y11  synchronous tracked state-changing interaction may map to Update
Y12  read-only state inspection may map to Query
Y13  human approval not Signal/Update automatically
Y14  source message flow not Signal automatically
Y15  explicit in-workflow time wait may map to durable Timer
Y16  external-event wait is not Timer automatically
Y17  human/event wait plus deadline supports composite message+timer pattern
Y18  parallel branches map to workflow concurrency without Child Workflow assumption
Y19  join maps to workflow join logic
Y20  subprocess may remain inline
Y21  separate lifecycle/service region may map to Child Workflow
Y22  code organization alone does not justify Child Workflow
Y23  resource/entity lifecycle may justify Child Workflow candidate
Y24  business loop does not imply retry
Y25  business loop does not imply Continue-As-New
Y26  long-history/lifecycle requirement may justify Continue-As-New intent
Y27  Continue-As-New threshold/value deferred to T5-03
Y28  cancellation intent placement without concrete cancellation policy
Y29  compensation intent placement without concrete compensation policy
Y30  context-only subject maps NO_DIRECT_PRIMITIVE
Y31  source/review/provenance item maps NO_DIRECT_PRIMITIVE
Y32  one execution subject may map to several Temporal mapping units
Y33  several execution subjects may map to one workflow-logic unit
Y34  capability binding identity not reused as Activity identity
Y35  exact ExecutionPlanRevision pin
Y36  newer ExecutionPlanRevision does not auto-rebase mapping
Y37  mapping revision history immutable
Y38  explicit mapping trace to execution/upstream semantics
Y39  no retry policy values in T5-02
Y40  no timeout values in T5-02
Y41  no Namespace/Task Queue/WorkflowId/Worker deployment values in T5-02
Y42  no secret/configuration environment realization in T5-02
Y43  recurring scheduled process start distinguished from in-workflow Timer and represented by current Temporal Schedule vocabulary
Y44  one-time future Workflow start distinguished from in-workflow Timer and represented as Start Delay candidate where appropriate
Y45  mapping revision declares/assesses the Temporal feature profile/version assumptions under which constructs such as Nexus/Schedules/new features are valid
Y46  READY_FOR_RUNTIME_POLICY_DESIGN does not mean runnable/deployable
```

## Pass rule

A fixture passes only if the mapping is explicit, traceable, version-safe, non-one-to-one by assumption, and preserves T5-03/T5-04 boundaries.
