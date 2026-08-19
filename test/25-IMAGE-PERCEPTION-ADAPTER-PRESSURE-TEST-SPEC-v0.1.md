# TALOS — P2-03 Image / Perception Adapter Pressure-Test Spec v0.1

Status: **TEST DESIGN / P2-03**  
Date: **2026-08-19**

Target:

```text
design/12-IMAGE-PERCEPTION-ADAPTER-CONTRACT-v0.1.md
arch/06-IMAGE-PERCEPTION-ADAPTER-ARCHITECTURE-v0.1.md
```

Frozen dependencies:

```text
Canonical Process Model v0.1
Provenance v0.3
Semantic Validation v0.2
Process Source Intake v0.2
Canvas Review / Projection v0.2
```

## Gate method

A fixture passes only if TALOS can preserve the source and represent the uncertainty/meaning without:

```text
laundering perception into SOURCE_TRUTH
inventing missing graph structure
collapsing source/canonical identity
losing local evidence
mutating prior perception/history
bypassing frozen Canonical/Provenance/Validation boundaries
```

---

## I01 — Physical origin vs photo capture — Q11

Given:

```text
physical paper drawing
→ user-supplied PNG photo
```

Must prove:

```text
physical origin ≠ PNG bytes
PNG hash identifies representation only
perception anchors resolve to PNG representation
```

---

## I02 — Digital-native origin vs screenshot — Q12

Given:

```text
digital canvas/model
→ screenshot supplied
native structured model not supplied
```

Must preserve:

```text
DIGITAL_NATIVE_ARTIFACT origin
CAPTURED_BYTES screenshot
NATIVE_STRUCTURED_MODEL = NOT_SUPPLIED/UNKNOWN
```

Screenshot perception never claims native source IDs.

---

## I03 — Region-addressable evidence

A perceived node/label/edge must cite a local image anchor tied to exact representation/coordinate space.

Pass if a later reviewer can locate the supporting pixels without relying only on a natural-language description.

---

## I04 — Crop / rotation / deskew derivative lineage

Given:

```text
captured image A
→ rotated/cropped derivative B
→ perception runs on B
```

Must prove:

```text
B ≠ A byte identity
anchor belongs to B coordinate space
transform lineage traces B → A → source origin
```

---

## I05 — Literal text vs interpreted meaning — Q11

For visible shorthand such as:

```text
Brainst
```

must distinguish:

```text
literal text candidate
normalized text candidate
interpreted meaning candidate
```

without silently rewriting the source.

---

## I06 — Competing text readings

A low/medium-legibility region supports more than one plausible reading.

Must preserve an unresolved alternative set with local confidence/evidence rather than forcing one string.

---

## I07 — Shape existence vs shape semantic type

A perceived diamond/box/circle may have:

```text
existence confidence
shape-class confidence
semantic-type confidence
```

independently.

High-confidence `diamond` does not automatically prove `DECISION`.

---

## I08 — Relationship properties independently uncertain

A connector may have:

```text
stroke existence = high
source endpoint = high
target endpoint = low
direction = medium
role = unknown
```

Must preserve those independently.

---

## I09 — Out-of-frame / occluded continuation vs termination

Given a visible node near an image boundary with no detected outgoing connector:

Talos must not infer END merely from non-detection.

Required states include visibility/coverage evidence such as:

```text
OUT_OF_FRAME_CANDIDATE
OBSCURED
LOW_LEGIBILITY
UNKNOWN
```

---

## I10 — Authoring UI separation — Q10

Miro toolbar, zoom controls, title/chrome and editor UI are visible source evidence.

They must not materialize as business nodes.

---

## I11 — Collaborator cursor ≠ actor — Q10

Visible labels/cursors:

```text
Himali
Aharon
Anna
Bettany
```

must remain collaboration-overlay evidence.

No actor/owner assignment is created from cursor proximity.

---

## I12 — Same text ≠ same occurrence — Q08

Repeated `Call back` and repeated `can the problem be solved?` nodes remain distinct source-occurrence candidates by spatial/source evidence.

---

## I13 — Ambiguous long connector — Q08

The raster clearly contains a long connector, but an endpoint is ambiguous.

Must preserve:

```text
relationship candidate exists
endpoint alternative/unknown
no fabricated canonical edge
```

---

## I14 — Event-like circle ≠ terminal — Q08

A circle with unclear subtype and wider topology must not become END from shape alone.

---

## I15 — Architecture diagram not one process — Q06

Reference Architecture for AI contains boxes, gateways, arrows and end-like shapes.

Must classify/scope as architecture/source-specific evidence before any process assumption.

Whole artifact may yield:

```text
ARCHITECTURE_SCOPE
0 whole-artifact PROCESS_CANDIDATE
0..N executable-slice candidates
```

---

## I16 — Metric/style overlays do not become execution policy — Q06

Colored badges/numeric/time-like overlays are visible.

Preserve as annotation/source metadata unless a source legend supports stronger meaning.

No routing/retry/SLA/state inference from appearance alone.

---

## I17 — Functional relationship role depends on notation hypothesis — Q12

Top-side attachment may support `FUNCTION_CONTROL` only because the artifact is interpreted as ICOM/IDEF0-like.

Must preserve dependency:

```text
relationshipRole claim
→ depends on notation/artifact/plane hypothesis
```

No universal `top = control` rule.

---

## I18 — Function mechanism/resource ≠ process step — Q12

Bottom-side labels such as members/personnel/resources must not be normalized into Activities solely because they are connected to a function.

---

## I19 — Functional dependency ≠ temporal sequence — Q12

Output→input links between function boxes may support functional dependency.

They must not become SEQUENCE automatically.

---

## I20 — Composite text inside one shape — Q11

One visible activity box containing:

```text
Brainst, design, arch, plan, build, test
```

must not automatically become six graph nodes.

---

## I21 — Expected business logic does not repair image — Q11

The first/second `No` branches appear to terminate unexpectedly.

Talos must preserve source topology/uncertainty rather than connect them to a more logical continuation.

---

## I22 — Multiple representations of one origin

Given photo A and scan B of the same physical source:

```text
attempt A → source occurrences A
attempt B → source occurrences B
```

No identity collapse occurs automatically.

Potential equivalence requires explicit correspondence claim.

---

## I23 — Re-perception by newer model

Same representation processed by model/pipeline v1 and later v2.

Must produce separate immutable AdapterAttempts/results/claims.

v2 does not mutate v1.

---

## I24 — Canvas review of uncertain/source-only evidence

A low-confidence edge/text occurrence that cannot safely canonicalize must still be reviewable in Canvas with:

```text
source image region
confidence/truth class
alternatives
diagnostics
```

Canvas display does not transfer source ownership.

---

## I25 — Partial perception is not failed source

Most of an image is interpretable, but one region/connector is unresolved.

Must allow:

```text
AdapterAttempt = PARTIAL
AdapterResult exists
SourceEvidenceGraph partial
CandidateSemanticScope(s) may exist
```

while preserving diagnostics.

---

## I26 — Perception failure preserves source

A perception pipeline/model fails completely after source preservation.

Must produce:

```text
AdapterAttempt FAILED
source representation remains preserved
no fake canonical result
retry may occur as new attempt
```

---

## I27 — Human resolution of perception alternatives is historical

Given an unresolved `PerceptionAlternativeSet` from attempt A, a human later confirms one reading.

Must prove:

```text
original alternative set remains immutable
human confirmation is a new authority/evidence record
prior model preference remains historically visible
```

A field on the old perception record must not be mutated from `UNRESOLVED` to `HUMAN_CONFIRMED`.

---

## I28 — Reviewer correction survives newer perception result

A user has already corrected/confirmed imported image meaning in Canvas Review.

Later a newer perception model proposes a conflicting candidate.

Must use:

```text
BaselineTransitionCandidate
BaselineReconciliationAnalysis
explicit decision
```

and must not silently overwrite review-authored evidence.

---

# Acceptance

```text
28 / 28 PASS
```

required for P2-03 design/architecture closure.

If the current contract fails any fixture:

1. record failure honestly;
2. version the affected contract;
3. preserve v0.1 history;
4. rerun all I01–I28;
5. freeze only exact passing artifacts.

BUILD remains closed.
