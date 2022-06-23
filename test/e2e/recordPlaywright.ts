import replayPlaywright from "@recordreplay/playwright";
import playwright from "playwright";
import * as cli from "@replayio/replay";
import findLast from "lodash/findLast";

import config from "./config";

export type BrowserName = "firefox" | "chromium";

export async function recordPlaywright(
  browserName: BrowserName,
  script: (page: playwright.Page) => Promise<void>
) {
  const playwrightBrowsers = config.shouldRecordTest ? replayPlaywright : playwright;
  // @ts-ignore
  const browserEntry : playwright.BrowserType = playwrightBrowsers[browserName] ;
  const browser = await browserEntry.launch({
    env: {
      ...process.env,
      // @ts-ignore
      RECORD_REPLAY_DRIVER: config.driverPath,
      // @ts-ignore
      RECORD_REPLAY_VERBOSE: config.driverPath ? "1" : undefined,
    },
    executablePath: config.browserPath,
    headless: config.headless,
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true					  
  });
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
