# TALOS — Cross-Adapter Conformance Spec v0.1

Status: **ACTIVE P2-06 TEST SPEC**  
Date: **2026-08-19**

Target:

```text
design/18-CROSS-ADAPTER-CONFORMANCE-CONTRACT-v0.1.md
```

Conformance sources:

```text
Canvas Native v0.2
Canvas Review / Projection v0.2
BPMN v0.1
Image / Perception v0.2
Language / Document v0.2
Existing Automation v0.2
```

---

# CAX01–CAX24

## CAX01 — preserve before interpretation
Every adapter can fail after preservation without deleting source evidence.

## CAX02 — source identity vs canonical identity
Native/provider/perceived/text-derived IDs never become canonical IDs by reuse.

## CAX03 — 0..N semantic scopes
Every source family can produce zero, one or many candidate semantic scopes.

## CAX04 — partial evidence survival
Dangling, unresolved, ambiguous, unsupported or partial source evidence remains representable.

## CAX05 — source-specific semantics survive
BPMN/event semantics, image hypotheses, language modality and automation implementation detail survive without forcing canonical-core expansion.

## CAX06 — truth/confidence/perspective independence
No adapter equates high confidence, parsed structure or executability with truth/perspective/readiness.

## CAX07 — adapter/model version immutability
Reparse/re-perception/re-interpretation/re-mapping creates new attempt history.

## CAX08 — human correction history
Human authority creates new claims/revisions/decisions rather than mutating adapter output.

## CAX09 — Canvas projection provenance
Imported source displayed in Canvas retains external provenance.

## CAX10 — Canvas review write path
Review corrections become review-authored evidence and new ProcessRevision lineage.

## CAX11 — multi-source perspectives
BUSINESS_INTENT, IMPLEMENTED_BEHAVIOR, OPERATIONAL_OBSERVATION and inferred source evidence can coexist.

## CAX12 — conflict preservation
No source wins automatically due to structure, confidence, executability, deployment or recency.

## CAX13 — presentation/editor metadata separation
Canvas layout, BPMN DI, image editor chrome and automation editor metadata remain non-semantic by default.

## CAX14 — relationship-role source awareness
Sequence, message, functional, linguistic, visual and technical connections remain distinct.

## CAX15 — completion discipline
No adapter infers business completion merely from last item/no outgoing detection/end-like shape/technical completion.

## CAX16 — side-effect/recovery discipline
Technical operation or retry/error behavior does not establish business compensation/recovery policy automatically.

## CAX17 — mixed-content delegation
Document→image and other embedded-source delegation preserves parent/child representation provenance.

## CAX18 — sensitive-data boundary
Readable source secrets/PII do not become canonical semantics automatically.

## CAX19 — common normalization boundary
Every source family enters canonical meaning only through normalization/claim/provenance paths.

## CAX20 — common validation boundary
Every accepted semantic scope/readiness decision uses Semantic Validation v0.2 rather than adapter-private readiness.

## CAX21 — source expression vs execution design
No BPMN/automation/native source can emit Temporal execution truth directly.

## CAX22 — deployment/runtime distinction survives cross-source merge
Automation definition, deployment observation and runtime observation remain separate while comparing with BPMN/SOP/Canvas intent.

## CAX23 — source revision vs review baseline
New source/interpreter version cannot silently rebase an active Canvas review workspace.

## CAX24 — one Talos core
No proven adapter requires hidden privileged semantics or an alternate Canonical/Provenance/Validation stack.

---

# Pass condition

```text
24 PASS / 0 FAIL
```

required to close P2-06.

A failure affecting a frozen common contract requires versioning and rerunning every impacted adapter suite.

BUILD remains closed.
