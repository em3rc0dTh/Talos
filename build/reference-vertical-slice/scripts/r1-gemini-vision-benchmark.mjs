import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function usage() {
  console.error('Usage: node ./scripts/r1-gemini-vision-benchmark.mjs "C:\\path\\to\\image.png" [model] [timeoutSeconds]');
  process.exitCode = 1;
}

const imageArg = process.argv[2];
if (!imageArg) {
  usage();
  process.exit();
}

const model = process.argv[3] || 'gemini-2.5-flash';
const timeoutSeconds = Number(process.argv[4] || '90');
if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 1 || timeoutSeconds > 300) {
  throw new TypeError('timeoutSeconds must be between 1 and 300');
}

const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) {
  console.error('GEMINI_API_KEY is not configured. Use r1-gemini-vision-benchmark.ps1 for hidden-key input.');
  process.exitCode = 2;
  process.exit();
}

const imagePath = resolve(imageArg);
const imageBytes = readFileSync(imagePath);
const imageBase64 = imageBytes.toString('base64');
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

function candidateText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((part) => typeof part?.text === 'string' ? part.text : '').join('').trim();
}

function usageSummary(payload) {
  const usage = payload?.usageMetadata ?? {};
  return {
    promptTokens: usage.promptTokenCount ?? null,
    outputTokens: usage.candidatesTokenCount ?? null,
    totalTokens: usage.totalTokenCount ?? null,
  };
}

async function runProbe(name, prompt, generationConfig) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  const started = performance.now();
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: 'image/png', data: imageBase64 } },
            { text: prompt },
          ],
        }],
        generationConfig,
      }),
      signal: controller.signal,
    });

    const elapsedMs = performance.now() - started;
    const rawText = await response.text();
    let payload;
    try { payload = rawText ? JSON.parse(rawText) : {}; } catch { payload = { rawText }; }

    console.log(`\n=== ${name} ===`);
    console.log(`HTTP         : ${response.status}`);
    console.log(`Wall seconds : ${(elapsedMs / 1000).toFixed(1)}`);

    if (!response.ok) {
      const message = payload?.error?.message ?? rawText.slice(0, 1000);
      console.log(`Error        : ${message}`);
      return { ok: false, status: response.status, elapsedMs, payload };
    }

    const candidate = payload?.candidates?.[0];
    const usage = usageSummary(payload);
    console.log(`Finish reason: ${candidate?.finishReason ?? 'unknown'}`);
    console.log(`Prompt tokens: ${usage.promptTokens ?? 'unknown'}`);
    console.log(`Output tokens: ${usage.outputTokens ?? 'unknown'}`);
    console.log(`Total tokens : ${usage.totalTokens ?? 'unknown'}`);
    const text = candidateText(payload);
    console.log('Answer:');
    console.log(text || '<EMPTY>');
    if (payload?.promptFeedback?.blockReason) console.log(`Prompt block : ${payload.promptFeedback.blockReason}`);
    if (candidate?.safetyRatings) console.log(`Safety       : ${JSON.stringify(candidate.safetyRatings)}`);
    return { ok: true, status: response.status, elapsedMs, payload, text };
  } catch (error) {
    const elapsedMs = performance.now() - started;
    const aborted = error instanceof Error && (error.name === 'AbortError' || /aborted/i.test(error.message));
    console.log(`\n=== ${name} ===`);
    console.log(`${aborted ? 'TIMEOUT' : 'ERROR'} after ${(elapsedMs / 1000).toFixed(1)}s`);
    console.log(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
    return { ok: false, status: aborted ? 'TIMEOUT' : 'ERROR', elapsedMs };
  } finally {
    clearTimeout(timer);
  }
}

console.log('\nTalos R1 Gemini direct vision benchmark');
console.log(`Image   : ${imagePath}`);
console.log(`Bytes   : ${imageBytes.byteLength}`);
console.log(`Model   : ${model}`);
console.log(`Timeout : ${timeoutSeconds}s per probe`);
console.log('Boundary: DIRECT GEMINI ONLY — no Talos admission, no fallback, no Canonical/BPMN');

const classify = await runProbe(
  'PROBE 1 — VISUAL CLASSIFICATION',
  'Look at the image. Reply with exactly one word: PROCESS if it contains a business process/workflow diagram, otherwise NOT_PROCESS.',
  { temperature: 0, maxOutputTokens: 16 },
);

const lite = await runProbe(
  'PROBE 2 — LITERAL VISUAL EXTRACTION',
  `Inspect the image as visual evidence only. Do not create BPMN and do not infer missing meaning. Return compact JSON with exactly these fields:\n{\n  "isProcess": boolean,\n  "visibleLabels": string[],\n  "visibleElementCount": number,\n  "visibleConnectorCount": number,\n  "uncertainties": string[]\n}\nCopy up to 20 visible process labels literally. Count visible process elements and visible connectors/arrows. If uncertain, report the uncertainty instead of guessing.`,
  { temperature: 0, maxOutputTokens: 512, responseMimeType: 'application/json' },
);

console.log('\n=== DIRECT GEMINI VERDICT ===');
console.log(`Classification probe : ${classify.ok ? 'HTTP_OK' : 'FAILED'}`);
console.log(`Extraction probe     : ${lite.ok ? 'HTTP_OK' : 'FAILED'}`);
if (classify.ok && /\bPROCESS\b/i.test(classify.text ?? '') && lite.ok) {
  console.log('RESULT               : GEMINI_DIRECT_VISION_WORKS');
  console.log('NEXT                 : Diagnose Talos Gemini structured request/schema mapping.');
} else if (!classify.ok) {
  console.log('RESULT               : GEMINI_DIRECT_PROVIDER_OR_MODEL_FAILURE');
  console.log('NEXT                 : Resolve model/API/provider before Talos perception changes.');
} else {
  console.log('RESULT               : GEMINI_DIRECT_VISION_INCONCLUSIVE');
  console.log('NEXT                 : Inspect the two raw probe answers above.');
}
