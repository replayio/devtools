/* Copyright 2020 Record Replay Inc. */
// Harness for end-to-end tests. Run this from the devtools root directory.
const fs = require("fs");
const http = require("http");
const os = require("os");
const { spawnSync, spawn } = require("child_process");
const { defer } = require("../src/protocol/utils");
const url = require("url");
const Manifest = require("./manifest.json");

const ExampleRecordings = fs.existsSync("./test/example-recordings.json")
  ? JSON.parse(fs.readFileSync("./test/example-recordings.json"))
  : {};

let count = 1;
const patterns = [];
let stripeIndex, stripeCount, dispatchServer, gInstallDir;
const startTime = Date.now();
let shouldRecordExamples = false;
let shouldRecordViewer = false;

function processArgs() {
  const usage = `
    Usage: run.js arguments
    Arguments:
      --count N: Run tests N times
      --pattern PAT: Only run tests matching PAT
      --record-examples: Record the example and save the recordings locally for testing
      --record-viewer: Record the viewer while the test is running
      --record-all: Record examples and save the recordings locally, and record the viewer
  `;
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    switch (arg) {
      case "--count":
        count = +process.argv[++i];
        break;
      case "--pattern":
        patterns.push(process.argv[++i]);
        break;
      case "--record-examples":
        shouldRecordExamples = true;
        break;
      case "--record-viewer":
        shouldRecordViewer = true;
        break;
      case "--record-all":
        shouldRecordViewer = true;
        shouldRecordExamples = true;
        break;
      case "--help":
      case "-h":
      default:
        console.log(usage);
        process.exit(0);
    }
  }
}

function processEnvironmentVariables() {
  /*
   * RECORD_REPLAY_DONT_RECORD_VIEWER  Disables recording the viewer
   */

  // The INPUT_STRIPE environment variable is set when running as a Github action.
  // This splits testing across multiple machines by having each only do every
  // other stripeCount tests, staggered so that all tests run on some machine.
  if (process.env.INPUT_STRIPE) {
    const match = /(\d+)\/(\d+)/.exec(process.env.INPUT_STRIPE);
    stripeIndex = +match[1];
    stripeCount = +match[2];

    shouldRecordViewer = true;
    shouldRecordExample = true;
  }

  gInstallDir = process.env.RECORD_REPLAY_PATH || "/Applications/Replay.app";

  // Get the address to use for the dispatch server.
  dispatchServer = process.env.RECORD_REPLAY_SERVER || "wss://dispatch.replay.io";
}

function startExampleServer() {
  // Server for content in the examples directory.
  console.log(`Starting example server on port 7998`);
  const exampleServer = http.createServer((request, response) => {
    try {
      const content = fs.readFileSync(`test/examples/${request.url}`);
      response.writeHead(200, { "Content-Type": getContentType(request.url) });
      response.end(content);
    } catch (e) {
      response.writeHead(404);
      response.end();
    }
  });
  exampleServer.listen(7998);
}

function elapsedTime() {
  return (Date.now() - startTime) / 1000;
}

function getContentType(url) {
  return url.endsWith(".js") ? "text/javascript" : "";
}

async function runMatchingTests() {
  for (let i = 0; i < Manifest.length; i++) {
    const [test, example] = Manifest[i];
    const exampleRecordingId = ExampleRecordings[example];
    if (stripeCount && i % stripeCount != stripeIndex) {
      continue;
    }

    // To make tests run faster, we save recordings of the examples locally. This happens just once -
    // when the test is first run. In subsequent tests that require that example, we simply use the
    // saved recording of the example instead of making another recording. To re-record an example,
    // the user can pass in the `--record-examples` or `--record-all` flag to the test runner.
    const env = {
      RECORD_REPLAY_RECORD_EXAMPLE: shouldRecordExamples || !exampleRecordingId,
      RECORD_REPLAY_DONT_RECORD_VIEWER: !shouldRecordViewer,
      RECORD_REPLAY_TEST_URL:
        shouldRecordExamples || !exampleRecordingId
          ? `http://localhost:7998/${example}`
          : `http://localhost:8080/view?id=${exampleRecordingId}&test=${test}`,
    };

    await runTest("test/harness.js", test, 240, env);
  }
}

function tmpFile() {
  return os.tmpdir() + ((Math.random() * 1e9) | 0);
}

function createTestScript({ path }) {
  const generatedScriptPath = tmpFile();
  const generatedScriptFd = fs.openSync(generatedScriptPath, "w");
  spawnSync("clang", ["-C", "-E", "-P", "-nostdinc", "-undef", "-x", "c++", path], {
    stdio: [, generatedScriptFd, generatedScriptFd],
  });
  fs.closeSync(generatedScriptFd);

  // print test file
  if (false) {
    const testFile = fs.readFileSync(generatedScriptPath, { encoding: "utf-8" });
    console.log(testFile);
  }

  return generatedScriptPath;
}

let failures = [];

async function runTest(path, local, timeout = 60, env = {}) {
  const testURL = env.RECORD_REPLAY_TEST_URL || "";
  for (const pattern of patterns) {
    if (!path.includes(pattern) && !testURL.includes(pattern) && !local.includes(pattern)) {
      console.log(`Skipping test ${path} ${testURL} ${local}`);
      return;
    }
  }

  console.log(`[${elapsedTime()}] Starting test ${path} ${testURL} ${local}`);
  const testScript = createTestScript({ path });

  const profileArgs = [];
  if (!process.env.NORMAL_PROFILE) {
    const profile = tmpFile();
    profileArgs.push("-profile", profile);
  }

  const gecko = spawn(`${gInstallDir}/Contents/MacOS/replay`, ["-foreground", ...profileArgs], {
    env: {
      ...process.env,
      ...env,
      MOZ_CRASHREPORTER_AUTO_SUBMIT: "1",
      RECORD_REPLAY_TEST_SCRIPT: testScript,
      RECORD_REPLAY_LOCAL_TEST: local,
      RECORD_REPLAY_NO_UPDATE: "1",
      RECORD_REPLAY_SERVER: dispatchServer,
      RECORD_REPLAY_VIEW_HOST: "http://localhost:8080",
    },
  });

  let passed = false;

  // Recording ID of any viewer recording we've detected.
  let recordingId;

  const waiter = defer();

  function processOutput(data) {
    const match = /CreateRecording (.*?) (.*)/.exec(data.toString());
    if (match && match[2].startsWith("http://localhost:8080/view")) {
      recordingId = match[1];
    }
    if (match && match[2].startsWith("http://localhost:7998")) {
      const exampleRecordingId = match[1];
      const example = url.parse(match[2]).pathname.slice(1);
      console.log(`example`, exampleRecordingId, example, url.parse(match[2]));

      const newExampleRecordings = { ...ExampleRecordings, [example]: exampleRecordingId };

      fs.writeFileSync(
        "./test/example-recordings.json",
        JSON.stringify(newExampleRecordings, null, 2)
      );
    }

    if (/TestPassed/.test(data.toString())) {
      passed = true;
    }
    process.stdout.write(data);
  }

  function logFailure(why) {
    failures.push(`Failed test: ${local} ${why}`);
    console.log(`[${elapsedTime()}] Test failed: ${why}`);

    // Log an error which github will recognize.
    let msg = `::error ::Failure ${local}`;
    if (recordingId) {
      msg += ` https://replay.io/view?id=${recordingId}`;
    }
    spawnChecked("echo", [msg], { stdio: "inherit" });
  }

  gecko.stdout.on("data", processOutput);
  gecko.stderr.on("data", processOutput);

  let timedOut = false;
  let closed = false;
  gecko.on("close", code => {
    closed = true;
    if (!timedOut) {
      if (code) {
        logFailure(`Exited with code ${code}`);
      } else if (!passed) {
        logFailure("Exited without passing test");
      }
    }
    waiter.resolve();
  });

  if (!process.env.RECORD_REPLAY_NO_TIMEOUT) {
    setTimeout(() => {
      if (!closed) {
        logFailure("Timed out");
        timedOut = true;
        gecko.kill();
      }
    }, timeout * 1000);
  }

  await waiter.promise;
}

(async function () {
  processArgs();
  processEnvironmentVariables();
  startExampleServer();

  for (let i = 0; i < count; i++) {
    await runMatchingTests();
  }

  if (failures.length) {
    console.log(`[${elapsedTime()}] Had ${failures.length} test failures.`);
    failures.forEach(failure => console.log(failure));
  } else {
    console.log(`[${elapsedTime()}] All tests passed.`);
  }

  process.exit(failures.length ? 1 : 0);
})();

function spawnChecked(...args) {
  const rv = spawnSync.apply(this, args);
  if (rv.status != 0 || rv.error) {
    throw new Error("Spawned process failed");
  }
}
