# TALOS — Image I4 Canonical + Validation Result v0.1

Status: **PASS — I4 CLOSED**  
Date: **2026-08-19**

## Scope

I4 proves that already-preserved/perceived image evidence can enter the frozen Canonical + Provenance + Validation spine without Canvas-native assumptions and without epistemic truth inflation.

Reference fixture:

```text
brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png
```

Verified source SHA-256 remains:

```text
219584f07852ac7a473018272e935f02c819b1c2fb4aedebd2fff4cd63aa8da9
```

## Implemented seam

```text
Image bytes
→ ImagePerceptionAdapter
→ SourceEvidenceGraph / CandidateSemanticScope
→ normalizeCommonAdapterResult(... IMAGE_PERCEPTION profile ...)
→ ProcessRevision
→ ProvenanceLink / SemanticClaim
→ ValidationAssessment
→ browser/API review output
```

The common normalizer does not import Canvas and does not require:

```text
TalosCanvasNativeSource
nativeValue
canvasRevision.semanticDigest
containerMemberships
nativeSourceId
```

## Epistemic result

Image normalization profile:

```text
sourceFamily = IMAGE_PERCEPTION
extractionMethod = VISUAL_PERCEPTION
interpretationMethod = PERCEPTION_COMMON_EVIDENCE_NORMALIZATION
interpreterVersion = image-common-normalizer-reference-v0.1
defaultTruthClass = INFERRED
perspective = BUSINESS_INTENT
```

Executable assertions prove:

```text
all image ProcessNode.truthClass       INFERRED
all image ProcessEdge.truthClass       INFERRED
all image SemanticClaim.truthClass     INFERRED
all image ProvenanceLink.truthClass    INFERRED
all image extractionMethod             VISUAL_PERCEPTION
CONFIRMED image claims                 0
SOURCE_TRUTH image semantic claims     0
fabricated raster nativeSourceId       0
```

Confidence or deterministic fixture behavior never upgrades image perception into source truth.

## Quarry-02 Canonical candidate

Current I4 common evidence materializes:

```text
Process nodes       8
Actors              5
Data objects         4
Process edges        8
```

Mapped edge families:

```text
SEQUENCE             5
CONDITIONAL          2
MESSAGE              1
```

No Yes/No BusinessRule is invented because structured branch guards have not yet been materialized into common image evidence.

## Validation result

The frozen semantic validator runs against the image-derived ProcessRevision.

Expected result:

```text
semanticVerdict      INCOMPLETE
executionReadiness   INSUFFICIENT_DETAIL
```

Material findings include:

```text
SV-CMP-001   explicit completion/end unproven
SV-SUB-002   subprocess boundary meaning unresolved
SV-CFL-001   inferred conditional branch rule unresolved (2 branches)
SV-SRC-001   material inferred business meaning requires confirmation
```

These findings are a success condition for I4: TALOS exposes what the image/common evidence does not establish instead of repairing it from fixture expectations.

## Browser/API gate

`POST /api/images` for the exact Quarry-02 fixture now returns:

```text
stage = CANONICAL_VALIDATION_READY_FOR_REVIEW
canonical.created = true
canonical.gate = I4_CLOSED
canonical.truthDiscipline = INFERRED_FROM_VISUAL_PERCEPTION
validation.semanticVerdict = INCOMPLETE
validation.executionReadiness = INSUFFICIENT_DETAIL
executionHandoff.gate = I5_CLOSED
temporal.gate = I6_CLOSED
```

Unknown PNG digests remain:

```text
PRESERVED_SOURCE_ONLY
providerStatus = NO_RESULT
canonical.created = false
validation = null
```

No arbitrary-image interpretation claim is made.

## Anti-shortcut assertions

After I4 image processing:

```text
SemanticFreezeRecord      0
CapabilityDesignRevision  0
CapabilityBindingRevision 0
ExecutionPlanRevision     0
TemporalMappingRevision   0
RuntimePolicyRevision     0
DeploymentRevision        0
image-started Workflow    0
```

## CI regression

Final Image Vertical Slice run:

```text
architecture guard                         PASS
B2 source-intake regression               PASS — 25/25
B3 canonical/validation regression        PASS — 27/27
I0 exact image intake                     PASS
I1 perception boundary                    PASS
I2 common source evidence                 PASS
I3 browser/source review                  PASS
I4 canonical + validation                 PASS
```

Final image workflow run:

```text
32330124064
```

Existing runtime regressions on the same change:

```text
B7–B9 Temporal runtime / app / E2E         PASS
B10 restart Node 22.16                     PASS
B10 restart Node 24.11                     PASS
```

## Verdict

```text
IMAGE → CANONICAL                          PROVEN
IMAGE → PROVENANCE                         PROVEN
IMAGE → FROZEN VALIDATION                  PROVEN
IMAGE INFERENCE → SOURCE_TRUTH             FORBIDDEN / NOT OBSERVED
IMAGE → SEMANTIC FREEZE                    NOT AUTHORIZED
IMAGE → EXECUTION                          NOT AUTHORIZED
IMAGE → TEMPORAL                           NOT AUTHORIZED
```

**I4 is CLOSED.**

The next lawful gate is image semantic review/confirmation and semantic-completion work. I5 execution handoff must remain closed until the image-derived validation blockers are explicitly resolved or accepted under the frozen review/freeze contracts.
