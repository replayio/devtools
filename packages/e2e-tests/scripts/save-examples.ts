#!/usr/bin/env ts-node

// NOTE: Set `export API_KEY=someApiKeyHere` before running these steps
// Use the API key for the "Frontend E2E Test Team" that we have set up in admin,
// as that should let us mark these recordings as public.

import { existsSync, writeFileSync } from "fs";
import assert from "node:assert/strict";
import path from "path";
import type { Page, expect as expectFunction } from "@playwright/test";
import chalk from "chalk";
import difference from "lodash/difference";
import { v4 as uuidv4 } from "uuid";
import yargs from "yargs";

import config from "../config";
import examplesJson from "../examples.json";
import { TestRecordingIntersectionValue } from "../helpers";
import { getStats } from "./get-stats";
import { loadRecording } from "./loadRecording";
import { recordNodeExample } from "./record-node";

import {
  saveRecording,
  recordPlaywright,
  findLastRecordingId,
  removeRecording,
} from "@devtools-repo/playwright-recorder";

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
const examplesJsonPath = path.join(__dirname, "..", "examples.json");

let mutableExamplesJSON: Record<string, { recording: string; buildId: string }> = {
  ...examplesJson,
};

const exampleToNewRecordingId: Record<string, string> = {};

function updateExamplesJSONFile(example: string, recordingId: string, buildId: string) {
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

// When running the Replay backend tests, we run against a selfcontained backend and we don't
// want to force it to run Recording.processRecording on every test fixture because it would be
// really slow and not do anything useful. By hardcoding this metadata, we can convince the Replay
// upload library that since this was a "passed" result, it does not need to process the recording.
const fakeTestPassedRecordingMetadata = {
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
};

interface TestRunCallbackArgs {
  example: TestExampleFile;
  examplePath: string;
}

async function saveExamples(
  examplesTarget: Target,
  callback: (args: TestRunCallbackArgs) => Promise<void>
) {
  let examplesToRun: TestExampleFile[] = [];

  let key: keyof typeof examplesJson;
  for (key in examplesJson) {
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

    let category: TestExampleFile["category"] | undefined;
    let folder: TestExampleFile["folder"] | undefined;

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

    assert(category, "Unknown category for runtime: " + runtime);
    assert(folder, "Unknown folder for runtime: " + runtime);

    if (category === examplesTarget) {
      let resolvedPlaywrightScript: PlaywrightScript | undefined;
      if (playwrightScript) {
        const playwrightScriptModule = require(path.join("..", playwrightScript));
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
    const examplePath = path.join(example.folder, example.filename);
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

  const recordingId = findLastRecordingId(exampleUrl);
  exampleToNewRecordingId[example.filename] = recordingId;

  const { buildId } = await saveRecording(
    {
      recordingId,
      title: `E2E Example: ${example.filename}`,
      metadata: fakeTestPassedRecordingMetadata,
    },
    config.replayApiKey
  );

  if (config.useExampleFile) {
    updateExamplesJSONFile(example.filename, recordingId, buildId);
  }

  removeRecording(recordingId);
}

async function saveNodeExamples() {
  await saveExamples("node", async ({ example, examplePath }: TestRunCallbackArgs) => {
    console.log(`Recording example ${chalk.gray.bold(example.filename)}`);

    process.env.RECORD_REPLAY_METADATA_TEST_RUN_ID = uuidv4();

    const recordingId = await recordNodeExample(examplePath);
    if (recordingId) {
      const { buildId } = await saveRecording(
        {
          recordingId,
          title: `E2E Example: ${example.filename}`,
        },
        config.replayApiKey
      );
      updateExamplesJSONFile(example.filename, recordingId, buildId);
      removeRecording(recordingId);

      exampleToNewRecordingId[example.filename] = recordingId;
    } else {
      console.error(`❌ Failed to record example ${chalk.bold(example.filename)}`);

      throw `Unable to save recording for ${chalk.bold(example.filename)}`;
    }
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
      } catch (e: any) {
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
