# TALOS — Image I7B-01 Async Provider Transport Evidence v0.1

Status: **CLOSED — VERIFIED**  
Date: **2026-08-20**

## Purpose

Prove that Talos can send an arbitrary preserved process image across a real asynchronous provider transport boundary, validate the untrusted model response before materialization, and then reuse the frozen I7A admission contract without granting the model semantic or execution authority.

## Verified boundary

```text
EXACT PNG SOURCE
  ↓
LocalImageByteStore.readPng(sha256)
  ↓
integrity re-verification
  ↓
AsyncImagePerceptionTransportEnvelope
  ↓
HTTP POST
  ↓
UNTRUSTED PROVIDER RESPONSE
  ↓
validateUntrustedImagePerceptionProviderResult(...)
  ↓
I7A admission
  ↓
INFERRED REVIEW EVIDENCE OR SAFE STOP
```

## Transport envelope

The outbound provider request contains only:

```text
schemaVersion
sourceRepresentationId
contentSha256
mediaType
coordinateSpace
imageBase64
```

It does not contain accepted Canonical nodes, confirmed claims, capability bindings, Temporal primitives, deployment choices, or execution authority.

The provider therefore sees the exact source image and source identity needed for perception, not downstream Talos truth.

## Source integrity proof

Before transport:

```text
intake.storage.sha256
  ==
intake.representation.contentHash
```

and `LocalImageByteStore.readPng(...)` re-hashes the stored bytes before returning them.

The HTTP test decodes the transmitted `imageBase64` and proves:

```text
transported bytes == original arbitrary PNG bytes
sha256(transported bytes) == SourceRepresentation.contentHash
```

## Provider provenance contract

A valid I7B-01 response must exactly match the configured:

```text
providerId
providerVersion
modelRef
modelVersion
pipelineVersion
```

and must declare:

```text
providerClass = MODEL_PROVIDER
evidenceMode  = MODEL_INFERENCE
```

A provider cannot claim fixture authority or source truth through this boundary.

## Untrusted response validation

The validator rejects malformed or incoherent provider output before Talos creates perception/common-evidence records.

Validated constraints include:

```text
allowed status / enum values
confidence range 0..1
unique provider keys
observation → anchor references
observation parent references
occurrence → anchor references
occurrence → observation references
literal-label observation references
alternative-set references
preferred alternative references
relation stroke references
relation anchor references
relation endpoint occurrence references
relation endpoint anchor references
relation role-alternative references
relation guard-text references
```

For:

```text
status = NO_RESULT
```

all perception evidence arrays must be empty. Hidden evidence inside `NO_RESULT` is rejected.

## Valid async transport proof

The I7B-01 gate starts a real local Node HTTP server and performs a real asynchronous POST through the transport adapter.

The server returns a structurally valid:

```text
MODEL_PROVIDER
MODEL_INFERENCE
PARTIAL
```

response.

Talos records:

```text
admission.decision                   = ADMITTED_FOR_REVIEW
requiresHumanReview                  = true
semanticAuthority                    = NONE
automaticFreezeAuthorized            = false
automaticExecutionAuthorized         = false
ArtifactClassification.truthClass    = INFERRED
CandidateSemanticScope.truthClass    = INFERRED
```

Therefore:

```text
REAL MODEL TRANSPORT
        ≠
SEMANTIC CONFIRMATION
        ≠
EXECUTION AUTHORITY
```

## Malformed provider response proof

The gate returns a response whose observation references a nonexistent anchor.

The validator rejects it with:

```text
INVALID_IMAGE_PERCEPTION_PROVIDER_RESPONSE
```

and I7A records:

```text
SAFE_STOP_PROVIDER_FAILURE
```

with zero:

```text
PerceptionObservation
SourceEvidenceGraph
CandidateSemanticScope
AdapterResult
ProcessRevision
```

No partial untrusted response leaks into semantic evidence.

## HTTP failure proof

A real local provider server returns HTTP 500.

The transport converts this into:

```text
IMAGE_PERCEPTION_PROVIDER_HTTP_500
```

which is then persisted as terminal I7A provider-failure evidence.

Repeated failures create independent append-only attempts/admission records with the same immutable input fingerprint. No result is fabricated.

## Clean NO_RESULT proof

A structurally valid `MODEL_PROVIDER / MODEL_INFERENCE / NO_RESULT` response with empty evidence arrays becomes:

```text
SAFE_STOP_NO_RESULT
```

with no SourceEvidenceGraph or CandidateSemanticScope.

## Timeout / transport behavior

The transport uses an `AbortController` with a configured timeout. Network errors, response parsing failures, timeout/abort failures, source-storage identity mismatch, and structural validation failures all flow into the same frozen terminal provider-failure admission path rather than bypassing Talos attempt evidence.

## Negative-space proof

I7B-01 grants zero automatic creation authority for:

```text
ProcessRevision
SemanticFreezeRecord
CapabilityDesignRevision
CapabilityBindingRevision
ExecutionPlanRevision
TemporalMappingRevision
RuntimePolicyRevision
DeploymentRevision
WorkflowExecutionObservation
```

## Regression evidence

Verified PR head before closure documentation:

```text
c8bf02eb2c0144b63414a92d0fcb94aa5d5de193
```

GitHub Actions:

```text
Image vertical slice              ✅ SUCCESS — run 163
B7-B9 Temporal reference runtime  ✅ SUCCESS — run 189
B10 Restart safety                ✅ SUCCESS — run 120
```

The Image lane passed:

```text
I0 → I6                         ✅
I7A arbitrary admission        ✅
I7B-01 async transport         ✅
```

Quarry-01 remains executable through the generic Temporal runtime. Quarry-02 remains safely blocked from timer materialization while its accepted WAIT lacks complete executable timing truth.

## Closure decision

I7B-01 is accepted.

Talos has now earned a production-shaped provider transport + validation boundary, but it still needs a concrete configured vision-model gateway implementation before arbitrary images can be interpreted outside test servers.
