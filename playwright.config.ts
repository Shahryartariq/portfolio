import { defineConfig, devices } from "@playwright/test";

const port = 3200;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    ...(process.env.PW_CHROME ? { channel: "chrome" } : {}),
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 860 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], ...(process.env.PW_CHROME ? { channel: "chrome" } : {}) } },
  ],
  webServer: {
    command: `npx next start -p ${port}`,
    port,
    reuseExistingServer: !process.env.CI,
    env: { STATUS_SAMPLE_DATA: "1" },
  },
});
