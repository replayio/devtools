const url = new URL(window.location.href);

const recordingId = url.searchParams.get("id");
const dispatch = url.searchParams.get("dispatch");
const test = url.searchParams.get("test");

// During testing, make sure we clear local storage before importing
// any code that might instantiate preferences from local storage.
if (test) {
  localStorage.clear();
  require("devtools-modules").asyncStorage.clear();
}

// *** WARNING ***
//
// Do not use "import" in this file. The import will run before we clear
// the local storage above, and existing local storage contents may be used
// when running automated tests, which we don't want to happen. It would
// be good if this was less fragile...
//

const { initSocket } = require("protocol/socket");
const loadImages = require("image/image");
const { setupLogpoints } = require("./protocol/logpoint");
const { bootstrapApp } = require("ui/utils/bootstrap/bootstrap");
const { bootstrapStore } = require("ui/utils/bootstrap/bootstrapStore");
const { setupTimeline, setupMetadata, setupApp } = require("ui/actions").actions;
const { setupGraphics } = require("protocol/graphics");
const { setupMessages } = require("devtools/client/webconsole/actions/messages");

const { LocalizationHelper } = require("devtools/shared/l10n");
const { setupEventListeners } = require("devtools/client/debugger/src/actions/event-listeners");
const { DevToolsToolbox } = require("ui/utils/devtools-toolbox");
const { createSession } = require("ui/actions/session");
const {
  initOutputSyntaxHighlighting,
} = require("./devtools/client/webconsole/utils/syntax-highlighted");

let initialized = false;
async function initialize() {
  window.L10N = new LocalizationHelper("devtools/client/locales/debugger.properties");
  loadImages();

  // Initialize the socket so we can communicate with the server
  initSocket(store, dispatch);

  if (recordingId) {
    createSession(store, recordingId);
  }

  document.body.addEventListener("contextmenu", e => e.preventDefault());

  // Set the current mouse position on the window. This is used in places where
  // testing element.matches(":hover") does not work right for some reason.
  document.body.addEventListener("mousemove", e => {
    window.mouseClientX = e.clientX;
    window.mouseClientY = e.clientY;
  });
  window.elementIsHovered = elem => {
    const { left, top, right, bottom } = elem.getBoundingClientRect();
    const { mouseClientX, mouseClientY } = window;
    return (
      left <= mouseClientX && mouseClientX <= right && top <= mouseClientY && mouseClientY <= bottom
    );
  };
}

(async () => {
  window.gToolbox = new DevToolsToolbox();
  store = await bootstrapStore();
  await bootstrapApp({}, { recordingId }, store);

  if (!initialized) {
    initialized = true;
    await initialize();
  }

  if (recordingId) {
    setupApp(recordingId, store);
    setupTimeline(recordingId, store);
    setupMetadata(recordingId, store);
    setupEventListeners(recordingId, store);
    setupGraphics(store);
    initOutputSyntaxHighlighting();
    setupMessages(store);
    setupLogpoints();
  }
})();
