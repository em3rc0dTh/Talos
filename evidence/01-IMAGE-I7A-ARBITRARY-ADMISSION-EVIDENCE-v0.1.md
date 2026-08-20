# TALOS — Image I7A Arbitrary Admission Evidence v0.1

Status: **CLOSED — VERIFIED**  
Date: **2026-08-20**

## Purpose

Prove that Talos can accept an arbitrary PNG that is not a known Quarry fixture, preserve exact source identity, invoke a provider-neutral perception boundary, and make an explicit admission decision without manufacturing semantic or execution authority.

## New boundary

I7A introduces:

```text
runImagePerceptionAdmission(...)
```

which creates an immutable:

```text
ImagePerceptionAdmissionRecord
```

with one of three decisions:

```text
ADMITTED_FOR_REVIEW
SAFE_STOP_NO_RESULT
SAFE_STOP_PROVIDER_FAILURE
```

The admission record explicitly carries:

```text
sourceRepresentationId
sourceContentSha256
sourceByteIdentityStatus
coordinateSpace
adapterAttemptId
adapterCompletionStatus
providerId
providerVersion
providerStatus
decision
reasonCodes
requiresHumanReview
semanticAuthority = NONE
automaticFreezeAuthorized = false
automaticExecutionAuthorized = false
commonEvidenceGraphRefs
diagnosticRefs
```

## Arbitrary source fixture

I7A uses a third independent PNG fixture, separate from Quarry-01 and Quarry-02:

```text
size        = 1 × 1 PNG
sha256      = 658e796317e9d94e0b7665744fd93a4e1a9e98f7c3ae9ddb91700e74015225e9
```

The gate asserts this digest is distinct from both Quarry fixture digests.

## Proof 1 — source identity is not storage identity

Uploading the same arbitrary PNG twice produces:

```text
same content SHA / same content-addressed byte path   ✅
distinct SourceIntakeSession                          ✅
distinct SourceArtifact                               ✅
distinct SourceRepresentation                         ✅
EXACT_VERIFIED byte identity                          ✅
```

Therefore Talos may deduplicate storage while preserving separate source/upload identities.

## Proof 2 — exact provider request boundary

The provider receives only the preserved source representation contract:

```text
sourceRepresentationId = exact intake representation
contentSha256           = exact preserved SHA-256
mediaType               = image/png
coordinateSpace         = exact parsed image coordinate space
```

No Quarry label, canonical node, business rule, actor, or runtime primitive is injected into the provider request.

## Proof 3 — PARTIAL evidence is review-only

A provider returning:

```text
status = PARTIAL
```

may successfully materialize common source evidence, but I7A records:

```text
admission.decision                   = ADMITTED_FOR_REVIEW
requiresHumanReview                  = true
semanticAuthority                    = NONE
automaticFreezeAuthorized            = false
automaticExecutionAuthorized         = false
ArtifactClassification.truthClass    = INFERRED
CandidateSemanticScope.truthClass    = INFERRED
```

This makes the separation explicit:

```text
ADAPTER MATERIALIZATION SUCCESS
        ≠
SEMANTIC COMPLETENESS
        ≠
EXECUTION AUTHORITY
```

## Proof 4 — NO_RESULT is a safe stop

Running the arbitrary PNG through the Quarry-02 fixture provider produces:

```text
provider status             = NO_RESULT
admission decision          = SAFE_STOP_NO_RESULT
AdapterResult               = absent
PerceptionObservation       = absent
SourceEvidenceGraph         = absent
CandidateSemanticScope      = absent
ProcessRevision             = absent
```

The arbitrary digest cannot fall through to a known fixture interpretation.

## Proof 5 — provider exception is terminal append-only evidence

A provider that throws is wrapped at the I7A admission boundary and becomes:

```text
IMAGE_PERCEPTION_PROVIDER_FAILURE
```

with:

```text
AdapterAttemptStart         persisted
AdapterDiagnostic           persisted
AdapterAttemptCompletion    persisted
admission decision          SAFE_STOP_PROVIDER_FAILURE
AdapterResult               absent
```

Two repeated failures create two independent attempts and two independent admission records with the same immutable input fingerprint. Neither attempt mutates the other.

## Negative-space proof

For arbitrary I7A intake, the gate requires zero automatic creation of:

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

I7A does not auto-confirm, auto-freeze, auto-bind, auto-map, or auto-run.

## Regression evidence

Implementation verification head:

```text
e7c8ba6e2a9220ebcf9787b63971053883d0ff14
```

GitHub Actions on that exact head:

```text
Image vertical slice              ✅ SUCCESS — run 159
B7-B9 Temporal reference runtime  ✅ SUCCESS — run 184
B10 Restart safety                ✅ SUCCESS — run 117
```

The Image vertical slice passed every gate from I0 through I6 and then:

```text
I7A arbitrary image admission     ✅ SUCCESS
```

Therefore Quarry-01 remains executable, Quarry-02 remains timing-blocked, and arbitrary admission adds no regression to the frozen runtime path.

## Closure decision

I7A is accepted.

Talos has now earned:

```text
ARBITRARY-PROCESS SOURCE INTAKE / PERCEPTION ADMISSION  ✅
```

Talos has **not** yet earned:

```text
ARBITRARY-PROCESS INTERPRETATION PROVIDER                ❌
ARBITRARY-PROCESS PRODUCTION AUTOMATION PLATFORM         ❌
```

The next gate is I7B: a real provider implementation for arbitrary-image interpretation while preserving all I7A admission and review boundaries.
