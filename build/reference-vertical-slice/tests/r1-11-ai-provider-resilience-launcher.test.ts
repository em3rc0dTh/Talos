import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const launcher = readFileSync(path.join(ROOT, 'scripts', 'r1-image-temporal-field-start.ps1'), 'utf8');

test('R1-11 field launcher attempts independent local AI redundancy by default', () => {
  assert.match(launcher, /\$tryLocalFallback = -not \[bool\]\$DisableLocalFallback/);
  assert.match(launcher, /Get-Command ollama/);
  assert.match(launcher, /TALOS_OLLAMA_FALLBACK_ENABLED = 'true'/);
  assert.match(launcher, /TALOS_OLLAMA_AUTOMATION_FALLBACK_ENABLED = 'true'/);
  assert.match(launcher, /Vision fallback/);
  assert.match(launcher, /Automation fallback/);
  assert.match(launcher, /AI redundancy/);
});

test('R1-11 missing local fallback degrades provider redundancy without killing Talos by default', () => {
  assert.match(launcher, /DEGRADED_AI_REDUNDANCY/);
  assert.match(launcher, /Talos will start with degraded provider redundancy/);
  assert.match(launcher, /Talos remains available, but an unusable Gemini result will safe-stop AI-dependent work/);
  assert.doesNotMatch(
    launcher,
    /if \(-not \$localFallbackEnabled\) \{\s*throw ['\"]Local AI fallback/i,
  );
});

test('R1-11 release evidence can require provider redundancy explicitly', () => {
  assert.match(launcher, /\[switch\]\$RequireLocalFallback/);
  assert.match(launcher, /\$strictLocalFallback = \[bool\]\(\$EnableLocalFallback -or \$RequireLocalFallback\)/);
  assert.match(launcher, /Local AI fallback is required/);
});

test('R1-11 provider resilience does not weaken Temporal or authority gates', () => {
  assert.match(launcher, /TALOS_PRIVATE_PREVIEW_RUNTIME_MODE = 'TEMPORAL_EXECUTION'/);
  assert.match(launcher, /Talos will fail before serving if Temporal is not reachable/);
  assert.doesNotMatch(launcher, /automaticConfirmationAuthorized\s*=\s*true|automaticExecutionAuthorized\s*=\s*true/i);
});
