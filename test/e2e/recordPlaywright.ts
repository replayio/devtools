import playwright from "@recordreplay/playwright";
import cli from "@replayio/replay";
import { findLast } from "lodash";

import config from "./config";

export type BrowserName = "firefox" | "chromium";

export async function recordPlaywright(
  browserName: BrowserName,
  script: (page: any) => Promise<void>
) {
  const browser = await (playwright as any)[browserName].launch({
    env: {
      ...process.env,
      RECORD_REPLAY_DRIVER: config.driverPath,
      RECORD_REPLAY_VERBOSE: config.driverPath ? "1" : undefined,
    },
    executablePath: config.browserPath,
    headless: config.headless,
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    return await script(page);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

export async function uploadLastRecording(url: string) {
  const list = cli.listAllRecordings();
  const id = findLast(list, rec => rec.metadata.uri === url)?.id;

  if (id) {
    return await cli.uploadRecording(id, {
      apiKey: config.replayApiKey,
      server: config.backendUrl,
    });
  }
}
