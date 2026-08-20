import type { PngDimensions } from './types.ts';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function assertPngBytes(bytes: Uint8Array): void {
  if (bytes.byteLength < 24) {
    throw new TypeError('IMAGE_INTAKE_INVALID_PNG: file is too short for PNG IHDR');
  }
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new TypeError('IMAGE_INTAKE_INVALID_PNG: PNG signature mismatch');
  }
  if (buffer.toString('ascii', 12, 16) !== 'IHDR') {
    throw new TypeError('IMAGE_INTAKE_INVALID_PNG: first PNG chunk is not IHDR');
  }
  const ihdrLength = buffer.readUInt32BE(8);
  if (ihdrLength !== 13) {
    throw new TypeError(`IMAGE_INTAKE_INVALID_PNG: unexpected IHDR length=${ihdrLength}`);
  }
}

export function parsePngDimensions(bytes: Uint8Array): PngDimensions {
  assertPngBytes(bytes);
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width === 0 || height === 0) {
    throw new TypeError(`IMAGE_INTAKE_INVALID_PNG: invalid dimensions ${width}x${height}`);
  }
  return { width, height };
}
