# R1 Product Authority Field Notes v0.1

These notes record the productization findings that emerged after R1-03 moved image-derived meaning into a real review/correction workspace.

## Finding 1 — The backend was ahead of the product surface

One-App already contained explicit confirmation, capability selection, ExecutionPlan review, Temporal mapping, runtime policy, deployment approval and workflow-start authority. The product shell stopped before those stages, creating a false impression that the remaining work was new engine design.

Decision: keep One-App as the sole semantic/authority backend and make the product shell drive those existing contracts.

## Finding 2 — A normal product launcher cannot require browser-held preview secrets

The R0 private-preview boundary correctly requires bearer/workspace/actor headers. Exposing the bearer token to browser JavaScript would weaken that boundary.

Decision: run an outer loopback product shell that proxies to the protected preview authority service. Bearer material remains closure-held on the server side; only safe actor/workspace/runtime metadata may reach the browser.

## Finding 3 — Deployment success must remain visibly weaker than workflow-start authority

The real generic Worker can be deployed and polling while no business workflow is authorized.

Decision: keep four visually distinct user actions: environment realization → deployment approval → deployment attempt → workflow-start approval/start.

## Finding 4 — Human Temporal design is ahead of human runtime execution

Talos can design UPDATE_HANDLER and SIGNAL_HANDLER mappings, but the current generic runtime has no asynchronous running-observation + human-input + completion lifecycle.

Decision: do not simulate human completion. Surface this as a runtime-extension boundary and implement it as a governed async execution gate.

## Finding 5 — The product owner should not certify internals manually

The owner field trial must evaluate whether Talos is understandable and useful, not whether Node/Temporal test commands pass.

Decision: technical certification remains automated/engineering-owned. Owner handoff begins only after a coherent product candidate exists.
