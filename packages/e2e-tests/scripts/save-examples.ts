#!/usr/bin/env ts-node

// NOTE: Set `export API_KEY=someApiKeyHere` before running these steps
// Use the API key for the "Frontend E2E Test Team" that we have set up in admin,
// as that should let us mark these recordings as public.

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Page } from "@playwright/test";
import { listAllRecordings, removeRecording, uploadRecording } from "@replayio/replay";
import axios from "axios";
import chalk from "chalk";
import { dots } from "cli-spinners";
import logUpdate from "log-update";
import { v4 as uuidv4 } from "uuid";
import yargs from "yargs";

import config, { BrowserName } from "../config";
import { recordNodeExample } from "./record-node";
import { recordPlaywright, uploadLastRecording } from "./record-playwright";

type Target = "all" | "browser" | "node";

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

type TestExampleFile = {
  filename: string;
  folder: string;
  category: "browser" | "node";
  runtime: "firefox" | "chromium" | "node";
};

const knownExamples: TestExampleFile[] = [
  {
    filename: "authenticated_comments_1.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "authenticated_comments_2.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "authenticated_comments_3.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "authenticated_logpoints_1.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "cra/dist/index.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "cra/dist/index_chromium.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
  },
  {
    filename: "doc_async.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_control_flow.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_debugger_statements.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_events.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_events_chromium.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
  },
  {
    filename: "doc_exceptions.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_exceptions_bundle.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_inspector_basic.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_inspector_shorthand.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_inspector_sourcemapped.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_inspector_styles.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_minified.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_minified_chromium.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
  },
  {
    filename: "doc_navigate.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_prod_bundle.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_recursion.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_rr_basic.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_rr_blackbox.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_rr_console.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_rr_error.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_rr_logs.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_rr_objects.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_rr_preview.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_rr_region_loading.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_rr_worker.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_stacking.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "log_points_and_block_scope.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "node/control_flow.js",
    folder: config.nodeExamplesPath,
    category: "node",
    runtime: "node",
  },
  {
    filename: "node/async.js",
    folder: config.nodeExamplesPath,
    category: "node",
    runtime: "node",
  },
  {
    filename: "node/basic.js",
    folder: config.nodeExamplesPath,
    category: "node",
    runtime: "node",
  },
  {
    filename: "node/error.js",
    folder: config.nodeExamplesPath,
    category: "node",
    runtime: "node",
  },
  {
    filename: "node/exceptions.js",
    folder: config.nodeExamplesPath,
    category: "node",
    runtime: "node",
  },
  {
    filename: "node/objects.js",
    folder: config.nodeExamplesPath,
    category: "node",
    runtime: "node",
  },
  {
    filename: "node/run_worker.js",
    folder: config.nodeExamplesPath,
    category: "node",
    runtime: "node",
  },
  {
    filename: "node/spawn.js",
    folder: config.nodeExamplesPath,
    category: "node",
    runtime: "node",
  },
  // The two separate Cypress examples from "cypress-realworld"
  // and "flake" are not listed here. We don't re-record those
  // ourselves. Instead we use specific recordings from CI runs
  // in those benchmark repos.
  // See README.md for instructions on updating those recording IDs.
];

const examplesJsonPath = join(__dirname, "..", "examples.json");

function logAnimated(text: string): () => void {
  let index = 0;

  const update = () => {
    const frame = dots.frames[++index % dots.frames.length];
    logUpdate(`${chalk.yellowBright(frame)} ${text}`);
  };

  const intervalId = setInterval(update, dots.interval);

  return () => {
    clearInterval(intervalId);
    logUpdate(`${chalk.greenBright("✓")} ${text}`);
    logUpdate.done();
  };
}

async function saveRecording(example: string, apiKey: string, recordingId?: string) {
  if (recordingId) {
  } else {
    const recordings = listAllRecordings();
    if (recordings.length > 0) {
      const lastRecording = recordings[recordings.length - 1];
      recordingId = lastRecording.id;
    } else {
      throw "No recording id found";
    }
  }

  const done = logAnimated(`Saving ${chalk.bold(example)} with recording id ${recordingId}`);
  const id = await uploadRecording(recordingId, {
    apiKey,
    server: config.backendUrl,
    verbose: true,
  });

  await makeReplayPublic(apiKey, recordingId);

  const text = "" + readFileSync(examplesJsonPath);
  const json = JSON.parse(text);
  writeFileSync(examplesJsonPath, JSON.stringify({ ...json, [example]: id }, null, 2));

  done();
}

interface TestRunCallbackArgs {
  example: TestExampleFile;
  examplePath: string;
}

async function saveExamples(
  examplesTarget: Target,
  callback: (args: TestRunCallbackArgs) => Promise<void>
) {
  let examplesToRun = knownExamples.filter(example => example.category === examplesTarget);

  const specificExample = argv.example;

  if (specificExample) {
    examplesToRun = examplesToRun.filter(example => example.filename === specificExample);
  }

  console.log(
    "Running examples for target: ",
    examplesTarget,
    examplesToRun.map(e => e.filename)
  );

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
  const done = logAnimated(`Recording example ${chalk.bold(example.filename)}`);

  const exampleUrl = `${config.devtoolsUrl}/test/examples/${example.filename}`;

  // Shouldn't be "node" by this point
  await recordPlaywright(example.runtime as BrowserName, async page => {
    await page.goto(exampleUrl);
    await waitUntilMessage(page as Page, "ExampleFinished");
  });
  const recordingId = await uploadLastRecording(exampleUrl);

  done();

  if (config.useExampleFile && recordingId) {
    await saveRecording(example.filename, config.replayApiKey, recordingId);
  }
  if (recordingId) {
    removeRecording(recordingId);
  }
}

async function saveNodeExamples() {
  await saveExamples("node", async ({ example, examplePath }: TestRunCallbackArgs) => {
    const done = logAnimated(`Recording example ${chalk.bold(example.filename)}`);

    process.env.RECORD_REPLAY_METADATA_TEST_RUN_ID = uuidv4();

    const recordingId = await recordNodeExample(examplePath);
    if (recordingId) {
      await saveRecording(example.filename, config.nodeWorkspaceApiKey, recordingId!);
      removeRecording(recordingId);

      done();

      console.log(
        `Saved recording ${chalk.bold(example.filename)} with id ${chalk.bold(recordingId)}`
      );
    } else {
      done();

      throw `Unable to save recording for ${chalk.bold(example.filename)}`;
    }
  });
}

async function makeReplayPublic(apiKey: string, recordingId: string) {
  const variables = {
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
    if (e.response) {
      console.log("Parameters");
      console.log(JSON.stringify(variables, undefined, 2));
      console.log("Response");
      console.log(JSON.stringify(e.response.data, undefined, 2));
    }

    throw e.message;
  });
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
      } catch (e) {
        console.log("Unserializable value");
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

    process.exit(0);
  } catch (error) {
    console.error("Unexpected error: ", error);

    process.exit(1);
  }
})();
