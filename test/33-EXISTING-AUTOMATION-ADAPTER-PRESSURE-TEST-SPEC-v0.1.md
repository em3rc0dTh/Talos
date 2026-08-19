# TALOS — Existing Automation Adapter Pressure-Test Spec v0.1

Status: **ACTIVE P2-05 TEST SPEC**  
Date: **2026-08-19**

Target:

```text
design/16-EXISTING-AUTOMATION-ADAPTER-CONTRACT-v0.1.md
arch/08-EXISTING-AUTOMATION-ADAPTER-ARCHITECTURE-v0.1.md
```

Purpose:

> Attack whether an existing automation definition can enter TALOS as implemented-behavior evidence without being mistaken for business intent, runtime observation, canonical semantics or future Temporal design.

Fixtures are synthetic n8n-style/provider-neutral automation cases because the Talos repository currently contains no dedicated imported n8n source corpus. They test the architectural contract, not a production parser.

---

# A01–A32

## A01 — source definition vs canonical model
Preserved automation export must remain distinct from canonical process output.

## A02 — provider node ID vs canonical ID
Native/provider IDs remain source identity only.

## A03 — node label vs business meaning
`Approve invoice` label cannot by itself prove business activity semantics.

## A04 — implemented behavior vs business intent
Automation behavior defaults to `IMPLEMENTED_BEHAVIOR`; business intent requires separate evidence.

## A05 — technical routing vs business decision
IF/router/filter topology cannot become business decision automatically.

## A06 — technical retry vs business loop
Retry/backoff configuration cannot become business loop/policy automatically.

## A07 — technical error handler vs business exception
Error workflow/continue-on-error cannot become rejection/cancel/compensation automatically.

## A08 — credential reference vs canonical data
Credential refs may be preserved safely; secret values never become canonical process data.

## A09 — webhook trigger vs business trigger intent
Configured webhook proves technical entry configuration, not business trigger meaning automatically.

## A10 — schedule/polling vs business wait/trigger
Cron/schedule/polling may be technical observation cadence rather than business timing semantics.

## A11 — sub-workflow reference unresolved
External referenced workflow may be unavailable; no subprocess body is invented.

## A12 — merge/fan-in vs semantic join policy
Multiple incoming edges/provider merge mode do not automatically prove ALL/ANY/N_OF_M.

## A13 — expression/template vs business rule
Expression/config may be technical transformation, routing, or mixed logic; do not promote automatically.

## A14 — provider/API binding vs capability contract
HTTP/provider operation is implementation evidence, not a provider-neutral capability contract.

## A15 — disabled node remains source evidence
Disabled/inactive node is preserved but not treated as current-path meaning automatically.

## A16 — sticky note/editor layout vs process semantics
Editor/authoring metadata stays outside business graph.

## A17 — provider-specific operation subtype
Provider operation/version/config survives even when canonical vocabulary is broader.

## A18 — unsupported node type
Unknown/custom/community node is preserved with diagnostics, not dropped or coerced.

## A19 — partial parser success
Most workflow interpretable, one node unsupported → PARTIAL result allowed.

## A20 — 0..N semantic scopes
Pure integration wiring may yield zero business-process candidates; one workflow need not equal one business process.

## A21 — technical side-effect candidate
Send/write/charge/update operation may support side-effect candidate but not business outcome/idempotency/compensation policy automatically.

## A22 — HTTP request ≠ business action automatically
An HTTP call may be infrastructure plumbing, data lookup or business side effect.

## A23 — AI/agent node ≠ business actor
Provider AI-agent node cannot become business role/actor automatically.

## A24 — code/script node opacity
Opaque script may contain several operations/branches; one provider node ≠ one canonical action automatically.

## A25 — webhook authentication ≠ business authorization
Technical auth configuration does not prove business approval/authority semantics.

## A26 — definition vs runtime observation
Workflow definition and execution trace must remain separate artifacts/perspectives.

## A27 — definition active flag vs deployment/runtime truth
A source export says `active=true`, but evidence does not establish when/where it was deployed, whether that state is current, or whether executions occurred. TALOS must represent definition-state evidence independently from deployment/activation observation and runtime execution.

## A28 — runtime trace as OPERATIONAL_OBSERVATION
If run history is supplied, it enters separately and may support/conflict with definition semantics.

## A29 — multiple definition revisions
Export A and Export B remain immutable historical source representations/snapshots.

## A30 — Canvas review correction
Reviewer can change accepted business meaning without rewriting imported automation source.

## A31 — adapter/provider-registry upgrade
New adapter/mapping version creates new interpretation history; old claims remain.

## A32 — no direct Temporal compilation
Existing automation never emits Temporal Workflow/Activity design directly.

---

# Pass requirements

P2-05 passes only if every fixture can be represented without:

```text
source loss
identity collapse
provider semantics laundering
implemented-behavior → business-intent laundering
configuration → runtime-observation laundering
secret leakage into canonical semantics
unsupported-node deletion
silent source repair
direct Temporal compilation
```

Any failure requires a new contract version and full A01–A32 regression.

BUILD remains closed.
