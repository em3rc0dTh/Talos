# TALOS — Commercial Audit Evidence Register v0.1

**Date:** 2026-09-14  
**Purpose:** Separate repository fact, historical source, commercial hypothesis and missing evidence.  
**Audience:** Human reviewers and LLMs.  
**Rule:** No `COMMERCIAL_HYPOTHESIS` may be promoted to `FACT_PRODUCT` without an explicit evidence entry.

## Status vocabulary

```text
FACT_REPO
SOURCE_DERIVED
COMMERCIAL_HYPOTHESIS
PARTIALLY_EVIDENCED
PROVEN_INTERNAL
PROVEN_EXTERNAL
REJECTED
STALE
```

## Source registry

| ID | Source | Role | Authority |
|---|---|---|---|
| SRC-001 | `README.md` | Current root system/product boundary | Repository fact at inspected commit |
| SRC-002 | `plan/00-TALOS-ROADMAP-v0.31.md` | Historical/active roadmap statement from 2026-08-19 | Repository fact for that roadmap version |
| SRC-003 | `evidence/sources/2026-09-14-CURRENT-TALOS-AUDIT-SOURCE.md` | Preserved audit input | Source, not automatically current truth |
| SRC-004 | `brainstorming/45-BRAINSTORMING-AUDITORIA-ANALISIS-COMERCIAL-TALOS-v0.1.md` | Commercial interpretation | Hypothesis-bearing document |
| SRC-005 | `main@b37f754033c6252e6041d1ca25a299419320cd07` | Inspected code/doc baseline | Repository fact |
| SRC-006 | Later paid pilots | External commercial evidence | Missing |

## Evidence rules

1. Repository documentation can prove what Talos claims internally, not customer value.
2. Passing tests can prove technical behavior, not willingness to pay.
3. One successful reference vertical can prove a bounded path, not horizontal market repeatability.
4. One customer can provide strong problem evidence, but not broad product-market fit.
5. A sales conversation is qualitative evidence; a paid deployment is stronger.
6. A signed pilot is not the same as a successful pilot.
7. Revenue without repeatability may still represent services rather than product.
8. A product claim that depends on an external market fact must be re-verified before public use.

---

# Claim register

| ID | Claim | Status | Current evidence | Required next evidence |
|---|---|---|---|---|
| C-001 | Talos preserves source before downstream interpretation | PROVEN_INTERNAL | Repository contracts/reference slice | Maintain regression evidence |
| C-002 | Talos separates source truth, confidence, readiness and execution | PROVEN_INTERNAL | Repository laws/contracts | Maintain invariants |
| C-003 | Talos supports explicit review/correction without rewriting original source | PROVEN_INTERNAL | One-App review/correction work | External usability proof |
| C-004 | Talos can compile approved meaning into an ExecutionPlan | PROVEN_INTERNAL | Reference vertical slice | Second distinct process |
| C-005 | Temporal is subordinate to a Talos execution model rather than business source truth | PARTIALLY_EVIDENCED | Current architecture/reference path | Full audit of runtime boundary |
| C-006 | Runtime lineage can fully reach immutable source evidence | PARTIALLY_EVIDENCED | Existing provenance/lineage spine | Complete source→runtime proof and restart proof |
| C-007 | Talos can support radically different verticals without Core changes | COMMERCIAL_HYPOTHESIS | Quarries/reference work suggest direction | 2–3 materially different real processes |
| C-008 | Talos reduces process-discovery time | COMMERCIAL_HYPOTHESIS | None external | Time comparison |
| C-009 | Talos catches material ambiguity before implementation | COMMERCIAL_HYPOTHESIS | Internal semantic fixtures | Real customer process with stakeholder confirmation |
| C-010 | Talos detects implementation drift vs business intent | COMMERCIAL_HYPOTHESIS | Model supports perspective separation | Real existing automation comparison |
| C-011 | Buyers value provenance enough to pay | COMMERCIAL_HYPOTHESIS | None | Paid pilot interview + contract |
| C-012 | Consultancies/system integrators are strong early ICP | COMMERCIAL_HYPOTHESIS | Logical fit only | 5–10 discovery conversations, at least one pilot |
| C-013 | Platform/engineering teams are strong early ICP | COMMERCIAL_HYPOTHESIS | Logical fit only | 5–10 discovery conversations, at least one pilot |
| C-014 | Process excellence teams are viable users | COMMERCIAL_HYPOTHESIS | Product journey fit only | Usability + buying evidence |
| C-015 | Talos can become a repeatable product rather than bespoke consulting | COMMERCIAL_HYPOTHESIS | Architecture designed for reuse | Customer B/C without Core rewrite |
| C-016 | Current Talos is production ready | REJECTED | Repository explicitly preserves production gaps | New release certification required |
| C-017 | Current Talos is commercially proven | REJECTED | No external paid evidence in repository | Paid/repeatable evidence |
| C-018 | More connectors are the next priority | REJECTED | Does not test core thesis | Reconsider only after capability/pilot evidence |

---

# Evidence strength scale

```text
E0 — assertion only
E1 — architecture / specification
E2 — deterministic unit/contract test
E3 — integrated reference test
E4 — internal user run
E5 — external design-partner run
E6 — paid pilot
E7 — repeated paid pilot across distinct customers
E8 — repeatable commercial operation
```

Technical proof and commercial proof must remain separate.

Example:

```text
ExecutionPlan generation
E3/E4 technical evidence
!=
customer willingness to pay
E6 commercial evidence
```

---

# Current commercial evidence posture

At the time of this audit:

```text
TECHNICAL SPINE       materially evidenced internally
PRODUCT SURFACE       progressing; One-App exists
EXTERNAL USER VALUE   not proven in repository
PAID VALUE            not proven in repository
REPEATABILITY         not proven commercially
SCALE                  not evaluated
```

This posture is intentionally conservative.

## Promotion rule

Before a public-facing claim is added to Talos marketing:

```text
claim
→ identify evidence level
→ cite reproducible proof
→ confirm wording does not exceed proof
→ record owner/date
```

No marketing statement may silently convert:

```text
INTERNAL PROOF
```

into:

```text
CUSTOMER VALUE PROOF
```
