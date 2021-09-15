import { sendMessage } from "protocol/socket";
import { uploadedData } from "@recordreplay/protocol";
import { Action } from "redux";

import tokenManager from "ui/utils/tokenManager";
import { UIThunkAction } from "ui/actions";
import * as actions from "ui/actions/app";
import * as selectors from "ui/reducers/app";
import { ThreadFront } from "protocol/thread";
import { assert, waitForTime } from "protocol/utils";
import { validateUUID } from "ui/utils/helpers";
import { prefs } from "ui/utils/prefs";
import { getTest, isDevelopment, getRecordingId, isTest, isMock } from "ui/utils/environment";
import LogRocket from "ui/utils/logrocket";
import { registerRecording, sendTelemetryEvent } from "ui/utils/telemetry";
import { extractGraphQLError } from "ui/utils/apolloClient";

import { ExpectedError, UnexpectedError } from "ui/state/app";
import { getRecording } from "ui/hooks/recordings";
import { getUserId, getUserInfo } from "ui/hooks/users";
import { jumpToInitialPausePoint } from "./timeline";
import { Recording } from "ui/types";
import { getFeatureFlag } from "ui/utils/launchdarkly";

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

export function getAccessibleRecording(
  recordingId: string
): UIThunkAction<Promise<Recording | null>> {
  return async ({ dispatch }) => {
    if (!validateUUID(recordingId)) {
      dispatch(
        setExpectedError({
          message: "Invalid ID",
          content: `"${recordingId}" is not a valid recording ID`,
        })
      );
      return null;
    }

    try {
      const [recording, userId] = await Promise.all([getRecording(recordingId), getUserId()]);
      if (!recording || recording.isInitialized) {
        const expectedError = getRecordingNotAccessibleError(recording, userId);
        if (expectedError) {
          dispatch(setExpectedError(expectedError));
          return null;
        }
      }
      return recording!;
    } catch (err) {
      dispatch(setExpectedError({ message: "Error", content: extractGraphQLError(err)! }));
      return null;
    }
  };
}

function getRecordingNotAccessibleError(
  recording?: Recording,
  userId?: string
): ExpectedError | undefined {
  const isAuthorized = !!(isTest() || recording);
  const isAuthenticated = !!(isTest() || isMock() || tokenManager.auth0Client?.isAuthenticated);

  if (isAuthorized) {
    return undefined;
  }

  if (isAuthenticated) {
    return {
      message: "You don't have permission to view this replay",
      content:
        "Sorry, you can't access this Replay. If you were given this URL, make sure you were invited.",
      action: "library",
    };
  }

  return {
    message: "",
    content: "",
    action: "sign-in",
  };
}

// Create a session to use while debugging.
export function createSession(recordingId: string): UIThunkAction {
  return async ({ getState, dispatch }) => {
    try {
      const [userInfo, recording] = await Promise.all([getUserInfo(), getRecording(recordingId)]);
      assert(recording);

      if (recording.title) {
        document.title = `${recording.title} - Replay`;
      }
      if (recording.workspace) {
        dispatch(actions.setRecordingWorkspace(recording.workspace));
      }

      LogRocket.createSession({
        recording,
        userInfo,
        auth0User: tokenManager.auth0Client?.user,
      });

      registerRecording({ recording, userInfo });

      ThreadFront.setTest(getTest() || undefined);
      ThreadFront.recordingId = recordingId;

      const { sessionId } = await sendMessage("Recording.createSession", {
        recordingId,
      });
      dispatch(showLoadingProgress());

      window.sessionId = sessionId;
      ThreadFront.setSessionId(sessionId);
      const recordingTarget = await ThreadFront.recordingTargetWaiter.promise;
      dispatch(actions.setRecordingTarget(recordingTarget));

      // We don't want to show the non-dev version of the app for node replays.
      if (recordingTarget === "node") {
        dispatch(actions.setViewMode("dev"));
      }

      dispatch(actions.setUploading(null));
      dispatch(actions.setAwaitingSourcemaps(false));
      prefs.recordingId = recordingId;

      dispatch(jumpToInitialPausePoint());
    } catch (e) {
      if (e.code == 31) {
        const currentError = selectors.getUnexpectedError(getState());

        // Don't overwrite an existing error.
        if (!currentError) {
          dispatch(
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
  };
}

function showLoadingProgress(): UIThunkAction {
  return async ({ dispatch, getState }) => {
    let displayedProgress = selectors.getLoading(getState());
    while (displayedProgress < 100) {
      await waitForTime(200);

      let progress = selectors.getLoading(getState());
      const increment = Math.random();
      const decayed = increment * ((100 - displayedProgress) / 40);
      displayedProgress = Math.max(displayedProgress + decayed, progress);

      dispatch(actions.setDisplayedLoadingProgress(displayedProgress));
    }

    const selectedPanel = selectors.getSelectedPanel(getState());
    // This shouldn't hit when the selectedPanel is "comments"
    // as that's not dealt with in toolbox, however we still
    // need to init the toolbox so we're not checking for
    // that here.
    gToolbox.init(selectedPanel);

    await waitForTime(300);
    await ThreadFront.initializedWaiter.promise;
    dispatch(actions.setLoadingFinished(true));
  };
}

export function onUploadedData({ uploaded, length }: uploadedData): UIThunkAction {
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
      recordingId: getRecordingId(),
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
      recordingId: getRecordingId(),
      sessionId: selectors.getSessionId(state),
      environment: isDevelopment() ? "dev" : "prod",
    });

    dispatch({ type: "set_unexpected_error", error });
  };
}
