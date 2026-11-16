import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { detectType } = createRequire(import.meta.url)('../../scripts/download-product-images.js');
const pad = (b) => Buffer.concat([Buffer.from(b), Buffer.alloc(16)]);

test('detectType accepts real image signatures and rejects error pages', () => {
  assert.equal(detectType(pad([0xff, 0xd8, 0xff, 0xe0])), 'jpeg');
  assert.equal(detectType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'png');
  assert.equal(detectType(Buffer.from('RIFF\0\0\0\0WEBPVP8 ', 'latin1')), 'webp');
  assert.equal(detectType(Buffer.from('<!DOCTYPE html><html>error</html>')), null);
  assert.equal(detectType(Buffer.alloc(0)), null);
});
