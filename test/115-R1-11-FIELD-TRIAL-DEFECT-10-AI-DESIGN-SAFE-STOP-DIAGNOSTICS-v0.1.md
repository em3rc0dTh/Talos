# R1-11 FIELD TRIAL DEFECT 10 — AI DESIGN SAFE-STOP DIAGNOSTICS v0.1

Date: 2026-09-08
Gate: R1-11 domain-agnostic real-user field trial
Status: FIX IMPLEMENTED — FIELD RE-TEST REQUIRED

## Observation

After a confirmed real process reached the governed AI Automation Designer, the product stopped safely with:

```text
AI design stopped safely because material design information is unresolved.
Review the AI questions below...
```

No questions were displayed. After the bounded automatic retry, the outer product state reported:

```text
Automation design could not settle automatically. Review the design state or try again.
```

No capability binding, deployment authority or workflow execution authority was created, so the authority boundary behaved correctly. The product diagnostics did not.

## Root cause

`AutomationProposalRoutingResult` already preserves attempt evidence for primary and optional fallback providers:

- `result`: `COMPLETE | PARTIAL | PROVIDER_FAILURE | POLICY_REJECTION`
- `providerId`
- `modelRef`
- `pipelineVersion`
- optional `proposal`
- optional `diagnostic`

The One-App AI Automation UI rendered unresolved questions only from an unresolved proposal. When both attempts had no proposal, `unresolvedAttempt()` returned null, so no question could exist. The UI nevertheless used copy that always told the user to review questions.

The R1-11 release-closure layer then performed its existing single bounded retry and, if unresolved again, surfaced only a generic terminal message.

Therefore the exact routing evidence existed but was hidden from the user.

## Fix

`one-app-product-ai-automation-page.ts` now distinguishes two safe-stop classes:

### A — reviewable partial proposal with material questions

Talos shows the actual business/design questions.

### B — no reviewable proposal produced

Talos explicitly says no reviewable proposal was produced and renders `Why Talos stopped` with each available attempt:

```text
Primary  · <result> · <provider/model> · <diagnostic>
Fallback · <result> · <provider/model> · <diagnostic>
```

The UI includes governed fallback text when a diagnostic string is absent for a known result class, but it never invents a business question or converts a provider failure into business meaning.

## Authority invariant

This change is observability only.

It creates no:

- capability binding;
- automation approval;
- deployment authority;
- execution authority;
- workflow-start authority.

`UNRESOLVED_AFTER_FALLBACK` remains fail-closed.

## Regression evidence

Updated:

`build/reference-vertical-slice/tests/r1-11-ai-automation-primary-product-path.test.ts`

The regression asserts that unresolved routing without a proposal:

- renders `Why Talos stopped`;
- exposes provider/policy diagnostics;
- distinguishes `POLICY_REJECTION`, `PROVIDER_FAILURE`, and `PARTIAL` evidence;
- only claims business/design questions when material questions actually exist;
- removes the misleading unconditional `Review the AI questions below` copy.

## Field re-test acceptance

Re-run the same confirmed process on the exact post-fix SHA.

If the AI design succeeds, continue the normal governed journey.

If it safe-stops again, the product must show enough routing evidence to classify the failure without opening browser devtools or inspecting the database.

That diagnostic output becomes the evidence for the next defect, if any.

## Release implication

R1-11 remains open. This field defect improves diagnosability and prevents generic safe-stop UX from hiding whether the actual cause is provider availability, proposal-policy rejection, or unresolved proposal material.
