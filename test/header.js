/* Copyright 2020 Record Replay Inc. */

// Definitions and utilities shared by end-to-end test scripts. This runs in the
// UI process.

function log(text) {
  dump(text + "\n");
  ChromeUtils.recordReplayLog(text);
}

function finishTest() {
  dump("TestPassed\n");
  Services.startup.quit(Ci.nsIAppStartup.eForceQuit);
}

const window = Services.wm.getMostRecentWindow("navigator:browser");
const { document, navigator } = window;

const EventUtils = {
  window: window,
  parent: window,
  _EU_Ci: Ci,
  _EU_Cc: Cc,
};

Services.scriptloader.loadSubScript(
  "chrome://remote/content/external/EventUtils.js",
  EventUtils
);

const modules = {};
XPCOMUtils.defineLazyModuleGetters(modules, {
  UrlbarInput: "resource:///modules/UrlbarInput.jsm",
});

let urlbar;

// Start recording a url in the current tab.
async function startRecordingTab(url, waitPath) {
  await waitForTime(2000);
  await waitUntil(() => !!document.getElementById("urlbar") && window.gBrowser);
  dump(`TestHarnessHasURLBar\n`);

  urlbar = new modules.UrlbarInput({
    textbox: document.getElementById("urlbar"),
  });

  while (true) {
    dump(`TestHarnessLoadURL ${url}\n`);
    loadUrl(url);
    if (waitPath) {
      if (await waitForLoad(waitPath)) {
        break;
      }
    } else {
      await waitForTime(500);
      break;
    }
  }

  await clickRecordingButton();
}

// Stop a recording tab and load the devtools, finishing up the test when notified
// by the content tab.
async function stopRecordingAndLoadDevtools() {
  await clickRecordingButton();

  // Record the devtools session itself.
  if (!env.get("RECORD_REPLAY_DONT_RECORD_VIEWER")) {
    await waitForTime(3000);
    await clickRecordingButton();
  }

  await waitForMessage("TestFinished");
  finishTest();
}

function loadUrl(url) {
  urlbar.focus();
  urlbar.select();
  EventUtils.sendString(url);
  EventUtils.synthesizeKey("VK_RETURN");
}

// Gives up after 5 seconds, returns whether the load was successful.
async function waitForLoad(urlPattern) {
  for (let i = 0; i < 50; i++) {
    await waitForTime(100);
    if (window.gBrowser.currentURI.spec.includes(urlPattern)) {
      return true;
    }
  }
  dump(`TestHarnessWaitForLoad TimedOut ${window.gBrowser.currentURI.spec}`);
  return false;
}

function waitForTime(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function waitForElapsedTime(time, ms) {
  const wait = time + ms - Date.now();
  if (wait > 0) {
    return waitForTime(wait);
  }
}

async function waitUntil(fn) {
  while (true) {
    const rv = fn();
    if (rv) {
      return rv;
    }
    await waitForTime(100);
  }
}

async function clickButton(button) {
  if (!button) {
    throw new Error("Could not find button");
  }
  await waitUntil(() => !button.hasAttribute("disabled"));
  log(`ButtonClicked`);
  EventUtils.synthesizeMouseAtCenter(button, {}, document.window);
}

function clickRecordingButton() {
  log(`ClickRecordingButton`);
  return clickButton(document.getElementById("recording-button"));
}

function defer() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function waitForMessage(msg) {
  const { resolve, promise } = defer();
  const listener = {
    receiveMessage() {
      resolve();
      Services.ppmm.removeMessageListener(msg, listener);
    },
  };

  Services.ppmm.addMessageListener(msg, listener);
  return promise;
}
