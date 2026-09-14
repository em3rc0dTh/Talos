# R1-11 Field Trial Evidence

This directory is the only repository location that the R1-11 machine gate reads for qualifying Talos 1.0 field-trial receipts.

A file counts only when:

- it ends in `.json`;
- it validates against `talos.r1-11.field-trial.v1`;
- it represents actual field work, not a fixture, quarry, developer smoke test, CI scenario, or LLM-authored substitute;
- the participant is external to the Talos implementation team for that trial;
- it contains no credentials, tokens, private keys, or secret-like material.

R1-11 requires at least **two valid receipts for two distinct real process fingerprints**.

## Human procedure

For each trial:

1. choose a real operational/customer process that is not an implementation fixture;
2. have a real business/operator participant use or review the Talos product journey;
3. preserve the original process source outside this JSON receipt according to the organization's privacy rules;
4. record only sanitized evidence references in the receipt;
5. measure the required metrics during the trial instead of estimating them later;
6. record negative observations and blocking defects as observed;
7. attest the receipt after the session;
8. place the final JSON file in this directory and run the validator.

Validator:

```bash
cd build/reference-vertical-slice
node --experimental-strip-types ./scripts/r1-11-field-trial-gate.ts ../../evidence/field-trials
```

A validator `PASS` is necessary but not sufficient by itself: a human must still confirm that the receipts correspond to actual field work.

## Receipt skeleton

Do not save this example as a `.json` file until it contains real observed values.

```json
{
  "schemaVersion": "talos.r1-11.field-trial.v1",
  "trialId": "FT-2026-001",
  "processOrigin": {
    "kind": "REAL_OPERATIONAL_PROCESS",
    "organizationAlias": "sanitized-org-alias",
    "description": "Sanitized description of the real process exercised"
  },
  "participant": {
    "role": "Business operator",
    "externalToImplementationTeam": true
  },
  "processFingerprint": "stable-non-secret-fingerprint-for-this-real-process",
  "inputKinds": ["BPMN"],
  "metrics": {
    "semanticAccuracyReviewed": 0.0,
    "reviewerEffortMinutes": 0,
    "questionUsefulnessRating1to5": 1,
    "correctionUsabilityRating1to5": 1,
    "suggestionQualityRating1to5": 1,
    "authorityClarityRating1to5": 1,
    "timeToReviewedMinutes": 0,
    "timeToApprovedMinutes": null,
    "executionOutcome": "NOT_ATTEMPTED",
    "operatorFrictionNotes": "Observed friction; do not hide negative results.",
    "defects": []
  },
  "evidenceRefs": ["sanitized:evidence-reference"],
  "attestedBy": "sanitized-attestor-id-or-role",
  "attestedAt": "2026-09-14T00:00:00.000Z"
}
```

## Privacy boundary

The receipt is a release-evidence summary, not a customer-data dump. Do not commit raw credentials, access tokens, customer secrets, private keys, sensitive personal data, or confidential source artifacts merely to satisfy R1-11.

`organizationAlias`, `attestedBy`, descriptions, and evidence references may be sanitized as long as they remain sufficient to audit that two real and distinct field trials occurred.

## Relationship to R1-12

The exact-SHA R1-12 workflow fails before release certification unless this directory contains a qualifying R1-11 PASS set. A field-trial receipt does not itself authorize deployment or execution and does not prove product-market fit.
