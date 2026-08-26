import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import {
  createTalosProductCapabilityTransportResolver,
  TALOS_PRODUCT_CAPABILITY_ENV,
} from '../apps/reference-api/src/private-preview-capability-transports.ts';
import {
  GITHUB_ISSUE_COMMENT_TRANSPORT_REF,
} from '../workers/reference-temporal-worker/src/github-issue-comment-transport.ts';
import { genericEffectIdentity } from '../workers/reference-temporal-worker/src/generic-activities.ts';
import type { GenericCapabilityActivityInput } from '../workers/reference-temporal-worker/src/generic-contracts.ts';

const TOKEN = 'r1-08-product-github-secret-must-never-leak';

async function startFakeGitHub() {
  const comments: Array<{ id: number; body: string; html_url: string }> = [];
  const authorizationHeaders: string[] = [];
  const server = createServer(async (req, res) => {
    authorizationHeaders.push(String(req.headers.authorization ?? ''));
    const expectedPath = '/repos/em3rc0dTh/Talos/issues/54/comments';
    const path = new URL(req.url ?? '/', 'http://127.0.0.1').pathname;
    if (path !== expectedPath) {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: 'not found' }));
      return;
    }
    if (req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(comments));
      return;
    }
    if (req.method === 'POST') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { body: string };
      const created = {
        id: 9000 + comments.length,
        body: payload.body,
        html_url: `https://github.example.test/comment/${9000 + comments.length}`,
      };
      comments.push(created);
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(JSON.stringify(created));
      return;
    }
    res.writeHead(405, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'method not allowed' }));
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('fake GitHub server did not bind');
  return {
    apiBaseUrl: `http://127.0.0.1:${address.port}`,
    comments,
    authorizationHeaders,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

test('R1-08 product registry activates GitHub only from the exact approved implementationRef and preserves idempotent concrete evidence', async () => {
  const fake = await startFakeGitHub();
  try {
    const env = {
      [TALOS_PRODUCT_CAPABILITY_ENV.githubRepository]: 'em3rc0dTh/Talos',
      [TALOS_PRODUCT_CAPABILITY_ENV.githubIssueNumber]: '54',
      [TALOS_PRODUCT_CAPABILITY_ENV.githubToken]: TOKEN,
      [TALOS_PRODUCT_CAPABILITY_ENV.githubApiBaseUrl]: fake.apiBaseUrl,
    };
    const resolver = createTalosProductCapabilityTransportResolver(env);
    const unsupported = resolver.resolve({
      context: {} as any,
      capabilityUseOccurrenceRef: 'capability-use:unsupported',
      implementationRef: 'SOME_OTHER_EXPLICIT_IMPLEMENTATION',
    });
    assert.equal(unsupported, undefined, 'family or label similarity must never activate a concrete product adapter');

    const transport = resolver.resolve({
      context: {} as any,
      capabilityUseOccurrenceRef: 'capability-use:r1-08-github',
      implementationRef: GITHUB_ISSUE_COMMENT_TRANSPORT_REF,
    });
    assert.ok(transport);
    assert.equal(transport.transportRef, GITHUB_ISSUE_COMMENT_TRANSPORT_REF);

    const input: GenericCapabilityActivityInput = {
      executionId: 'R1-08-PRODUCT-EFFECT-001',
      capabilityUseOccurrenceRef: 'capability-use:r1-08-github',
      input: { comment: 'Talos R1-08 product-path external effect proof.' },
    };
    const identity = genericEffectIdentity(input);
    const first = await transport.execute(input, identity);
    assert.equal(first.effectStatus, 'INSERTED');
    assert.equal(first.transportRef, GITHUB_ISSUE_COMMENT_TRANSPORT_REF);
    assert.match(first.externalEffectRef, /^github:issue-comment:/);
    assert.ok(first.evidenceRefs.includes(`talos:effect-key:${identity.effectKey}`));
    assert.ok(first.evidenceRefs.includes(`talos:input-digest:${identity.inputDigest}`));

    const second = await transport.execute(input, identity);
    assert.equal(second.effectStatus, 'DUPLICATE_IDENTICAL');
    assert.equal(second.externalEffectRef, first.externalEffectRef);
    assert.equal(fake.comments.length, 1, 'external idempotency must leave exactly one GitHub-side effect');
    assert.ok(fake.authorizationHeaders.length >= 3);
    assert.ok(fake.authorizationHeaders.every((value) => value === `Bearer ${TOKEN}`));
    assert.equal(JSON.stringify({ first, second }).includes(TOKEN), false, 'runtime evidence must never serialize the server-held credential');
  } finally {
    await fake.close();
  }
});

test('R1-08 GitHub adapter configuration is lazy and fails closed only when that exact implementation is selected', () => {
  const resolver = createTalosProductCapabilityTransportResolver({});
  assert.equal(resolver.resolve({
    context: {} as any,
    capabilityUseOccurrenceRef: 'capability-use:other',
    implementationRef: 'UNRELATED_IMPLEMENTATION',
  }), undefined);
  assert.throws(() => resolver.resolve({
    context: {} as any,
    capabilityUseOccurrenceRef: 'capability-use:github',
    implementationRef: GITHUB_ISSUE_COMMENT_TRANSPORT_REF,
  }), /TALOS_PRODUCT_CAPABILITY_CONFIGURATION_REQUIRED: TALOS_PRODUCT_GITHUB_REPOSITORY/);
});
