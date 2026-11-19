import { test as base, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT = 'aula4-e2e-atividade';
const COMPOSE = 'compose.e2e.atividade.yml';
const DB = 'aula4_e2e_atividade';

function psql(input: string) {
  const result = spawnSync(
    'docker',
    ['compose', '-f', COMPOSE, '-p', PROJECT, 'exec', '-T', 'database',
     'psql', '-U', 'postgres', '-d', DB, '-v', 'ON_ERROR_STOP=1'],
    { cwd: resolve(__dirname, '..'), encoding: 'utf8', input },
  );
  if (result.error || result.status !== 0) {
    throw new Error(
      `Falha ao restaurar o banco E2E: ${result.error?.message ?? result.stderr}`,
    );
  }
}

export function resetDatabase() {
  const seed = readFileSync(resolve(__dirname, '../database/seed.sql'), 'utf8');
  psql('TRUNCATE enrollments, courses, students RESTART IDENTITY CASCADE;\n' + seed);
}

export function clearDatabase() {
  psql('TRUNCATE enrollments, courses, students RESTART IDENTITY CASCADE;');
}

export const test = base.extend({
  page: async ({ page }, use) => {
    resetDatabase();
    await page.goto('/');
    await use(page);
  },
});

export { expect };