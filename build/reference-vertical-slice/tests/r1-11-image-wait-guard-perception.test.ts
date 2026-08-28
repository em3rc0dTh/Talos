import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  intakePngUpload,
  LocalImageByteStore,
  resolveGeminiImagePerceptionRuntime,
  runCorrelatedConfiguredImagePerceptionAdmission,
} from '../packages/image-perception/src/index.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

function tinyPng(width = 1000, height = 600): Buffer {
  const bytes = Buffer.alloc(24);
  Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]).copy(bytes,0);
  bytes.writeUInt32BE(13,8);
  bytes.write('IHDR',12,'ascii');
  bytes.writeUInt32BE(width,16);
  bytes.writeUInt32BE(height,20);
  return bytes;
}

test('Gemini perception preserves generic WAIT semantics and decision guard labels without domain-specific matching', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-wait-guard-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(dir, 'source-bytes'));
  let prompt = '';
  try {
    const fakeGemini = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      prompt = String(body.contents?.[0]?.parts?.[1]?.text ?? '');
      const extraction = {
        completeCoverage: true,
        artifactType: 'PROCESS_DIAGRAM',
        elements: [
          { id:'decision', label:'Is additional review required?', nodeKind:'DECISION', occurrenceKind:'NODE', sourcePlaneKind:'BUSINESS_GRAPH', bbox:[10,350,160,600], confidence:0.98, visibility:'VISIBLE' },
          { id:'wait', label:'Hold for 5 minutes', nodeKind:'WAIT', occurrenceKind:'NODE', sourcePlaneKind:'BUSINESS_GRAPH', bbox:[250,50,400,300], confidence:0.97, visibility:'VISIBLE' },
          { id:'continue', label:'Continue processing', nodeKind:'ACTION', occurrenceKind:'NODE', sourcePlaneKind:'BUSINESS_GRAPH', bbox:[250,700,400,950], confidence:0.97, visibility:'VISIBLE' },
        ],
        connectors: [
          { id:'yes-flow', sourceElementId:'decision', targetElementId:'wait', direction:'SOURCE_TO_TARGET', role:'CONDITIONAL_FLOW', guardText:'Yes', bbox:[150,250,280,450], confidence:0.96 },
          { id:'no-flow', sourceElementId:'decision', targetElementId:'continue', direction:'SOURCE_TO_TARGET', role:'CONDITIONAL_FLOW', guardText:'No', bbox:[150,550,280,800], confidence:0.96 },
        ],
        uncertainties: [],
      };
      return new Response(JSON.stringify({ candidates:[{ content:{ parts:[{ text:JSON.stringify(extraction) }] } }] }), {
        status:200, headers:{'content-type':'application/json'},
      });
    }) as typeof fetch;

    const runtime = resolveGeminiImagePerceptionRuntime({ GEMINI_API_KEY:'test-key' }, fakeGemini);
    assert.equal(runtime.status, 'CONFIGURED');
    if (runtime.status !== 'CONFIGURED') return;
    assert.equal(runtime.binding.descriptor.modelRef, 'gemini-3.6-flash');

    const intake = intakePngUpload(repo, byteStore, tinyPng(), { initiatedBy:'test' });
    const result = await runCorrelatedConfiguredImagePerceptionAdmission(repo, byteStore, intake, runtime.binding, {}, runtime.fetchImpl);
    assert.equal(result.providerResult.status, 'SUCCEEDED');

    const wait = result.providerResult.occurrenceCandidates.find((item) => item.candidateSemanticType === 'WAIT');
    assert.ok(wait, 'WAIT candidate must survive Gemini structured perception mapping');

    const guardObservationValues = result.providerResult.relationCandidates
      .flatMap((relation) => relation.guardTextObservationKeys ?? [])
      .map((key) => result.providerResult.observations.find((observation) => observation.providerObservationKey === key)?.observedValue)
      .filter(Boolean)
      .sort();
    assert.deepEqual(guardObservationValues, ['No', 'Yes']);

    assert.match(prompt, /Use WAIT when the visible element's primary business meaning is elapsed time/i);
    assert.match(prompt, /For every decision\/gateway outgoing connector/i);
    assert.match(prompt, /yes\/no labels in any language/i);
  } finally {
    repo.close();
    rmSync(dir, { recursive:true, force:true });
  }
});
