import replayPlaywright, { BrowserType, Page } from "@recordreplay/playwright";
import * as cli from "@replayio/replay";
import findLast from "lodash/findLast";

import config, { BrowserName } from "../config";

export async function recordPlaywright(
  browserName: BrowserName,
  script: (page: Page) => Promise<void>
) {
  let playwrightBrowsers = replayPlaywright;

  if (!config.shouldRecordTest) {
    // Playwright only gets installed if we install the `test` folder
    playwrightBrowsers = require("playwright");
  }

  // @ts-ignore `browserName` key mismatch
  const browserEntry = playwrightBrowsers[browserName] as BrowserType<any>;
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
    ignoreHTTPSErrors: true,
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
  const latest = cli.viewLatestRecording();
  console.log(">>> line 46 in uploadLastRecording, latest: ", latest);
  console.log(`>>> line 47 uploadLastRecording list ${JSON.stringify(list)}`);
  const id = findLast(list, rec => rec.metadata.uri === url)?.id;

  console.log(">>> line 49 in uploadLastRecording, id: ", id);

  if (id) {
    console.log(">>> line 52 in uploadLastRecording, id: ", id);

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
    });
  }
}
