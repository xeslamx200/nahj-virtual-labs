import { defineConfig, devices } from '@playwright/test';

/** End-to-end tests run against the production build served by the Express server. */
const PORT = Number(process.env.E2E_PORT ?? 4317);

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'tablet-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 } }, grep: /@responsive/ },
  ],
  webServer: {
    command: `npm run build && node server/index.js`,
    env: { PORT: String(PORT), ANTHROPIC_API_KEY: '', GEMINI_API_KEY: '', AI_PROVIDER: '' },
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
