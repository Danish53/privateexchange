/**
 * Runs `next build` with distDir `.next-build-verify` so it does not fight
 * `npm run dev` (which locks `.next` on Windows).
 * For production deploy, use plain `npm run build` (stop dev first).
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

process.env.NEXT_DIST_DIR = '.next-build-verify';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const r = spawnSync('npx', ['next', 'build'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

process.exit(r.status === null ? 1 : r.status);
