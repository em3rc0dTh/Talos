import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ONE_APP_PRODUCT_PAGE } from '../apps/reference-api/src/one-app-product-page.ts';
import {
  R1_04_BUSINESS_CONFIRMATION_EXTENSION,
  renderR104BusinessConfirmationPage,
} from '../apps/reference-api/src/one-app-r1-04-confirmation-extension.ts';

const cwd = process.cwd();
const prerequisiteTests = [
  'tests/r1-01-image-stage-truth.test.ts',
  'tests/r1-02-one-app-product-intake.test.ts',
  'tests/r1-03-one-app-process-review-page.test.ts',
  'tests/r1-03-one-app-process-review.test.ts',
  'tests/r1-04-business-process-confirmation.test.ts',
];

test('R1-00 prerequisite certification inventory is complete before R1-05', () => {
  for (const relativePath of prerequisiteTests) {
    assert.equal(existsSync(path.resolve(cwd, relativePath)), true, `${relativePath} must exist`);
  }

  const packageJson = JSON.parse(readFileSync(path.resolve(cwd, 'package.json'), 'utf8')) as any;
  assert.match(
    String(packageJson.scripts?.['image:edge:test'] ?? ''),
    /image:i8-03:test/,
    'the existing automation-design implementation remains part of the image edge regression chain',
  );
});

test('R1-00 cumulative product authority chain preserves source → review → confirmation separation', () => {
  const rendered = renderR104BusinessConfirmationPage(ONE_APP_PRODUCT_PAGE);

  assert.match(rendered, /1 · SOURCE/);
  assert.match(rendered, /2 · PERCEPTION/);
  assert.match(rendered, /3 · REVIEWED MEANING/);
  assert.match(rendered, /4 · BUSINESS CONFIRMATION/);
  assert.match(rendered, /5 · EXECUTION/);
  assert.match(rendered, /INFERRED · NOT CONFIRMED/);
  assert.match(rendered, /Business-process confirmation/);
  assert.match(rendered, /exact BPMN review revision and exact Canonical ProcessRevision/);
  assert.match(rendered, /Automation design remains unauthorized/);
});

test('R1-00 cumulative prerequisite boundary grants no hidden R1-05+ authority', () => {
  assert.doesNotMatch(R1_04_BUSINESS_CONFIRMATION_EXTENSION, /\/api\/bpmn\/automation-design-approval/);
  assert.doesNotMatch(R1_04_BUSINESS_CONFIRMATION_EXTENSION, /\/api\/automation\/approve/);
  assert.doesNotMatch(R1_04_BUSINESS_CONFIRMATION_EXTENSION, /\/api\/automation\/execution\/start/);
});
