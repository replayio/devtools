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

require("devtools/codemirror-addons");

const { initSocket, sendMessage, setStatus, addEventListener } = require("protocol/socket");
const { ThreadFront } = require("protocol/thread");
const loadImages = require("image/image");
const { bootstrapApp } = require("ui/utils/bootstrap/bootstrap");
const {
  setupTimeline,
  setupMetadata,
  setUploading,
  setupApp,
  setUnexpectedError,
  setExpectedError,
} = require("ui/actions").actions;

const { LocalizationHelper } = require("devtools/shared/l10n");
const { setupEventListeners } = require("devtools/client/debugger/src/actions/event-listeners");
const { prefs } = require("ui/utils/prefs");

// Create a session to use while debugging.
async function createSession() {
  addEventListener("Recording.uploadedData", onUploadedData);
  addEventListener("Recording.sessionError", onSessionError);

  try {
    ThreadFront.setTest(test);
    ThreadFront.recordingId = recordingId;
    const { sessionId } = await sendMessage("Recording.createSession", {
      recordingId,
    });
    window.sessionId = sessionId;
    ThreadFront.setSessionId(sessionId);
    store.dispatch(setUploading(null));
    prefs.recordingId = recordingId;
  } catch (e) {
    if (e.code == 9 || e.code == 31) {
      store.dispatch(setExpectedError(e));
    } else {
      throw e;
    }
  }
}

function onUploadedData({ uploaded, length }) {
  const uploadedMB = (uploaded / (1024 * 1024)).toFixed(2);
  const lengthMB = length ? (length / (1024 * 1024)).toFixed(2) : undefined;
  store.dispatch(setUploading({ total: lengthMB, amount: uploadedMB }));
}

function onSessionError(error) {
  store.dispatch(setUnexpectedError(error));
}

let initialized = false;
async function initialize() {

  window.L10N = new LocalizationHelper("devtools/client/locales/debugger.properties");
  loadImages();

  // Initialize the socket so we can communicate with the server
  initSocket(dispatch);

  if (recordingId) {
    createSession();
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
  store = await bootstrapApp({}, { recordingId });

  if (!initialized) {
    initialized = true;
    await initialize();
  }

  if (recordingId) {
    setupApp(recordingId, store);
    setupTimeline(recordingId, store);
    setupMetadata(recordingId, store);
    setupEventListeners(recordingId, store);
  }
})();
