import type { Page, expect as expectFunction } from "@playwright/test";
import { chromium, expect, firefox } from "@playwright/test";
import { getExecutablePath } from "@replayio/playwright";
import * as cli from "@replayio/replay";
import findLast from "lodash/findLast";

import config, { BrowserName } from "../config";

export async function recordPlaywright(
  browserName: BrowserName,
  script: (page: Page, expect?: typeof expectFunction) => Promise<void>
) {
  let executablePath: string | undefined = undefined;
  if (config.shouldRecordTest) {
    executablePath = config.browserPath || getExecutablePath(browserName)!;
  }

  const browserType = browserName === "chromium" ? chromium : firefox;

  const browserServer = await browserType.launchServer({
    env: {
      ...process.env,
      // @ts-ignore
      RECORD_REPLAY_DRIVER: config.driverPath,
      // @ts-ignore
      RECORD_REPLAY_VERBOSE:
        config.driverPath || process.env.RECORD_REPLAY_BROWSER_LOG ? "1" : undefined,
      RECORD_ALL_CONTENT: "1",
    },
    executablePath, //: config.browserPath,
    headless: config.headless,
  });

  // Set if you want to see the chromium logs during recording.
  if (process.env.RECORD_REPLAY_BROWSER_LOG) {
    const stderr = browserServer.process().stderr;
    stderr?.addListener("data", data => {
      console.error(data + "");
    });
  }

  const browser = await chromium.connect(browserServer.wsEndpoint());
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  try {
    return await script(page as any, expect);
  } catch (err) {
    console.error("PLAYWRIGHT ERROR", err);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    await browserServer.close();
  }
}

export async function uploadLastRecording(url: string): Promise<string> {
  const list = cli.listAllRecordings();
  const id = findLast(list, rec => rec.metadata.uri === url)?.id;

  if (id) {
    // When running the Replay backend tests, we run against a selfcontained backend and we don't
    // want to force it to run Recording.processRecording on every test fixture because it would be
    // really slow and not do anything useful. By hardcoding this metadata, we can convince the Replay
    // upload library that since this was a "passed" result, it does not need to process the recording.
    cli.addLocalRecordingMetadata(id, {
      test: {
        file: "fake.html",
        path: ["fake.html"],
        result: "passed",
        runner: {
          name: "fake",
          version: "",
        },
        run: {
          id: "00000000-0000-4000-8000-000000000000",
          title: "fake",
        },
        title: "",
        version: 1,
      },
    });

    return await cli.uploadRecording(id, {
      apiKey: config.replayApiKey,
      server: config.backendUrl,
      verbose: true,
      strict: true,
    });
  } else {
    throw Error(
      `No recording found matching url "${url}" in list:\n${list
        .map(rec => rec.metadata.uri)
        .join("\n")}`
    );
  }
}
