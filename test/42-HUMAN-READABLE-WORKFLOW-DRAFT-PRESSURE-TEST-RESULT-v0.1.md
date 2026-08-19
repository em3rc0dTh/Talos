# TALOS — T3-01 Human-Readable Workflow Draft Pressure-Test Result v0.1

Status: **PRESSURE TEST COMPLETE — EVOLUTION REQUIRED**  
Date: **2026-08-19**

Target:

```text
design/20-HUMAN-READABLE-WORKFLOW-DRAFT-CONTRACT-v0.1.md
arch/10-HUMAN-READABLE-WORKFLOW-DRAFT-ARCHITECTURE-v0.1.md
```

## Result

```text
E01–E30
29 PASS
 1 FAIL
PASS RATE 96.7%
```

Failure:

```text
E10 — mixed property-level epistemic state inside one human proposition
```

## Why E10 fails

v0.1 correctly makes `SemanticClaim` references available to an `ExplanationProposition`, but the proposition itself exposes only one:

```text
epistemicState
evidencePerspective?
confidence?
```

while allowing:

```text
propertyPaths[]
claimRefs[]
```

That can flatten different property-level evidence states when one human statement combines them.

Q11 regression example:

```text
literalText = "Brainst"          SOURCE_TRUTH
interpretedMeaning = brainstorm  INFERRED
```

A proposition such as:

```text
The box contains "Brainst", interpreted as brainstorm.
```

needs at least two independently addressable evidence/epistemic facets.

The v0.1 proposition-wide state cannot prove that distinction by itself.

This would violate frozen Provenance v0.3's property-scoped claim discipline.

## Passing fixtures

```text
E01 PASS
E02 PASS
E03 PASS
E04 PASS
E05 PASS
E06 PASS
E07 PASS
E08 PASS
E09 PASS
E10 FAIL
E11 PASS
E12 PASS
E13 PASS
E14 PASS
E15 PASS
E16 PASS
E17 PASS
E18 PASS
E19 PASS
E20 PASS
E21 PASS
E22 PASS
E23 PASS
E24 PASS
E25 PASS
E26 PASS
E27 PASS
E28 PASS
E29 PASS
E30 PASS
```

## Required evolution

Add property/facet-scoped explanation evidence binding so one rhetorical statement can preserve multiple truth/confidence/perspective states without splitting every sentence artificially.

No Phase-1 or Phase-2 frozen contract needs reopening.

```text
T3-01 FREEZE  ⛔ NOT ALLOWED YET
BUILD         ⛔ CLOSED
```