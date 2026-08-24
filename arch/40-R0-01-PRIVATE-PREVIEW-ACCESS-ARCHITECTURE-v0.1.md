# R0-01 — Private Preview Access Architecture v0.1

Status: **ACTIVE / IMPLEMENTED FOR TEST**  
Date: **2026-08-24**

## Boundary

R0-01 introduces a release-layer boundary around the already-certified I9 one-app engine.

```text
external client
  │
  │ bearer + workspace + actor
  ▼
private-preview-server.ts
  │
  │ sanitized JSON only
  ▼
127.0.0.1:<ephemeral>
one-app-server.ts
  │
  ▼
Talos canonical / review / capability / execution / Temporal / deployment layers
```

The inner I9 server remains bound to loopback and is not the externally advertised private-preview endpoint.

## Trust boundaries

### Untrusted

- HTTP caller
- caller-supplied bearer material
- caller-supplied workspace header
- caller-supplied actor header
- caller-supplied JSON authority actor fields

### Configured private-preview trust

- one bearer token
- one workspace identifier
- one actor identifier

### Existing trusted I9 boundary

Once R0-01 access succeeds, all existing I8/I9 domain authority gates still apply unchanged.

## Security properties proven by R0-01

- missing/incorrect bearer is denied before proxying;
- wrong workspace is denied before proxying;
- wrong actor is denied before proxying;
- control-plane actor impersonation in JSON is denied before proxying;
- private bearer is never forwarded to the inner engine;
- private bearer is never returned in health/status payloads;
- inner engine remains loopback-only;
- business `facts` / `capabilityInputs` remain opaque to actor-field scanning.

## Honest limitations

`SINGLE_WORKSPACE_PROCESS` is process isolation, not a claim of row-level multi-tenant data isolation.

`SINGLE_CONFIGURED_ACTOR` is a private-preview operator binding, not a general identity/role system.

A successful R0-01 gate therefore means:

```text
SAFE ENOUGH TO BEGIN A CONTROLLED PRIVATE TECHNICAL PREVIEW
```

not:

```text
PUBLIC / MULTI-TENANT / PRODUCTION READY
```
