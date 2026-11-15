import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3003";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command:
      "DATABASE_URL=postgresql://dom@localhost:5432/realtime_polling_app_e2e DB_SSL_REQUIRE=false pnpm dev --port 3003",
    url: `${baseURL}/projects/polls`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
