# R0-02 — Private Preview Configuration + Secret Contract — Brainstorm v0.1

Status: BUILDING / CERTIFICATION REQUIRED  
Date: 2026-08-24

## Problem

I9 proves Talos can execute a real Temporal workflow under explicit authority. R0-01 proves only the configured private-preview actor/workspace may reach that engine.

Neither fact proves that a preview process started with coherent runtime configuration.

A private preview must fail closed when configuration is incomplete, contradictory, unsafe, or accidentally claims more runtime capability than is actually available.

## Release law

```text
CONFIGURATION PRESENT
    !=
CONFIGURATION VALID
    !=
RUNTIME CAPABILITY AVAILABLE
    !=
EXECUTION AUTHORIZED
```

Secrets are not configuration evidence. Their values must not appear in public descriptors, health/status payloads, configuration fingerprints, persisted documents, or diagnostics.

## Required explicit choices

### Access
- one exact workspace id
- one exact actor id
- one private-preview bearer secret
- loopback-only bind host
- exact allowed hostnames
- exact browser origins or NONE

### Request limits
- maximum JSON request bytes
- maximum decoded image bytes
- JSON limit must be able to carry the configured base64 image limit

### Image input
- `DISABLED`: provider variables are forbidden
- `REQUIRED`: complete credential-safe provider configuration is required

### Runtime
- `DESIGN_ONLY`: Temporal coordinates and runtime adapters are forbidden
- `TEMPORAL_EXECUTION`: exact Temporal address, namespace and Task Queue are required, and deployment/workflow adapters must exist

## Threats to pressure-test

```text
missing access secret
weak access secret
public bind host
host-header scope bypass
origin scope bypass
oversized JSON
oversized decoded image
partial provider config
provider secret leakage
Temporal coordinates in DESIGN_ONLY
TEMPORAL_EXECUTION with partial coordinates
TEMPORAL_EXECUTION without executors
DESIGN_ONLY with executors
configuration fingerprint containing secret material
```

## Deliberate preview constraints

R0-02 does not create public SaaS IAM, tenant multiplexing, secret rotation infrastructure, browser login, or production credential storage.

The private preview remains:

```text
one process
one workspace
one configured actor
loopback-local server
explicit environment configuration
```

Those constraints are product truth, not hidden limitations.
