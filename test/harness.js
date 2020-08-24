/* Copyright 2020 Record Replay Inc. */

// Harness used for local testing.

#include "header.js"

// env is declared in the scope this is evaluated in.
const url = env.get("RECORD_REPLAY_TEST_URL");

(async function() {
  await startRecordingTab(url, "localhost");
  await waitForMessage("RecordingFinished");
  await stopRecordingAndLoadDevtools();
})();
