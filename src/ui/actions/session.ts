import { sendMessage, addEventListener } from "protocol/socket";
import { sessionError, uploadedData } from "@recordreplay/protocol";
import { Action } from "redux";

import tokenManager from "ui/utils/tokenManager";
import { UIStore, UIThunkAction } from "ui/actions";
import * as actions from "ui/actions/app";
import * as selectors from "ui/reducers/app";
import { ThreadFront } from "protocol/thread";
const { prefs } = require("ui/utils/prefs");
import { getTest, isTest, isDevelopment } from "ui/utils/environment";
import { sendTelemetryEvent } from "ui/utils/telemetry";

import { ExpectedError, UnexpectedError } from "ui/state/app";

export type SetUnexpectedErrorAction = Action<"set_unexpected_error"> & {
  error: UnexpectedError;
};
export type SetExpectedErrorAction = Action<"set_expected_error"> & { error: ExpectedError };
export type SessionActions = SetExpectedErrorAction | SetUnexpectedErrorAction;

declare global {
  interface Window {
    sessionId: string;
  }
}

// Create a session to use while debugging.
export async function createSession(store: UIStore, recordingId: string) {
  addEventListener("Recording.uploadedData", (data: uploadedData) =>
    store.dispatch(onUploadedData(data))
  );
  addEventListener("Recording.sessionError", (error: sessionError) =>
    store.dispatch(
      setUnexpectedError({
        ...error,
        message: "Unexpected session error",
        content: "The session has closed due to an error. Please refresh the page.",
        action: "refresh",
      })
    )
  );

  try {
    ThreadFront.setTest(getTest() || undefined);
    ThreadFront.recordingId = recordingId;

    if (!isTest()) {
      tokenManager.addListener(({ token }) => {
        if (token) {
          sendMessage("Authentication.setAccessToken", { accessToken: token });
        }
      });
      await tokenManager.getToken();
    }

    const { sessionId } = await sendMessage("Recording.createSession", {
      recordingId,
    });

    window.sessionId = sessionId;
    ThreadFront.setSessionId(sessionId);
    const recordingTarget = await ThreadFront.recordingTargetWaiter.promise;
    store.dispatch(actions.setRecordingTarget(recordingTarget));

    // We don't want to show the non-dev version of the app for node replays.
    if (recordingTarget === "node") {
      store.dispatch(actions.setViewMode("dev"));
    }

    store.dispatch(actions.setUploading(null));
    prefs.recordingId = recordingId;
  } catch (e) {
    if (e.code == 31) {
      const currentError = selectors.getUnexpectedError(store.getState());

      // Don't overwrite an existing error.
      if (!currentError) {
        store.dispatch(
          setUnexpectedError({
            message: "Unexpected session error",
            content: "The session has closed due to an error. Please refresh the page.",
            action: "refresh",
            ...e,
          })
        );
      }
    } else {
      throw e;
    }
  }
}

function onUploadedData({ uploaded, length }: uploadedData): UIThunkAction {
  return ({ dispatch }) => {
    const uploadedMB = (uploaded / (1024 * 1024)).toFixed(2);
    const lengthMB = length ? (length / (1024 * 1024)).toFixed(2) : undefined;
    dispatch(actions.setUploading({ total: lengthMB, amount: uploadedMB }));
  };
}

export function setExpectedError(error: ExpectedError): UIThunkAction {
  return ({ getState, dispatch }) => {
    const state = getState();

    sendTelemetryEvent("DevtoolsExpectedError", {
      message: error.message,
      action: error.action,
      recordingId: selectors.getRecordingId(state),
      sessionId: selectors.getSessionId(state),
      environment: isDevelopment() ? "dev" : "prod",
    });

    dispatch({ type: "set_expected_error", error });
  };
}

export function setUnexpectedError(error: UnexpectedError): UIThunkAction {
  return ({ getState, dispatch }) => {
    const state = getState();

    sendTelemetryEvent("DevtoolsUnexpectedError", {
      ...error,
      recordingId: selectors.getRecordingId(state),
      sessionId: selectors.getSessionId(state),
      environment: isDevelopment() ? "dev" : "prod",
    });

    dispatch({ type: "set_unexpected_error", error });
  };
}
