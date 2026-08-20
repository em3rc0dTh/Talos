# B8 Tryable Reference App CI Result

Status: **FAIL**

```text
workspace lock sync         success
npm ci                      success
Temporal lock gate          success
architecture guard          failure
B8 app smoke test           success
```

The smoke test boots the full native Canvas → validation → Manager correction → semantic freeze → capability → execution design pipeline, launches a real local Temporal server and Worker, starts HTTP/browser app state, then executes APPROVED and REJECTED requests through Workflow Updates.

## ARCH failure tail
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
    "review forbidden external import bpmn-moddle"
  ]
}
```
