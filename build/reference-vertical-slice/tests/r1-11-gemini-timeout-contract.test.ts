import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const composePath = new URL('../../../docker-compose.field-trial.gemini.yml', import.meta.url);
const envExamplePath = new URL('../../../.env.field-trial.gemini.example', import.meta.url);

test('R1-11 Gemini field-trial timeout cannot exceed the Talos runtime provider ceiling', async () => {
  const [compose, envExample] = await Promise.all([
    readFile(composePath, 'utf8'),
    readFile(envExamplePath, 'utf8'),
  ]);

  assert.match(compose, /TALOS_IMAGE_PERCEPTION_TIMEOUT_MS:\s*"120000"/);
  assert.doesNotMatch(compose, /TALOS_IMAGE_PERCEPTION_TIMEOUT_MS:\s*\$\{/);
  assert.match(envExample, /^TALOS_IMAGE_PERCEPTION_TIMEOUT_MS=120000$/m);
  assert.match(compose, /GEMINI_TIMEOUT_MS:\s*\$\{GEMINI_TIMEOUT_MS:-15000\}/);
  assert.match(envExample, /^GEMINI_TIMEOUT_MS=15000$/m);
  assert.doesNotMatch(compose + envExample, /330000/);
});
