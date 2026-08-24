# R0-02 — Private Preview Configuration + Secret Contract — Design v0.1

Status: BUILDING / CERTIFICATION REQUIRED  
Date: 2026-08-24

## Goal

Create one fail-closed startup contract for Talos v0.1 Private Technical Preview without changing I9 authority semantics.

## Configuration flow

```text
ENVIRONMENT
    ↓
resolveTalosPrivatePreviewRuntimeBinding(...)
    ↓
SAFE IMMUTABLE DESCRIPTOR
    +
CLOSURE-HELD SECRET MATERIAL
    ↓
createStartConfiguration()
    ↓
startTalosPrivatePreviewFromEnv(...)
    ↓
R0-01 access shell
    ↓
certified I9 engine
```

## Safe descriptor

The descriptor may expose only non-secret release facts:

- config schema/version
- workspace id
- actor id
- loopback bind host
- exact hostname/origin policy
- request limits
- image mode
- image provider safe descriptor
- runtime mode
- Temporal target when applicable
- deterministic configuration fingerprint
- boolean/source metadata proving an access secret was configured

It must not contain bearer secret values.

## Secret boundary

```text
TALOS_PRIVATE_PREVIEW_BEARER_TOKEN
        ↓ closure-held
request authorization only

TALOS_IMAGE_PERCEPTION_BEARER_TOKEN
        ↓ closure-held by existing provider resolver
transient provider transport only
```

Neither value participates in the public descriptor or its fingerprint.

## Runtime modes

### DESIGN_ONLY

Permitted:
- BPMN/image intake behavior supported by configured image mode
- process confirmation
- automation design/review

Forbidden at startup contract:
- Temporal target coordinates
- deployment attempt executor
- workflow execution executor

### TEMPORAL_EXECUTION

Required:
- Temporal `host:port`
- exact namespace
- exact Task Queue
- deployment attempt executor
- workflow execution executor

Having coordinates alone never creates execution authority; all I9 approval gates remain required.

## Image modes

### DISABLED
Any image-provider environment variables are a configuration conflict.

### REQUIRED
The existing credential-safe image-perception resolver must return `CONFIGURED`; partial provider configuration fails startup.

## Request boundary

The R0-01 shell is extended with:
- exact Host scope
- exact optional Origin scope
- maximum JSON bytes
- maximum decoded image bytes

The boundary rejects requests before forwarding to the I9 engine.

## Non-goals

- public auth/OIDC
- multi-user workspace membership
- multi-tenant isolation
- remote secret manager implementation
- secret rotation
- production ingress/TLS
- automatic Temporal deployment/execution authority
