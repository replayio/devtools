import { sendMessage, addEventListener } from "protocol/socket";
import { sessionError, uploadedData } from "@recordreplay/protocol";
import { Action } from "redux";

import tokenManager from "ui/utils/tokenManager";
import { UIStore, actions, UIThunkAction } from "ui/actions";
import { ThreadFront } from "protocol/thread";
const { prefs } = require("ui/utils/prefs");
import { getTest, isTest } from "ui/utils/environment";

import { ExpectedError } from "ui/state/app";
import { getExpectedError } from "ui/reducers/app";

export type SetUnexpectedErrorAction = Action<"set_unexpected_error"> & { error: sessionError };
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
  addEventListener("Recording.sessionError", (err: sessionError) =>
    store.dispatch(onSessionError(err))
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
    store.dispatch(actions.setUploading(null));
    prefs.recordingId = recordingId;
  } catch (e) {
    if (e.code == 9 || e.code == 31) {
      const currentExpectedError = getExpectedError(store.getState());

      // Don't overwrite an existing error.
      if (!currentExpectedError) {
        store.dispatch(setExpectedError(e));
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

function onSessionError(error: sessionError): UIThunkAction {
  return ({ dispatch }) => {
    dispatch(setUnexpectedError(error));
  };
}

export function setExpectedError(error: ExpectedError): SetExpectedErrorAction {
  return { type: "set_expected_error", error };
}

export function setUnexpectedError(error: sessionError): SetUnexpectedErrorAction {
  return { type: "set_unexpected_error", error };
}
