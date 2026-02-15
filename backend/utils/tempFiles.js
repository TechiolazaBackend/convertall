import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export async function createTempDir(prefix = 'technolaza-') {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function cleanupTempDir(dirPath) {
  if (!dirPath) {
    return;
  }

  await fs.rm(dirPath, { recursive: true, force: true });
}

export function getBaseNameWithoutExt(fileName) {
  const ext = path.extname(fileName || 'file');
  return path.basename(fileName || 'file', ext) || 'file';
}
