import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const launcher = readFileSync(path.join(ROOT, 'scripts', 'r1-image-temporal-field-start.ps1'), 'utf8');
const infraUp = readFileSync(path.join(ROOT, 'scripts', 'r1-field-infra-up.ps1'), 'utf8');
const infraDown = readFileSync(path.join(ROOT, 'scripts', 'r1-field-infra-down.ps1'), 'utf8');
const infraUpSh = readFileSync(path.join(ROOT, 'scripts', 'r1-field-infra-up.sh'), 'utf8');
const infraDownSh = readFileSync(path.join(ROOT, 'scripts', 'r1-field-infra-down.sh'), 'utf8');
const compose = readFileSync(path.join(ROOT, 'docker-compose.r1-field.yml'), 'utf8');

test('R1-11 field launcher discovers independent local AI redundancy over the Ollama HTTP contract', () => {
  assert.match(launcher, /\$tryLocalFallback = -not \[bool\]\$DisableLocalFallback/);
  assert.match(launcher, /Invoke-RestMethod[\s\S]*\/api\/tags/);
  assert.match(launcher, /TALOS_OLLAMA_FALLBACK_ENABLED = 'true'/);
  assert.match(launcher, /TALOS_OLLAMA_FALLBACK_URL = \$chatEndpoint/);
  assert.match(launcher, /TALOS_OLLAMA_AUTOMATION_FALLBACK_ENABLED = 'true'/);
  assert.match(launcher, /TALOS_OLLAMA_AUTOMATION_FALLBACK_URL = \$chatEndpoint/);
  assert.match(launcher, /Vision fallback/);
  assert.match(launcher, /Automation fallback/);
  assert.match(launcher, /AI redundancy/);
  assert.doesNotMatch(launcher, /Get-Command ollama|ollama list|ollama pull/);
});

test('R1-11 Docker Compose field stack owns Temporal, Ollama and idempotent model initialization', () => {
  assert.match(compose, /name:\s*talos-r1-field/);
  assert.match(compose, /temporal:\s*[\s\S]*temporalio\/temporal:latest/);
  assert.match(compose, /127\.0\.0\.1:17233:7233/);
  assert.match(compose, /127\.0\.0\.1:18233:8233/);
  assert.match(compose, /ollama:\s*[\s\S]*ollama\/ollama:latest/);
  assert.match(compose, /127\.0\.0\.1:11434:11434/);
  assert.match(compose, /talos_ollama_models:\/root\/\.ollama/);
  assert.match(compose, /ollama-init:/);
  assert.match(compose, /condition:\s*service_healthy/);
  assert.match(compose, /qwen3-vl:4b-instruct/);
  assert.match(compose, /ollama show/);
  assert.match(compose, /ollama pull/);
  assert.match(compose, /talos-r1-ollama-models/);
});

test('R1-11 PowerShell infra launcher supports native Windows Docker or Docker inside WSL', () => {
  assert.match(infraUp, /Get-Command docker/);
  assert.match(infraUp, /Get-Command wsl\.exe/);
  assert.match(infraUp, /wsl\.exe docker compose version/);
  assert.match(infraUp, /wsl\.exe wslpath -a \$ComposeFile/);
  assert.match(infraUp, /\$script:DockerMode = 'WSL'/);
  assert.match(infraUp, /Invoke-Docker compose -f \$script:ComposeFileForDocker up -d/);
  assert.match(infraDown, /Get-Command wsl\.exe/);
  assert.match(infraDown, /Invoke-Docker compose -f \$script:ComposeFileForDocker down/);
});

test('R1-11 field infra launcher waits for real Temporal and persisted Ollama model readiness', () => {
  assert.match(infraUp, /Wait-ForTcp '127\.0\.0\.1' 17233/);
  assert.match(infraUp, /http:\/\/127\.0\.0\.1:11434/);
  assert.match(infraUp, /api\/tags/);
  assert.match(infraUp, /Talos R1 field infrastructure READY/);
  assert.match(infraUp, /-RequireLocalFallback/);
});

test('R1-11 field infra migrates the known legacy Temporal container without deleting it', () => {
  assert.match(infraUp, /Stop-LegacyTemporalIfRunning/);
  assert.match(infraUp, /name=\^\/talos-temporal\$/);
  assert.match(infraUp, /Invoke-Docker stop talos-temporal/);
  assert.match(infraUp, /Legacy container stopped and preserved \(not deleted\)/);
  assert.doesNotMatch(infraUp, /(?:docker|Invoke-Docker) rm[^\n]*talos-temporal/);
});

test('R1-11 native WSL launcher uses Linux paths and the same Compose/model contract', () => {
  assert.match(infraUpSh, /docker compose -f "\$compose_file" up -d/);
  assert.match(infraUpSh, /\/dev\/tcp\/127\.0\.0\.1\/17233/);
  assert.match(infraUpSh, /ollama show "\$FALLBACK_MODEL"/);
  assert.match(infraUpSh, /Talos R1 field infrastructure READY/);
  assert.doesNotMatch(infraUpSh, /\\scripts\\|\.\\build\\/);
});

test('R1-11 field infra shutdown preserves Ollama model volume unless explicitly deleted', () => {
  assert.match(infraDown, /\[switch\]\$DeleteModelVolume/);
  assert.match(infraDown, /Invoke-Docker compose -f \$script:ComposeFileForDocker down -v/);
  assert.match(infraDown, /Invoke-Docker compose -f \$script:ComposeFileForDocker down/);
  assert.match(infraDown, /model volume preserved/);
  assert.match(infraDownSh, /DELETE_MODEL_VOLUME/);
  assert.match(infraDownSh, /docker compose -f "\$compose_file" down -v/);
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
  assert.match(launcher, /r1-field-infra-up\.ps1/);
});

test('R1-11 provider resilience does not weaken Temporal or authority gates', () => {
  assert.match(launcher, /TALOS_PRIVATE_PREVIEW_RUNTIME_MODE = 'TEMPORAL_EXECUTION'/);
  assert.match(launcher, /Talos will fail before serving if Temporal is not reachable/);
  assert.doesNotMatch(launcher, /automaticConfirmationAuthorized\s*=\s*true|automaticExecutionAuthorized\s*=\s*true/i);
});
