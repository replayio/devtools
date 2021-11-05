/* Copyright 2020 Record Replay Inc. */

#include "header.js"

dump(`ExampleTestHarnessStart\n`);

// This harness is used to load examples in a single browser instance which is
// recording all its content processes, wait for the example to finish and then
// quit the browser.
const url = env.get("RECORD_REPLAY_TEST_URL");
(async function() {
  const promise = waitForMessage("Example__Finished");
  await openUrlInTab(url, "localhost");
  await promise;
  Services.startup.quit(Ci.nsIAppStartup.eAttemptQuit);
})();
