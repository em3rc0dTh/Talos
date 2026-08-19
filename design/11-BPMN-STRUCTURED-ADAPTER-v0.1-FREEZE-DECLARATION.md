# TALOS — BPMN Structured Adapter v0.1 Freeze Declaration

Status: **FROZEN / P2-02 DESIGN-ARCH CLOSED**  
Date: **2026-08-19**

## Frozen design

```text
path:
design/10-BPMN-STRUCTURED-ADAPTER-CONTRACT-v0.1.md

commit:
bed85a94bd16c7f602315d239dfd89f88f13c28b

blob:
f662aacf383a1b966a073242171ca7e0fd89ff7d
```

## Frozen architecture

```text
path:
arch/05-BPMN-STRUCTURED-ADAPTER-ARCHITECTURE-v0.1.md

commit:
ccf5c6ef533451aaf074c590594db37e9eff2a84

blob:
682f7c5836ef6a307b130dc3dc5d125f3f669af2
```

## Evidence

```text
test/22-BPMN-STRUCTURED-ADAPTER-PRESSURE-TEST-SPEC-v0.1.md
test/23-BPMN-STRUCTURED-ADAPTER-PRESSURE-TEST-RESULT-v0.1.md

B01–B20
20 / 20 PASS
```

---

# What is frozen

P2-02 design/architecture now establishes:

```text
BPMN native bytes/structure are preserved source evidence
BPMN IDs remain distinct from TALOS canonical IDs
one definitions document may yield 0..N semantic scopes
participant/pool semantics remain distinct from lanes
sequence flow remains distinct from message flow
gateway subtype is preserved before canonical role inference
event class/definition/context are preserved separately
boundary-event attachment + cancelActivity are first-class evidence
subprocess/call activity/event subprocess/transaction distinctions survive
data associations/annotations do not become control flow
conditions/default flows remain source expressions/refs
BPMN DI remains presentation evidence
vendor extensions remain source-specific evidence
isExecutable remains distinct from TALOS readiness
unsupported BPMN constructs may remain evidence with zero canonical mapping
unresolved references remain unresolved rather than fabricated
partial/failed parse never destroys preserved source
BPMN evidence can enter Canvas Review/Projection without provenance transfer
```

---

# Support boundary

This freeze means:

```text
BPMN ADAPTER DESIGN / ARCHITECTURE     ✅ PROVEN
```

It does not mean:

```text
BPMN PARSER IMPLEMENTATION             ❌ NOT BUILT
BPMN PRODUCTION INTEROPERABILITY       ❌ NOT TESTED
BPMN SOURCE FAMILY                     ❌ NOT YET IMPLEMENTED/SUPPORTED
```

The source family becomes implemented/supported only after a later BUILD/implementation gate and executable conformance tests.

---

# Reopening rule

If later image/language/automation/cross-adapter evidence exposes a common-intake or BPMN-contract defect:

```text
create explicit new version
→ rerun B01–B20
→ rerun affected prior Canvas conformance
```

No silent edits to frozen artifacts.

---

# Next Phase-2 gate

```text
P2-03 — IMAGE / PERCEPTION ADAPTER
```

BUILD remains closed.
