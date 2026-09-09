# R1 Product Launcher / Runtime Boundary v0.1

## Components

```text
Browser
  ↓ loopback HTTP, no bearer material
Talos Product Shell
  ↓ server-held bearer + workspace + actor headers
R0 Private Preview Boundary
  ↓
One-App semantic / authority engine
  ↓ trusted adapter only after explicit authority
Talos Product Temporal Runtime
  ↓
Temporal namespace + generic Worker
```

## Product shell

Presentation and server-side proxy only. It cannot create semantic truth or authority by itself. The browser receives safe runtime metadata but never the preview bearer token.

## Private-preview boundary

Remains the access authority. It binds the configured actor/workspace and rejects direct unauthenticated access or actor impersonation.

## One-App

Remains the sole semantic and authority backend. Review, correction, confirmation, automation design, capability selection, ExecutionPlan review, Temporal mapping, runtime policy, deployment and workflow-start authority are all append-only One-App operations.

## Trusted Temporal runtime

The runtime adapter is not exposed as a browser API. It receives only an already-authorized One-App context. Deployment compiles the exact approved ExecutionPlan + TemporalMapping + RuntimePolicy + Deployment design and starts a Worker. Workflow execution is a later, separately approved operation.

## Connection ownership

Production runtime creates and closes connections to the configured Temporal address. Tests may inject an already-running Temporal Client/NativeConnection; injected connections remain owned by the test environment and are not closed by the adapter.

## Safety invariants

- browser-held bearer material = forbidden
- deployment attempt != workflow execution authority
- runtime adapters in DESIGN_ONLY = forbidden
- TEMPORAL_EXECUTION without runtime adapters = startup failure
- missing wait semantics = fail closed
- unsupported runtime construct != simulated success
- approved execution input drift = reject before `workflow.start()`
