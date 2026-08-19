# TALOS — Phase 2 Input Understanding Gate v0.6

Status: **ACTIVE PHASE-2 GOVERNING GATE**  
Date: **2026-08-19**  
Supersedes: `03-PHASE-2-INPUT-UNDERSTANDING-GATE-v0.5.md`

## Governing principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

---

# Current mandatory path

```text
COMMON SOURCE INTAKE            ✅ FROZEN
CANVAS NATIVE AUTHORING         ✅ PROVEN
CANVAS REVIEW/PROJECTION        ✅ PROVEN
BPMN STRUCTURED ADAPTER         ✅ DESIGN/ARCH PROVEN
IMAGE/PERCEPTION ADAPTER        ✅ DESIGN/ARCH PROVEN
LANGUAGE/DOCUMENT ADAPTER       ✅ DESIGN/ARCH PROVEN
EXISTING AUTOMATION ADAPTER     ✅ DESIGN/ARCH PROVEN
CROSS-ADAPTER CONFORMANCE       🟢 NEXT
PHASE 2 DESIGN/ARCH GATE        ⚪ PENDING
REFERENCE BUILD                 ⛔ NOT OPEN
```

BUILD remains closed.

---

# Closed source-family proofs

```text
Canvas native authoring             20/20
Canvas review/projection            14/14
BPMN structured source              20/20
Image/perception source             28/28
Language/document source            30/30
Existing automation source          32/32
```

P2-05 froze:

```text
DEFINITION CONFIGURATION
        ≠
DEPLOYMENT / ACTIVATION OBSERVATION
        ≠
RUNTIME EXECUTION OBSERVATION
        ≠
BUSINESS INTENT
```

---

# Cross-adapter conformance objective

P2-06 must prove the common architecture is truly shared rather than six compatible-looking special cases.

All source families must converge through:

```text
SOURCE PRESERVATION
        ↓
AdapterAttempt
        ↓
SourceEvidenceGraph
        ↓
0..N CandidateSemanticScope
        ↓
SemanticClaim / Provenance
        ↓
Canonical normalization where safe
        ↓
Semantic Validation
        ↓
Canvas Review / correction where needed
```

No source family may require privileged canonical IDs, implicit truth upgrades, source mutation, hidden alternate runtime paths or direct Temporal compilation.

---

# Shared conformance themes

```text
1. Preserve source before interpretation.
2. Source identity ≠ canonical identity.
3. One source may yield 0..N semantic scopes.
4. UNKNOWN/partial/unsupported evidence survives.
5. Source-specific semantics survive without polluting the canonical core.
6. Truth class ≠ confidence ≠ evidence perspective.
7. Adapter/model upgrade creates new immutable interpretation history.
8. Human correction/confirmation creates new lineage.
9. Source conflicts preserve each evidence perspective.
10. Canvas projection does not transfer provenance ownership.
11. Adapter failure never destroys preserved source.
12. No adapter emits Temporal directly.
13. Common normalization/validation boundaries remain shared.
14. Source-family extensions remain optional specializations, not alternate Talos cores.
```

If any cross-adapter test breaks a frozen common contract, Phase 2 cannot close until that contract is versioned and every impacted source-family proof is rerun.

---

# Build gate

```text
P2-06 Cross-Adapter Conformance    pending
Phase-2 Design/Architecture        pending
BUILD                              CLOSED
```

Phase-2 closure itself does not start BUILD automatically. An explicit post-closure build-opening decision is still required.

---

# Immediate next move

```text
P2-06 — CROSS-ADAPTER CONFORMANCE
```
