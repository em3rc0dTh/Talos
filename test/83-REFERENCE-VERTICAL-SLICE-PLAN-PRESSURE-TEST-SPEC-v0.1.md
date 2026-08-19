# TALOS — Reference Vertical Slice Plan Pressure Test Spec v0.1

Status: **ACTIVE BUILD-PLAN PRESSURE TEST**  
Date: **2026-08-19**

Target:

```text
plan/09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.1.md
```

BUILD remains closed.

## Fixtures

```text
V01 common source/intake packages precede Canvas-specific shortcut
V02 only Talos Canvas adapter is implementation-supported in first slice
V03 no BPMN/image/language/automation support claim
V04 source revision preserved before adapter attempt
V05 branded source/canonical identities prevent accidental equality
V06 initial reference source contains unresolved reviewer actor
V07 initial source fixture does not leak the later correction value "Manager" into source truth
V08 validation finding occurs before correction
V09 user correction creates new immutable source/semantic revision
V10 old revision remains queryable after correction
V11 T3 explanation + visual review share pinned baseline
V12 semantic review action uses command/precondition path, not direct CRUD
V13 stale review command executable test exists
V14 semantic diff/collateral-change test exists
V15 automation-design freeze requires validator readiness
V16 CapabilityRequirement/provider offering/binding remain separate
V17 reference email offering is explicitly test-only and not business meaning
V18 human interaction/form logical contract remains UI/runtime independent
V19 reusable FormRevision process-use mapping remains explicit
V20 ExecutionPlan/canonical identities remain separate
V21 TemporalMapping is persisted design before Worker uses it
V22 reference RuntimePolicy fixture contains concrete deterministic retry/timeout values before code implementation, not placeholders that Worker code invents
V23 idempotency strategy is persisted and executable
V24 TemporalFeatureProfile is explicit/versioned
V25 TemporalDefaultBehaviorProfile/reference context is represented even when explicit policies avoid defaults
V26 no material runtime SDK default is accepted silently
V27 DeploymentRevision pins exact local target/queue/type/artifact identities
V28 reference email capability side-effect persistence is logically isolated from Talos domain persistence so provider effect cannot masquerade as Talos state mutation
V29 secret bytes absent from first slice
V30 DeploymentRevision/Attempt/Observation/WorkflowExecution remain separate
V31 actual Temporal service required for acceptance
V32 deterministic Workflow performs no direct SQLite/filesystem/provider calls
V33 human approval Update semantics explicitly justified
V34 WorkflowExecutionObservation/runtime evidence is verified from Temporal runtime/history/describe evidence, not merely asserted from runner configuration
V35 Activity retry/failure/idempotency injection covered
V36 app restart/reopen durability proof covered
V37 complete runtime→source lineage automated assertion covered
V38 forbidden dependency/import architecture tests covered
V39 frozen contract manifest + exact build dependency lock/context prevents latest drift
V40 first BUILD scope remains bounded to reference vertical slice and has explicit stop-on-contract-defect rule
```

## Pass rule

A plan passes only when implementation can proceed without inventing a material semantic, capability, runtime-policy, deployment or evidence decision that should have been decided before BUILD.
