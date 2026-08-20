# TALOS — Image I0 Exact PNG Intake Result v0.1

Status: **PASS — I0 CLOSED**  
Date: **2026-08-19**

## Gate

```text
I0 — exact PNG intake / immutable source-byte preservation
```

Question:

> Can TALOS receive a real PNG, preserve the exact bytes before interpretation, verify byte identity and coordinate space, keep source identity separate from storage deduplication, and reject invalid bytes without manufacturing source history?

Answer:

```text
YES
```

## Real fixture

```text
brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png
```

Verified from actual committed bytes:

```text
byte length   31,989
width         791
height        451
SHA-256       219584f07852ac7a473018272e935f02c819b1c2fb4aedebd2fff4cd63aa8da9
```

Historical `source-02.md` declares a different SHA-256:

```text
6b57667aeee62a7fe47d79a4533787f5922d59e5f52dedede2751e910df755ee
```

That discrepancy is preserved separately in:

```text
test/109-IMAGE-I0-QUARRY-02-DIGEST-DISCREPANCY-v0.1.md
```

No old source record was rewritten.

## Implemented boundary

```text
PNG bytes
  ↓ signature / IHDR validation
SHA-256
  ↓
content-addressed immutable byte store
  ↓
SourceIntakeSession
SourceOrigin
SourceCapture
SourceArtifact
SourceRepresentation(EXACT_VERIFIED)
SourceAvailabilityRecord
ImageByteStorageRecord
ImageCoordinateSpace
```

Reference byte path:

```text
.runtime/source-bytes/sha256/<verified-digest>.png
```

## Executable assertions

```text
1. Quarry-02 binary identity + dimensions                  PASS
2. exact-byte round trip + durable source provenance       PASS
3. byte dedup does not collapse upload/source identities   PASS
4. invalid non-PNG creates no source records                PASS
```

Result:

```text
4 / 4 PASS
```

## Important laws proven in code

```text
DECLARED SOURCE METADATA ≠ VERIFIED BYTE IDENTITY
same bytes               ≠ same SourceOrigin automatically
same bytes               ≠ same SourceCapture automatically
same bytes               ≠ same SourceRepresentation automatically
storage deduplication     ≠ semantic/source identity collapse
raw bytes                 ≠ perceived structure
```

## Regression integrity

On the same branch/head after the I0 correction:

```text
Image vertical slice gate          PASS
B7–B9 Temporal runtime gate        PASS
B10 restart/replay gate            PASS
architecture boundary              PASS — 17 modules
```

No Temporal SDK import exists in `packages/image-perception`.

## Verdict

```text
I0 PNG INTAKE                      CLOSED
I1A PROVIDER-NEUTRAL PERCEPTION    NEXT
```
