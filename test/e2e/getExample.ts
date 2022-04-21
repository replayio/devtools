import fs from "fs";
import path from "path";

import config from "./config";
import { recordNodeExample } from "./recordNode";
import { recordPlaywright, uploadLastRecording } from "./recordPlaywright";
import { waitUntilMessage } from "./utils";

const exampleFile = path.resolve(__dirname, "../../test/example-recordings.json");

export async function getExampleRecordingId(
  example: string,
  isNodeExample = false
): Promise<string | undefined> {
  // Recording ID to load in the viewer. If not set, we will record the example
  // in the browser or node before stopping and switching to the viewer.
  let exampleRecordingId = config.useExampleFile ? readExampleFile()[example] : undefined;

  if (!exampleRecordingId) {
    if (isNodeExample) {
      exampleRecordingId = await recordNodeExample(path.resolve(__dirname, "../examples", example));
    } else {
      exampleRecordingId = await recordPlaywrightExample(example);
    }
  }

  return exampleRecordingId;
}

function readExampleFile() {
  return fs.existsSync(exampleFile) ? JSON.parse(fs.readFileSync(exampleFile, "utf8")) : {};
}

function updateExampleFile(example: string, recordingId: string) {
  let exampleRecordings = readExampleFile();
  exampleRecordings[example] = recordingId;
  fs.writeFileSync(exampleFile, JSON.stringify(exampleRecordings, null, 2));
}

async function recordPlaywrightExample(example: string) {
  const exampleUrl = `${config.devtoolsUrl}/test/examples/${example}`;
  console.log("Recording example:", exampleUrl, config.browserName);

  await recordPlaywright(config.browserName, async page => {
    await page.goto(exampleUrl);
    console.log("Loaded Page");
    await waitUntilMessage(page, "ExampleFinished");
  });

  console.log("Uploading example");
  const recordingId = await uploadLastRecording(exampleUrl);
  if (config.useExampleFile && recordingId) {
    updateExampleFile(example, recordingId);
  }
  return recordingId;
}
