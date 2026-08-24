# R0-02 — Private Preview Configuration + Secret Contract — Architecture v0.1

Status: BUILDING / CERTIFICATION REQUIRED  
Date: 2026-08-24

## Architectural position

R0-02 sits outside the certified I9 engine and inside the private-preview product shell.

```text
operator environment
        ↓
private-preview-config.ts
        ↓
TalosPrivatePreviewRuntimeBinding
   ├─ safe immutable descriptor
   └─ secret-held start configuration
        ↓
private-preview-runtime.ts
        ↓
private-preview-server.ts (R0-01 + request policy)
        ↓ loopback proxy
one-app-server.ts (I9 authority engine)
        ↓
Temporal / provider adapters
```

## Boundary ownership

### `private-preview-config.ts`
Owns:
- environment schema
- validation
- explicit runtime/image modes
- safe descriptor
- deterministic fingerprint
- secret materialization only through `createStartConfiguration()`

Does not own:
- process authority
- automation authority
- deployment authority
- workflow execution authority

### `private-preview-runtime.ts`
Owns:
- startup composition
- mode/adaptor coherence
- passing only validated values to R0-01/I9 startup

### `private-preview-server.ts`
Owns:
- bearer/workspace/actor access from R0-01
- Host/Origin request scope
- request/image size limits
- secret-safe health/status presentation

### `one-app-server.ts`
Remains the certified I9 authority engine and is not weakened by R0-02.

## Secret architecture

Secrets are intentionally absent from the safe data model.

```text
ENV secret value
    ↓
resolver local variable / closure
    ↓
transient runtime use

SAFE descriptor
    ✕ secret value
    ✕ secret digest
    ✕ secret-derived fingerprint
```

The public configuration fingerprint hashes only safe fields. Therefore it identifies the non-secret release configuration without creating a reusable secret verifier.

## Fail-closed invariants

1. Missing required config prevents binding creation.
2. Public bind addresses are rejected.
3. Hostname allowlist may contain only loopback identities.
4. Browser origins are exact origins, never path/prefix matches.
5. `DISABLED` image mode conflicts with any provider config.
6. `REQUIRED` image mode requires a complete provider binding.
7. `DESIGN_ONLY` conflicts with Temporal coordinates or runtime adapters.
8. `TEMPORAL_EXECUTION` requires complete coordinates and runtime adapters.
9. Request limits are enforced before I9 forwarding.
10. Access/provider secrets are absent from safe descriptors and HTTP status payloads.

## Authority invariant

```text
R0 configuration validity
    !=
I9 process confirmation
    !=
automation approval
    !=
deployment approval
    !=
workflow execution approval
```

R0-02 changes release admission, not business authority.
