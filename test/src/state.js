const os = require("os");
const path = require("path");
const fs = require("fs");

console.log(process.env);
const defaultState = {
  uploadDestination: "https://app.replay.io",
  testingServer: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080",

  // This API key allows access to the whole team that holds all these test
  // recordings. If someone wanted to, they could go in and delete the workspace
  // or recordings in it or anything. While thats not great, it's also not
  // the end of the world. If someone does that, we can always change
  // this code to only run in CI in the main repo and have this as a secret.
  // It's a lot easier to hardcode it for now though.
  // trunk-ignore(gitleaks/generic-api-key)
  replayApiKey: "rwk_7XPbO5fhz0bkhANYXtN2dkm74wNQCchXf2OxVgAerTQ",
  dispatchServer: "wss://dispatch.replay.io",
  exampleRecordings: fs.existsSync("./test/example-recordings.json")
    ? JSON.parse(fs.readFileSync("./test/example-recordings.json"))
    : {},
  headless: !!process.env.RECORD_REPLAY_PLAYWRIGHT_HEADLESS,
  shouldRecordExamples: !!process.env.SHOULD_RECORD_EXAMPLES,
  exampleRecordingIdFile: path.join(os.tmpdir(), "record-replay-example-recording-id"),

  browserPath: process.env.RECORD_REPLAY_PATH,
  driverPath: process.env.RECORD_REPLAY_DRIVER,
  onlyTarget: process.env.onlyTarget,
  skippedTests: process.env.SKIPPED_TESTS,
  testTimeout: 240,
  longTimeout: false,

  // Runtime state
  count: 1,
  failures: [],
  patterns: [],
  startTime: Date.now(),
  stripeCount: undefined,
  stripeIndex: undefined,
  timings: {},
};

const usage = `
  Usage: run.js arguments
  Arguments:
    --count N: Run tests N times
    --pattern PAT: Only run tests matching PAT
    --record-examples: Record the example and save the recordings locally for testing
    --browserPath: Path to the local version of the replay browser to use
    --driverPath: Path to the local version of the linker to use for recording examples
    --timeout N: Use a timeout of N seconds for tests (default 240).
    --target TARGET: Only run tests using given TARGET
    --server ADDRESS: Set server to connect to (default wss://dispatch.replay.io).
    --long-timeout: Use longer timeouts when running tests.
`;
function processArgs(state, argv) {
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--count":
        state.count = +argv[++i];
        break;
      case "--driverPath":
        state.driverPath = argv[++i];
        break;
      case "--browserPath":
        state.browserPath = argv[++i];
        break;
      case "--pattern":
        state.patterns.push(argv[++i]);
        break;
      case "--record-examples":
        state.shouldRecordExamples = true;
        break;
      case "--timeout":
        state.testTimeout = +argv[++i];
        break;
      case "--target":
        state.onlyTarget = argv[++i];
        break;
      case "--server":
        state.dispatchServer = argv[++i];
        break;
      case "--long-timeout":
        state.longTimeout = true;
        break;
      case "--help":
      case "-h":
      default:
        console.log(usage);
        process.exit(0);
    }
  }
}

function processEnvironmentVariables(state) {
  // The INPUT_STRIPE environment variable is set when running as a Github action.
  // This splits testing across multiple machines by having each only do every
  // other stripeCount tests, staggered so that all tests run on some machine.
  if (process.env.INPUT_STRIPE) {
    const match = /(\d+)\/(\d+)/.exec(process.env.INPUT_STRIPE);
    state.stripeIndex = +match[1];
    state.stripeCount = +match[2];
  }
}

function validateState(state) {
  if (state.browserPath && !fs.existsSync(state.browserPath)) {
    throw new Error(
      `supplied browserPath (or $RECORD_REPLAY_PATH): ${state.browserPath} does not exist`
    );
  }
  if (state.driverPath && !fs.existsSync(state.driverPath)) {
    throw new Error(
      `supplied driverPath (or $RECORD_REPLAY_DRIVER): ${state.driverPath} does not exist`
    );
  }
}

function bootstrap(argv) {
  let state = { ...defaultState };
  processArgs(state, argv);
  processEnvironmentVariables(state);
  validateState(state);
  console.log(state);
  return state;
}

exports.bootstrap = bootstrap;
