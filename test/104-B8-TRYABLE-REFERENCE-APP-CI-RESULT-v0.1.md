# B8 Tryable Reference App CI Result

Status: **FAIL**

```text
npm ci                     success
Temporal lock gate         success
architecture guard         failure
B8 app smoke test          success
```

The smoke test boots the real Talos reference pipeline, local Temporal server/Worker and HTTP app, then executes APPROVED and REJECTED requests through Workflow Updates.

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
