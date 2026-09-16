import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'analytics-production.spec.ts',
  use: { baseURL: 'http://127.0.0.1:3100' },
  webServer: { command: 'pnpm exec next start --port 3100', url: 'http://127.0.0.1:3100', reuseExistingServer: false },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
