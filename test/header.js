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

Services.scriptloader.loadSubScript("chrome://remote/content/external/EventUtils.js", EventUtils);

const modules = {};
XPCOMUtils.defineLazyModuleGetters(modules, {
  UrlbarInput: "resource:///modules/UrlbarInput.jsm",
});

let urlbar;

async function waitForUrlBar() {
  await waitForTime(2000);
  await waitUntil(() => !!document.getElementById("urlbar") && window.gBrowser);
  dump(`TestHarnessHasURLBar\n`);

  urlbar = new modules.UrlbarInput({
    textbox: document.getElementById("urlbar"),
  });
}

async function openUrlInTab(url, waitPath) {
  await waitForUrlBar();

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
}

async function waitForDevtools() {
  while (true) {
    dump(`TestHarnessWaitForDevtools\n`);

    // This is the server used for hosting the devtools in run.js. This is cheesy...
    if (await waitForLoad("localhost:8080")) {
      break;
    }
  }
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
  log(`WaitingForMessage ${msg}`);
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
