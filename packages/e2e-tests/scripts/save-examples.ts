#!/usr/bin/env ts-node

// NOTE: Set `export API_KEY=someApiKeyHere` before running these steps
// Use the API key for the "Frontend E2E Test Team" that we have set up in admin,
// as that should let us mark these recordings as public.

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Page, expect as expectFunction } from "@playwright/test";
import { removeRecording, uploadRecording } from "@replayio/replay";
import axios from "axios";
import { blue, underline, yellow } from "chalk";
import chalk from "chalk";
import { dots } from "cli-spinners";
import logUpdate from "log-update";
import { v4 as uuidv4 } from "uuid";
import yargs from "yargs";

import { SetRecordingIsPrivateVariables } from "../../shared/graphql/generated/SetRecordingIsPrivate";
import { UpdateRecordingTitleVariables } from "../../shared/graphql/generated/UpdateRecordingTitle";
import config, { BrowserName } from "../config";
import { testFunction as reduxFundamentalsScript } from "../examples/redux-fundamentals/tests/example-script";
import { ExamplesData } from "../helpers";
import { getStats } from "./get-stats";
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
  .option("runtime", {
    alias: "r",
    default: "",
    description: "Override runtime specified in test config",
    choices: ["", "chromium", "firefox", "node"],
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

type PlaywrightScript = (page: Page, expect: typeof expectFunction) => Promise<void>;

type TestExampleFile = {
  filename: string;
  folder: string;
  category: "browser" | "node";
  runtime: "firefox" | "chromium" | "node";
  playwrightScript?: PlaywrightScript;
};

const knownExamples: TestExampleFile[] = [
  {
    filename: "authenticated_comments.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
  },
  {
    filename: "authenticated_logpoints.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
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
    filename: "redux/dist/index.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
  },
  {
    filename: "doc_async.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
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
    runtime: "chromium",
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
    runtime: "chromium",
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
    runtime: "chromium",
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
    runtime: "chromium",
  },
  {
    filename: "doc_navigate.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
  },
  {
    filename: "doc_prod_bundle.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
  },
  {
    filename: "doc_recursion.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
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
    runtime: "chromium",
  },
  {
    filename: "doc_rr_console.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
  },
  {
    filename: "doc_rr_error.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
  },
  {
    filename: "doc_rr_logs.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
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
    runtime: "chromium",
  },
  {
    filename: "doc_rr_region_loading.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
  },
  {
    filename: "doc_rr_worker.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
  },
  {
    filename: "doc_stacking.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "firefox",
  },
  {
    filename: "doc_stacking_chromium.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
  },
  {
    filename: "log_points_and_block_scope.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
  },
  {
    filename: "redux-fundamentals/dist/index.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
    playwrightScript: reduxFundamentalsScript,
  },
  {
    filename: "rdt-react-versions/dist/index.html",
    folder: config.browserExamplesPath,
    category: "browser",
    runtime: "chromium",
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
  // Similarly, the "breakpoints-01" recording is not listed here.
  // See README.md for instructions on updating those recording IDs.
];

const examplesJsonPath = join(__dirname, "..", "examples.json");

const exampleToNewRecordingId: { [example: string]: string } = {};

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

async function saveRecording(
  example: string,
  apiKey: string,
  recordingId: string,
  skipUpload?: boolean
) {
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

  const done = logAnimated(`Saving ${chalk.bold(example)} with recording id ${recordingId}`);

  if (!skipUpload) {
    await uploadRecording(recordingId, {
      apiKey,
      server: config.backendUrl,
      verbose: true,
    });
  }

  await makeReplayPublic(apiKey, recordingId);
  await updateRecordingTitle(apiKey, recordingId, `E2E Example: ${example}`);

  const text = "" + readFileSync(examplesJsonPath);

  const json: ExamplesData = {
    ...JSON.parse(text),
    [example]: {
      recording: recordingId,
      buildId,
    },
  };

  const keys = Object.keys(json).sort();

  writeFileSync(
    examplesJsonPath,
    JSON.stringify(
      keys.reduce((accumulated, key) => {
        accumulated[key] = json[key];

        return accumulated;
      }, {}),
      null,
      2
    )
  );

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

  const specificExamples = argv.example.split(",").filter(s => s.length > 0);

  if (specificExamples.length > 0) {
    examplesToRun = examplesToRun.filter(example => specificExamples.includes(example.filename));
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
  async function defaultPlaywrightScript(page: Page) {
    await waitUntilMessage(page as Page, "ExampleFinished");
  }
  const playwrightScript: PlaywrightScript = example.playwrightScript ?? defaultPlaywrightScript;

  // Shouldn't be "node" by this point
  await recordPlaywright((argv.runtime || example.runtime) as BrowserName, async (page, expect) => {
    const waitForLogPromise = playwrightScript(page, expect);
    const goToPagePromise = page.goto(exampleUrl);

    await Promise.all([goToPagePromise, waitForLogPromise]);
  });

  console.log("Recording completed");
  const recordingId = await uploadLastRecording(exampleUrl);
  if (recordingId == null) {
    throw new Error("Recording not uploaded");
  }

  exampleToNewRecordingId[example.filename] = recordingId;

  done();

  if (config.useExampleFile && recordingId) {
    await saveRecording(example.filename, config.replayApiKey, recordingId, true);
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
      await saveRecording(example.filename, config.replayApiKey, recordingId);
      removeRecording(recordingId);

      exampleToNewRecordingId[example.filename] = recordingId;

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

    const updatedExamples = Object.keys(exampleToNewRecordingId);
    const newRecordingIds = Object.values(exampleToNewRecordingId);

    console.log("\n");
    console.log(
      `${newRecordingIds.length} new recordings have been saved. Open each recording to ensure it has been pre-processed:`
    );
    console.log(
      newRecordingIds
        .map(recordingId => ` • ${blue(underline(`https://go/r/${recordingId}`))}`)
        .join("\n")
    );

    const { exampleToTestMap } = getStats();

    console.log("\n");
    console.log("The following tests have been impacted by this change:");
    console.table(
      updatedExamples
        .map(example => {
          const tests = exampleToTestMap[example];

          return ` • ${yellow(example)}${tests.map(test => `\n   • ${test}`).join("")}`;
        })
        .join("\n")
    );

    process.exit(0);
  } catch (error) {
    console.error("Unexpected error: ", error);

    process.exit(1);
  }
})();
