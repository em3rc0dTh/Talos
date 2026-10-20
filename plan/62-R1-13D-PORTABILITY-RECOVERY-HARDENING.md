# R1-13D — Portability & Durable Workspace Hardening

Contract baseline: `design/45-TALOS-PRODUCT-CONTRACT-v1.0.md`

## Scope

- verify and re-import Talos native Canvas exports without trusting tampered snapshots;
- preserve visual layout across Canvas export/import;
- reconstruct the latest translation workspace from durable records after restart;
- recover Canvas/BPMN/Temporal design views without rehydrating deployment or execution authority;
- keep Image / BPMN / Canvas as the three product input families; `.talos.json` import remains inside the Canvas family;
- keep feature-branch pushes free of long runtime Actions; full runtime certification remains on final PR/main.

## Authority invariants

- import creates a fresh review candidate;
- import never confirms automatically;
- workspace recovery is read-only;
- workspace recovery never restores deployment authority;
- workspace recovery never restores workflow-start authority;
- export/import portability is independent from implementation.

## Validation strategy

During development use targeted local tests (`r1-13*.test.ts`). Do not use long GitHub Actions as an iterative test loop. Run the full PR/main certification only when the R1-13 productization batch is ready for a release gate.
