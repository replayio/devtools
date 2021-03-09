/* Copyright 2020 Record Replay Inc. */

// Harness for end-to-end tests. Run this from the devtools root directory.
const fs = require("fs");
const https = require("https");
const { spawn, spawnSync } = require("child_process");
const url = require("url");
const Manifest = require("./manifest.json");
const {
  findGeckoPath,
  createTestScript,
  tmpFile,
  spawnChecked,
  defer,
} = require("./utils");

const ExampleRecordings = fs.existsSync("./test/example-recordings.json")
  ? JSON.parse(fs.readFileSync("./test/example-recordings.json"))
  : {};

let count = 1;
const patterns = [];
let stripeIndex, stripeCount, dispatchServer;
const startTime = Date.now();
let shouldRecordExamples = false;
let shouldRecordViewer = false;
let recordExamplesSeparately = false;

function processArgs() {
  const usage = `
    Usage: run.js arguments
    Arguments:
      --count N: Run tests N times
      --pattern PAT: Only run tests matching PAT
      --record-examples: Record the example and save the recordings locally for testing
      --record-viewer: Record the viewer while the test is running
      --record-all: Record examples and save the recordings locally, and record the viewer
      --separate: Record examples in a separate browser instance.
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
      case "--separate":
        shouldRecordExamples = true;
        recordExamplesSeparately = true;
        break;
      case "--help":
      case "-h":
      default:
        console.log(usage);
        process.exit(0);
    }
  }
}

const DefaultDispatchServer = "wss://dispatch.replay.io";

function processEnvironmentVariables() {
  // The INPUT_STRIPE environment variable is set when running as a Github action.
  // This splits testing across multiple machines by having each only do every
  // other stripeCount tests, staggered so that all tests run on some machine.
  if (process.env.INPUT_STRIPE) {
    const match = /(\d+)\/(\d+)/.exec(process.env.INPUT_STRIPE);
    stripeIndex = +match[1];
    stripeCount = +match[2];

    // This is hacky, but on macOS we require() this script instead of starting
    // it with specific command line arguments.
    if (process.platform == "darwin") {
      shouldRecordViewer = true;
      shouldRecordExamples = true;
    }
  }

  // Get the address to use for the dispatch server.
  dispatchServer = process.env.RECORD_REPLAY_SERVER || DefaultDispatchServer;
}

function elapsedTime() {
  return (Date.now() - startTime) / 1000;
}

async function runMatchingTests() {
  for (let i = 0; i < Manifest.length; i++) {
    const [test, example] = Manifest[i];
    if (stripeCount && i % stripeCount != stripeIndex) {
      continue;
    }

    await runTest(test, example);
  }
}

let failures = [];

async function runTest(test, example) {
  if (patterns.length && patterns.every(pattern => !test.includes(pattern))) {
    console.log(`Skipping test ${test}`);
    return;
  }

  if (process.env.SKIPPED_TESTS && process.env.SKIPPED_TESTS.includes(test)) {
    console.log(`Skipping test ${test}, excluded by SKIPPED_TESTS`);
    return;
  }

  console.log(`[${elapsedTime()}] Starting test ${test}`);

  // Recording ID to load in the viewer. If not set, we will record the example
  // in the browser before stopping and switching to the viewer.
  let exampleRecordingId = shouldRecordExamples ? null : ExampleRecordings[example];

  if (example.endsWith(".js")) {
    // Node test.
    if (!exampleRecordingId) {
      if (!process.env.RECORD_REPLAY_NODE) {
        console.log(`Skipping test ${test}: RECORD_REPLAY_NODE not set`);
        return;
      }
      if (!process.env.RECORD_REPLAY_DRIVER) {
        console.log(`Skipping test ${test}: RECORD_REPLAY_DRIVER not set`);
        return;
      }
      exampleRecordingId = await createExampleNodeRecording(example);
      if (!exampleRecordingId) {
        failures.push(`Failed test: ${example} no node recording created`);
        console.log(`[${elapsedTime()}] Test failed: no node recording created`);
        return;
      }
    }
  } else if (recordExamplesSeparately) {
    exampleRecordingId = await createExampleBrowserRecording(
      `http://localhost:8080/test/examples/${example}`
    );
    if (!exampleRecordingId) {
      failures.push(`Failed test: ${example} no recording created`);
      console.log(`[${elapsedTime()}] Test failed: no recording created`);
      return;
    }
  }

  // To make tests run faster, we save recordings of the examples locally. This happens just once -
  // when the test is first run. In subsequent tests that require that example, we simply use the
  // saved recording of the example instead of making another recording. To re-record an example,
  // the user can pass in the `--record-examples` or `--record-all` flag to the test runner.
  const env = {
    RECORD_REPLAY_RECORD_EXAMPLE: exampleRecordingId ? undefined : "1",
    RECORD_REPLAY_RECORD_VIEWER: shouldRecordViewer ? "1" : undefined,
    // Don't start processing recordings when they are created while we are
    // running tests. This reduces server load if we are recording the viewer
    // itself.
    RECORD_REPLAY_DONT_PROCESS_RECORDINGS: true,
    RECORD_REPLAY_TEST_URL:
      exampleRecordingId
        ? `http://localhost:8080/view?id=${exampleRecordingId}&test=${test}&dispatch=${dispatchServer}`
      : `http://localhost:8080/test/examples/${example}`,
    // If we need to record the example we have to use the target dispatch server.
    // If we already have the example, use the default dispatch server. When running in CI
    // against a local version of the backend, this allows us to record the viewer using the
    // regular dispatch server and get recordings that are easier to inspect.
    RECORD_REPLAY_SERVER: exampleRecordingId ? DefaultDispatchServer : dispatchServer,
    RECORD_REPLAY_DRIVER: exampleRecordingId ? undefined : process.env.RECORD_REPLAY_DRIVER,
  };

  await runTestViewer("test/harness.js", test, 240, env);
}

function spawnGecko(env) {
  const args = ["-foreground"];

  if (!process.env.NORMAL_PROFILE) {
    const profile = tmpFile();
    fs.mkdirSync(profile);
    args.push("-profile", profile);

    // Change the startup page from replay.io/view so that we don't create
    // a recording for the latter if RECORD_ALL_CONTENT is set.
    fs.writeFileSync(`${profile}/prefs.js`, `user_pref("browser.startup.homepage", "about:blank");\n`);
  }

  if (process.env.HEADLESS) {
    args.push("-headless");
  }

  const geckoPath = findGeckoPath();
  return spawn(geckoPath, args, { env });
}

async function runTestViewer(path, local, timeout, env) {
  const testScript = createTestScript({ path });

  const gecko = spawnGecko({
    ...process.env,
    ...env,
    MOZ_CRASHREPORTER_AUTO_SUBMIT: "1",
    RECORD_REPLAY_TEST_SCRIPT: testScript,
    RECORD_REPLAY_LOCAL_TEST: local,
    RECORD_REPLAY_VIEW_HOST: "http://localhost:8080",
  });

  let passed = false;

  // Recording ID of any viewer recording we've detected.
  let recordingId;

  const { promise, resolve } = defer();

  function processOutput(data) {
    const match = /CreateRecording (.*?) (.*)/.exec(data.toString());
    if (match && match[2].startsWith("http://localhost:8080/view")) {
      recordingId = match[1];

      if (env.RECORD_REPLAY_SERVER == DefaultDispatchServer) {
        addTestRecordingId(recordingId);
      }
    }
    if (match && match[2].startsWith("http://localhost:8080/test/examples/")) {
      const exampleRecordingId = match[1];
      const path = url.parse(match[2]).pathname.slice(1);
      const filename = path.split("/")[path.split("/").length - 1];

      const newExampleRecordings = { ...ExampleRecordings, [filename]: exampleRecordingId };
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
    // This is used in backend CI to move dump files into a shared directory
    // after test failures.
    if (process.env.TEST_FAILURE_DUMP_SOURCE &&
        process.env.TEST_FAILURE_DUMP_TARGET) {
      try {
        const source = process.env.TEST_FAILURE_DUMP_SOURCE;
        const target = process.env.TEST_FAILURE_DUMP_TARGET;
        for (const file of fs.readdirSync(source)) {
          fs.renameSync(`${source}/${file}`, `${target}/${local}-${file}`);
          console.log(`DumpFile ${file}`);
        }
      } catch (e) {
        console.log(`DumpFileError ${e}`);
      }
    }

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
    resolve();
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

  await promise;
}

function getRecordingId(file) {
  try {
    const contents = fs.readFileSync(file).toString().split("\n")[0];
    return (contents && contents.length) ? contents : null;
  } catch (e) {
    return null;
  }
}

async function createExampleNodeRecording(example) {
  const recordingIdFile = tmpFile();
  spawnSync(
    process.env.RECORD_REPLAY_NODE,
    [`${__dirname}/examples/node/${example}`],
    {
      env: {
        ...process.env,
        RECORD_REPLAY_RECORDING_ID_FILE: recordingIdFile,
        RECORD_REPLAY_DISPATCH: dispatchServer,
      },
      stdio: "inherit",
    },
  );
  return getRecordingId(recordingIdFile);
}

async function createExampleBrowserRecording(url) {
  const testScript = createTestScript({ path: `${__dirname}/exampleHarness.js` });
  const recordingIdFile = tmpFile();
  const gecko = spawnGecko({
    ...process.env,
    MOZ_CRASHREPORTER_AUTO_SUBMIT: "1",
    RECORD_REPLAY_TEST_SCRIPT: testScript,
    RECORD_REPLAY_TEST_URL: url,
    RECORD_REPLAY_RECORDING_ID_FILE: recordingIdFile,
    RECORD_REPLAY_SERVER: dispatchServer,
    RECORD_ALL_CONTENT: "1",
  });

  if (!process.env.RECORD_REPLAY_NO_TIMEOUT) {
    setTimeout(() => gecko.kill(), 30 * 1000);
  };

  gecko.stdout.on("data", data => process.stderr.write(data));
  gecko.stderr.on("data", data => process.stderr.write(data));

  const { promise, resolve } = defer();
  gecko.on("close", resolve);

  await promise;
  return getRecordingId(recordingIdFile);
}

(async function () {
  processArgs();
  processEnvironmentVariables();

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

function addTestRecordingId(recordingId) {
  try {
    const options = {
      hostname: "test-inbox.replay.io",
      port: 443,
      path: `/${recordingId}`,
      method: "GET",
    };
    const req = https.request(options, res => {
      console.log("AddTestRecordingId", recordingId, res.statusCode);
    });
    req.end();
  } catch (e) {
    console.error("addTestRecordingId failed", e);
  }
}
