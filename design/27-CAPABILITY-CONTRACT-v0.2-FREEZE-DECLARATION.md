# TALOS — Capability Contract v0.2 Freeze Declaration

Status: **FROZEN — T4-01**
Date: **2026-08-19**

## Exact tested design

```text
path: design/26-CAPABILITY-CONTRACT-v0.2.md
creation commit: cd06dcaa9f700abcae14415b0a50f4aaf4e5026d
blob: ff2ee808b946230517b1539e3973d947accdc811
```

## Exact tested architecture

```text
path: arch/14-CAPABILITY-MODEL-ARCHITECTURE-v0.2.md
creation commit: 21dc95ae2f190a9ee8ac8f9b033a2d4323973abf
blob: f267defb832e6a29f04715415732e845c11b75e3
```

## Regression evidence

```text
test/53-CAPABILITY-CONTRACT-PRESSURE-TEST-SPEC-v0.1.md
test/54-CAPABILITY-CONTRACT-PRESSURE-TEST-RESULT-v0.1.md
test/55-CAPABILITY-CONTRACT-REGRESSION-RESULT-v0.1.md
K01-K32: 32 PASS / 0 FAIL
```

## Frozen boundary

```text
Requirement != Offering != Match != Binding != Temporal mapping
```

Property-level `CapabilityRequirementFacet` is authoritative for material design basis/state. Existing implementation evidence does not become a required provider automatically. Matching never creates an accepted binding. Temporal execution primitives remain outside capability offering identity.

Future semantic changes require a new contract version and new regression evidence. The exact tested files above remain unchanged.

BUILD remains closed.
