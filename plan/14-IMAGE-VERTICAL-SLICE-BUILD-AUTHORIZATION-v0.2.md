# TALOS — Image Vertical Slice Build Authorization v0.2

Status: **BOUNDED GO — I4 CANONICAL / VALIDATION ONLY**  
Date: **2026-08-19**  
Supersedes for active image BUILD authorization: `plan/12-IMAGE-VERTICAL-SLICE-BUILD-AUTHORIZATION-v0.1.md`. Historical authorization remains preserved.

Governing opening review:

```text
plan/13-IMAGE-I4-CANONICAL-VALIDATION-OPENING-REVIEW-v0.1.md
```

## Already closed

```text
I0 exact PNG intake / source-byte preservation      ✅
I1 provider-neutral + fixture perception            ✅
I2 common source evidence                           ✅
I3 browser evidence/review surface                  ✅
```

## Newly authorized

```text
I4 source-agnostic common normalization
I4 image-derived ProcessRevision
I4 image-derived provenance / semantic claims
I4 ValidationAssessment
I4 read-only API/browser presentation of canonical + findings
I4 regression / gate evidence
```

Minimum additive changes are authorized in:

```text
build/reference-vertical-slice/packages/application/
build/reference-vertical-slice/packages/semantic-core/        only if common implementation interface is required
build/reference-vertical-slice/packages/image-perception/      image profile/orchestration only
build/reference-vertical-slice/apps/reference-api/             I4 read-only output only
build/reference-vertical-slice/tests/image-*.test.ts
build/reference-vertical-slice/architecture/                   boundary verification only
build/reference-vertical-slice/package.json                    test scripts only
.github/workflows/image-vslice.yml                              I4 gate step only
```

## Hard constraints

```text
Canvas SOURCE_TRUTH behavior must remain regression-green.
Image perception candidates remain INFERRED unless separate human confirmation exists.
confidence = 1.0 does not promote image inference to SOURCE_TRUTH.
Raster normalization must not require nativeSourceId.
Raster normalization must not require Canvas nativeValue/containerMemberships.
I4 may surface semantic incompleteness; it may not repair it silently.
I4 creates no SemanticFreezeRecord for image acceptance automatically.
I4 creates no CapabilityBindingRevision.
I4 creates no ExecutionPlan.
I4 creates no TemporalMappingRevision.
I4 starts no Workflow.
```

## Still closed

```text
I5 image semantic freeze + execution handoff          ⛔
I6 generic image → real Temporal execution            ⛔
real arbitrary-image multimodal provider              ⛔
production OCR / vision provider                      ⛔
BPMN / language / n8n expansion                       ⛔
```

## Gate rule

If I4 exposes a frozen Canonical/Provenance/Validation contract defect:

```text
STOP I4
→ preserve failing evidence
→ version affected design/architecture
→ rerun required frozen regressions
→ re-freeze
→ resume only after compatibility is restored
```

This authorization does not close broader B10 hardening.
