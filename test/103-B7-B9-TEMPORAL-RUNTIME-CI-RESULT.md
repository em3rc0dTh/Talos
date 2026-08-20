# B7/B9 Temporal Runtime CI Result

Status: **FAIL**

```text
npm ci                     success
Temporal lock gate         success
architecture guard         success
real SDK Activity tests    failure
local Temporal E2E         failure
```

## SDK failure tail
```text

> @talos/reference-vertical-slice@0.0.0-reference b7:sdk:test
> node --experimental-strip-types --test ./tests/b7-temporal-sdk.test.ts

TAP version 13
# node:internal/modules/package_json_reader:256
#   throw new ERR_MODULE_NOT_FOUND(packageName, fileURLToPath(base), null);
#         ^
# Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@temporalio/common' imported from /home/runner/work/Talos/Talos/build/reference-vertical-slice/tests/b7-temporal-sdk.test.ts
#     at Object.getPackageJSONURL (node:internal/modules/package_json_reader:256:9)
#     at packageResolve (node:internal/modules/esm/resolve:768:81)
#     at moduleResolve (node:internal/modules/esm/resolve:854:18)
#     at defaultResolve (node:internal/modules/esm/resolve:984:11)
#     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:780:12)
#     at \#cachedDefaultResolve (node:internal/modules/esm/loader:704:25)
#     at ModuleLoader.resolve (node:internal/modules/esm/loader:687:38)
#     at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:305:38)
#     at ModuleJob._link (node:internal/modules/esm/module_job:137:49) {
#   code: 'ERR_MODULE_NOT_FOUND'
# }
# Node.js v22.16.0
# Subtest: tests/b7-temporal-sdk.test.ts
not ok 1 - tests/b7-temporal-sdk.test.ts
  ---
  duration_ms: 136.047204
  type: 'test'
  location: '/home/runner/work/Talos/Talos/build/reference-vertical-slice/tests/b7-temporal-sdk.test.ts:1:1'
  failureType: 'testCodeFailure'
  exitCode: 1
  signal: ~
  error: 'test failed'
  code: 'ERR_TEST_FAILURE'
  ...
1..1
# tests 1
# suites 0
# pass 0
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 145.221306
```

## E2E failure tail
```text

> @talos/reference-vertical-slice@0.0.0-reference b9:test
> node --experimental-strip-types --test ./tests/b9-temporal-e2e.test.ts

TAP version 13
# node:internal/modules/package_json_reader:256
#   throw new ERR_MODULE_NOT_FOUND(packageName, fileURLToPath(base), null);
#         ^
# Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@temporalio/testing' imported from /home/runner/work/Talos/Talos/build/reference-vertical-slice/tests/b9-temporal-e2e.test.ts
#     at Object.getPackageJSONURL (node:internal/modules/package_json_reader:256:9)
#     at packageResolve (node:internal/modules/esm/resolve:768:81)
#     at moduleResolve (node:internal/modules/esm/resolve:854:18)
#     at defaultResolve (node:internal/modules/esm/resolve:984:11)
#     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:780:12)
#     at \#cachedDefaultResolve (node:internal/modules/esm/loader:704:25)
#     at ModuleLoader.resolve (node:internal/modules/esm/loader:687:38)
#     at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:305:38)
#     at ModuleJob._link (node:internal/modules/esm/module_job:137:49) {
#   code: 'ERR_MODULE_NOT_FOUND'
# }
# Node.js v22.16.0
# Subtest: tests/b9-temporal-e2e.test.ts
not ok 1 - tests/b9-temporal-e2e.test.ts
  ---
  duration_ms: 217.514925
  type: 'test'
  location: '/home/runner/work/Talos/Talos/build/reference-vertical-slice/tests/b9-temporal-e2e.test.ts:1:1'
  failureType: 'testCodeFailure'
  exitCode: 1
  signal: ~
  error: 'test failed'
  code: 'ERR_TEST_FAILURE'
  ...
1..1
# tests 1
# suites 0
# pass 0
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 229.023171
```
