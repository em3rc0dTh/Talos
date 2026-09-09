# TALOS — R1-11 Gemini-primary / local-fallback image policy v0.1

Status: **IMPLEMENTED / EXECUTABLE CERTIFICATION PENDING**  
Release line: **Talos 1.0 RC**

## Decision

For the Talos 1.0 image route, visual perception is provider-assisted but downstream process meaning and execution remain Talos-owned.

```text
IMAGE SOURCE
   ↓ preserve exact bytes / provenance
GEMINI PRIMARY VISUAL PERCEPTION
   ↓ structured observations only
TALOS DETERMINISTIC SUFFICIENCY GATE
   ├─ sufficient → selected perception evidence
   └─ insufficient → AUTOMATIC LOCAL FALLBACK
                       ↓ Ollama/Qwen3-VL or explicit local provider
                    TALOS SUFFICIENCY GATE
                       ├─ sufficient → selected perception evidence
                       └─ insufficient → SAFE STOP / HUMAN REVIEW

SELECTED PERCEPTION EVIDENCE
   ↓
TALOS RECONCILIATION
   ↓
CANONICAL PROCESS
   ↓
VALIDATION
   ↓
BPMN DRAFT
   ↓
USER REVIEW / CORRECTION
   ↓
BUSINESS CONFIRMATION
   ↓
AUTOMATION DESIGN
   ↓
CAPABILITY / INTEGRATION BINDING
   ↓
TEMPORAL MAPPING
   ↓
EXECUTION PLAN
   ↓
EXPLICIT APPROVAL
   ↓
TEMPORAL WORKFLOW
```

## Frozen boundaries

1. Gemini is a **visual perception sensor**, not Talos business truth.
2. Gemini never emits an authoritative BPMN revision, automation design, ExecutionPlan, Temporal mapping, deployment authority or workflow-start authority.
3. Top-left → bottom-right is a **coverage strategy only**. Visual position never establishes process execution order.
4. Process order is inferred only from visible connector/arrow evidence plus notation and is preserved as inferred meaning until business confirmation.
5. Talos, not Gemini, decides whether primary perception is sufficient.
6. Primary insufficiency automatically triggers the configured local fallback; no user action is required to start fallback.
7. The fallback is an independent re-read. It must not be given Gemini's answer as truth to imitate.
8. If both providers are insufficient, no perception attempt is selected for canonical normalization.
9. No recursive provider lottery / majority vote is permitted. Unresolved material ambiguity is surfaced to the human review boundary.
10. Perception never grants automatic confirmation, semantic freeze, automation approval, deployment authority or execution authority.

## Primary provider

Talos provides a first-class Gemini adapter activated by:

```text
GEMINI_API_KEY=<secret>
```

Optional overrides:

```text
TALOS_GEMINI_MODEL=gemini-3.7-flash
TALOS_GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta/models
TALOS_GEMINI_TIMEOUT_MS=120000
```

A complete explicit `TALOS_IMAGE_PERCEPTION_*` provider configuration overrides Gemini for custom/test deployments.

The API key remains transient runtime secret material and is not persisted in Talos descriptors/evidence.

## Local fallback

Two fallback lanes are supported.

### First-class Ollama fallback

Enable:

```text
TALOS_OLLAMA_FALLBACK_ENABLED=true
```

Defaults:

```text
TALOS_OLLAMA_FALLBACK_URL=http://127.0.0.1:11434/api/chat
TALOS_OLLAMA_FALLBACK_MODEL=qwen3-vl:4b
TALOS_OLLAMA_FALLBACK_TIMEOUT_MS=120000
```

The local model is used only after the Talos primary sufficiency gate rejects Gemini evidence.

### Explicit/custom fallback

A custom local OCR/CV/VLM provider can be supplied through:

```text
TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_URL
TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_ID
TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_VERSION
TALOS_IMAGE_PERCEPTION_FALLBACK_MODEL_REF
TALOS_IMAGE_PERCEPTION_FALLBACK_MODEL_VERSION
TALOS_IMAGE_PERCEPTION_FALLBACK_PIPELINE_VERSION
TALOS_IMAGE_PERCEPTION_FALLBACK_TIMEOUT_MS
TALOS_IMAGE_PERCEPTION_FALLBACK_BEARER_TOKEN
TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_CLASS
TALOS_IMAGE_PERCEPTION_FALLBACK_EVIDENCE_MODE
```

An explicit fallback configuration takes precedence over the packaged Ollama fallback.

## Talos primary-sufficiency signals

The deterministic gate currently rejects primary evidence when material signals include:

- provider result is not `SUCCEEDED`;
- no process/business occurrences were recovered;
- relevant evidence is partially visible, low-legibility, obscured, out-of-frame or unknown;
- business occurrences lack anchors, supporting observations or semantic type;
- a multi-node graph has no relationships;
- relationship stroke evidence is missing;
- relationship source/target endpoints are unresolved or ambiguous;
- relationship direction is unknown or ambiguous;
- supplied material confidence falls below policy threshold;
- multiple alternatives have no sufficiently supported preferred alternative;
- provider diagnostics report ambiguity, uncertainty, low confidence, incompleteness, illegibility, missing evidence or unresolved meaning.

Default numeric threshold when a provider supplies confidence: `0.70`.

The threshold is not treated as business truth. It controls only whether a second perception attempt is required.

## Evidence records

Every routed image may preserve:

```text
primary provider / attempt
primary sufficiency assessment
fallback provider / attempt (when triggered)
fallback sufficiency assessment
selected provider / attempt (if any)
automaticFallbackTriggered
decision:
  PRIMARY_ACCEPTED
  FALLBACK_ACCEPTED
  UNRESOLVED_AFTER_FALLBACK
```

All provider attempts remain immutable evidence history.

## Regression evidence added

```text
build/reference-vertical-slice/tests/r1-11-image-perception-primary-fallback.test.ts
build/reference-vertical-slice/tests/r1-11-image-perception-product-config.test.ts
```

These regressions are part of the existing `npm run r1:test` glob and therefore the R1-12 exact-SHA certification matrix.

## Release truth

Implementation is committed to the Talos 1.0 RC branch. This document is **not** an executable PASS receipt.

The exact candidate SHA must still execute the R1-12 matrix on a real runner, and R1-11 still requires real-user field evidence across the structural matrix. A real Gemini-key field run plus local-fallback trigger case should be captured before the image route is called release-certified.
