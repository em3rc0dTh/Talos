import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

function usage() {
  console.error('Usage: node ./scripts/r1-ollama-vision-benchmark.mjs "C:\\path\\to\\image.png" [model] [timeoutSeconds]');
  process.exit(1);
}

const imageArg = process.argv[2];
if (!imageArg) usage();

const imagePath = resolve(imageArg);
const model = process.argv[3] || 'qwen3-vl:2b-instruct';
const timeoutSeconds = Number(process.argv[4] || '120');
if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 1 || timeoutSeconds > 600) {
  throw new TypeError('timeoutSeconds must be between 1 and 600');
}

const imageBytes = readFileSync(imagePath);
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
const started = performance.now();

console.log('\nTalos R1 Ollama vision micro-benchmark');
console.log(`Image   : ${imagePath}`);
console.log(`Model   : ${model}`);
console.log(`Bytes   : ${imageBytes.byteLength}`);
console.log(`Timeout : ${timeoutSeconds}s`);
console.log('Task    : one-word visual classification; no Talos schema, no canonicalization\n');

try {
  const response = await fetch('http://127.0.0.1:11434/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: 'Look at the image. Reply with exactly one word: PROCESS if it contains a business process/workflow diagram, otherwise NOT_PROCESS.',
        images: [imageBytes.toString('base64')],
      }],
      stream: false,
      think: false,
      options: {
        temperature: 0,
        num_predict: 8,
      },
    }),
    signal: controller.signal,
  });

  const elapsedMs = performance.now() - started;
  const text = await response.text();
  if (!response.ok) {
    console.error(`HTTP ${response.status} after ${(elapsedMs / 1000).toFixed(1)}s`);
    console.error(text);
    process.exitCode = 2;
  } else {
    const result = JSON.parse(text);
    console.log(`HTTP              : ${response.status}`);
    console.log(`Wall seconds      : ${(elapsedMs / 1000).toFixed(1)}`);
    console.log(`Answer            : ${String(result?.message?.content ?? '').trim()}`);
    console.log(`Done reason       : ${result?.done_reason ?? 'unknown'}`);
    if (typeof result?.load_duration === 'number') console.log(`Load ms           : ${(result.load_duration / 1e6).toFixed(1)}`);
    if (typeof result?.prompt_eval_duration === 'number') console.log(`Prompt eval ms    : ${(result.prompt_eval_duration / 1e6).toFixed(1)}`);
    if (typeof result?.eval_duration === 'number') console.log(`Generation ms     : ${(result.eval_duration / 1e6).toFixed(1)}`);
    if (typeof result?.total_duration === 'number') console.log(`Ollama total ms   : ${(result.total_duration / 1e6).toFixed(1)}`);
    console.log(`\nBENCHMARK RESULT: ${basename(imagePath)} / ${model}`);
    process.exitCode = 0;
  }
} catch (error) {
  const elapsedMs = performance.now() - started;
  const aborted = error instanceof Error && (error.name === 'AbortError' || /aborted/i.test(error.message));
  console.error(`\n${aborted ? 'TIMEOUT' : 'ERROR'} after ${(elapsedMs / 1000).toFixed(1)}s`);
  console.error(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
  process.exitCode = aborted ? 3 : 4;
} finally {
  clearTimeout(timer);
}
