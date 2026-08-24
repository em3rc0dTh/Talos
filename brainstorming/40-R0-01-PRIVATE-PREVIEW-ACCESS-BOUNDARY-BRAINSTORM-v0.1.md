# R0-01 — Private Preview Access Boundary — Brainstorm v0.1

Status: **ACTIVE / BUILDING**  
Date: **2026-08-24**

## Starting truth

I9-07 closes the technical authority chain from source intake to explicitly authorized real Temporal workflow execution.

That does **not** make the HTTP surface releasable.

The one-app reference API is intentionally an engineering shell: it is reachable without authentication and accepts caller-supplied actor labels. Those properties are acceptable for the proven reference slice but not for a private technical preview.

## R0-01 problem

Create the smallest release boundary that makes the proven I9 engine usable by one invited private-preview operator without inventing multi-tenancy or changing domain authority semantics.

## Governing law

```text
TECHNICALLY EXECUTABLE
    !=
PRIVATE-PREVIEW ACCESS AUTHORIZED
```

and:

```text
BEARER AUTHENTICATED
    !=
WORKSPACE AUTHORIZED
    !=
ACTOR AUTHORIZED
    !=
BUSINESS / AUTOMATION / DEPLOYMENT / EXECUTION AUTHORITY
```

R0 access control may decide **who can reach Talos**. It must never manufacture the domain approvals already modeled by I8/I9.

## Chosen R0-01 scope

One Talos private-preview process hosts exactly:

- one configured workspace;
- one configured actor;
- one private bearer credential;
- one loopback-only I9 engine behind an access gateway.

Every protected request must satisfy all three access conditions before it can reach I9.

## Explicit non-goals

R0-01 does **not** claim:

- multi-tenant SaaS isolation;
- account signup/login;
- roles or organization membership;
- OAuth/OIDC;
- billing;
- production secrets management;
- production deployment readiness.

Those remain later release gates.

## Pressure-test cases

R0-01 must reject before domain side effects:

1. missing bearer token;
2. wrong bearer token;
3. wrong workspace header;
4. wrong actor header;
5. body-level attempt to impersonate another authority actor;
6. weak private-preview token configuration.

It must also avoid false positives on business data fields carried inside `facts` or `capabilityInputs`.
