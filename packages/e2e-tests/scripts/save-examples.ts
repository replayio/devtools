#!/usr/bin/env ts-node

// NOTE: Set `export API_KEY=someApiKeyHere` before running these steps
// Use the API key for the "Frontend E2E Test Team" that we have set up in admin,
// as that should let us mark these recordings as public.

import { existsSync, writeFileSync } from "fs";
import assert from "node:assert/strict";
import { join } from "path";
import type { Page, expect as expectFunction } from "@playwright/test";
import { removeRecording, uploadRecording } from "@replayio/replay";
import axios from "axios";
import chalk from "chalk";
import difference from "lodash/difference";
import { v4 as uuidv4 } from "uuid";
import yargs from "yargs";

import { SetRecordingIsPrivateVariables } from "../../shared/graphql/generated/SetRecordingIsPrivate";
import { UpdateRecordingTitleVariables } from "../../shared/graphql/generated/UpdateRecordingTitle";
import config from "../config";
import examplesJson from "../examples.json";
import { TestRecordingIntersectionValue } from "../helpers";
import { getStats } from "./get-stats";
import { loadRecording } from "./loadRecording";
import { recordNodeExample } from "./record-node";
import { recordPlaywright, uploadLastRecording } from "./record-playwright";

type Target = "all" | "browser" | "node";

const argv = yargs
  .option("example", {
    alias: "e",
    description: "Only re-generate tests for a single file, or a comma-separated list of files",
    type: "string",
    default: "",
  })
  .option("build", {
    alias: "b",
    default: "",
    description: "Only re-generate tests for recordings made with the specified build id",
    type: "string",
  })
  .option("runtime", {
    alias: "r",
    default: "",
    description: "Override runtime specified in test config",
    choices: ["", "chromium", "node"],
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

const CONFIG = {
  recordingTimeout: 60_000,
  uploadTimeout: 60_000,
};

type PlaywrightScript = (page: Page, expect: typeof expectFunction) => Promise<void>;

type TestExampleFile = {
  buildId: string;
  category: "browser" | "node";
  filename: string;
  folder: string;
  runtime: "chromium" | "node";
  playwrightScript?: PlaywrightScript;
};
const examplesJsonPath = join(__dirname, "..", "examples.json");

let mutableExamplesJSON = { ...examplesJson };

const exampleToNewRecordingId: { [example: string]: string } = {};

async function saveRecording(
  example: string,
  apiKey: string,
  recordingId: string,
  skipUpload?: boolean
) {
  console.log(
    `Saving ${chalk.grey.bold(example)} with recording id ${chalk.yellow.bold(recordingId)}`
  );

  if (!skipUpload) {
    await uploadRecording(recordingId, {
      apiKey,
      server: config.backendUrl,
      strict: true,
    });
  }

  const response = await axios({
    url: config.graphqlUrl,
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    data: {
      query: `
          query GetRecordingBuildId($recordingId: UUID!) {
            recording(uuid: $recordingId) {
              buildId
            }
          }
        `,
      variables: {
        recordingId,
      },
    },
  });

  const buildId = response.data.data.recording.buildId;

  await makeReplayPublic(apiKey, recordingId);
  await updateRecordingTitle(apiKey, recordingId, `E2E Example: ${example}`);

  mutableExamplesJSON = {
    ...mutableExamplesJSON,
    [example]: {
      ...mutableExamplesJSON[example],
      recording: recordingId,
      buildId,
    },
  };

  writeFileSync(examplesJsonPath, JSON.stringify(mutableExamplesJSON, null, 2));
}

interface TestRunCallbackArgs {
  example: TestExampleFile;
  examplePath: string;
}

async function saveExamples(
  examplesTarget: Target,
  callback: (args: TestRunCallbackArgs) => Promise<void>
) {
  let examplesToRun: TestExampleFile[] = [];

  for (const key in examplesJson) {
    const {
      buildId,
      playwrightScript,
      requiresManualUpdate = false,
    } = examplesJson[key] as TestRecordingIntersectionValue;

    if (requiresManualUpdate) {
      // A few of our examples require manual updates;
      // See README.md for instructions on updating them
      continue;
    }

    const [_, runtime] = buildId.split("-");

    let category: TestExampleFile["category"];
    let folder: TestExampleFile["folder"];

    switch (runtime) {
      case "chromium":
      case "gecko": {
        category = "browser";
        folder = config.browserExamplesPath;
        break;
      }
      case "node": {
        category = "node";
        folder = config.nodeExamplesPath;
        break;
      }
    }

    if (category === examplesTarget) {
      let resolvedPlaywrightScript: PlaywrightScript | undefined;
      if (playwrightScript) {
        const playwrightScriptModule = require(join("..", playwrightScript));
        assert(
          typeof playwrightScriptModule.default === "function",
          `Expected default export to be a function in ${playwrightScript}`
        );
        resolvedPlaywrightScript = playwrightScriptModule.default;
      }
      examplesToRun.push({
        buildId,
        category,
        filename: key,
        folder,
        runtime: runtime as TestExampleFile["runtime"],
        playwrightScript: resolvedPlaywrightScript,
      });
    }
  }

  const specificExamples = argv.example.split(",").filter(s => s.length > 0);
  if (specificExamples.length > 0) {
    const allExampleNames = examplesToRun.map(e => e.filename);
    const invalidInputs = difference(specificExamples, allExampleNames);
    if (invalidInputs.length) {
      if (argv.target !== "all") {
        // If no target is specified, this script will check both Chrome and Node examples;
        // we shouldn't throw in that case (since it's likely that at least one target will contain no matches)
        throw new Error(
          `Invalid examples don't exist or require manual recording: ${invalidInputs.join(",")}`
        );
      }
    }
    examplesToRun = examplesToRun.filter(example => specificExamples.includes(example.filename));
  }

  const buildId = argv.build;
  if (buildId) {
    examplesToRun = examplesToRun.filter(example => example.buildId.includes(buildId));
  }

  for (const example of examplesToRun) {
    const examplePath = join(example.folder, example.filename);
    if (existsSync(examplePath)) {
      await callback({ example, examplePath });
    } else {
      throw new Error("Could not find example: " + examplePath);
    }
  }
}

async function saveBrowserExamples() {
  await saveExamples("browser", saveBrowserExample);
}

async function saveBrowserExample({ example }: TestRunCallbackArgs) {
  console.log(`Recording example ${chalk.gray.bold(example.filename)}`);

  const exampleUrl = `${config.devtoolsUrl}/recording/test/examples/${example.filename}`;
  async function defaultPlaywrightScript(page: Page) {
    await waitUntilMessage(page as Page, "ExampleFinished");
    // add a little delay to ensure that the recording is complete, see [FE-2286] and [RUN-3258]
    await sleep(500);
    console.log("Example finished");
  }
  const playwrightScript: PlaywrightScript = example.playwrightScript ?? defaultPlaywrightScript;
  await raceForTime(
    CONFIG.recordingTimeout,
    recordPlaywright(async (page, expect) => {
      const waitForLogPromise = playwrightScript(page, expect);
      const goToPagePromise = page.goto(exampleUrl);

      await Promise.all([goToPagePromise, waitForLogPromise]);
    })
  );

  const recordingId = await raceForTime(CONFIG.uploadTimeout, uploadLastRecording(exampleUrl));
  if (recordingId == null) {
    throw new Error(`Recording "${example.filename}" not uploaded`);
  }
  exampleToNewRecordingId[example.filename] = recordingId;

  if (config.useExampleFile && recordingId) {
    await saveRecording(example.filename, config.replayApiKey, recordingId, true);
  }

  if (recordingId) {
    removeRecording(recordingId);
  }
}

async function saveNodeExamples() {
  await saveExamples("node", async ({ example, examplePath }: TestRunCallbackArgs) => {
    console.log(`Recording example ${chalk.gray.bold(example.filename)}`);

    process.env.RECORD_REPLAY_METADATA_TEST_RUN_ID = uuidv4();

    const recordingId = await recordNodeExample(examplePath);
    if (recordingId) {
      await saveRecording(example.filename, config.replayApiKey, recordingId);
      removeRecording(recordingId);

      exampleToNewRecordingId[example.filename] = recordingId;
    } else {
      console.error(`❌ Failed to record example ${chalk.bold(example.filename)}`);

      throw `Unable to save recording for ${chalk.bold(example.filename)}`;
    }
  });
}

function logError(e: any, variables: any) {
  if (e.response) {
    console.log("Parameters");
    console.log(JSON.stringify(variables, undefined, 2));
    console.log("Response");
    console.log(JSON.stringify(e.response.data, undefined, 2));
  }

  throw e.message;
}

async function makeReplayPublic(apiKey: string, recordingId: string) {
  const variables: SetRecordingIsPrivateVariables = {
    recordingId: recordingId,
    isPrivate: false,
  };

  return axios({
    url: config.graphqlUrl,
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
    logError(e, variables);
  });
}

async function updateRecordingTitle(apiKey: string, recordingId: string, title: string) {
  const variables: UpdateRecordingTitleVariables = {
    recordingId: recordingId,
    title,
  };

  return axios({
    url: config.graphqlUrl,
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    data: {
      query: `
        mutation UpdateRecordingTitle($recordingId: ID!, $title: String!) {
          updateRecordingTitle(input: { id: $recordingId, title: $title }) {
            success
            recording {
              uuid
              title
            }
          }
        }
      `,
      variables,
    },
  }).catch(e => {
    logError(e, variables);
  });
}

async function sleep(timeoutMs: number) {
  return new Promise<void>(r => setTimeout(() => r(), timeoutMs));
}

async function raceForTime<T>(timeoutMs: number, promise: Promise<T>) {
  return Promise.race([
    promise,
    sleep(timeoutMs).then(() => Promise.reject(new Error(`Race timeout after ${timeoutMs}ms`))),
  ]);
}

async function waitUntilMessage(
  page: Page,
  message: string,
  timeout: number = 30_000
): Promise<void> {
  const gotMatch = await new Promise<boolean>(resolve => {
    let timer = setTimeout(() => resolve(false), timeout);
    page.on("console", async msg => {
      try {
        const firstArg = await msg.args()[0]?.jsonValue();
        if (firstArg === message) {
          clearTimeout(timer);
          resolve(true);
        }
      } catch (error) {
        // Ignore
      }
    });
  });

  if (!gotMatch) {
    throw new Error("Timed out waiting for " + message);
  }
}

(async () => {
  try {
    const functionsForTarget = {
      browser: saveBrowserExamples,
      node: saveNodeExamples,
    };

    const target: Target = argv.target as Target;
    if (Array.isArray(target)) {
      // prevent `--target` from being used multiple times
      throw new Error("Only one target value is allowed");
    }

    let targetsToRun: Target[] = ["browser", "node"];
    if (target !== "all") {
      targetsToRun = [target];
    }

    for (const target of targetsToRun) {
      const saveExamplesForTarget = functionsForTarget[target as keyof typeof functionsForTarget];
      await saveExamplesForTarget();
    }

    const updatedExamples = Object.keys(exampleToNewRecordingId);
    const newRecordingIds = Object.values(exampleToNewRecordingId);

    console.log(
      `${newRecordingIds.length} new recordings have been saved. Loading each recording to ensure it has been pre-processed.`
    );

    const { exampleToTestMap } = getStats();

    for (const recordingId of newRecordingIds) {
      try {
        await loadRecording(recordingId);
      } catch (e) {
        console.error(`Ignored error during processing: ${e?.stack || e}`);
      }
    }

    console.log("The following tests have been impacted by this change:");
    console.table(
      updatedExamples
        .map(example => {
          const tests = exampleToTestMap[example];
          return tests
            ? ` • ${chalk.yellow(example)}${tests.map(test => `\n   • ${test}`).join("")}`
            : ` • ${chalk.red(example)} is updated, but has no associated tests`;
        })
        .join("\n")
    );

    process.exit(0);
  } catch (error) {
    console.error("Unexpected error: ", error);

    process.exit(1);
  }
})();
