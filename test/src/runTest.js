const fs = require("fs");
const path = require("path");
const playwright = require("@recordreplay/playwright");
const cli = require("@replayio/replay");
const _ = require("lodash");

const { sendTelemetryEvent, waitUntilMessage, elapsedTime } = require("./utils");
const { recordNode } = require("./recordNode");

async function recordBrowser(state, test, testPath, browserName, saveFixture) {
  console.log(`Recording Test:`, test, browserName);

  let success, why;
  const logs = [];
  const browser = await playwright[browserName].launch({
    executablePath: state.browserPath,
    headless: state.headless,
  });

  const apolloLogs = [];
  const websocketLogs = [];

  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  try {
    if (state.updateFixtures) {
      page.on("response", async function onResponse(response) {
        const url = response.url();
        if (url.startsWith("https://api.replay.io/v1/graphql")) {
          const request = response.request();
          const requestData = request.postDataJSON();
          const responseData = await response.json();
          apolloLogs.push({
            requestData,
            responseData,
            url,
          });
        }
      });
    }

    await page.goto(testPath);
    page.on("console", async msg => logs.push(`${test}: ${msg.text()}`));
    page.on("websocket", ws => {
      if (ws.url() !== "wss://dispatch.replay.io/") {
        return;
      }
      ws.on("framereceived", frameData => websocketLogs.push(JSON.parse(frameData.payload)));
    });

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

  if (state.updateFixtures && saveFixture) {
    const testName = test.substr(0, test.length - 3);
    fs.writeFileSync(
      `./test/fixtures/${testName}.replay.json`,
      JSON.stringify(websocketLogs, null, 2)
    );
    fs.writeFileSync(
      `./test/fixtures/${testName}.apollo.json`,
      JSON.stringify(apolloLogs, null, 2)
    );
  }

  console.log(`Finished test:${test} success:${success}`, why || "");

  if (!success) {
    console.log(logs.join("\n"));
  }

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

async function onFinish(state, { test, target, success, testPath, why, recordingId }) {
  sendTelemetryEvent("E2EFinished", {
    test,
    action: process.env.GITHUB_ACTION,
    branch: process.env.GITHUB_REF_NAME,
    sha: process.env.GITHUB_SHA,
    success,
    why,
  });

  if (success === false) {
    state.failures.push(`Failed test:${test} target:${target} ${why}`);
    console.log(`[${elapsedTime(state)}] TestFailed: ${why}`);

    recordingId = await upload(state, testPath);

    // Log an error which github will recognize.
    let msg = `::error ::Failure ${test}`;
    if (recordingId) {
      msg += ` ${state.uploadDestination}/recording/${recordingId}`;
    }
    console.log(msg);
  }
}

async function runTest(state, test, exampleRecordingId, target, saveFixture) {
  let testPath = `${state.testingServer}/recording/${exampleRecordingId}?test=${test}`;
  if (state.dispatchServer != "wss://dispatch.replay.io") {
    testPath += `&dispatch=${state.dispatchServer}`;
  }
  if (state.longTimeout) {
    testPath += "&longTimeout=1";
  }

  let success, why, recordingId;
  if (target == "gecko" || target == "chromium") {
    const browserName = target == "gecko" ? "firefox" : "chromium";
    const result = await recordBrowser(state, test, testPath, browserName, saveFixture);
    ({ success, why } = result);
  } else {
    await recordNode(state, path.join(__dirname, "../examples/node", test));
  }

  await onFinish(state, { test, target, success, why, testPath, recordingId });

  return recordingId;
}

exports.runTest = runTest;
