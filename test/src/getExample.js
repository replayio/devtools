const fs = require("fs");
const path = require("path");

const playwright = require("@recordreplay/playwright");
const cli = require("@replayio/replay");
const _ = require("lodash");

const { recordNode } = require("./recordNode");
const { elapsedTime, waitUntilMessage } = require("./utils");

async function recordToCloud(state, browserName, exampleUrl) {
  console.log(`Recording Example:`, exampleUrl, browserName);

  if (fs.existsSync(state.exampleRecordingIdFile)) {
    fs.unlinkSync(state.exampleRecordingIdFile);
  }

  const browser = await playwright[browserName].launch({
    env: {
      ...process.env,
      RECORD_REPLAY_API_KEY: state.replayApiKey,
      RECORD_REPLAY_RECORDING_ID_FILE: state.exampleRecordingIdFile,
      RECORD_REPLAY_SERVER: state.dispatchServer,
    },
    executablePath: state.browserPath,
    headless: state.headless,
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(exampleUrl);
    console.log("Loaded Page");
    await waitUntilMessage(page, "ExampleFinished");
  } catch (e) {
    console.log("Failed to record example:", e);
  } finally {
    await page.close();
    await context.close();
    // this is currently necessary to ensure that the recording contains sourcemaps,
    // see https://github.com/RecordReplay/gecko-dev/issues/717
    await new Promise(res => setTimeout(res, 1000));
    await browser.close();
  }
}

async function recordToFile(state, browserName, example) {
  console.log(`Recording Example:`, example, browserName);

  const browser = await playwright[browserName].launch({
    env: {
      ...process.env,
      RECORD_REPLAY_DRIVER: state.driverPath,
      RECORD_REPLAY_VERBOSE: state.diverPath ? "1" : undefined,
    },
    executablePath: state.browserPath,
    headless: state.headless,
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(example);
    console.log("Loaded Page");
    await waitUntilMessage(page, "ExampleFinished");
  } catch (e) {
    console.log("Failed to record example:", e);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

async function upload(state, example) {
  const list = cli.listAllRecordings();
  const id = _.findLast(list, rec => rec.metadata.uri === example)?.id;

  if (id) {
    console.log(`Uploading example:${example}`, id);

    const recordingId = await cli.uploadRecording(id, {
      apiKey: state.replayApiKey,
      server: state.dispatchServer,
    });

    console.log(
      `Uploaded example:${example}`,
      `${state.uploadDestination}/recording/${recordingId}`
    );

    return recordingId;
  }
}

function updateExampleFile(state, example, recordingId) {
  state.exampleRecordings = { ...state.exampleRecordings, [example]: recordingId };
  fs.writeFileSync(
    "./test/example-recordings.json",
    JSON.stringify(state.exampleRecordings, null, 2)
  );
}

async function recordExample(state, example, target) {
  const exampleUrl = `${state.testingServer}/test/examples/${example}`;
  const browser = target === "gecko" ? "firefox" : "chromium";
  let recordingId;
  await recordToFile(state, browser, exampleUrl);
  recordingId = await upload(state, exampleUrl);
  // await recordToCloud(state, browser, exampleUrl);
  // recordingId = fs.readFileSync(state.exampleRecordingIdFile, "utf8").trim();
  // fs.unlinkSync(state.exampleRecordingIdFile);
  if (recordingId) {
    updateExampleFile(state, example, recordingId);
    return recordingId;
  }
}

async function getExample(state, example, target) {
  // Recording ID to load in the viewer. If not set, we will record the example
  // in the browser before stopping and switching to the viewer.
  let exampleRecordingId = state.shouldRecordExamples ? null : state.exampleRecordings[example];

  if (!exampleRecordingId) {
    switch (target) {
      case "node":
        exampleRecordingId = await recordNode(state, path.join(__dirname, "../examples", example));
        break;
      case "gecko":
      case "chromium": {
        exampleRecordingId = await recordExample(state, example, target);
        break;
      }
      default:
        throw new Error(`Bad target ${target}`);
    }
  }

  if (!exampleRecordingId) {
    state.failures.push(`Failed test: ${example} no recording created`);
    console.log(`[${elapsedTime(state)}] Test failed: no recording created`);
    return;
  }

  if (exampleRecordingId) {
    console.log(`Found recording ID ${exampleRecordingId}, loading devtools...`);
  }

  return exampleRecordingId;
}

exports.getExample = getExample;
