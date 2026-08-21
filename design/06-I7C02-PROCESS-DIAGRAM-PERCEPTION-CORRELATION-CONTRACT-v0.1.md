# TALOS — I7C-02 Process-Diagram Perception Correlation Contract v0.1

Status: **IMPLEMENTED — VERIFICATION ACTIVE**  
Date: **2026-08-20**

## Purpose

A model response can be structurally correct and still belong to the wrong image, an earlier retry, or a stale provider request. Talos must reject such a response before it can become common source evidence.

I7C-02 therefore adds an exact response-correlation gate on top of the historical I7B-01 untrusted-response validator.

## Required provider echo

Every successful response on the correlated real-provider route must contain:

```json
{
  "requestCorrelation": {
    "schemaVersion": "talos-image-perception-correlation-v0.1",
    "sourceRepresentationId": "...",
    "contentSha256": "...",
    "coordinateSpace": {
      "width": 0,
      "height": 0,
      "basis": "...",
      "orientation": "...",
      "originConvention": "..."
    }
  }
}
```

The values must equal the exact outbound Talos request envelope.

## Order of trust checks

```text
PRESERVED PNG
   ↓
I7C-01 credential-safe configured transport
   ↓
provider HTTP response
   ↓
I7C-02 request-correlation validation
   ↓ only exact match
I7B-01 provider/model/schema/referential validation
   ↓ only valid
I7A admission + common source evidence
```

A correlation mismatch never reaches common evidence materialization.

## Compatibility rule

The historical functions remain unchanged:

```text
runAsyncHttpImagePerceptionAdmission()       I7B-01
runConfiguredImagePerceptionAdmission()      I7C-01
```

I7C-02 adds:

```text
runCorrelatedConfiguredImagePerceptionAdmission()
```

Later product image ingestion must use the strongest current route. Historical tests retain the exact behavior they originally proved.

## Failure contract

Any of these:

```text
missing requestCorrelation
wrong correlation schema
wrong sourceRepresentationId
wrong contentSha256
wrong width/height
wrong coordinate basis
wrong orientation
wrong origin convention
```

must become the existing append-only provider-failure path:

```text
SAFE_STOP_PROVIDER_FAILURE
no AdapterResult
no PerceptionObservation
no SourceEvidenceGraph
no CandidateSemanticScope
no canonical process
no confirmation/freeze/execution authority
```

## Authority invariant

Exact correlation proves only:

> “This model response belongs to this exact image request.”

It does not prove that the response is semantically correct.

Therefore:

```text
request correlation success ≠ source truth
request correlation success ≠ confirmation
request correlation success ≠ automation readiness
request correlation success ≠ execution authority
```
