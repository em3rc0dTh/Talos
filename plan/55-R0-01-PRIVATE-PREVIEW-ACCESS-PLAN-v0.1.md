# R0-01 — Private Preview Access Closure Plan v0.1

Status: **ACTIVE**  
Date: **2026-08-24**

## Goal

Close the first Talos v0.1 Private Technical Preview release gate without modifying or bypassing the I9 domain authority chain.

## Release invariant

```text
I9 TECHNICAL EXECUTION CAPABILITY
        !=
PRIVATE-PREVIEW ACCESS AUTHORITY
```

R0-01 controls access to the engine only. It never grants business-process, automation-design, deployment or workflow-execution authority.

## Build scope

```text
R0 private-preview HTTP shell
+ one configured bearer token
+ one configured workspace
+ one configured actor
+ loopback-only I9 engine
+ actor anti-impersonation
+ actor binding on known control-plane commands
+ secret-safe health/status
```

## Certification matrix

| Gate | Required result |
|---|---|
| Architecture verification | PASS |
| R0-01 access/adversarial tests | PASS |
| Image/current authority regression | PASS |
| B7–B9 real Temporal regression | PASS |
| B10 restart regression | PASS |
| PR diff audit | only intended R0-01 product/test/docs/CI files |

## Adversarial cases

Must reject before I9 side effects:

- no bearer;
- incorrect bearer;
- wrong workspace;
- wrong actor;
- authority actor mismatch in request body;
- nested capability/runtime-policy actor impersonation;
- weak preview credential configuration.

Must preserve:

- opaque business data in `facts` and `capabilityInputs`;
- I9 domain approval ordering;
- one-shot deployment authority;
- one-shot workflow-start authority;
- exact revision/digest pinning;
- durable execution observations.

## No-go conditions

Do not merge if any of the following is true:

```text
R0 auth can be skipped
workspace mismatch reaches I9
actor mismatch reaches I9
bearer appears in proxy request or response
R0 gateway fabricates a domain approval
architecture verifier is weakened to permit the shell
existing I9/Temporal/restart regressions fail
UNKNOWN is represented as PASS
```

## Closure

On exact-head PASS across required gates:

```text
R0-01 ✅ CLOSED
        ↓
R0-02 Preview Configuration + Secret Contract
```
