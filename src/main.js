const url = new URL(window.location.href);

// Coercing recordingId to undefined so that it is not passed to auth0
const recordingId = url.searchParams.get("id") || undefined;
const dispatch = url.searchParams.get("dispatch") || "wss://dispatch.replay.io";
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
const { setupLogpoints } = require("./protocol/logpoint");
const { bootstrapApp } = require("ui/utils/bootstrap/bootstrap");
const { bootstrapStore } = require("ui/utils/bootstrap/bootstrapStore");
const { setupTimeline, setupApp } = require("ui/actions").actions;
const { setupGraphics } = require("protocol/graphics");
const { setupMessages } = require("devtools/client/webconsole/actions/messages");

const { LocalizationHelper } = require("devtools/shared/l10n");
const { setupEventListeners } = require("devtools/client/debugger/src/actions/event-listeners");
const { DevToolsToolbox } = require("ui/utils/devtools-toolbox");
const { createSession } = require("ui/actions/session");
import { setExpectedError } from "ui/actions/session";
import { Action, Dispatch } from "redux";

const {
  initOutputSyntaxHighlighting,
} = require("./devtools/client/webconsole/utils/syntax-highlighted");

require("image/image.css");

let initialized = false;
async function initialize() {
  window.L10N = new LocalizationHelper("devtools/client/locales/debugger.properties");

  // Initialize the socket so we can communicate with the server
  initSocket(dispatch, {
    onClose: () => store.dispatch(onSocketClose()),
    onError: (evt: Event) => store.dispatch(onSocketError(evt)),
  });

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
    if (!elem) {
      return false;
    }
    const { left, top, right, bottom } = elem.getBoundingClientRect();
    const { mouseClientX, mouseClientY } = window;
    return (
      left <= mouseClientX && mouseClientX <= right && top <= mouseClientY && mouseClientY <= bottom
    );
  };
}

function onSocketClose() {
  return ({ dispatch }: { dispatch: Dispatch<Action> }) => {
    log("Socket Closed");
    gSocketOpen = false;

    if (!willClose) {
      dispatch(
        setExpectedError({
          message: "Session has closed due to inactivity, please refresh the page.",
        })
      );
    }
  };
}

function onSocketError(evt: Event) {
  console.error("Socket Error", evt);
  // If the socket has errored, the connection will close. So let's set `willClose`
  // so that we show _this_ error message, and not the `onSocketClose` error message
  willClose = true;
  return ({ dispatch }: { dispatch: Dispatch<Action> }) => {
    log("Socket Error");
    dispatch(
      setExpectedError({
        message: "Session has closed due to an error, please refresh the page.",
      })
    );
  };
}

(async () => {
  window.gToolbox = new DevToolsToolbox();
  store = await bootstrapStore();

  if (!initialized) {
    initialized = true;
    await initialize();
  }

  if (recordingId) {
    setupApp(recordingId, store);
    setupTimeline(recordingId, store);
    setupEventListeners(recordingId, store);
    setupGraphics(store);
    initOutputSyntaxHighlighting();
    setupMessages(store);
    setupLogpoints(store);
  }

  bootstrapApp({}, { recordingId }, store);
})();
