// Handling for the mockEnvironment property which is installed on the window object in mock tests.

// This script runs within the browser process.
function doInstall(options) {
  const database = {
    isRecordingInitialized(recordingId) {
      return !options.unknownRecording;
    },
    getRecordingOwnerUserId(recordingId) {
      return null;
    },
    getUserSettings() {
      return {
        showElements: false,
        showReact: false,
        enableTeams: true,
        enableRepaint: false,
        defaultWorkspaceId: null,
      };
    },
    useGetRecording(recordingId) {
      if (options.unknownRecording) {
        return { isAuthorized: false, loading: false };
      }
      return {
        recording: {
          id: recordingId,
          url: "mock-test-url",
          title: "mock-test-title",
          private: false,
          isInitialized: true,
        },
        isAuthorized: true,
        loading: false,
      };
    },
  };

  const Errors = {
    MissingDescription: { code: 28, message: "No description added for recording" },
  };

  function makeResult(result) {
    return { result };
  }

  function makeError(error) {
    return { error };
  }

  const messageHandlers = {
    "Recording.getDescription": () => makeError(Errors.MissingDescription),
    "Recording.createSession": () => {
      const sessionId = "mock-test-session";
      if (options.sessionError) {
        setTimeout(() => {
          emitEvent("Recording.sessionError", {
            sessionId,
            code: 1,
            message: "Session died unexpectedly",
          });
        }, 2000);
      }
      return makeResult({ sessionId });
    },
  };

  let receiveMessageCallback;

  function emitEvent(method, params) {
    const event = { method, params };
    receiveMessageCallback({ data: JSON.stringify(event) });
  }

  window.mockEnvironment = {
    database,
    setOnSocketMessage(callback) {
      receiveMessageCallback = callback;
    },
    async sendSocketMessage(str) {
      const msg = JSON.parse(str);
      if (!messageHandlers[msg.method]) {
        console.error(`Missing mock message handler for ${msg.method}`);
        return new Promise(resolve => {});
      }
      const { result, error } = await messageHandlers[msg.method](msg.params);
      const response = { id: msg.id, result, error };
      receiveMessageCallback({ data: JSON.stringify(response) });
    },
  };
}

function installMockEnvironment(page, options = {}) {
  page.evaluate(doInstall, options);
}

module.exports = { installMockEnvironment };
