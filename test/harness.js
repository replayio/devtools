/* Copyright 2020 Record Replay Inc. */

// Harness used for local testing.

dump(`TestHarnessStart\n`);

#include "header.js"

// env is declared in the scope this is evaluated in.
const url = env.get("RECORD_REPLAY_TEST_URL");
const recordExample = env.get("RECORD_REPLAY_RECORD_EXAMPLE");
const recordViewer = env.get("RECORD_REPLAY_RECORD_VIEWER");

(async function() {
  await openUrlInTab(url, "localhost");

  if (recordExample) {
    clickRecordingButton();
    dump(`TestHarnessExampleRecordingTabStarted\n`);
    await waitForMessage("Example__Finished");
    clickRecordingButton();
    dump(`TestHarnessExampleRecordingTabFinished\n`);
  } else {
    dump(`TestHarnessRetrievingExampleFromRecordings\n`);
  }

  await waitForViewRecording();
  const exampleReplayUrl = getCurrentUrl();

  if (recordViewer) {
    clickRecordingButton();
    dump(`TestHarnessViewerRecordingTabStarted\n`);
  }

  await waitForMessage("TestFinished");

  if (recordViewer) {
    clickRecordingButton();
    await waitUntil(() => getCurrentUrl() !== exampleReplayUrl);
    dump(`TestHarnessViewerRecordingTabFinished\n`);
  }

  finishTest();
  dump(`TestHarnessFinished\n`);
})();
