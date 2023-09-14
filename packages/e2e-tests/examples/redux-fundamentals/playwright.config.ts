import { PlaywrightTestConfig, devices } from '@playwright/test'

const { CI, SLOW_MO } = process.env

const projects = [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chromium'] },
  },
]

const config: PlaywrightTestConfig = {
  testDir: 'tests',
  use: {
    launchOptions: {
      slowMo: SLOW_MO ? parseInt(SLOW_MO, 10) : 0,
    },
    viewport: {
      width: 1280,
      height: 1024,
    },
    // Don't allow any one action to take more than 15s
    actionTimeout: 15_000,
  },

  expect: {
    timeout: 10_000,
  },

  // Retry failed tests on CI to account for some basic flakiness.
  retries: CI ? 3 : 0,

  // Give individual tests a while to complete instead of default 30s
  timeout: 120_000,

  // Limit the number of workers on CI, use default locally
  workers: CI ? 4 : undefined,
  projects,
}

export default config
