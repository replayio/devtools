const fs = require("fs");
const path = require("path");
const playwright = require("@recordreplay/playwright");
const cli = require("@recordreplay/recordings-cli");
const _ = require("lodash");
const { sendTelemetryEvent, waitUntilMessage, elapsedTime } = require("./utils");
const { recordNode } = require("./recordNode");

async function recordBrowser(state, test, testPath, browserName) {
  console.log(`Recording Test:`, test, browserName);

  let success, why;
  const browser = await playwright[browserName].launch({
    headless: state.headless,
    executablePath: state.executablePath,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(testPath);
    page.on("console", async msg => console.log(`${test}:`, msg.text()));
    const result = await waitUntilMessage(page, "TestFinished", state.testTimeout * 1000);
    success = result.success;
    why = result.why;
  } catch (e) {
    console.log("Error:", e);
    success = false;
    why = "Timed out";
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  console.log(`Finished test:${test} success:${success}`, why);

  return { success, why };
}

const pathname = url => {
  try {
    new URL(url).pathname;
  } catch {
    return "";
  }
};

async function upload(state, test) {
  const list = cli.listAllRecordings();

  const id = _.findLast(list, rec => pathname(rec.metadata.uri) === pathname(test))?.id;

  if (id) {
    console.log("Uploading recording", id);

    const recordingId = await cli.uploadRecording(id, {
      apiKey: state.replayApiKey,
    });

    console.log("Uploaded recording", `${state.uploadDestination}/recording/${recordingId}`);

    return recordingId;
  }
}

function onFinish(state, { test, target, success, why, recordingId }) {
  sendTelemetryEvent("E2EFinished", {
    test,
    action: process.env.GITHUB_ACTION,
    branch: process.env.GITHUB_REF_NAME,
    sha: process.env.GITHUB_SHA,
    success: 0,
    why,
  });

  if (!success) {
    state.failures.push(`Failed test:${test} target:${target} ${why}`);
    console.log(`[${elapsedTime(state)}] Test failed: ${why}`);

    // Log an error which github will recognize.
    let msg = `::error ::Failure ${test}`;
    if (recordingId) {
      msg += ` ${state.uploadDestination}/recording/${recordingId}`;
    }
    console.log(msg);
  }
}

async function runTest(state, test, exampleRecordingId, target) {
  const testPath = `${state.testingServer}/recording/${exampleRecordingId}?test=${test}`;

  let success, why, recordingId;
  if (target == "gecko" || target == "chromium") {
    const browserName = target == "gecko" ? "firefox" : "chromium";
    const result = await recordBrowser(state, test, testPath, browserName);
    ({ success, why } = result);
  } else {
    await recordNode(state, path.join(__dirname, "../examples/node", test));
  }

  if (success === false) {
    recordingId = await upload(state, testPath);
    onFinish(state, { test, target, success, why, recordingId });
  }

  return recordingId;
}

exports.runTest = runTest;
