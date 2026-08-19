# TALOS Mining Site — Cross-Quarry Synthesis v0.1

Status: **AUDIT / EVIDENCE SYNTHESIS**  
Date: **2026-08-18**  
Scope: **Q01–Q10 + current TALOS system/canonical/provenance drafts**

## Purpose

This artifact does not define a new frozen TALOS language. It audits the first ten Mining Site quarries together and extracts repeated semantics, recurring failure modes, provenance defects, and evidence-backed hypotheses that should influence the next architecture gates.

The central question is no longer only:

> Can TALOS read a process diagram?

After ten quarries, the stronger question is:

> Can TALOS determine what kind of evidence it is looking at, separate process meaning from surrounding presentation/context, preserve local uncertainty and source identity, and only then hand executable semantic slices to the Foundry?

The evidence says this separation is essential.

---

# 1. Evidence set

```text
Q01  Order Process
     sequence + responsibility lanes + decisions + explicit success/failure ends

Q02  Water Order & Delivery
     participant boundary + message interaction + schedule wait + subprocess + business object states

Q03  Availability / Procurement / Settlement
     message start + collapsed subprocesses + boundary exceptions + multiple domain outcomes

Q04  Candidate Application Lifecycle
     identity/access condition + optional pre-processing + shared rejection handling + retention intent

Q05  Ward / Pharmacy Drug Fulfillment
     collaboration + participant-local flow + message flow + correlation gap + duplicate labels

Q06  AI Reference Architecture
     artifact-class challenge + architecture layers + service/resource topology + executable-slice discovery

Q07  Order Validation / Payment / Fulfillment
     object/state evidence + fork/join concurrency + all-branch synchronization + incomplete success termination

Q08  Multi-Department Service Handling
     lane-vs-participant distinction + repeated decision labels + graph uncertainty + callbacks + parallel regions

Q09  Proposal Preparation Activity Process
     notation annotations + business loop/back-edge + three-way fork/join + object occurrence identity

Q10  Collaborative Order / Stock / Card / Delivery
     authoring UI + collaborator overlays + shared cancellation causality + validation-vs-side-effect + compensation gap
```

The quarries are deliberately heterogeneous. That heterogeneity is the evidence.

---

# 2. Strongest pattern — classification must precede workflow interpretation

Q01–Q05 mostly look like process diagrams. Q06 breaks that assumption: its source is a reference architecture with workflow-like shapes, architecture bands, capability/resource nodes and metric overlays. Q10 breaks the assumption again: its source is a Miro workspace screenshot containing both a business-looking graph and editor/collaboration context.

Therefore TALOS cannot begin with:

```text
IMAGE
  ↓
FIND TASKS
  ↓
BUILD WORKFLOW
```

The evidence-backed front-end is closer to:

```text
SOURCE CAPTURE
    ↓
ARTIFACT CLASSIFICATION
    ↓
SOURCE-PLANE SEGMENTATION
    ↓
SOURCE GRAPH EXTRACTION
    ↓
NODE / EDGE / REGION TYPING
    ↓
IDENTITY + PROVENANCE BINDING
    ↓
UNCERTAINTY / CONFLICT PRESERVATION
    ↓
CANONICAL NORMALIZATION
    ↓
EXECUTABLE-SLICE DISCOVERY
    ↓
FOUNDRY SOURCE
```

This is one of the most important conclusions of the Mining Site.

TALOS is behaving less like a notation converter and more like a **source-aware semantic compiler front-end**.

---

# 3. Sources contain multiple semantic planes

Repeatedly, the visible source contains material that is real evidence but is not part of executable business control flow.

The ten quarries support at least these planes:

```text
SOURCE ARTIFACT
│
├── AUTHORING / WORKSPACE PLANE
│   └── editor chrome, toolbar, collaborator presence, cursor overlays
│
├── NOTATION / ANNOTATION PLANE
│   └── legends, explanatory labels, annotation arrows, source-asserted node types
│
├── BUSINESS GRAPH PLANE
│   └── events, actions, decisions, branches, loops, joins, outcomes
│
├── RESPONSIBILITY / COLLABORATION PLANE
│   └── participants, lanes, roles, handoffs, messages
│
├── OBJECT / DATA PLANE
│   └── Order [New], Order [Placed], Proposal object nodes, purchase-order artifacts
│
├── ARCHITECTURE / CAPABILITY PLANE
│   └── services, repositories, layers, infrastructure and topology
│
└── ANALYTIC / SIMULATION PLANE
    └── metric badges, timing/performance overlays, analytic model annotations
```

These planes may coexist in one screenshot.

A core safety invariant follows:

```text
VISIBLE IN SOURCE
      ≠
BELONGS TO EXECUTABLE BUSINESS GRAPH
```

But the non-process material is not garbage. It remains provenance/evidence and may matter for interpretation.

---

# 4. Graph identity is more trustworthy than label identity

Several quarries prove that display labels cannot define semantic identity.

Examples include:

- Q05: two separate Ward nodes both labeled `receive internal order`;
- Q05: two `in stock` decisions in different participant contexts;
- Q08: two separate gateways labeled `can the problem be solved?`;
- Q08: symmetric `(m)` and `(e)` branch activities;
- Q09: two distinct source occurrences labeled `aProposal : Proposal`;
- Q10: two different negative causes converge on one `Cancel order` action.

The repeated rule is:

```text
SAME LABEL
  ≠ SAME SOURCE NODE
  ≠ SAME AUTHORITY CONTEXT
  ≠ SAME BUSINESS OBJECT INSTANCE
  ≠ SAME RUNTIME IDENTITY
```

TALOS therefore needs occurrence identity before conceptual unification.

A safe progression is:

```text
SOURCE OCCURRENCE ID
        ↓
SOURCE-AWARE TYPE
        ↓
CANONICAL ELEMENT ID
        ↓
OPTIONAL CONCEPTUAL IDENTITY / EQUIVALENCE
        ↓
RUNTIME IDENTITY — only when execution defines it
```

---

# 5. Edge semantics are first-class

The diagrams repeatedly use arrows/lines for different meanings.

Across the evidence set TALOS encounters:

```text
CONTROL / SEQUENCE
CONDITIONAL ROUTING
MESSAGE / COMMUNICATION
OBJECT / DATA FLOW
RESPONSIBILITY HANDOFF
DEPENDENCY
FEEDBACK
ANNOTATION POINTER
UNRESOLVED ASSOCIATION
```

Q05 proves message flow is not sequence flow. Q07/Q09 prove object/data flow is not control flow. Q09 proves an annotation arrow is not a process edge. Q10 proves an editorial pointer/cursor is not a control-flow edge. Q08 proves a long visible connector may have uncertain endpoints even when the surrounding graph region is clear.

Therefore edge identity requires provenance and certainty independently of node certainty.

A source can support:

```text
NODE A exists                  HIGH confidence
NODE B exists                  HIGH confidence
some connector exists          HIGH confidence
connector endpoint = NODE B    LOW / unresolved
```

A single global confidence score would destroy this information.

---

# 6. Concurrency is notation-independent semantic truth

Q07, Q08 and Q09 all reinforce parallel activation and synchronization through different visual contexts.

Repeated canonical meaning:

```text
PARALLEL SPLIT
   ├── branch A
   └── branch B / C
        ↓
JOIN
policy: ALL / SOURCE_DEFINED
```

The key rule is:

```text
MERGE / CONVERGENCE
        ≠
JOIN / SYNCHRONIZATION
```

An exclusive merge may continue when one active branch arrives. A synchronization join may require every activated branch to reach a completion predicate.

This is now repeated evidence, not a one-quarry hypothesis.

---

# 7. Business loops are not technical retry semantics

Q09 provides the cleanest back-edge/re-entry loop. Q05 and Q08 also expose possible re-entry/callback behavior.

The Mining Site must preserve:

```text
BUSINESS REPETITION / RE-ENTRY
```

without upgrading it to:

```text
Temporal retry policy
Activity retry
Continue-As-New
technical polling loop
```

Those are Foundry/runtime choices.

The distinction is fundamental because business repetition can be correct domain behavior while a technical retry is failure-recovery behavior.

---

# 8. Validation/check work is different from side-effect work

Q10 explicitly separates:

```text
Check credit card
      ↓
Card valid?
      ↓
Process credit card
```

This creates a reusable semantic distinction:

```text
VALIDATE / CHECK / READ
        ≠
SIDE EFFECT / MUTATION
```

The source still does not dictate implementation, but the distinction matters later because side effects often introduce idempotency, compensation, reconciliation and failure-boundary requirements that a read/validation does not necessarily share.

This should remain semantic evidence before capability/runtime binding.

---

# 9. Shared handling must preserve causality

Q04 and Q10 independently show multiple branches converging into shared downstream handling.

Examples:

```text
APPLICATION REVIEW REJECT ─┐
                           ├── shared rejection handling
FINAL DECISION REJECT ─────┘
```

and:

```text
OUT_OF_STOCK ─────┐
                  ├── CANCEL ORDER
CARD_INVALID ─────┘
```

Normalization may reuse the shared action while preserving the incoming reason/cause.

Rule:

```text
SHARED HANDLING
      ≠
LOSS OF CAUSAL ORIGIN
```

This is important for explanation, audit, compensation, analytics and later execution history.

---

# 10. Completion is frequently less explicit than the happy-path diagram suggests

A recurring source weakness is that the last visible activity is treated visually as if it were completion even when no final outcome is actually present.

Examples:

- Q07: rejection has an explicit final-like node; success visibly stops at `Deliver order`;
- Q08: several local event-like nodes exist, but one global completion is not proven;
- Q10: `Cancel order` and `Receive` are last visible nodes but have no explicit end/final event;
- Q05: participant-local ends do not automatically prove collaboration-level completion.

Therefore TALOS needs a validation distinction between:

```text
LAST VISIBLE NODE
LOCAL MILESTONE / LOCAL END
EXPLICIT PROCESS OUTCOME
GLOBAL COLLABORATION COMPLETION
```

The absence of a visible continuation is not positive evidence of success.

---

# 11. Negative paths expose more automation risk than happy paths

Q03, Q04, Q05, Q07, Q08 and Q10 repeatedly reveal that source diagrams are much stronger at describing the happy path than failure/re-entry/compensation behavior.

Especially Q10:

```text
payment processed
      ↓
delivery fails
      ↓
???
```

The missing topology may hide:

```text
refund
payment reversal
inventory release
replacement
manual review
recovery workflow
customer communication
```

TALOS must not invent those outcomes, but it should make the missing semantic region visible to validation.

A useful principle emerges:

> Missing failure topology is not an implementation detail. It is a semantic-readiness finding.

---

# 12. Collaboration implies correlation, not just arrows

Q02 and especially Q05 show participant-to-participant communication. Q08 introduces cross-responsibility case handling that may also require durable case identity.

A message edge by itself does not establish:

```text
payload schema
correlation key
sender authority
receiver identity
at-least-once/exactly-once semantics
response expectation
process-instance relationship
```

Mining Site should therefore preserve a `CORRELATION_REQUIREMENT` finding when separate process/participant lifecycles must later be connected but the source does not define how.

---

# 13. One source may contain zero, one, or many executable lifecycles

Q06 is the clearest counterexample to `one diagram = one workflow`.

An architecture diagram may contain:

```text
capabilities
services
repositories
model lifecycle
approval lifecycle
analytics topology
feedback relationships
```

Only some regions may be candidates for durable orchestration.

Therefore:

```text
SOURCE ARTIFACT
      ↓
0..N EXECUTABLE SLICES
      ↓
0..N FOUNDRY DESIGNS
      ↓
0..N TEMPORAL WORKFLOW BOUNDARIES
```

Workflow-boundary selection belongs to Foundry, not Mining Site.

---

# 14. Source-byte provenance audit

The current repository itself exposed a T1-02 problem: a semantic source record may describe the original upload correctly while the repository later gains an exact copy or a derivative representation without the record being refreshed.

The attached Mining Site export was compared against the current Git repository tree using source byte length and Git blob identity where the original bytes were present in the export.

## Verified exact original bytes now in repository

```text
Q04  quarry-04.png   EXACT byte identity verified
Q07  quarry-07.png   EXACT byte identity verified
Q08  quarry-08.png   EXACT byte identity verified
Q09  quarry-09.webp  EXACT byte identity verified
Q10  quarry-10.webp  EXACT byte identity verified
```

For these quarries, some `source-NN.md` records still say `repository binary attachment pending`. That statement reflects an earlier repository state and is now stale.

## Repository representation differs from captured original

```text
Q01  repository PNG differs from captured original bytes
Q02  repository PNG differs from captured original bytes
Q03  repository PNG differs from captured original bytes
Q05  repository AVIF is a derivative of captured original JPG
```

These repository representations may remain useful as previews/derivatives, but they must never be claimed as byte-identical source artifacts.

## Q06

The repository contains `quarry-06.ppm` with the same recorded byte length (`127,371`) and the source record preserves the important extension/signature mismatch (`.ppm` filename with PNG signature). The current exported conversation does not contain the original Q06 bytes, so this audit does **not** independently re-verify its SHA-256 identity.

## Provenance implication

TALOS needs to distinguish:

```text
ORIGINAL SOURCE BYTES
EXACT REPOSITORY COPY
DERIVATIVE / TRANSCODE
PREVIEW / THUMBNAIL
RECREATED / REDRAWN ARTIFACT
MISSING ORIGINAL
```

A path or filename is not enough.

This is not repository housekeeping only. It is direct evidence for the Provenance Model gate.

---

# 15. Evidence granularity must be property-scoped

The quarries repeatedly support some properties of an element while leaving others unresolved.

Example from Q08:

```text
shape exists                     SOURCE_TRUTH
circular event-like marker       SOURCE_TRUTH
exact BPMN event subtype         UNRESOLVED
termination                      depends on visible topology
```

Example from Q10:

```text
blue diamond exists              SOURCE_TRUTH
label = In stock?                SOURCE_TRUTH
behaves like a decision          strong interpretation
formal notation = BPMN XOR       NOT PROVEN
```

Therefore provenance cannot stop at:

```text
ProcessNode.provenanceRef
```

It must support claims against properties/relationships:

```text
subjectRef
propertyPath
value
truthClass
confidence
source region / element
interpretation method/version
```

This strongly reinforces `SemanticClaim` as a first-class model.

---

# 16. The Mining Site is revealing a semantic front-end architecture

Across the ten quarries, the same transformation stages recur:

```text
1. CAPTURE
   preserve original artifact identity

2. CLASSIFY
   process / collaboration / architecture / annotated notation / whiteboard / other

3. SEGMENT SOURCE PLANES
   editor context / annotations / graph / objects / analytics / architecture

4. BUILD SOURCE GRAPH
   source occurrences + candidate edges + regions

5. TYPE WITHOUT OVERCOMMITTING
   source-asserted type where available; inferred type otherwise

6. RESOLVE IDENTITIES
   keep occurrence identity separate from conceptual identity

7. PRESERVE UNCERTAINTY
   claim-level and edge-level, not one global confidence

8. NORMALIZE REPEATED SEMANTICS
   decision / branch / join / wait / object / message / outcome etc.

9. DETECT READINESS GAPS
   missing completion / correlation / failure / compensation / ownership / rule detail

10. DISCOVER EXECUTABLE SLICES
    without choosing runtime boundaries yet

11. HAND OFF TO FOUNDRY
    semantic source, not Temporal code
```

This pipeline is one of the clearest structural results of the experiment.

---

# 17. Implications for T1-02 — Provenance Model

The next provenance contract should explicitly cover:

- original source bytes independently from repository derivatives;
- byte hash, byte length, declared filename/extension, observed MIME/signature;
- representation lineage (`DERIVED_FROM`, `TRANSCODED_FROM`, `PREVIEW_OF`);
- evidence region/fragment within an artifact;
- source plane/classification;
- source occurrence identity;
- property-scoped SemanticClaims;
- truth class independently from confidence;
- evidence perspective independently from truth class;
- extraction/interpreter version;
- claim conflict and human resolution history;
- immutable transformation/revision lineage;
- exact trace from later execution element back to the source representation and evidence fragment that justified it.

The provenance model should be able to answer:

> Is this the original source, an exact copy, or only a visual derivative?

as naturally as it answers:

> Was this node extracted, inferred, suggested or confirmed?

---

# 18. Implications for T1-03 — Semantic Validation

The quarries suggest validation findings beyond simple structural correctness:

```text
UNPROVEN_COMPLETION
LOCAL_END_NOT_GLOBAL_END
AMBIGUOUS_EDGE_ENDPOINT
UNKNOWN_EVENT_SUBTYPE
UNRESOLVED_BRANCH_CONDITION
MISSING_CORRELATION
MISSING_REENTRY
MISSING_FAILURE_PATH
MISSING_COMPENSATION_TOPOLOGY
UNKNOWN_SIDE_EFFECT_BOUNDARY
UNRESOLVED_OBJECT_IDENTITY
ARTIFACT_CLASS_NOT_EXECUTABLE_PROCESS
SOURCE_PLANE_CONTAMINATION_RISK
```

These are not necessarily errors.

Some sources are intentionally high-level or incomplete. The validation engine must explain whether the model is useful, conflicted, incomplete, or ready for automation design.

---

# 19. What is now strongly reinforced

After ten quarries, the following are no longer weak one-off ideas:

```text
SOURCE-AWARE CLASSIFICATION              STRONG
PROVENANCE / ORIGIN PRESERVATION         STRONG
NODE OCCURRENCE IDENTITY                 STRONG
EDGE SEMANTIC TYPING                     STRONG
PARTICIPANT ≠ LANE                       STRONG
MESSAGE ≠ SEQUENCE                       STRONG
OBJECT FLOW ≠ CONTROL FLOW               STRONG
PARALLEL FORK / JOIN                     STRONG
SHARED HANDLING WITH CAUSE PRESERVATION  STRONG
LOCAL END ≠ GLOBAL COMPLETION            STRONG
BUSINESS LOOP ≠ TECHNICAL RETRY          STRONG
SOURCE UI / ANNOTATION FILTERING         STRONG
EXECUTABLE-SLICE DISCOVERY               STRONG
```

---

# 20. What remains intentionally unresolved

The evidence does not yet justify freezing:

- a universal importer architecture;
- a complete node taxonomy for every process notation;
- automatic Workflow boundaries;
- automatic Activity vs Signal/Update vs Child Workflow mapping;
- a universal human-task implementation;
- a universal object persistence model;
- automatic compensation design;
- automatic correlation strategy;
- a Temporal compiler strategy;
- one canonical interpretation for architecture diagrams.

Those remain Foundry/design/validation concerns.

---

# 21. Audit conclusion

The first ten quarries demonstrate that TALOS's hardest problem is **not drawing arrows and not generating Temporal code**.

The hard problem is preserving semantic truth while crossing multiple boundaries:

```text
visible pixels / source bytes
        ↓
source context
        ↓
source graph
        ↓
semantic meaning
        ↓
canonical process truth
        ↓
validated automation intent
        ↓
execution design
```

The Mining Site has therefore validated a stronger TALOS identity:

> **TALOS is a source-aware semantic guard and compiler front-end between heterogeneous business-process evidence and durable execution design.**

That conclusion remains compatible with the frozen Canonical Process Model v0.1. It does not reopen T1-01. Instead, it gives T1-02 and T1-03 better real evidence with which to close their gates.
