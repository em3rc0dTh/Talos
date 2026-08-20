import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import type { StoredImageBytes } from './types.ts';
import { assertPngBytes } from './png.ts';

export function sha256ImageBytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export class LocalImageByteStore {
  readonly #root: string;

  constructor(root: string) {
    this.#root = path.resolve(root);
  }

  putPng(bytes: Uint8Array): StoredImageBytes {
    assertPngBytes(bytes);
    const digest = sha256ImageBytes(bytes);
    const relativePath = path.posix.join('sha256', `${digest}.png`);
    const absolutePath = path.join(this.#root, 'sha256', `${digest}.png`);
    mkdirSync(path.dirname(absolutePath), { recursive: true });

    if (existsSync(absolutePath)) {
      const existing = readFileSync(absolutePath);
      const incoming = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      if (!existing.equals(incoming)) {
        throw new TypeError(`IMAGE_BYTE_STORE_DIGEST_COLLISION: sha256=${digest}`);
      }
      return { sha256: digest, byteLength: bytes.byteLength, relativePath, reused: true };
    }

    try {
      writeFileSync(absolutePath, bytes, { flag: 'wx' });
    } catch (error: any) {
      if (error?.code !== 'EEXIST') throw error;
      const existing = readFileSync(absolutePath);
      const incoming = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      if (!existing.equals(incoming)) {
        throw new TypeError(`IMAGE_BYTE_STORE_DIGEST_COLLISION: sha256=${digest}`);
      }
      return { sha256: digest, byteLength: bytes.byteLength, relativePath, reused: true };
    }

    return { sha256: digest, byteLength: bytes.byteLength, relativePath, reused: false };
  }

  readPng(sha256: string): Buffer {
    if (!/^[0-9a-f]{64}$/.test(sha256)) {
      throw new TypeError('IMAGE_BYTE_STORE_INVALID_DIGEST');
    }
    const absolutePath = path.join(this.#root, 'sha256', `${sha256}.png`);
    const bytes = readFileSync(absolutePath);
    const actual = sha256ImageBytes(bytes);
    if (actual !== sha256) {
      throw new TypeError(`IMAGE_BYTE_STORE_INTEGRITY_FAILURE: expected=${sha256} actual=${actual}`);
    }
    return bytes;
  }

  absolutePathFor(sha256: string): string {
    if (!/^[0-9a-f]{64}$/.test(sha256)) throw new TypeError('IMAGE_BYTE_STORE_INVALID_DIGEST');
    return path.join(this.#root, 'sha256', `${sha256}.png`);
  }
}
