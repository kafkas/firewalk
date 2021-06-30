import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';

export function writeFileAndMkdirSync(
  path: string,
  data: string | Record<string, unknown> | unknown[],
  opts?: Parameters<typeof writeFileSync>[2]
): void {
  const d = typeof data === 'string' ? data : JSON.stringify(data);
  ensureDirectoryExistence(path);
  writeFileSync(path, d, opts);
}

function ensureDirectoryExistence(path: string): void {
  const dirName = dirname(path);
  if (existsSync(dirName)) {
    return;
  }
  ensureDirectoryExistence(dirName);
  mkdirSync(dirName);
}
