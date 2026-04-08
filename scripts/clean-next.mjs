import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dirs = [
  path.join(root, '.next'),
  path.join(root, '.next-alt'),
  path.join(root, '.next-build'),
  path.join(root, '.next-build-verify'),
];

for (const dir of dirs) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log('Removed:', dir);
  } catch {
    /* ignore */
  }
}
