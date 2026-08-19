# TALOS — P2-04 Language / Document Adapter Gate Closure v0.1

Status: **GATE CLOSED — DESIGN / ARCHITECTURE**  
Date: **2026-08-19**

## Gate

```text
P2-04 — LANGUAGE / DOCUMENT ADAPTER
```

Gate question:

> Can TALOS receive process knowledge expressed in prose/documents where graph structure, actors, conditions, order, scope and completion may be implicit or distributed across text spans, while preserving exact textual evidence and preventing language-model interpretation from becoming source truth automatically?

Answer:

```text
YES — for the frozen v0.2 design/architecture and L01–L30 evidence set.
```

---

# Evidence chain

```text
Common Source Intake v0.2
Canvas Authoring v0.2
Canvas Review / Projection v0.2
BPMN Structured Adapter v0.1
Image / Perception Adapter v0.2
        ↓
Language / Document Adapter v0.1
        ↓
L01–L30 pressure test
        ↓
29 PASS / 1 FAIL
        ↓
L28 historical language-resolution defect
        ↓
Language / Document Adapter v0.2
        ↓
full L01–L30 regression
        ↓
30 PASS / 0 FAIL
        ↓
exact design/architecture blobs frozen
```

---

# Frozen artifacts

```text
design/14-LANGUAGE-DOCUMENT-ADAPTER-CONTRACT-v0.2.md
arch/07-LANGUAGE-DOCUMENT-ADAPTER-ARCHITECTURE-v0.2.md
design/15-LANGUAGE-DOCUMENT-ADAPTER-v0.2-FREEZE-DECLARATION.md

test/29-LANGUAGE-DOCUMENT-ADAPTER-PRESSURE-TEST-SPEC-v0.1.md
test/30-LANGUAGE-DOCUMENT-ADAPTER-PRESSURE-TEST-RESULT-v0.1.md
test/31-LANGUAGE-DOCUMENT-ADAPTER-REGRESSION-RESULT-v0.1.md
```

---

# Final fixture result

```text
L01 PASS  source document vs extracted text
L02 PASS  exact text-span addressability
L03 PASS  one paragraph → multiple claims
L04 PASS  one claim → multiple spans
L05 PASS  document order ≠ runtime order
L06 PASS  explicit temporal marker
L07 PASS  normal path vs urgent exception
L08 PASS  pronoun/coreference ambiguity
L09 PASS  unresolved role alias
L10 PASS  MUST modality
L11 PASS  SHOULD modality
L12 PASS  MAY modality
L13 PASS  negation/prohibition
L14 PASS  exception scope
L15 PASS  example vs requirement
L16 PASS  definition vs action
L17 PASS  ordered-list ambiguity
L18 PASS  explicitly ordered procedure list
L19 PASS  table decision semantics
L20 PASS  RACI responsibility vs flow
L21 PASS  local cross-reference
L22 PASS  unresolved external reference
L23 PASS  missing process boundary
L24 PASS  multiple processes in one manual
L25 PASS  policy-only / zero process candidate
L26 PASS  embedded diagram / adapter delegation
L27 PASS  partial extraction
L28 PASS  human resolution is separate immutable history
L29 PASS  newer interpreter version remains historical
L30 PASS  Canvas review/correction lineage
```

---

# What P2-04 proves

The common intake architecture now survives a source family where process structure is **distributed linguistically rather than encoded as a graph**.

TALOS can preserve:

```text
DOCUMENT / RAW EXPRESSION
      ↓
TEXT / STRUCTURAL EVIDENCE
      ↓
LINGUISTIC OBSERVATIONS
      ↓
ALTERNATIVE INTERPRETATIONS
      ↓
SEMANTIC CLAIMS / 0..N SCOPES
      ↓
CANONICAL MEANING WHERE SAFE
      ↓
VALIDATION / REVIEW
```

without collapsing document structure into workflow structure.

---

# Important architectural laws

```text
TEXT SPAN
      ≠
SEMANTIC CLAIM AUTOMATICALLY
      ≠
PROCESS NODE AUTOMATICALLY
      ≠
CONTROL FLOW AUTOMATICALLY
```

and:

```text
DOCUMENT ORDER
      ≠
PROCESS EXECUTION ORDER AUTOMATICALLY
```

and:

```text
MODEL PREFERENCE
      ≠
HUMAN / AUTHORITY CONFIRMATION
```

---

# What P2-04 does not prove

```text
PDF/DOCX parser code
LLM/provider implementation
text extraction accuracy
production document support
security/redaction implementation
Temporal execution
```

No BUILD/support claim is made.

---

# Phase-2 status

```text
COMMON SOURCE INTAKE            ✅ FROZEN
CANVAS NATIVE AUTHORING         ✅ PROVEN
CANVAS REVIEW / PROJECTION      ✅ PROVEN
BPMN STRUCTURED ADAPTER         ✅ DESIGN/ARCH PROVEN
IMAGE / PERCEPTION ADAPTER      ✅ DESIGN/ARCH PROVEN
LANGUAGE / DOCUMENT ADAPTER     ✅ DESIGN/ARCH PROVEN
EXISTING AUTOMATION ADAPTER     🟢 NEXT
CROSS-ADAPTER CONFORMANCE       ⚪ PENDING

PHASE 2 INPUT ARCHITECTURE      🟡 OPEN
BUILD                           ⛔ CLOSED
```

---

# Next gate

```text
P2-05 — EXISTING AUTOMATION ADAPTER
```

Next question:

> Can TALOS ingest an existing executable automation such as n8n as evidence of implemented behavior, preserve provider/runtime-specific structure without mistaking it for business intent, and normalize only the business semantics that are supportable through the same common intake/provenance/validation boundary?
