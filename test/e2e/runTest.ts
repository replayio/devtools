import { Page } from "@recordreplay/playwright";

import config from "./config";
import { getExampleRecordingId } from "./getExample";
import { recordPlaywright, uploadLastRecording } from "./recordPlaywright";
import { reportError, waitUntilMessage } from "./utils";

export async function runClassicTest(args: {
  example: string;
  isNodeExample?: boolean;
  script: string;
}) {
  let exampleRecordingId: string | undefined;
  try {
    exampleRecordingId = await getExampleRecordingId(args.example, args.isNodeExample || false);
  } catch (e) {
    reportError(`${args.script}: Failed to create example recording`, e);
    throw e;
  }
  expect(exampleRecordingId).toBeTruthy();

  const testUrl = `${config.devtoolsUrl}/recording/${exampleRecordingId}?test=${args.script}`;
  console.log("Recording test:", testUrl);

  let success = false;
  try {
    await recordPlaywright(config.browserName, async page => {
      await page.goto(testUrl);
      page.on("console", async (msg: any) => console.log(`${args.script}:`, msg.text()));
      const result = await waitUntilMessage(page, "TestFinished", 240_000);
      success = result.success;
    });
  } catch (e) {
    console.error("Recording test failed:", e);
  }

  if (!success) {
    console.log("Test failed, uploading recording");
    const recordingId = await uploadLastRecording(testUrl);
    reportError(`${args.script}: https://app.replay.io/recording/${recordingId}`);
  }
  expect(success).toBe(true);
}

export async function runPlaywrightTest(args: {
  example: string;
  isNodeTest?: boolean;
  script: (page: Page) => Promise<void>;
}) {
  let exampleRecordingId: string | undefined;
  try {
    exampleRecordingId = await getExampleRecordingId(args.example, args.isNodeTest || false);
  } catch (e) {
    reportError(`${args.script}: Failed to create example recording`, e);
    throw e;
  }
  expect(exampleRecordingId).toBeTruthy();

  const url = `${config.devtoolsUrl}/recording/${exampleRecordingId}`;
  try {
    await recordPlaywright(config.browserName, async page => {
      await page.goto(url);
      await args.script(page);
    });
  } catch (e) {
    const recordingId = await uploadLastRecording(url);
    reportError(`${args.script}: https://app.replay.io/recording/${recordingId}`);
    throw e;
  }
}
