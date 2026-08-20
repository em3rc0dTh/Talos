# TALOS — Image Vertical Slice Implementation Plan v0.1

Status: **ACTIVE BOUNDED IMPLEMENTATION PLAN — IMAGE SOURCE FAMILY**  
Date: **2026-08-19**

## Purpose

Extend the already-running TALOS reference vertical slice with the first implemented non-Canvas source family:

```text
IMAGE BYTES
  ↓ preserve exact source
VISUAL PERCEPTION EVIDENCE
  ↓
COMMON SOURCE EVIDENCE
  ↓
CANONICAL / VALIDATION / REVIEW
  ↓
existing TALOS execution spine
```

This plan does **not** authorize the shortcut:

```text
image → model guess → Temporal
```

and does not reopen the frozen Phase-2 Image / Perception Adapter semantics.

---

# 1. Governing frozen evidence

Implementation must conform to the P2-03 frozen evidence chain:

```text
design/13-IMAGE-PERCEPTION-ADAPTER-v0.2-FREEZE-DECLARATION.md
arch/06-IMAGE-PERCEPTION-ADAPTER-ARCHITECTURE-v0.2.md
test/28-P2-03-IMAGE-PERCEPTION-ADAPTER-GATE-CLOSURE-v0.1.md
```

The freeze declaration identifies the original v0.2 design blob as:

```text
16147de77eb340de2bc157170986867be4199822
```

and the frozen architecture blob as:

```text
b3c6de6c32867b1190b3f5771fee1517da6f9689
```

The original v0.2 design commit is:

```text
417a07dac4e13a3739c78ce0b71286847a86d0fa
```

The current repository path `design/12-IMAGE-PERCEPTION-ADAPTER-CONTRACT-v0.2.md` has later same-path edits and therefore must not be silently treated as byte-identical to the frozen blob. Implementation decisions are governed by the frozen declaration, original v0.2 commit, frozen architecture and P2-03 28/28 closure.

---

# 2. Immutable laws

```text
PIXELS / CAPTURED BYTES      ≠ PERCEIVED STRUCTURE
PERCEIVED STRUCTURE           ≠ INTERPRETED SEMANTICS
INTERPRETED SEMANTICS         ≠ CONFIRMED BUSINESS TRUTH
MODEL PREFERENCE              ≠ HUMAN CONFIRMATION
VISIBLE ARROW                 ≠ SEQUENCE FLOW AUTOMATICALLY
NEW PERCEPTION ATTEMPT        ≠ MUTATION OF OLD PERCEPTION
PERCEPTION ALTERNATIVE SET    = IMMUTABLE ATTEMPT OUTPUT
HUMAN RESOLUTION              ≠ PERCEPTION RECORD MUTATION
```

No image-family package may import Temporal SDK, capability, execution, runtime-policy or deployment packages.

---

# 3. Reference fixture

The first implementation fixture is the existing Mining Site source:

```text
brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png
```

Source notes:

```text
brainstorming/mining-site/quarry-02-water-order-delivery/source-02.md
```

Pinned source facts from the source record:

```text
image dimensions = 791 × 451
SHA-256 = 6b57667aeee62a7fe47d79a4533787f5922d59e5f52dedede2751e910df755ee
```

The source record is the fixture oracle. Tests must not add process meaning not supported by that record.

---

# 4. I0 — Image intake / exact-byte preservation

Scope for v0.1:

```text
PNG only
```

I0 must implement:

```text
raw upload bytes
→ MIME/signature validation
→ SHA-256
→ PNG IHDR width/height parsing
→ content-addressed immutable byte store
→ SourceOrigin
→ SourceCapture
→ SourceArtifact
→ SourceRepresentation
→ ImageCoordinateSpace
```

Reference byte store:

```text
.runtime/source-bytes/sha256/<digest>.png
```

Rules:

```text
same bytes → same digest/path
existing same digest + same bytes → reuse
existing same digest + different bytes → hard failure
raw bytes are source evidence, not canonical semantics
semantic SQLite does not replace source-byte identity
```

No OCR or perception is required for I0 acceptance.

---

# 5. I1A — Provider-neutral perception boundary

Create:

```text
ImagePerceptionProvider
ImagePerceptionProviderRequest
ImagePerceptionProviderResult
```

Provider output may contain only visual/perception-level statements such as:

```text
anchors
text candidates
shape candidates
connector observations
endpoint candidates
artifact/plane candidates
confidence
model/provider metadata
```

The provider does not create Temporal primitives and does not mark inferred business semantics as `SOURCE_TRUTH`.

The adapter materializes frozen image-family records:

```text
ImageCoordinateSpace
VisualEvidenceAnchor
PerceptionObservation
PerceptionAlternativeSet
PerceptionRelationCandidate
```

plus common source evidence where safely addressable.

---

# 6. I1B — REFERENCE_QUARRY_PERCEPTION

The first executable perception provider is deliberately deterministic and test-only:

```text
REFERENCE_QUARRY_PERCEPTION v1
```

It recognizes only the exact pinned Quarry-02 SHA-256.

Its structured output is derived from the existing `source-02.md` fixture record and is used to prove:

```text
image bytes
→ local evidence anchors
→ perception observations
→ common evidence materialization
→ review projection
```

It must be visibly classified as:

```text
TEST_ONLY / FIXTURE_PROVIDER
```

It must never be represented as arbitrary-image AI or production perception.

For any other digest:

```text
source bytes remain preserved
perception status = NO_PERCEPTION_PROVIDER_RESULT
no fake candidate process is emitted
```

---

# 7. I2 — Semantic candidate handoff

After I1 is proven, image perception may feed the existing common normalization boundary.

Required discipline:

```text
shape candidate      ≠ canonical node automatically
connector candidate  ≠ canonical edge automatically
text candidate       ≠ normalized business meaning automatically
```

I2 acceptance requires a candidate semantic scope and property-level provenance that can be traced back to image anchors.

No image-private canonical model is allowed.

---

# 8. I3 — Image review workspace

The reference browser must support:

```text
upload PNG
→ display original image
→ overlay visual anchors
→ list Talos observations/alternatives
→ show confidence + evidence state
→ distinguish SOURCE BYTES / PERCEIVED / INFERRED / CONFIRMED
```

Reviewer actions create immutable review/perception-resolution history; they never edit the uploaded bytes or original perception attempt.

I3 is the first human-facing milestone of this plan.

---

# 9. I4–I6 — later gates

Not opened merely by this v0.1 plan:

```text
I4 canonical + validation closure for image-derived process
I5 semantic freeze + capability/execution handoff
I6 generic supported Temporal execution
```

Each requires its own gate evidence.

The existing `TalosReferenceApprovalWorkflow` remains a reference runtime and must not be mislabeled as a generic arbitrary-process compiler.

---

# 10. Real arbitrary-image perception

A future I1C may add a real multimodal provider behind `ImagePerceptionProvider`.

Provider/vendor/model selection is implementation configuration, not TALOS domain truth.

Before promotion, I1C must prove:

```text
provider output remains inferred/perceived
local evidence anchors survive
ambiguous readings remain alternatives
unknown/unsafe regions do not become fake certainty
provider/model version is recorded
new model run creates new immutable attempt
```

I1C is explicitly separate from the deterministic reference fixture provider.

---

# 11. Stage order

```text
I0  PNG intake + immutable byte preservation             🟢 NEXT
I1A provider-neutral perception domain                  ⚪
I1B Quarry-02 deterministic fixture provider            ⚪
I2  common semantic candidate handoff                   ⚪
I3  image review browser                                ⚪
I4  canonical/validation image gate                     ⛔
I5  execution handoff                                   ⛔
I6  real generic Temporal execution                     ⛔
```

Every stage must pass before the next stage is described as supported.

---

# 12. Non-scope

Still not authorized by this plan:

```text
BPMN parser implementation
language/document adapter implementation
n8n adapter implementation
Gmail/Drive/Slack/production SaaS
production OCR service
production vision provider
arbitrary notation-specific geometry rules
production Temporal deployment
broad visual design/polish
```

B10 broader runtime hardening remains open in parallel and is not declared complete by opening this image track.
