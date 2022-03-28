/* Copyright 2020 Record Replay Inc. */

// Harness for end-to-end tests.
// Run this from the devtools root directory.

const Manifest = require("./manifest");
const { elapsedTime } = require("./src/utils");
const { getExample } = require("./src/getExample");
const { runTest } = require("./src/runTest");
const { bootstrap } = require("./src/state");

async function runMatchingTests(state) {
  for (let i = 0; i < Manifest.length; i++) {
    const log = msg => console.log(msg);
    const { disabled, example, script, targets } = Manifest[i];
    const test = script;
    if (state.stripeCount && (i % state.stripeCount) + 1 != state.stripeIndex) {
      log(`it does not match stripe`);
      continue;
    }

    if (disabled) {
      log(`it is disabled`);
      continue;
    }

    for (const target of targets) {
      if (state.onlyTarget && target != state.onlyTarget) {
        log(`different target`);
        continue;
      }

      if (process.platform == "darwin" && target == "chromium") {
        log(`chromium is not supported on mac`);
        continue;
      }

      if (state.patterns.length && state.patterns.every(pattern => !test.includes(pattern))) {
        log(`does not match pattern`);
        continue;
      }

      if (state.skippedTests?.includes(test)) {
        log(`excluded by SKIPPED_TESTS`);
        continue;
      }

      console.log(`[${elapsedTime(state)}] TestStart:${test} target:${target}`);
      const exampleRecordingId = await getExample(state, example, target);
      console.log(
        `[${elapsedTime(state)}] TestExample:${test} target:${target} ${exampleRecordingId}`
      );

      const startTime = Date.now();
      await runTest(state, test, exampleRecordingId, target);
      state.timings[`${test}-${target}`] = Date.now() - startTime;
      console.log(`[${elapsedTime(state)}] TestFinished:${test} target:${target}`);
    }
  }
}

(async function () {
  const state = bootstrap(process.argv);
  for (let i = 0; i < state.count; i++) {
    await runMatchingTests(state);
  }

  if (state.failures.length) {
    console.log({ timings: state.timings });
    console.log(`[${elapsedTime(state)}] Had ${state.failures.length} test failures.`);
    state.failures.forEach(failure => console.log(failure));
  } else {
    console.log(`[${elapsedTime(state)}] All tests passed.`);
  }

  process.exit(state.failures.length ? 1 : 0);
})();
