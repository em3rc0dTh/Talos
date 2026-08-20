# TALOS — Image Vertical Slice Build Authorization v0.1

Status: **BOUNDED GO — I0 / I1A / I1B / I2 / I3 ONLY**  
Date: **2026-08-19**

Governing plan:

```text
plan/11-IMAGE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.1.md
```

## Authorization

The following bounded implementation work is authorized inside the existing reference workspace:

```text
build/reference-vertical-slice/packages/image-perception/
build/reference-vertical-slice/apps/reference-api/     image intake/review additions only
build/reference-vertical-slice/apps/reference-web/     image review additions only when used
build/reference-vertical-slice/fixtures/image/
build/reference-vertical-slice/tests/image-*.test.ts
build/reference-vertical-slice/scripts/                image-specific verification only
build/reference-vertical-slice/architecture/            boundary update only
build/reference-vertical-slice/contracts/               implementation pin metadata only
```

The existing source-intake/application/persistence packages may receive the minimum additive interfaces or orchestration required to connect image evidence through already-frozen common boundaries.

## Authorized stages

```text
I0   exact PNG intake / source-byte preservation
I1A  provider-neutral perception contract
I1B  REFERENCE_QUARRY_PERCEPTION test fixture provider
I2   common semantic-candidate handoff
I3   image evidence/review browser surface
```

## Closed stages

The following remain closed until explicit gate evidence opens them:

```text
I4 image-derived canonical/validation support claim
I5 image-derived execution handoff support claim
I6 arbitrary image → generic Temporal execution
```

Existing Canvas/reference Temporal behavior must remain regression-green.

## Hard boundaries

```text
image-perception → foundation/source-intake only
image-perception → NO Temporal SDK
image-perception → NO capability/execution/runtime/deployment imports
raw image bytes → NO semantic truth promotion
fixture provider → TEST_ONLY and digest-pinned
unknown image → preserved source, no fabricated perception result
```

## Gate rule

If implementation exposes a frozen image-contract defect:

```text
STOP affected image stage
→ preserve failing evidence
→ version affected design/architecture
→ rerun P2-03 regression
→ re-freeze
→ resume only after compatibility is restored
```

This authorization does not close or waive B10 broader runtime hardening.
