import test from 'node:test';
import assert from 'node:assert/strict';
import { createTransientProviderRetryFetch } from '../apps/reference-api/src/transient-provider-fetch.ts';

const noDelay = async () => undefined;

function request(fetchImpl: typeof fetch) {
  return fetchImpl('https://provider.example.test/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ request: 'perception' }),
  });
}

test('R1-11 transient Gemini transport retries 503 and returns the successful replay-safe response', async () => {
  let calls = 0;
  const baseFetch = (async () => {
    calls += 1;
    return calls === 1
      ? new Response('temporarily unavailable', { status: 503 })
      : new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  const fetchImpl = createTransientProviderRetryFetch(baseFetch, { maxAttempts: 3, retryDelayMs: [0, 0], sleep: noDelay });
  const response = await request(fetchImpl);
  assert.equal(response.status, 200);
  assert.equal(calls, 2);
});

test('R1-11 transient Gemini transport never retries non-transient 4xx responses', async () => {
  let calls = 0;
  const baseFetch = (async () => {
    calls += 1;
    return new Response('bad request', { status: 400 });
  }) as typeof fetch;
  const fetchImpl = createTransientProviderRetryFetch(baseFetch, { maxAttempts: 3, retryDelayMs: [0, 0], sleep: noDelay });
  const response = await request(fetchImpl);
  assert.equal(response.status, 400);
  assert.equal(calls, 1);
});

test('R1-11 transient Gemini transport remains bounded and returns the final 503 after exhaustion', async () => {
  let calls = 0;
  const baseFetch = (async () => {
    calls += 1;
    return new Response(`unavailable-${calls}`, { status: 503 });
  }) as typeof fetch;
  const fetchImpl = createTransientProviderRetryFetch(baseFetch, { maxAttempts: 3, retryDelayMs: [0, 0], sleep: noDelay });
  const response = await request(fetchImpl);
  assert.equal(response.status, 503);
  assert.equal(await response.text(), 'unavailable-3');
  assert.equal(calls, 3);
});

test('R1-11 replay-safe provider transport retries a network failure once without changing request content', async () => {
  let calls = 0;
  const bodies: string[] = [];
  const baseFetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    calls += 1;
    bodies.push(String(init?.body ?? ''));
    if (calls === 1) throw new TypeError('temporary network failure');
    return new Response('ok', { status: 200 });
  }) as typeof fetch;
  const fetchImpl = createTransientProviderRetryFetch(baseFetch, { maxAttempts: 2, retryDelayMs: [0], sleep: noDelay });
  const response = await request(fetchImpl);
  assert.equal(response.status, 200);
  assert.equal(calls, 2);
  assert.equal(bodies[0], bodies[1]);
});
