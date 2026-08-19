# TALOS — Cross-Adapter Conformance v0.1 Freeze Declaration

Status: **FROZEN — P2-06**  
Date: **2026-08-19**

## Frozen conformance contract

```text
path:
design/18-CROSS-ADAPTER-CONFORMANCE-CONTRACT-v0.1.md

blob:
f699402d37f623f79dbc44d6ec621ac51e85ba1c
```

## Conformance evidence

```text
test/37-CROSS-ADAPTER-CONFORMANCE-SPEC-v0.1.md
test/38-CROSS-ADAPTER-CONFORMANCE-RESULT-v0.1.md

CAX01–CAX24
24 PASS / 0 FAIL
```

## Frozen Phase-2 conformance law

Every supported/proven source-family architecture must preserve:

```text
one source-intake boundary
source identity separate from canonical identity
0..N semantic scopes
local uncertainty/partial evidence
property-scoped claims/provenance
truth/confidence/perspective separation
immutable adapter/interpreter history
immutable human authority history
provenance-safe Canvas review
multi-source conflict preservation
one Canonical / Provenance / Validation core
no direct Temporal compilation
```

No source family receives privileged semantics merely because its source is structured, visual, textual, executable or TALOS-native.

---

# Change policy

Any future semantic change to the cross-adapter laws requires:

```text
new conformance version
+ preserved v0.1
+ updated/expanded fixtures
+ rerun of every impacted source-family suite
+ rerun cross-adapter conformance
+ explicit freeze decision
```

BUILD remains closed.
