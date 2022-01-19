const fs = require("fs");
const path = require("path");
const playwright = require("@recordreplay/playwright");
const cli = require("@recordreplay/recordings-cli");
const _ = require("lodash");

const { recordNode } = require("./recordNode");
const { elapsedTime, waitUntilMessage } = require("./utils");

async function record(state, browserName, example) {
  console.log(`Recording Example:`, example, browserName);

  const browser = await playwright[browserName].launch({
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
  const id = _.findLast(list, rec => rec.metadata.uri == example)?.id;

  if (id) {
    console.log(`Uploading example:${example}`, id);

    const recordingId = await cli.uploadRecording(id, {
      apiKey: state.replayApiKey,
    });

    console.log(
      `Uploaded example:${example}`,
      `${state.uploadDestination}/recording/${recordingId}`
    );

    return recordingId;
  }
}

function updateExampleFile(state, example, recordingId) {
  const newExampleRecordings = { ...state.exampleRecordings, [example]: recordingId };
  fs.writeFileSync("./test/example-recordings.json", JSON.stringify(newExampleRecordings, null, 2));
}

async function recordExample(state, example, target) {
  const browser = target == "gecko" ? "firefox" : "chromium";
  await record(state, browser, example);
  const recordingId = await upload(state, example);
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
        const exampleUrl = `${state.testingServer}/test/examples/${example}`;
        exampleRecordingId = await recordExample(state, exampleUrl, target);
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
