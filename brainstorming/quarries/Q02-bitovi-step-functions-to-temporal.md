# QUARRY-02 — bitovi/aws-step-functions-to-temporal-migration

Status: **RESEARCH SOURCE / HIGH VALUE**

Source: `bitovi/aws-step-functions-to-temporal-migration`

## Why this quarry matters

This repository is closer to the long-term TALOS transformation problem than the earlier BPMN proof of concept because it explores migration from one real orchestration representation into Temporal while preserving the underlying behavior.

Conceptually:

```text
AWS Step Functions
Lambda
DynamoDB
API Gateway
        │
        │ semantic/implementation migration
        ↓
Temporal Workflow
Temporal Activities
PostgreSQL
FastAPI
```

## Useful patterns

The repository documents not only code but also architecture and migration reasoning.

Important concepts include:

- source-to-target behavior preservation;
- explicit API boundary;
- worker boundary;
- durable Temporal waits;
- retry policies;
- idempotent Activity behavior;
- database access separation;
- workflow identity;
- implementation notes and migration journals;
- operational architecture.

## TALOS extraction

TALOS should learn the migration discipline rather than the exact implementation.

A TALOS importer for an existing automation system should identify:

```text
Source State / Task
Source control-flow
Source variables
Source wait semantics
Source retry semantics
Source failure semantics
Source integrations
Source persistence assumptions
Source identity/correlation
```

and preserve those facts in the canonical process model before designing a Temporal representation.

## Resulting TALOS principle

> Existing workflow systems are another process-expression source. TALOS must recover their semantics before translating their implementation.

This applies not only to AWS Step Functions but eventually to systems such as n8n, other workflow engines, low-code automations and internal orchestrators.
