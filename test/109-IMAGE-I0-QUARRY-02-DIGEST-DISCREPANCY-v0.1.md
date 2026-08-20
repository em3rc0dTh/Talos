# TALOS — Image I0 Quarry-02 Digest Discrepancy v0.1

Status: **SOURCE METADATA DISCREPANCY — PRESERVED / NOT SILENTLY REWRITTEN**  
Date: **2026-08-19**

## Discovery

The first executable Image I0 gate read the actual committed binary:

```text
brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png
```

and compared its SHA-256 with the historical source record:

```text
brainstorming/mining-site/quarry-02-water-order-delivery/source-02.md
```

The source record declares:

```text
6b57667aeee62a7fe47d79a4533787f5922d59e5f52dedede2751e910df755ee
```

The exact committed PNG bytes verify as:

```text
219584f07852ac7a473018272e935f02c819b1c2fb4aedebd2fff4cd63aa8da9
```

The file length remains:

```text
31,989 bytes
```

and the PNG IHDR dimensions are:

```text
791 × 451
```

## TALOS treatment

The historical source record is not rewritten.

I0 distinguishes:

```text
DECLARED SOURCE METADATA
        ≠
VERIFIED BYTE IDENTITY
```

For a newly uploaded representation:

```text
SourceOrigin.declaredDescription
may preserve the historical declaration/context

SourceRepresentation.contentHash
= SHA-256 computed from the actual uploaded bytes

SourceRepresentation.byteIdentityStatus
= EXACT_VERIFIED only for the computed byte identity
```

This discrepancy does not alter business/process semantics. It is source-provenance evidence discovered during implementation.

## Verdict

```text
SOURCE RECORD PRESERVED             PASS
ACTUAL BYTES VERIFIED               PASS
DECLARED HASH NOT SILENTLY TRUSTED  PASS
OLD RECORD NOT MUTATED              PASS
```
