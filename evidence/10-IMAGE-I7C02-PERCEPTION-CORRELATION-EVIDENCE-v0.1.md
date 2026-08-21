# TALOS — I7C-02 Perception Correlation Evidence v0.1

Status: **PASS — CLOSED**  
Date: **2026-08-20**

## Exact proven implementation head

```text
a45b35b38151facbd2338912a1c02b0a16f08378
```

## Exact CI

```text
Image vertical slice              run 255 ✅
B7-B9 Temporal reference runtime  run 269 ✅
B10 Restart safety                run 169 ✅
```

## Proven contract

The strongest configured provider path now requires a successful model response to echo the exact outbound image identity:

```text
correlation schema
sourceRepresentationId
contentSha256
coordinate width/height
coordinate basis
orientation
origin convention
```

Exact match:

```text
correlation validation
→ historical I7B-01 provider/model/schema validation
→ I7A admission
→ common source evidence
```

Missing or mismatched correlation:

```text
SAFE_STOP_PROVIDER_FAILURE
no AdapterResult
no PerceptionObservation
no SourceEvidenceGraph
no CandidateSemanticScope
```

Tests explicitly cover wrong representation ID, wrong SHA, wrong dimensions, and missing correlation.

## Compatibility

Historical I7B-01 and I7C-01 APIs remain unchanged. I7C-02 adds the stronger:

```text
runCorrelatedConfiguredImagePerceptionAdmission()
```

for later product use.

## Authority

Correlation proves request ownership only. Accepted model output remains `MODEL_INFERENCE` / `INFERRED`, with no semantic, freeze, deployment, or execution authority.
