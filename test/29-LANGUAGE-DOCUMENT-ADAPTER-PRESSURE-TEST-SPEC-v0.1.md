# TALOS — Language / Document Adapter Pressure-Test Spec v0.1

Status: **TEST DESIGN / P2-04 GATE**  
Date: **2026-08-19**

Target:

```text
design/14-LANGUAGE-DOCUMENT-ADAPTER-CONTRACT-v0.1.md
arch/07-LANGUAGE-DOCUMENT-ADAPTER-ARCHITECTURE-v0.1.md
```

Purpose:

> Break the Language / Document Adapter before BUILD by testing whether prose/document evidence can remain exact, distributed, ambiguous, scope-aware and historically reviewable without being flattened into a generated flowchart.

BUILD remains closed.

---

# Fixture matrix

## L01 — source document vs extracted text

Input: PDF/DOCX/native document with derived text extraction.

Pass if:

```text
original source representation preserved
TEXT_EXTRACT is derivative/linked
extracted text does not replace source bytes
```

## L02 — exact text-span addressability

Input: claim supported by one paragraph sentence.

Pass if exact evidence is addressable by representation-scoped anchor/structural unit and remains stable for that representation/version.

## L03 — one paragraph → multiple claims

Input:

```text
Finance validates the invoice, records the result, and notifies Procurement if the amount exceeds the threshold.
```

Pass if TALOS may represent several candidate actions/rule/condition claims without turning the paragraph into one indivisible node.

## L04 — one claim → multiple spans

Input: actor definition in section 2, action in section 5, exception in section 8.

Pass if one semantic claim may cite evidence from several spans/sections.

## L05 — document order ≠ runtime order

Input: background paragraph appears before procedure paragraph.

Pass if paragraph order is not promoted to control flow.

## L06 — explicit temporal marker

Input:

```text
After approval, Finance releases the payment.
```

Pass if `After` is anchored and supports an ordering candidate without making every adjacent sentence sequential.

## L07 — normal path vs urgent exception

Input:

```text
First, managers normally review requests. Urgent requests may instead be approved directly by the director.
```

Pass if TALOS preserves:

```text
manager review = typical behavior candidate
director approval = permitted/alternative candidate
urgent = condition candidate
instead = replacement/exception candidate
```

and does **not** flatten to:

```text
Manager Review → Director Approval
```

## L08 — pronoun/coreference ambiguity

Input:

```text
The manager sends the request to the analyst after they validate it.
```

Pass if `they` may retain competing referent candidates rather than a fabricated actor assignment.

## L09 — unresolved role alias

Input uses `request owner`, `owner`, and `approver` without definitions.

Pass if TALOS preserves separate mentions/possible equivalence rather than merging identities silently.

## L10 — MUST modality

Input:

```text
The supervisor must approve expenses above $5,000.
```

Pass if literal modal marker and interpreted REQUIRED candidate remain separate from process-node materialization.

## L11 — SHOULD modality

Input:

```text
Managers should review unusual requests.
```

Pass if RECOMMENDED candidate is not silently upgraded to required execution truth.

## L12 — MAY modality

Input:

```text
The analyst may request additional documents.
```

Pass if permission/possibility does not automatically become an optional control-flow branch.

## L13 — negation / prohibition

Input:

```text
Do not release payment before approval.
```

Pass if prohibition/order constraint may be captured without fabricating a `Release Payment` activity solely from the prohibited mention.

## L14 — exception scope

Input:

```text
All requests require manager review except emergency safety requests, which go directly to the duty officer.
```

Pass if exception scope and alternative handling remain explicit and addressable.

## L15 — example vs requirement

Input:

```text
For example, a damaged invoice may be sent back to the supplier.
```

Pass if example discourse role does not become mandatory branch truth.

## L16 — definition vs action

Input:

```text
An urgent request is any request required within two hours.
```

Pass if definition/rule evidence is not turned into an Activity.

## L17 — ordered list ambiguity

Input numbered checklist under heading `Review checklist`.

Pass if numbering is preserved but strict runtime sequence is not assumed without supporting language/context.

## L18 — explicit procedure list

Input heading/intro:

```text
Perform these steps in order:
1. Verify identity.
2. Validate account.
3. Approve access.
```

Pass if structural + literal evidence can support ordered-flow candidates because the text explicitly asserts ordering.

## L19 — table semantics

Input table with columns `Condition | Action | Owner`.

Pass if table structure is preserved and may be interpreted as a decision/rule table without treating row order as sequence.

## L20 — RACI-like table

Input table of tasks vs Responsible/Accountable roles.

Pass if responsibility evidence remains distinct from control flow.

## L21 — local cross-reference

Input:

```text
Follow the escalation criteria in section 4.2.
```

Pass if literal reference is preserved and resolved only when the target structural unit is actually available.

## L22 — external unresolved reference

Input:

```text
Follow SOP-17.
```

SOP-17 is unavailable.

Pass if unresolved external dependency remains explicit and no missing process is invented.

## L23 — missing process boundary

Input contains policy, responsibilities and several process fragments with no declared start/end.

Pass if TALOS may produce 0..N candidate scopes and does not call the whole document one process automatically.

## L24 — multiple processes in one manual

Input manual has onboarding, refund and closure procedures.

Pass if separate candidate scopes may share policy evidence without collapsing into one process.

## L25 — policy-only document

Input defines approvals/limits but no procedure topology.

Pass if useful policy/rule scope can exist with zero process candidate.

## L26 — embedded diagram in document

Input document contains prose plus an embedded process screenshot.

Pass if embedded visual content is preserved/delegated to the Image adapter family or reported unprocessed; language adapter must not invent visual semantics from a caption alone.

## L27 — partial extraction

Input document has extractable text plus unsupported embedded/object content.

Pass if AdapterAttempt may be PARTIAL and still produce useful evidence/scopes with diagnostics.

## L28 — human resolution of language alternatives is historical

Input: interpreter produces two mutually exclusive meanings for a sentence; later an authorized reviewer selects one outside a Canvas-specific workflow.

Pass if:

```text
original LanguageAlternativeSet remains immutable
model preference remains historical
human/authority decision is a separate immutable record tied to the alternative set
confirmed claim/revision may follow
```

Fail if resolution requires mutating the set or depends only on an informal generic note that cannot explicitly identify selected/rejected alternatives.

## L29 — newer interpreter version

Input: same source interpreted by model v2 with a different actor/order reading.

Pass if both attempts remain immutable and newer freshness does not auto-rebase accepted review meaning.

## L30 — Canvas review/correction lineage

Input: language-derived candidate process shown in Canvas; reviewer corrects actor/condition/order.

Pass if correction creates review-authored evidence/new ProcessRevision/ValidationAssessment and original document/interpreter attempt remain unchanged.

---

# Gate rule

P2-04 cannot freeze unless all L01–L30 pass after any evidence-forced contract evolution.

Any change to a frozen common/Phase-1 contract requires explicit versioning and regression of previously closed source-family gates.
