/* Copyright 2020 Record Replay Inc. */

#include "header.js"

// This harness is used to load examples in a single browser instance which is
// recording all its content processes, wait for the example to finish and then
// quit the browser.
(async function() {
  await waitForMessage("Example__Finished");
  Services.startup.quit(Ci.nsIAppStartup.eAttemptQuit);
})();
