import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';

function fail(message, code = 1) {
  console.error(`\nTALOS R1 IMAGE FIELD PROBE FAILED\n${message}\n`);
  process.exit(code);
}

function gitSha() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'UNKNOWN';
  }
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

const imageArg = process.argv[2];
const baseUrl = (process.argv[3] || 'http://127.0.0.1:8787').replace(/\/$/, '');
const explicitReceipt = process.argv[4];

if (!imageArg) {
  fail('Usage: node ./scripts/r1-image-field-probe.mjs "C:\\path\\to\\quarry.png" [baseUrl] [receipt.json]');
}

const imagePath = resolve(imageArg);
if (extname(imagePath).toLowerCase() !== '.png') fail(`Talos image intake currently requires PNG. Got: ${imagePath}`);

let imageBytes;
try {
  imageBytes = readFileSync(imagePath);
} catch (error) {
  fail(`Cannot read image: ${imagePath}\n${error instanceof Error ? error.message : String(error)}`);
}

const localSha256 = sha256(imageBytes);
const currentGitSha = gitSha();

let statusResponse;
try {
  const response = await fetch(`${baseUrl}/api/status`);
  const text = await response.text();
  statusResponse = JSON.parse(text);
  if (!response.ok) fail(`Talos status endpoint returned HTTP ${response.status}: ${text}`);
} catch (error) {
  fail(`Cannot reach Talos at ${baseUrl}. Keep the launcher terminal running first.\n${error instanceof Error ? error.message : String(error)}`);
}

if (statusResponse?.imageInputIntegratedIntoOneApp !== true) {
  fail(`Talos reports image input is not active. Status:\n${JSON.stringify(statusResponse, null, 2)}`);
}
if (statusResponse?.image?.primarySelection !== 'GEMINI_API_KEY' && statusResponse?.image?.primarySelection !== 'EXPLICIT_TALOS_PROVIDER') {
  fail(`Unexpected primary perception selection: ${statusResponse?.image?.primarySelection ?? 'missing'}`);
}

console.log('\nTalos R1 image field probe');
console.log(`Git SHA       : ${currentGitSha}`);
console.log(`Image         : ${imagePath}`);
console.log(`Image SHA-256 : ${localSha256}`);
console.log(`Primary       : ${statusResponse?.image?.provider?.providerId ?? 'unknown'}`);
console.log(`Fallback      : ${statusResponse?.image?.automaticFallbackOnPrimaryInsufficiency ? 'configured/automatic' : 'not configured'}`);
console.log('Submitting exact PNG bytes to Talos...\n');

let imageResponse;
let httpStatus;
try {
  const response = await fetch(`${baseUrl}/api/input/image`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      imageBase64: imageBytes.toString('base64'),
      fileName: basename(imagePath),
      initiatedBy: 'em3rc0d-field-tester',
    }),
  });
  httpStatus = response.status;
  const text = await response.text();
  try {
    imageResponse = JSON.parse(text);
  } catch {
    fail(`Talos image endpoint returned non-JSON HTTP ${response.status}: ${text}`);
  }
} catch (error) {
  fail(`Talos image request failed: ${error instanceof Error ? error.message : String(error)}`);
}

const receipt = {
  schemaVersion: 'talos-r1-image-field-receipt-v0.1',
  testedAt: new Date().toISOString(),
  gitSha: currentGitSha,
  productBaseUrl: baseUrl,
  source: {
    fileName: basename(imagePath),
    absolutePath: imagePath,
    byteLength: imageBytes.byteLength,
    localSha256,
  },
  productStatus: {
    imageInputIntegratedIntoOneApp: statusResponse?.imageInputIntegratedIntoOneApp,
    primarySelection: statusResponse?.image?.primarySelection,
    provider: statusResponse?.image?.provider,
    fallback: statusResponse?.image?.fallback,
    deterministicPrimarySufficiencyGate: statusResponse?.image?.deterministicPrimarySufficiencyGate,
    automaticFallbackOnPrimaryInsufficiency: statusResponse?.image?.automaticFallbackOnPrimaryInsufficiency,
    runtimeMode: statusResponse?.runtimeMode,
  },
  imageRequest: {
    httpStatus,
    result: imageResponse,
  },
  verdict: {
    sourceIdentityMatchesTalos: imageResponse?.sourceContentSha256 === localSha256,
    resultStatus: imageResponse?.status ?? 'UNKNOWN',
    perceptionDecision: imageResponse?.perceptionDecision ?? 'UNKNOWN',
    routingDecision: imageResponse?.perceptionRouting?.decision ?? 'SINGLE_PROVIDER_NO_ROUTING_RECORD',
    automaticFallbackTriggered: imageResponse?.perceptionRouting?.automaticFallbackTriggered ?? false,
    selectedProviderId: imageResponse?.perceptionRouting?.selectedProviderId ?? statusResponse?.image?.provider?.providerId ?? 'UNKNOWN',
    canonicalBoundaryCrossed: imageResponse?.status === 'BPMN_READY_FOR_PROCESS_REVIEW',
    safeStop: imageResponse?.status === 'SAFE_STOP_BEFORE_CANONICAL',
    automaticConfirmationAuthorized: imageResponse?.automaticConfirmationAuthorized ?? false,
    automaticFreezeAuthorized: imageResponse?.automaticFreezeAuthorized ?? false,
    automaticExecutionAuthorized: imageResponse?.automaticExecutionAuthorized ?? false,
  },
};

const receiptPath = explicitReceipt
  ? resolve(explicitReceipt)
  : join(dirname(imagePath), `${basename(imagePath, extname(imagePath))}.talos-${timestamp()}.json`);
writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');

console.log('Result');
console.log(`  HTTP status              : ${httpStatus}`);
console.log(`  Talos status             : ${receipt.verdict.resultStatus}`);
console.log(`  Perception admission     : ${receipt.verdict.perceptionDecision}`);
console.log(`  Routing                  : ${receipt.verdict.routingDecision}`);
console.log(`  Automatic fallback       : ${receipt.verdict.automaticFallbackTriggered}`);
console.log(`  Selected provider        : ${receipt.verdict.selectedProviderId}`);
console.log(`  Exact source hash match  : ${receipt.verdict.sourceIdentityMatchesTalos}`);
console.log(`  Canonical boundary       : ${receipt.verdict.canonicalBoundaryCrossed ? 'crossed into review candidate' : 'not crossed'}`);
console.log(`  Safe stop                : ${receipt.verdict.safeStop}`);
console.log(`  Auto confirmation        : ${receipt.verdict.automaticConfirmationAuthorized}`);
console.log(`  Auto execution           : ${receipt.verdict.automaticExecutionAuthorized}`);
console.log(`\nReceipt written: ${receiptPath}\n`);

if (!receipt.verdict.sourceIdentityMatchesTalos) {
  fail('FAIL: Talos source content hash does not match the exact PNG bytes submitted.', 3);
}
if (receipt.verdict.automaticConfirmationAuthorized || receipt.verdict.automaticFreezeAuthorized || receipt.verdict.automaticExecutionAuthorized) {
  fail('FAIL: perception crossed a forbidden authority boundary.', 4);
}
if (httpStatus >= 500) {
  fail(`FAIL: Talos returned server error HTTP ${httpStatus}.`, 5);
}

if (receipt.verdict.safeStop) {
  console.log('FIELD RESULT: SAFE STOP. This is valid fail-closed evidence; send the receipt to Jett for diagnosis.');
  process.exit(2);
}
if (receipt.verdict.canonicalBoundaryCrossed) {
  console.log('FIELD RESULT: PERCEPTION ROUTE REACHED BPMN REVIEW CANDIDATE. Send the receipt to Jett.');
  process.exit(0);
}

console.log('FIELD RESULT: NON-TERMINAL/UNKNOWN RESPONSE. Send the receipt to Jett for review.');
process.exit(6);
