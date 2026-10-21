/**
 * Rebuilds the isolated test database before the suite runs so repeated runs
 * start from a clean schema and never collide with leftover fixtures.
 */

import './setup-env.mjs';
import { spawnSync } from 'node:child_process';

const result = spawnSync('npx prisma migrate reset --force --skip-seed', {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
