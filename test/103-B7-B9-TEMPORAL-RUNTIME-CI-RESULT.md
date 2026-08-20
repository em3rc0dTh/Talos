# B7/B9 Temporal Runtime CI Result

Status: **FAIL**

```text
npm ci                     success
Temporal lock gate         success
architecture guard         failure
real SDK Activity tests    success
local Temporal E2E         success
```

## Architecture failure tail
```text

> @talos/reference-vertical-slice@0.0.0-reference architecture:verify
> node ./scripts/verify-architecture.mjs

{
  "status": "FAIL",
  "checks": {
    "pinnedArtifacts": 25,
    "moduleBoundaries": 17,
    "contractHashVerification": "SKIPPED_BY_ENV"
  },
  "errors": [
    "application forbidden relative cross-module import persistence-sqlite from packages/application/src/quarry01-generic-demo.ts"
  ]
}
```
