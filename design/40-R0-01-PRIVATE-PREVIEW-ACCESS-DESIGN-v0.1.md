# R0-01 — Private Preview Access Design v0.1

Status: **ACTIVE / IMPLEMENTED FOR TEST**  
Date: **2026-08-24**

## Design intent

Preserve the certified I9 engine unchanged and place a private-preview access shell in front of it.

```text
PRIVATE PREVIEW CLIENT
        ↓
Bearer token
Exact workspace header
Exact actor header
        ↓
R0-01 ACCESS SHELL
        ↓
Actor-claim anti-impersonation check
        ↓
Actor binding for known authority commands
        ↓
LOOPBACK-ONLY I9 ONE-APP ENGINE
        ↓
Existing Talos authority chain
```

## Access contract

Protected requests require:

```text
Authorization: Bearer <configured secret>
x-talos-workspace-id: <configured workspace>
x-talos-actor-id: <configured actor>
```

The bearer token is compared by fixed-size SHA-256 digests with `timingSafeEqual` and is never forwarded to the I9 engine or returned by status endpoints.

## Actor binding

The gateway rejects explicit control-plane actor fields that disagree with the authenticated actor. It then binds the configured actor into known I9 command fields such as:

- `initiatedBy`
- `confirmedBy`
- `approvedBy`
- `decidedBy`
- `realizedBy`

Nested capability selections and runtime-policy decisions are also bound to the configured actor.

Business payloads under `facts` and `capabilityInputs` are treated as opaque business data and are not scanned for control-plane actor names.

## Health and status

`GET /health` is intentionally unauthenticated and exposes only coarse readiness metadata.

`GET /api/status` is protected and augments the existing I9 status with:

- `R0-01_PRIVATE_PREVIEW_ACCESS_BOUNDARY`
- single-workspace-process isolation mode
- single-configured-actor mode
- explicit statement that bearer token material is not exposed
- I9-07 as the underlying engine authority stage

## Non-authority rule

The access shell does not create or infer:

- business-process confirmation;
- automation-design approval;
- capability binding;
- runtime policy;
- deployment approval;
- workflow execution approval.

Those remain explicit I8/I9 domain actions after access has already been granted.
