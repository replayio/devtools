import fs from "fs";

import { Page } from "@recordreplay/playwright";

import config from "./config";
import { getExampleRecordingId } from "./getExample";
import { recordPlaywright, uploadLastRecording } from "./recordPlaywright";
import { reportError, waitUntilMessage } from "./utils";

export async function runClassicTest(args: {
  example: string;
  isNodeExample?: boolean;
  saveFixture?: boolean;
  script: string;
}) {
  const { example, isNodeExample, script } = args;
  const saveFixture = config.updateFixtures && args.saveFixture;

  let exampleRecordingId: string | undefined;
  try {
    exampleRecordingId = await getExampleRecordingId(example, isNodeExample || false);
  } catch (e) {
    reportError(`${script}: Failed to create example recording`, e);
    throw e;
  }
  expect(exampleRecordingId).toBeTruthy();

  const testUrl = `${config.devtoolsUrl}/recording/${exampleRecordingId}?test=${script}`;
  console.log("Recording test:", testUrl);

  let success = false;
  const apolloLogs: any[] = [];
  const websocketLogs: any[] = [];
  try {
    await recordPlaywright(config.browserName, async page => {
      if (saveFixture) {
        page.on("response", async function onResponse(response) {
          const url = response.url();
          if (url.startsWith("https://api.replay.io/v1/graphql")) {
            const request = response.request();
            const requestData = request.postDataJSON();
            const responseData = await response.json();
            apolloLogs.push({
              requestData,
              responseData,
              url,
            });
          }
        });
        page.on("websocket", ws => {
          if (ws.url() !== "wss://dispatch.replay.io/") {
            return;
          }
          ws.on("framereceived", frameData =>
            websocketLogs.push(JSON.parse(frameData.payload.toString()))
          );
        });
      }

      await page.goto(testUrl);
      page.on("console", async msg => console.log(`${script}:`, msg.text()));
      const result = await waitUntilMessage(page, "TestFinished", 240_000);
      success = result.success;
    });
  } catch (e) {
    console.error("Recording test failed:", e);
  }

  if (saveFixture && success) {
    const testName = script.substring(0, script.length - 3);
    fs.writeFileSync(
      `./test/fixtures/${testName}.replay.json`,
      JSON.stringify(websocketLogs, null, 2)
    );
    fs.writeFileSync(
      `./test/fixtures/${testName}.apollo.json`,
      JSON.stringify(apolloLogs, null, 2)
    );
  }

  if (!success) {
    console.log("Test failed, uploading recording");
    const recordingId = await uploadLastRecording(testUrl);
    reportError(`${script}: https://app.replay.io/recording/${recordingId}`);
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
