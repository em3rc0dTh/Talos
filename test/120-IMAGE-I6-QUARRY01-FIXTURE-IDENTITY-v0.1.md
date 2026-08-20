# IMAGE I6 — Quarry-01 Repository Fixture Identity v0.1

Status: **VERIFIED DISCREPANCY / HISTORICAL RECORD PRESERVED**  
Date: **2026-08-20**

## Purpose

Record the exact byte identity used by the I6 Quarry-01 runtime conformance fixture without rewriting the earlier Quarry-01 source documentation.

## Historical source record

`brainstorming/mining-site/quarry-01-order-process/source-01.md` records the originally received user image as:

```text
SHA-256    100741f25704d1f311ab1d9f0d51b6aa65255ae2258387d9dd5a853471d20779
Dimensions 2048 x 971
```

That historical claim remains preserved as provenance and is not silently replaced.

## Exact repository PNG used by I6

Talos exact PNG intake on the repository fixture
`brainstorming/mining-site/quarry-01-order-process/imagen_2026-08-18_204857678.png`
measured:

```text
SHA-256    8ede24c9f1162ed83c10d8c62063d8d19813c993965378acf1a2e36113218bd9
Dimensions 3102 x 1472
```

Evidence source: GitHub Actions Image I6 intake diagnostic on 2026-08-20. The value is produced by the same `intakePngUpload` byte store used by the image vertical slice.

## Decision

The I6 `ReferenceQuarry01PerceptionProvider` is pinned to the **exact repository fixture bytes**, because those are the bytes executed by CI. Its diagnostic explicitly states that this is TEST_ONLY deterministic conformance evidence and not arbitrary-image vision.

The historical source record is not modified. Therefore:

```text
HISTORICAL RECEIVED SOURCE IDENTITY
        !=
CURRENT REPOSITORY TEST FIXTURE IDENTITY
```

and Talos keeps both facts separate rather than manufacturing equivalence.

## Safety consequence

A byte mismatch returns `NO_RESULT`. I6 can only run when the exact verified repository PNG is supplied; a visually similar or differently encoded image cannot silently reuse the fixture perception result.
