# TALOS — Image I4 Canonical / Validation Opening Review v0.1

Status: **BOUNDED GO — PREREQUISITE NORMALIZATION REFACTOR REQUIRED**  
Date: **2026-08-19**

## Question

Can the already-closed image path:

```text
PNG bytes
→ ImagePerceptionAdapter
→ SourceEvidenceGraph
→ CandidateSemanticScope
```

enter the frozen Canonical + Validation spine without importing Canvas semantics or upgrading perception inference into source truth?

## Evidence reviewed

```text
plan/11-IMAGE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.1.md
plan/12-IMAGE-VERTICAL-SLICE-BUILD-AUTHORIZATION-v0.1.md
test/110-IMAGE-I0-EXACT-PNG-INTAKE-RESULT-v0.1.md
test/111-IMAGE-I1-PERCEPTION-BOUNDARY-RESULT-v0.1.md
test/112-IMAGE-I2-COMMON-EVIDENCE-RESULT-v0.1.md
test/113-IMAGE-I3-REVIEW-SURFACE-RESULT-v0.1.md
build/reference-vertical-slice/packages/application/src/normalization.ts
build/reference-vertical-slice/packages/image-perception/src/perception-adapter.ts
build/reference-vertical-slice/packages/image-perception/src/reference-quarry-provider.ts
```

## Finding I4-OPEN-01 — common evidence seam exists

I2 already produces common source-intake structures:

```text
SourceOccurrenceDescriptor
SourceRelationshipDescriptor
SourceEvidenceGraph
CandidateSemanticScope
ArtifactClassification
```

Raster occurrences correctly omit `nativeSourceId` and candidate types/roles remain perception-derived.

**Result: PASS.** No image-private canonical model is required.

## Finding I4-OPEN-02 — current normalizer is still Canvas-shaped

The current `normalizeAdapterResult()` implementation requires:

```text
SourceRepresentation<TalosCanvasNativeSource>.nativeValue
native.canvasRevision.semanticDigest
native.containerMemberships
```

and stamps provenance/claims with:

```text
extractionMethod = TALOS_CANVAS_NATIVE_STRUCTURED
truthClass = SOURCE_TRUTH
interpreterVersion = canvas-normalizer-reference-v0.1
```

That behavior is correct for native Canvas but unsafe for raster perception.

If image I2 evidence were passed into the current normalizer unchanged, it would either fail because there is no Canvas native model or corrupt epistemic truth by promoting inferred image candidates to `SOURCE_TRUTH`.

**Result: BLOCKING IMPLEMENTATION DEFECT FOR I4, not a frozen-contract defect.**

## Finding I4-OPEN-03 — Quarry-02 semantic evidence is intentionally incomplete

The I1B fixture provider currently gives image/common evidence for:

```text
participants / lane labels
activities
decision
wait candidate
subprocess candidate
data-object labels
8 principal relation candidates
```

but does not yet materialize every visible source fact as canonical-ready common evidence, including full lane/responsibility attachment and explicit start/end occurrences.

I4 must not invent those facts merely because `source-02.md` records them. The canonical/validation result may therefore remain incomplete and must expose gaps through Validation.

**Result: ACCEPTABLE FOR I4.** I4 is a semantic-normalization/validation gate, not automation-readiness closure.

## Required implementation seam

Create a source-agnostic common normalizer whose input truth profile is explicit.

Conceptually:

```text
AdapterResult
+ CandidateSemanticScope
+ SourceEvidenceGraph
+ NormalizationSourceProfile
        ↓
COMMON NORMALIZATION CORE
        ↓
ProcessRevision / Provenance / SemanticClaims
```

Required profile fields/behavior:

```text
sourceFamily
representation semantic digest / stable input digest
extractionMethod
interpreterVersion
default truthClass
candidate confidence handling
source-family extension hook (optional)
```

Canvas profile must preserve current behavior:

```text
sourceFamily = CANVAS_NATIVE
truthClass = SOURCE_TRUTH
extractionMethod = TALOS_CANVAS_NATIVE_STRUCTURED
```

Image profile must use:

```text
sourceFamily = IMAGE_PERCEPTION
truthClass = INFERRED
extractionMethod = VISUAL_PERCEPTION
```

No perception-generated semantic property becomes `SOURCE_TRUTH` merely because confidence is 1.0 or because the deterministic fixture provider is used.

## I4 acceptance

I4 may close only if executable evidence proves:

```text
1. existing Canvas B3 normalization/validation regression stays green
2. image I0–I3 regressions stay green
3. image AdapterResult normalizes without Canvas nativeValue
4. raster occurrences do not require nativeSourceId
5. image candidate node kind claims are INFERRED
6. image candidate relationship-role claims are INFERRED
7. image ProcessNode / ProcessEdge truth classes are INFERRED
8. image provenance extractionMethod records VISUAL_PERCEPTION
9. no human confirmation is manufactured
10. Validation runs against the image-derived ProcessRevision
11. unsupported/missing image semantics remain findings/unknown rather than repaired
12. no capability/execution/Temporal artifact is created by I4
```

## Authorization verdict

```text
I0 exact image intake                 ✅ CLOSED
I1 perception boundary               ✅ CLOSED
I2 common source evidence             ✅ CLOSED
I3 browser review                     ✅ CLOSED
I4 canonical + validation             🟢 OPEN — BOUNDED
I5 execution handoff                  ⛔ CLOSED
I6 generic image → Temporal           ⛔ CLOSED
```

**I4 BUILD may proceed only through the source-agnostic normalization + validation boundary described above.**
