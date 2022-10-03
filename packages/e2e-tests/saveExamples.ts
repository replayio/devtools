// NOTE: Set `export API_KEY=someApiKeyHere` before running these steps
// Use the API key for the "Frontend E2E Test Team" that we have set up in admin,
// as that should let us mark these recordings as public.

import { Page } from "@playwright/test";
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

import { recordNodeExample } from "../../test/e2e/recordNode";
import config from "../../test/e2e/config";

const playwright = require("@recordreplay/playwright");
import { uploadRecording, listAllRecordings } from "@replayio/replay";

async function waitUntilMessage(page: Page, message: string, timeout: number = 30_000) {
  return await new Promise((resolve, reject) => {
    let timer = setTimeout(reject, timeout);
    page.on("console", async msg => {
      try {
        const firstArg = await msg.args()[0]?.jsonValue();
        // console.log(firstArg);
        if (firstArg === message) {
          const secondArg = await msg.args()[1]?.jsonValue();
          clearTimeout(timer);
          resolve(secondArg);
        }
      } catch (e) {
        console.log("Unserializable value");
      }
    });
  });
}

async function recordExample(example: string) {
  let browser, context, page, succeeded;
  try {
    console.log(`Recording ${example}`);
    browser = await playwright["firefox"].launch({
      // executablePath: state.browserPath,
      headless: true,
    });

    context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });
    page = await context.newPage();

    await page.goto(`http://localhost:8080/test/examples/${example}`);
    await waitUntilMessage(page, "ExampleFinished");
    console.log(`Recorded ${example}`);
    succeeded = true;
  } catch (e) {
    succeeded = false;
    console.error(e);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  if (succeeded) {
    await saveRecording(example);
  }
}

async function saveRecording(example: string, recordingId?: string) {
  console.log(`Saving ${example}`);

  if (!recordingId) {
    const recordings = listAllRecordings();
    const lastRecording = recordings[recordings.length - 1];
    recordingId = lastRecording.id;

    console.log("Last recording: ", lastRecording);
  }

  const id = await uploadRecording(recordingId, {
    apiKey: process.env.API_KEY,
  });

  await makeReplayPublic(process.env.API_KEY!, recordingId);

  const text = "" + readFileSync(`${__dirname}/examples.json`);
  const json = JSON.parse(text);
  writeFileSync(`${__dirname}/examples.json`, JSON.stringify({ ...json, [example]: id }, null, 2));
  console.log(`Saved recording ID for example: ${example}`);
}

// TODO [FE-626] Tie this into the new `main()` function below
async function recordExamples() {
  const files = readdirSync(`public/test/examples`);
  const pages = files.filter(file => file.startsWith("doc"));
  for (const page of pages) {
    await recordExample(page);
  }

  const examples = readFileSync(`${__dirname}/examples.json`, "utf8");
  console.log(examples);
}

async function saveNodeExample(nodeExampleName: string) {
  // Assume the incoming node example name is a file that lives in $REPO/test/examples/node/
  const nodeExamplesPath = path.join(__dirname, "../../test/examples/node");
  const nodeExampleFilename = path.join(nodeExamplesPath, nodeExampleName);

  config.replayApiKey = process.env.API_KEY!;

  const exampleExists = existsSync(nodeExampleFilename);

  if (exampleExists) {
    process.env.RECORD_REPLAY_METADATA_TEST_RUN_ID = uuidv4();
    const recordingId = await recordNodeExample(nodeExampleFilename);

    if (recordingId) {
      console.log("Recording succeeded. ID: ", recordingId);
      console.log("Saving recording info...");
      await saveRecording(`node/${nodeExampleName}`, recordingId);

      console.log(`Saved example: ${recordingId}`);
    } else {
      console.error("Did not save a recording!");
    }
  } else {
    throw new Error("Could not find example file: " + nodeExampleFilename);
  }
}

async function makeReplayPublic(apiKey: string, recordingId: string) {
  const variables = {
    recordingId: recordingId,
    isPrivate: false,
  };

  return axios({
    url: "https://api.replay.io/v1/graphql",
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    data: {
      query: `
        mutation MakeReplayPublic($recordingId: ID!, $isPrivate: Boolean!) {
          updateRecordingPrivacy(input: { id: $recordingId, private: $isPrivate }) {
            success
          }
        }
      `,
      variables,
    },
  }).catch(e => {
    if (e.response) {
      console.log("Parameters");
      console.log(JSON.stringify(variables, undefined, 2));
      console.log("Response");
      console.log(JSON.stringify(e.response.data, undefined, 2));
    }

    throw e.message;
  });
}

async function main() {
  const args = process.argv.slice(2);
  //
  const [exampleType, exampleFilename] = args;

  if (exampleType === "node") {
    await saveNodeExample(exampleFilename);
  } else if (exampleType === "cra") {
    recordExample("cra/dist/index.html");
  }
  // TODO [FE-626] Re-add handling for re-recording other example forms
}

(async () => {
  try {
    await main();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
