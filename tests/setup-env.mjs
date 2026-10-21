/**
 * Loads local environment files for the test runner and forces every database
 * connection onto TEST_DATABASE_URL. Tests must never touch the development or
 * production database (see .agent/rules/testing.md).
 */

import fs from 'node:fs';

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;

  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const key = match[1];
    if (process.env[key] !== undefined) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

if (!process.env.TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL must be set before running tests.');
}

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.DIRECT_URL = process.env.TEST_DATABASE_URL;
process.env.NODE_ENV = 'test';
