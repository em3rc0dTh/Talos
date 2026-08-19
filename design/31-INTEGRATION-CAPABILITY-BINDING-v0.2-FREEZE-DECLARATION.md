# TALOS — Integration / Capability Binding v0.2 Freeze Declaration

Status: **FROZEN — T4-03**
Date: **2026-08-19**

## Exact tested design

```text
path: design/30-INTEGRATION-CAPABILITY-BINDING-CONTRACT-v0.2.md
creation commit: 490562c6d02a2535568f3283446b6a61b74595d0
blob: 132b22baa7c188b67e80b0321005048c02e519ed
```

## Exact tested architecture

```text
path: arch/16-INTEGRATION-CAPABILITY-BINDING-ARCHITECTURE-v0.2.md
creation commit: 195fafd11c077b5c76de11c6fa461bd4a5d47c5c
blob: a28f33412f74cdb85febef8ebd8bb721497a1ddf
```

## Evidence

```text
test/61-INTEGRATION-CAPABILITY-BINDING-PRESSURE-TEST-SPEC-v0.1.md
test/62-INTEGRATION-CAPABILITY-BINDING-PRESSURE-TEST-RESULT-v0.1.md
test/63-INTEGRATION-CAPABILITY-BINDING-REGRESSION-RESULT-v0.1.md
G01-G36: 36 PASS / 0 FAIL
```

## Frozen laws

```text
match != selection != binding
binding pins exact requirement/offering revisions
logical I/O/outcome != provider payload/status
binding design != environment realization
credential resolution contract != secret/environment handle
configuration resolution slot != environment value
secret/environment rotation != binding design change
READY_FOR_EXECUTION_DESIGN != deployable/runnable
CapabilityBinding != Temporal Activity
```

Future semantic changes require a new version and new regression evidence. Exact tested files remain unchanged.

BUILD remains closed.
