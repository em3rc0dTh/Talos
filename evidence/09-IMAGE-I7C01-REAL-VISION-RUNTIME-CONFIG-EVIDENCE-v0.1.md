# TALOS — I7C-01 Real Vision Runtime Configuration Evidence v0.1

Status: **PASS — I7C-01 CLOSED ON EXACT IMPLEMENTATION HEAD**  
Date: **2026-08-20**

## Exact proven implementation head

```text
e7aa5cdb8ebf7b4ab52fc8056321fb7871763d41
```

## Exact CI

```text
Image vertical slice              run 249 ✅
B7-B9 Temporal reference runtime  run 262 ✅
B10 Restart safety                run 164 ✅
```

Image run 249 passed the full chain through the newly appended I7C-01 gate after every prior image/BPMN/confirmation/freeze gate.

# What I7C-01 proves

## Credential-safe runtime binding

Talos now resolves a real image-perception HTTP provider from runtime environment without exposing the bearer credential through the public configuration descriptor.

Public identity:

```text
endpoint
providerId
providerVersion
modelRef
modelVersion
pipelineVersion
timeoutMs
authMode
authConfigured
configurationFingerprint
```

Secret material:

```text
TALOS_IMAGE_PERCEPTION_BEARER_TOKEN
```

remains closure-held and is injected only into:

```text
Authorization: Bearer <secret>
```

for the outbound provider request.

## No hidden fixture fallback

```text
no TALOS_IMAGE_PERCEPTION_PROVIDER_URL
→ DISABLED / ENDPOINT_NOT_CONFIGURED
```

Talos does not substitute a Quarry fixture provider when real runtime configuration is absent.

## Unsafe configuration fails closed

I7C-01 rejects:

```text
partial provider identity
non-http(s) endpoints
credentials embedded in URL authority
query parameters on provider URL
URL fragments
blank configured bearer token
invalid timeout
```

## Exact image transport is preserved

The I7C-01 gate reuses the hardened I7B-01 HTTP transport and proves:

```text
sourceRepresentationId pinned
SHA-256 pinned
coordinate space pinned
exact preserved PNG bytes transmitted
provider/model/pipeline response identity validated
```

## Secret non-propagation is tested

The gate asserts the bearer token is absent from:

```text
public descriptor
serialized runtime binding
configuration fingerprint
provider request JSON body
append-only perception/evidence documents
```

while still proving the exact secret reaches the local HTTP provider Authorization header.

## Secret rotation is not public identity

A final pressure test rotates only the bearer token and proves:

```text
safe descriptor A == safe descriptor B
configurationFingerprint A == configurationFingerprint B
```

while the transient HTTP headers use their respective tokens.

Therefore secret rotation cannot silently create a different public provider/model/pipeline identity.

## Authority remains zero

A structurally valid configured model response still remains:

```text
providerClass                  MODEL_PROVIDER
evidenceMode                   MODEL_INFERENCE
truthClass                     INFERRED
semanticAuthority              NONE
automaticFreezeAuthorized      false
automaticExecutionAuthorized   false
```

I7C-01 creates no canonical process, semantic freeze, capability design, ExecutionPlan, Temporal mapping, deployment revision, or execution authority.

# Non-claims

I7C-01 does not prove:

```text
specific external vendor integration       ❌
live external model call                    ❌
arbitrary process-image interpretation      ❌
image evidence → canonical process          ❌
image → BPMN review candidate               ❌
```

Those belong to the subsequent I7C slices.

# Closure verdict

```text
real provider runtime configuration boundary     ✅ CLOSED
secret-safe HTTP authorization                   ✅ PROVEN
exact image bytes/SHA through configured path    ✅ PROVEN
fixture fallback when unconfigured               ❌ FORBIDDEN
model output authority escalation                ❌ FORBIDDEN
```
