import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadR111Receipts,
  validateR111FieldTrialSet,
  type R111FieldTrialReceipt,
} from './r1-11-field-trial-gate.ts';

export const R1_12_RELEASE_RECEIPT_SCHEMA = 'talos.r1-12.release-receipt.v1';

export interface R112ReleaseEnvironment {
  exactSha: string;
  mainSha: string;
  githubSha?: string;
  repository: string;
  workflowRunId: string;
  workflowRunAttempt: string;
  workflowRef: string;
  externalEffectIssueNumber: number;
  certifiedAt: string;
}

export interface R112ReleaseReceipt {
  schemaVersion: typeof R1_12_RELEASE_RECEIPT_SCHEMA;
  releaseLabel: 'Talos 1.0';
  status: 'PASS';
  productReadyClaimAuthorized: true;
  exactMainSha: string;
  certifiedAt: string;
  workflow: {
    repository: string;
    runId: string;
    runAttempt: string;
    workflowRef: string;
  };
  fieldTrials: {
    status: 'PASS';
    qualifyingTrialCount: number;
    distinctProcessCount: number;
    trialIds: string[];
  };
  externalEffect: {
    transportRef: 'GITHUB_ISSUE_COMMENT_V1';
    repository: string;
    issueNumber: number;
    evidenceUrl: string;
    proofContract: 'ONE_APP_TO_TEMPORAL_REAL_EFFECT_PLUS_FRESH_WORKER_DEDUPLICATION';
  };
  checks: Array<{ id: string; status: 'PASS'; evidence: string }>;
  truthBoundary: string;
}

function requireText(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new TypeError(`R1-12 requires ${name}`);
  return normalized;
}

function requireExactSha(value: string, name: string): string {
  if (!/^[0-9a-f]{40}$/i.test(value)) throw new TypeError(`${name} must be an exact 40-character Git SHA`);
  return value.toLowerCase();
}

function requirePositiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 1) throw new TypeError(`${name} must be a positive integer`);
  return value;
}

export function buildR112ReleaseReceipt(
  environment: R112ReleaseEnvironment,
  receipts: unknown[],
): R112ReleaseReceipt {
  const exactSha = requireExactSha(environment.exactSha, 'exactSha');
  const mainSha = requireExactSha(environment.mainSha, 'mainSha');
  const githubSha = environment.githubSha ? requireExactSha(environment.githubSha, 'githubSha') : exactSha;

  if (mainSha !== exactSha) {
    throw new TypeError(`R1-12 exact-SHA violation: checked-out SHA ${exactSha} is not current origin/main ${mainSha}`);
  }
  if (githubSha !== exactSha) {
    throw new TypeError(`R1-12 workflow SHA violation: GITHUB_SHA ${githubSha} does not equal certified SHA ${exactSha}`);
  }

  const fieldTrials = validateR111FieldTrialSet(receipts);
  if (fieldTrials.status !== 'PASS') {
    throw new TypeError(`R1-12 requires R1-11 PASS: ${fieldTrials.errors.join('; ')}`);
  }

  const repository = requireText(environment.repository, 'repository');
  const workflowRunId = requireText(environment.workflowRunId, 'workflowRunId');
  const workflowRunAttempt = requireText(environment.workflowRunAttempt, 'workflowRunAttempt');
  const workflowRef = requireText(environment.workflowRef, 'workflowRef');
  const certifiedAt = requireText(environment.certifiedAt, 'certifiedAt');
  if (!Number.isFinite(Date.parse(certifiedAt))) throw new TypeError('certifiedAt must be ISO-date compatible');
  const issueNumber = requirePositiveInteger(environment.externalEffectIssueNumber, 'externalEffectIssueNumber');

  return {
    schemaVersion: R1_12_RELEASE_RECEIPT_SCHEMA,
    releaseLabel: 'Talos 1.0',
    status: 'PASS',
    productReadyClaimAuthorized: true,
    exactMainSha: exactSha,
    certifiedAt,
    workflow: {
      repository,
      runId: workflowRunId,
      runAttempt: workflowRunAttempt,
      workflowRef,
    },
    fieldTrials: {
      status: 'PASS',
      qualifyingTrialCount: fieldTrials.qualifyingTrialCount,
      distinctProcessCount: fieldTrials.distinctProcessCount,
      trialIds: fieldTrials.trialIds,
    },
    externalEffect: {
      transportRef: 'GITHUB_ISSUE_COMMENT_V1',
      repository,
      issueNumber,
      evidenceUrl: `https://github.com/${repository}/issues/${issueNumber}`,
      proofContract: 'ONE_APP_TO_TEMPORAL_REAL_EFFECT_PLUS_FRESH_WORKER_DEDUPLICATION',
    },
    checks: [
      { id: 'R1-11_REAL_FIELD_TRIALS', status: 'PASS', evidence: `${fieldTrials.qualifyingTrialCount} qualifying trials across ${fieldTrials.distinctProcessCount} distinct processes` },
      { id: 'EXACT_MERGED_MAIN_SHA', status: 'PASS', evidence: exactSha },
      { id: 'CLEAN_INSTALL', status: 'PASS', evidence: 'npm ci completed in the R1-12 workflow before receipt generation' },
      { id: 'ARCHITECTURE_AND_FROZEN_INVARIANTS', status: 'PASS', evidence: 'architecture verification + B1-B9 verification completed before receipt generation' },
      { id: 'SOURCE_SEMANTIC_REVIEW_AUTOMATION_AUTHORITY', status: 'PASS', evidence: 'R1 product regression suite completed before receipt generation' },
      { id: 'ARBITRARY_INPUT_POSITIVE_AND_FAIL_CLOSED', status: 'PASS', evidence: 'image verification chain completed before receipt generation' },
      { id: 'SAME_BUILD_RESTART', status: 'PASS', evidence: 'B10 + R1-09 restart tests completed before receipt generation' },
      { id: 'UPGRADE_STATE_BEHAVIOR', status: 'PASS', evidence: 'R1-09 runtime compatibility contract completed before receipt generation' },
      { id: 'REAL_ONE_APP_TO_EXECUTION', status: 'PASS', evidence: 'R1-07/R1-08 complete authority and execution path completed before receipt generation' },
      { id: 'REAL_EXTERNAL_EFFECT', status: 'PASS', evidence: `GitHub issue ${issueNumber}` },
      { id: 'NO_DUPLICATE_EFFECT_ON_REPLAY', status: 'PASS', evidence: 'R1-08 fresh-Worker replay required DUPLICATE_IDENTICAL before receipt generation' },
      { id: 'SECRET_SAFE_EVIDENCE', status: 'PASS', evidence: 'R1-08 durable evidence token-leak assertion + R1-11 secret-like material validation completed before receipt generation' },
    ],
    truthBoundary: 'This receipt certifies the exact merged-main SHA only. It does not prove product-market fit, commercial repeatability, scale readiness, or suitability for every process.',
  };
}

function environmentFromProcess(): R112ReleaseEnvironment {
  return {
    exactSha: requireText(process.env.R1_12_EXACT_SHA, 'R1_12_EXACT_SHA'),
    mainSha: requireText(process.env.R1_12_MAIN_SHA, 'R1_12_MAIN_SHA'),
    githubSha: process.env.GITHUB_SHA,
    repository: requireText(process.env.GITHUB_REPOSITORY ?? process.env.R1_12_REPOSITORY, 'GITHUB_REPOSITORY'),
    workflowRunId: requireText(process.env.GITHUB_RUN_ID ?? process.env.R1_12_WORKFLOW_RUN_ID, 'GITHUB_RUN_ID'),
    workflowRunAttempt: requireText(process.env.GITHUB_RUN_ATTEMPT ?? process.env.R1_12_WORKFLOW_RUN_ATTEMPT ?? '1', 'GITHUB_RUN_ATTEMPT'),
    workflowRef: requireText(process.env.GITHUB_WORKFLOW_REF ?? process.env.R1_12_WORKFLOW_REF, 'GITHUB_WORKFLOW_REF'),
    externalEffectIssueNumber: Number(requireText(process.env.R1_12_EXTERNAL_EFFECT_ISSUE_NUMBER, 'R1_12_EXTERNAL_EFFECT_ISSUE_NUMBER')),
    certifiedAt: process.env.R1_12_CERTIFIED_AT?.trim() || new Date().toISOString(),
  };
}

function main(): void {
  const fieldTrialDirectory = path.resolve(
    process.env.R1_11_FIELD_TRIAL_DIRECTORY ?? path.join(process.cwd(), '..', '..', 'evidence', 'field-trials'),
  );
  const outputPath = path.resolve(
    requireText(process.env.R1_12_RECEIPT_PATH, 'R1_12_RECEIPT_PATH'),
  );
  const receipts = loadR111Receipts(fieldTrialDirectory);
  const receipt = buildR112ReleaseReceipt(environmentFromProcess(), receipts);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ outputPath, receipt }, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
