import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-atividade',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:18081',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  reporter: [['html', { outputFolder: 'playwright-report-atividade', open: 'never' }]],
});