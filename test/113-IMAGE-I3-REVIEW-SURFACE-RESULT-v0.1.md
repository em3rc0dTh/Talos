# TALOS — Image I3 Review Surface Result v0.1

Status: **PASS — I3 CLOSED**  
Date: **2026-08-19**

## Purpose

Prove the first human-facing image source path without collapsing image perception into Canonical or Temporal execution.

```text
browser PNG upload
  ↓
exact source-byte preservation
  ↓
ImagePerceptionAdapter
  ↓
perception evidence
  ↓
common SourceEvidenceGraph / CandidateSemanticScope
  ↓
read-only browser review surface
```

The image path still stops before `ProcessRevision`.

## Browser/API behavior proved

The reference app now exposes:

```text
POST /api/images
GET  /api/image-bytes/<sha256>.png
```

For the exact Quarry-02 fixture:

```text
HTTP status                          201
stage                                COMMON_EVIDENCE_READY_FOR_REVIEW
byte identity                        EXACT_VERIFIED
width × height                       791 × 451
provider                             REFERENCE_QUARRY_PERCEPTION
provider class                       FIXTURE_PROVIDER
provider status                      SUCCEEDED
perception observations              30
provider occurrence candidates       18
relation candidates                  8
classification                       COLLABORATION_DIAGRAM / INFERRED
candidate scope                      COLLABORATION / INFERRED
common occurrences                   18
common relationships                 8
Canonical created                    false
Canonical gate                       I4_CLOSED
image → Temporal started             false
Temporal gate                        I6_CLOSED
```

The served image endpoint returned byte-identical PNG bytes to the upload.

## Unsupported image behavior

A different valid PNG digest is still preserved exactly, but the fixture provider returns:

```text
stage                    PRESERVED_SOURCE_ONLY
provider status          NO_RESULT
perception observations  0
common evidence          null
Canonical created        false
image → Temporal         false
```

No process meaning is fabricated.

Invalid non-PNG bytes declared as `image/png` return an intake error before source records are manufactured.

## User-interface truth discipline

The browser explicitly identifies the current provider as:

```text
REFERENCE_QUARRY_PERCEPTION / FIXTURE_PROVIDER
```

and displays the active gates:

```text
I0 bytes                  CLOSED
I1 perception             CLOSED
I2 common evidence        CLOSED
I3 browser review         CLOSED
I4 Canonical              CLOSED / NOT YET OPEN
I6 image → Temporal       CLOSED / NOT YET OPEN
```

The current whole-image evidence overlay is deliberately coarse because the source record does not contain pixel-region annotations. No fabricated boxes are presented as perception evidence.

## Regression integrity

Same branch/head:

```text
Image vertical slice I0–I3       PASS
frozen B2 source-intake regression PASS
B7–B9 Temporal runtime           PASS
B10 restart/replay Node 22       PASS
B10 restart/replay Node 24       PASS
architecture guard               PASS — 17 modules
```

## Verdict

```text
I0 EXACT IMAGE INTAKE             ✅ CLOSED
I1 PERCEPTION BOUNDARY            ✅ CLOSED
I2 COMMON SOURCE EVIDENCE         ✅ CLOSED
I3 IMAGE REVIEW SURFACE           ✅ CLOSED
I4 IMAGE CANONICAL/VALIDATION      ⛔ CLOSED — OPENING REVIEW REQUIRED
I5 EXECUTION HANDOFF               ⛔ CLOSED
I6 GENERIC IMAGE → TEMPORAL        ⛔ CLOSED
```

**Image Vertical Slice v0.1 has reached its authorized I0–I3 boundary without weakening the existing Temporal reference spine.**
