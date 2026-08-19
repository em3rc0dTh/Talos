# TALOS — Cross-Adapter Conformance Contract v0.1

Status: **P2-06 CONFORMANCE TARGET**  
Date: **2026-08-19**

## Purpose

Define the shared behavioral laws that every Phase-2 source adapter must obey so TALOS remains one source-agnostic semantic system rather than a collection of source-specific pipelines.

Conformance targets:

```text
Canvas Native Source v0.2
Canvas Review / Projection v0.2
BPMN Structured Adapter v0.1
Image / Perception Adapter v0.2
Language / Document Adapter v0.2
Existing Automation Adapter v0.2
```

Shared foundation:

```text
Canonical Process Model v0.1
Provenance v0.3
Semantic Validation v0.2
Process Source Intake v0.2
```

---

# 1. One intake law

Every source family must converge through:

```text
SOURCE ORIGIN / REPRESENTATION
        ↓
PRESERVE
        ↓
AdapterAttempt
        ↓
SOURCE-FAMILY EVIDENCE
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

No adapter owns an alternate canonical/runtime core.

---

# 2. Shared identity law

```text
SOURCE IDENTITY ≠ CANONICAL IDENTITY
```

This applies to:

```text
Canvas element IDs
BPMN IDs
image-perceived occurrence IDs
text-derived occurrence IDs
automation provider IDs
```

Cross-source equivalence is established only through explicit normalization/evidence, never ID reuse.

---

# 3. Shared source-preservation law

```text
INTERPRETATION FAILURE ≠ SOURCE LOSS
```

Source preservation occurs before adapter success.

Failed/partial adaptation retains:

```text
origin
capture
representation
attempt
available diagnostics/evidence
```

---

# 4. Shared uncertainty law

All adapters must preserve uncertainty locally rather than collapsing it into artifact-wide success/failure.

Examples:

```text
Canvas       dangling endpoint
BPMN         unresolved reference
Image        ambiguous edge/text/type
Language     unresolved pronoun/order/modality
Automation   unsupported node/business meaning uncertainty
```

`UNKNOWN`, partial, source-only and unsupported evidence remain valid evidence states.

---

# 5. 0..N scope law

```text
ONE SOURCE ARTIFACT ≠ ONE PROCESS
```

All adapters support 0..N candidate semantic scopes.

A source may legitimately produce:

```text
zero process scopes
+ useful architecture/policy/integration/source evidence
```

---

# 6. Truth / confidence / perspective law

```text
TRUTH CLASS ≠ CONFIDENCE ≠ EVIDENCE PERSPECTIVE
```

Source-family certainty never changes these axes implicitly.

Examples:

```text
parsed BPMN type            SOURCE_TRUTH about source notation
perceived image shape       INFERRED
exact document wording      SOURCE_TRUTH for preserved text representation
n8n/provider behavior       IMPLEMENTED_BEHAVIOR perspective
runtime trace               OPERATIONAL_OBSERVATION perspective
human-confirmed policy      BUSINESS_INTENT where evidence supports it
```

---

# 7. Source-specific semantics law

Adapters may define source-family extension structures, but they must remain traceable through common source/provenance boundaries.

Examples:

```text
BPMN boundary event attachment
Image perception alternatives
Language modality/coreference
Automation deployment observation
```

No source-specific semantic forces a hidden parallel canonical model.

---

# 8. Interpretation history law

```text
NEW ADAPTER / MODEL / REGISTRY VERSION
      ≠
MUTATION OF OLD INTERPRETATION
```

Every re-parse/re-perception/re-interpretation creates new immutable attempts/results/claims.

---

# 9. Human authority history law

Human confirmation/correction creates new immutable authority/evidence records.

It never mutates:

```text
original source
old perception alternatives
old language alternatives
old adapter results
old ProcessRevision
old ValidationAssessment
```

---

# 10. Canvas projection law

```text
DISPLAY OF IMPORTED MEANING ≠ PROVENANCE OWNERSHIP TRANSFER
```

Canvas may display any source family, including source-only/uncertain evidence.

Review edits create TALOS-native review evidence and later ProcessRevision lineage.

---

# 11. Multi-source merge law

Sources with different evidence perspectives may describe the same business process.

Example:

```text
BPMN                   design/documentation evidence
SOP                     BUSINESS_INTENT candidate
Image of whiteboard     inferred source evidence
Existing automation     IMPLEMENTED_BEHAVIOR
Runtime trace           OPERATIONAL_OBSERVATION
Canvas correction       reviewer-confirmed/new intent evidence
```

No perspective wins automatically due to structure, executability, recency or confidence.

Conflicts remain explicit until authority-backed resolution.

---

# 12. Presentation/authoring separation law

Across all visual/structured/editor sources:

```text
layout / DI / cursor / sticky note / position / viewport
      ≠
process semantics automatically
```

Presentation evidence may be preserved without canonicalization.

---

# 13. Runtime/execution separation law

```text
SOURCE EXPRESSION ≠ TALOS EXECUTION DESIGN
```

Even explicitly executable sources such as existing automation or executable BPMN do not bypass:

```text
Canonical
Provenance
Semantic Validation
later Capability/Execution design
```

---

# 14. Mixed-content delegation law

A source may embed another evidence family.

Examples:

```text
document contains diagram
screenshot contains text
BPMN contains extension metadata/code
Canvas imports external source evidence
```

Delegation creates traceable representation/evidence lineage.

It never flattens the embedded source silently or steals its provenance.

---

# 15. Relationship semantics law

No adapter may assume generic arrows/edges/connections share one meaning.

Examples:

```text
BPMN sequence flow
BPMN message flow
image connector candidate
functional input/control/output/mechanism
language BEFORE/EXCEPTION relation
automation technical connection
Canvas structured relation
```

Relationship role is source/context aware and property-scoped.

---

# 16. Completion law

```text
LAST / FINAL / NO OUTGOING DETECTED ≠ BUSINESS COMPLETION AUTOMATICALLY
```

Applies across diagrams, images, language and automations.

Semantic Validation remains the shared completion/readiness authority.

---

# 17. Side-effect / recovery law

Source evidence that an operation sends/writes/charges/deploys does not establish business recovery policy automatically.

Technical retry/error configuration remains separate from business compensation/cancellation policy.

---

# 18. Security/data boundary law

Sensitive implementation/source values are not copied into canonical semantics merely because an adapter can read them.

Credential/secret examples are the automation regression case; the same principle applies to sensitive document/image/source evidence.

---

# 19. Common validation law

Every process/candidate scope requiring acceptance or automation readiness uses the same Semantic Validation v0.2 boundary.

Adapters do not carry private readiness verdicts that bypass `ValidationAssessment` / `ReadinessDecision`.

---

# 20. Conformance pass condition

P2-06 passes only if all source-family contracts can satisfy CAX01–CAX24 without modifying a frozen contract.

If a common defect appears:

```text
version affected contract
preserve frozen predecessor
rerun impacted source-family suites
rerun cross-adapter conformance
```

BUILD remains closed during P2-06.
