# TALOS — I7C-01 Real Vision Runtime Configuration Contract v0.1

Status: **DESIGN BASELINE — IMPLEMENTATION OPEN**  
Date: **2026-08-20**

## Why this slice exists

I7B-01 already proves a vendor-neutral HTTP transport that sends exact preserved PNG bytes to a model-provider boundary and validates the untrusted Talos perception response.

What Talos does not yet have is a production-shaped way to configure that transport without leaking credentials into:

```text
source records
provider result records
adapter identities
configuration fingerprints
logs / UI status
evidence documents
```

I7C-01 closes that runtime configuration boundary. It does **not** claim arbitrary-image perception quality or a live vendor call by itself.

## Contract

Runtime configuration is split into two classes:

```text
SAFE DESCRIPTOR
  endpoint
  providerId
  providerVersion
  modelRef
  modelVersion
  pipelineVersion
  timeoutMs
  authConfigured
  configurationFingerprint

SECRET MATERIAL
  bearer token
```

The safe descriptor may be logged, returned by runtime status, hashed, compared, and persisted as evidence.

The secret material may only be injected into the outbound HTTP request header at transport creation time.

```text
ENV / SECRET STORE
      ↓
credential-safe runtime binding
      ├── safe descriptor ─────────→ logs/status/evidence allowed
      │
      └── closure-held secret
              ↓
        transient HTTP headers
              ↓
        provider request only
```

## Required environment variables

A configured external provider uses:

```text
TALOS_IMAGE_PERCEPTION_PROVIDER_URL
TALOS_IMAGE_PERCEPTION_PROVIDER_ID
TALOS_IMAGE_PERCEPTION_PROVIDER_VERSION
TALOS_IMAGE_PERCEPTION_MODEL_REF
TALOS_IMAGE_PERCEPTION_MODEL_VERSION
TALOS_IMAGE_PERCEPTION_PIPELINE_VERSION
```

Optional:

```text
TALOS_IMAGE_PERCEPTION_TIMEOUT_MS
TALOS_IMAGE_PERCEPTION_BEARER_TOKEN
```

No provider URL means the real provider is **DISABLED**, not silently substituted with a Quarry fixture provider.

If the URL is present but required identity fields are incomplete, configuration is invalid and startup/config resolution must fail closed.

## Endpoint rules

The configured endpoint must:

```text
use http:// or https://
contain no username/password authority credentials
contain no URL fragment
contain no query string
```

Credentials belong in the secret header path, never inside URLs that may be logged or fingerprinted.

## Secret non-propagation invariant

The bearer token must never be present in:

```text
JSON.stringify(runtime binding)
JSON.stringify(safe descriptor)
configurationFingerprint
provider/model/pipeline identifiers
Talos source or review records
ImagePerceptionProviderResult
ImagePerceptionAdmissionRecord
```

The only intended propagation is:

```text
Authorization: Bearer <secret>
```

on the actual provider HTTP call.

## Relationship to I7B-01

I7C-01 reuses:

```text
runAsyncHttpImagePerceptionAdmission(...)
validateUntrustedImagePerceptionProviderResult(...)
```

and does not weaken any I7B-01 guarantees:

```text
exact source bytes                         preserved
request/source SHA correlation             preserved
MODEL_PROVIDER requirement                 preserved
MODEL_INFERENCE requirement                preserved
provider/model/version/pipeline pinning     preserved
malformed response safe-stop               preserved
HTTP/timeout failure safe-stop              preserved
semanticAuthority = NONE                   preserved
automaticFreezeAuthorized = false          preserved
automaticExecutionAuthorized = false       preserved
```

## I7C-01 acceptance

```text
1. absent endpoint means DISABLED, never fixture fallback                  required
2. partial configured identity fails closed                                required
3. unsafe endpoint credentials/query/fragment are rejected                 required
4. public descriptor contains no bearer token                              required
5. configuration fingerprint contains only safe descriptor fields          required
6. bearer token is injected into a real HTTP request                       required
7. transported PNG bytes remain exact and SHA-pinned                       required
8. token is absent from append-only Talos records                          required
9. structurally valid MODEL_PROVIDER response still has no authority       required
10. all I7A–I7B-08, Temporal, and restart regressions remain green         required
```

## Explicit non-claims

I7C-01 does not yet prove:

```text
OpenAI / Anthropic / Gemini vendor adapter             ❌
real external model quality                            ❌
previously unseen process image successfully parsed   ❌
image → canonical normalization                        ❌
image → BPMN candidate                                 ❌
```

Those move through I7C-02 onward.
