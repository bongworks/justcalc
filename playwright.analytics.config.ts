import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'analytics-production.spec.ts',
  use: { baseURL: 'http://127.0.0.1:3100' },
  webServer: { command: 'python3 -m http.server 3100 --bind 127.0.0.1 --directory out', url: 'http://127.0.0.1:3100', reuseExistingServer: false },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
