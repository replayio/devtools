#!/usr/bin/env ts-node

// NOTE: Set `export API_KEY=someApiKeyHere` before running these steps
// Use the API key for the "Frontend E2E Test Team" that we have set up in admin,
// as that should let us mark these recordings as public.

import { Page } from "@playwright/test";
const playwright = require("@recordreplay/playwright");
import { uploadRecording, listAllRecordings } from "@replayio/replay";
import axios from "axios";
import chalk from "chalk";
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import yargs from "yargs";

import config from "./config";
import { recordNodeExample } from "./recordNode";

const argv = yargs
  .option("example", {
    alias: "e",
    description: "Only re-generate tests for this specific example file",
    type: "string",
  })
  .option("target", {
    alias: "t",
    default: "all",
    description: "Only re-generate tests for this target",
    choices: ["all", "browser", "node"],
  })
  .help()
  .alias("help", "h")
  .parseSync();

const exampleFilename = argv.example || null;
const target = argv.target;

async function getExampleFileNames(path: string): Promise<string[]> {
  return readdirSync(path).filter(file => {
    return file.endsWith(".js");
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
  if (recordingId) {
    console.log(`Saving ${chalk.bold(example)} with recording id ${recordingId} ...`);
  } else {
    const recordings = listAllRecordings();
    if (recordings.length > 0) {
      const lastRecording = recordings[recordings.length - 1];
      recordingId = lastRecording.id;

      console.log(`Saving ${chalk.bold(example)} as most recent recording id ${recordingId} ...`);
    } else {
      throw "No recording id found";
    }
  }

  const id = await uploadRecording(recordingId, {
    apiKey: config.replayApiKey,
  });

  await makeReplayPublic(config.replayApiKey, recordingId);

  const text = "" + readFileSync(`${__dirname}/examples.json`);
  const json = JSON.parse(text);
  writeFileSync(`${__dirname}/examples.json`, JSON.stringify({ ...json, [example]: id }, null, 2));
}

// TODO [FE-626] Tie this into the new `main()` function below
// async function recordExamples() {
//   const files = readdirSync(`public/test/examples`);
//   const pages = files.filter(file => file.startsWith("doc"));
//   for (const page of pages) {
//     await recordExample(page);
//   }

//   const examples = readFileSync(`${__dirname}/examples.json`, "utf8");
//   console.log(examples);
// }

async function saveBrowserExamples() {
  switch (target) {
    case "all":
    case "browser":
      // TODO [FE-626] Re-add handling for re-recording other example forms
      break;
  }
}

async function saveNodeExamples() {
  switch (target) {
    case "all":
    case "node":
      const exampleFilenames =
        exampleFilename !== null
          ? [exampleFilename]
          : await getExampleFileNames(config.nodeExamplesPath);

      for (const exampleFilename of exampleFilenames) {
        const examplePath = join(
          config.nodeExamplesPath,
          exampleFilename.endsWith(".js") ? exampleFilename : `${exampleFilename}.js`
        );
        if (existsSync(examplePath)) {
          process.env.RECORD_REPLAY_METADATA_TEST_RUN_ID = uuidv4();

          console.log(`Re-recording example ${chalk.bold(exampleFilename)} ...`);

          const recordingId = await recordNodeExample(examplePath);
          if (recordingId) {
            await saveRecording(`node/${exampleFilename}`, recordingId!);

            console.log(
              `Saved recording ${chalk.bold(exampleFilename)} with id ${chalk.bold(recordingId)}`
            );
          } else {
            throw `Unable to save recording for ${chalk.bold(exampleFilename)}`;
          }
        } else if (target === "node") {
          // Only error if this was a specific target + example combination.
          // Otherwise assume this is a different type of target.
          throw `Could not find example ${chalk.bold(exampleFilename)}`;
        }
      }
      break;
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

(async () => {
  try {
    if (target !== "all") {
      console.log(`Regenerating ${chalk.bold(target)} test recordings ...`);
    } else {
      console.log(`Regenerating test recordings ...`);
    }

    await saveBrowserExamples();
    await saveNodeExamples();

    process.exit(0);
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
})();
