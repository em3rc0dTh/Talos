# TALOS — T3-01 Human-Readable Workflow Draft Pressure-Test Spec v0.1

Status: **ACTIVE T3-01 TEST SPEC**  
Date: **2026-08-19**

Target:

```text
design/20-HUMAN-READABLE-WORKFLOW-DRAFT-CONTRACT-v0.1.md
arch/10-HUMAN-READABLE-WORKFLOW-DRAFT-ARCHITECTURE-v0.1.md
```

Pass condition:

A human-readable explanation must preserve topology, scope, provenance, property-scoped epistemic state, validation and review history without inventing process truth.

## Fixtures

```text
E01  simple sequence renders as supported sequence
E02  decision preserves distinct branches/guards
E03  parallel region is not serialized as arbitrary sequence
E04  dangling branch remains unresolved/source-only
E05  Q06 reference architecture is not forced into one workflow
E06  Q12 functional dependency is not rendered as temporal sequence
E07  Q11 surprising NO branch is preserved, not repaired
E08  source-only occurrence can be explained without canonical placeholder
E09  multi-source conflict remains explicit
E10  one human statement may contain properties with different truth/confidence/perspective states
E11  validation finding is not process step
E12  clarification question does not imply answer
E13  language normal-path/urgent-exception is not flattened to sequence
E14  automation implementation evidence is labeled IMPLEMENTED_BEHAVIOR
E15  deployment/runtime evidence does not imply business success
E16  same display label / distinct source occurrences remain distinguishable
E17  participant-local end does not imply global collaboration completion
E18  unproven completion remains explicit
E19  incomplete wait semantics expose blocker/question
E20  human interaction with missing outcome remains incomplete
E21  material proposition links back to local source evidence
E22  renderer locale/detail change does not create semantic revision
E23  validation reassessment can create new explanation snapshot without ProcessRevision mutation
E24  newer adapter interpretation does not silently rebase active explanation
E25  accepted review correction / new ProcessRevision yields new draft snapshot
E26  source with zero process candidates can still receive non-workflow explanation
E27  one artifact with multiple candidate scopes produces separate scoped drafts
E28  sensitive credential/secret source value is excluded from human draft
E29  display/list order is not treated as execution order
E30  textual and Canvas review projections must share compatible baseline context
```

## E10 adversarial detail

Q11-style source evidence:

```text
literalText = "Brainst"          SOURCE_TRUTH
interpretedMeaning = brainstorm  INFERRED
```

A rendered sentence may mention both, but the explanation model must not assign one flattened epistemic state/confidence/perspective to both properties.

Required:

```text
property/facet-scoped explanation evidence state
```

or an equivalent structure that preserves the frozen Provenance v0.3 property-scoped claim law.

## Gate rule

Any fixture failure requires versioned design evolution and full E01–E30 regression.

BUILD remains closed.