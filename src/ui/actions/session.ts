import { ApolloError } from "@apollo/client";
import { Action } from "@reduxjs/toolkit";
import { uploadedData } from "@replayio/protocol";
import * as Sentry from "@sentry/react";

import {
  CommandRequest,
  CommandResponse,
  ExperimentalSettings,
  createSession,
} from "protocol/socket";
import { ThreadFront as ThreadFrontType } from "protocol/thread";
import { assert } from "protocol/utils";
import { recordingTargetCache } from "replay-next/src/suspense/BuildIdCache";
import { Recording } from "shared/graphql/types";
import { UIThunkAction } from "ui/actions";
import * as actions from "ui/actions/app";
import { getRecording } from "ui/hooks/recordings";
import { getFeature, getUserSettings } from "ui/hooks/settings";
import { getUserId, getUserInfo } from "ui/hooks/users";
import {
  clearExpectedError,
  getExpectedError,
  setCurrentPoint,
  setTrialExpired,
} from "ui/reducers/app";
import { getUnexpectedError } from "ui/reducers/app";
import {
  ProtocolEvent,
  errorReceived,
  eventReceived,
  requestSent,
  responseReceived,
} from "ui/reducers/protocolMessages";
import { setFocusRegion } from "ui/reducers/timeline";
import type { ExpectedError, UnexpectedError } from "ui/state/app";
import { extractGraphQLError } from "ui/utils/apolloClient";
import { getPausePointParams, isMock, isTest } from "ui/utils/environment";
import LogRocket from "ui/utils/logrocket";
import { endMixpanelSession } from "ui/utils/mixpanel";
import { features, prefs } from "ui/utils/prefs";
import { registerRecording, trackEvent } from "ui/utils/telemetry";
import tokenManager from "ui/utils/tokenManager";
import { subscriptionExpired } from "ui/utils/workspace";

import { setExpectedError, setUnexpectedError } from "./errors";
import { setViewMode } from "./layout";
import { jumpToInitialPausePoint } from "./timeline";

export { setUnexpectedError, setExpectedError };

declare global {
  interface Window {
    sessionId: string;
    sessionMetrics: any[] | undefined;
  }
}

export function getAccessibleRecording(
  recordingId: string
): UIThunkAction<Promise<Recording | null>> {
  return async dispatch => {
    try {
      const [recording, userId] = await Promise.all([getRecording(recordingId), getUserId()]);
      if (!recording || recording.isInitialized) {
        const expectedError = getRecordingNotAccessibleError(recording, userId);
        if (expectedError) {
          dispatch(setExpectedError(expectedError));
          return null;
        } else {
          dispatch(clearRecordingNotAccessibleError());
        }
      }
      return recording!;
    } catch (err) {
      let content = "Unexpected error retrieving recording.";
      if (err instanceof ApolloError) {
        content = extractGraphQLError(err)!;
      }

      dispatch(setExpectedError({ message: "Error", content }));
      return null;
    }
  };
}

function clearRecordingNotAccessibleError(): UIThunkAction {
  return async (dispatch, getState) => {
    const state = getState();
    const err = getExpectedError(state);

    // NOTE: This is coupled to the errors generated by getRecordingNotAccessibleError()
    if (err?.action === "sign-in" || err?.action === "request-access") {
      dispatch(clearExpectedError());
    }
  };
}

function getRecordingNotAccessibleError(
  recording?: Recording,
  userId?: string
): ExpectedError | undefined {
  const isAuthorized = !!((isTest() && !isMock()) || recording);
  const isAuthenticated = !!(isTest() || isMock() || !!tokenManager.getState()?.token);

  if (isAuthorized) {
    return undefined;
  }

  if (isAuthenticated) {
    trackEvent("error.unauthorized_viewer");
    return {
      message: "Sorry, you don't have permission!",
      content: "Maybe you haven't been invited to this replay yet?",
      action: "request-access",
    };
  }

  trackEvent("error.unauthenticated_viewer");
  return {
    message: "Almost there!",
    content: "This is a private replay. Please sign in.",
    action: "sign-in",
  };
}

export function getDisconnectionError(): UnexpectedError {
  endMixpanelSession("disconnected");
  return {
    action: "refresh",
    content: "This replay timed out to reduce server load.",
    message: "Ready when you are!",
  };
}

interface SourceContentsCommandRespone {
  id: number;
  result: {
    contentType: string;
    contents: string;
  };
  error?: undefined;
}

function isSourceContentsCommandResponse(
  response: CommandResponse
): response is SourceContentsCommandRespone {
  // @ts-expect-error
  return response.result && "contentType" in response.result && "contents" in response.result;
}

// Create a session to use while debugging.
// NOTE: This thunk is dispatched _before_ the rest of the devtools logic
// is initialized, so `extra.ThreadFront` isn't available yet.
// We pass `ThreadFront` in as an arg here instead.
export function createSocket(
  recordingId: string,
  ThreadFront: typeof ThreadFrontType
): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    assert(recordingId, "no recordingId");
    try {
      if (ThreadFront.recordingId) {
        assert(
          recordingId === ThreadFront.recordingId,
          "Can't create a session for 2 different recordings"
        );
        return;
      }
      ThreadFront.recordingId = recordingId;

      const [userSettings, userInfo, recording] = await Promise.all([
        getUserSettings(),
        getUserInfo(),
        getRecording(recordingId),
      ]);
      assert(recording, "failed to load recording");

      if (recording.workspace) {
        dispatch(actions.setRecordingWorkspace(recording.workspace));
      }

      LogRocket.createSession({
        recording,
        userInfo,
        auth0User: tokenManager.auth0Client?.user,
        userSettings,
      });

      registerRecording({ recording });

      if (
        recording.workspace &&
        subscriptionExpired(recording.workspace, new Date(recording.date))
      ) {
        return dispatch(setTrialExpired());
      }

      const experimentalSettings: ExperimentalSettings = {
        disableScanDataCache: getFeature("disableScanDataCache"),
        disableCache: !!prefs.disableCache,
        disableStableQueryCache: getFeature("disableStableQueryCache"),
        disableUnstableQueryCache: !getFeature("enableUnstableQueryCache"),
        listenForMetrics: !!prefs.listenForMetrics,
        profileWorkerThreads: getFeature("profileWorkerThreads"),
        enableRoutines: getFeature("enableRoutines"),
        rerunRoutines: getFeature("rerunRoutines"),
        disableRecordingAssetsInDatabase: getFeature("disableRecordingAssetsInDatabase"),
        keepAllTraces: getFeature("keepAllTraces"),
        disableIncrementalSnapshots: getFeature("disableIncrementalSnapshots"),
        disableConcurrentControllerLoading: getFeature("disableConcurrentControllerLoading"),
      };
      if (features.newControllerOnRefresh) {
        experimentalSettings.controllerKey = String(Date.now());
      }

      const queuedActions: Array<Action | UIThunkAction> = [];
      let flushTimeoutId: NodeJS.Timeout | null = null;

      function flushQueuedActions() {
        flushTimeoutId = null;

        const actions = queuedActions.splice(0);
        actions.forEach(action => dispatch(action));
      }

      // WebSocket messages may be sent by a component that Suspends during render.
      // Dispatching these Redux actions after a tick avoids potentially scheduling a React update while another component is rendering.
      function queueAction(action: Action | UIThunkAction) {
        queuedActions.push(action);

        if (flushTimeoutId === null) {
          flushTimeoutId = setTimeout(flushQueuedActions, 0);
        }
      }

      const focusRegion = getPausePointParams().focusRegion;
      const focusRange = focusRegion
        ? {
            begin: focusRegion.begin.time,
            end: focusRegion.end.time,
          }
        : undefined;

      const sessionId = await createSession(
        recordingId,
        undefined,
        experimentalSettings,
        focusRange,
        {
          onEvent: (event: ProtocolEvent) => {
            if (getFeature("logProtocolEvents")) {
              queueAction(eventReceived({ ...event, recordedAt: window.performance.now() }));
            }
          },
          onRequest: (request: CommandRequest) => {
            if (getFeature("logProtocol")) {
              queueAction(requestSent({ ...request, recordedAt: window.performance.now() }));
            }
          },
          onResponse: (response: CommandResponse) => {
            if (getFeature("logProtocol")) {
              const clonedResponse = { ...response, recordedAt: window.performance.now() };

              if (isSourceContentsCommandResponse(clonedResponse)) {
                // Must be a source contents entry. Shrink the source text just to minimize store size.
                // It's rare that we would want to look at the source text in the Protocol Viewer,
                // and at most we might want to see if the initial lines match or something.
                clonedResponse.result = {
                  ...clonedResponse.result,
                  contents: clonedResponse.result.contents.slice(0, 1000),
                };
              }
              queueAction(responseReceived(clonedResponse));
            }
          },
          onResponseError: (error: CommandResponse) => {
            if (getFeature("logProtocol")) {
              queueAction(errorReceived({ ...error, recordedAt: window.performance.now() }));
            }
          },
          onSocketError: (evt: Event, initial: boolean) => {
            console.error("Socket Error", evt);
            if (initial) {
              queueAction(
                setUnexpectedError({
                  action: "refresh",
                  content:
                    "A connection to our server could not be established. Please check your connection.",
                  message: "Unable to establish socket connection",
                  ...evt,
                })
              );
            } else {
              queueAction(
                setUnexpectedError({
                  action: "refresh",
                  content: "The socket has closed due to an error. Please refresh the page.",
                  message: "Unexpected socket error",
                  ...evt,
                })
              );
            }
          },
          onSocketClose: (willClose: boolean) => {
            if (!willClose) {
              queueAction(setUnexpectedError(getDisconnectionError(), true));
            }
          },
        }
      );

      Sentry.configureScope(scope => {
        scope.setExtra("sessionId", sessionId);
      });

      window.sessionId = sessionId;
      replayClient.configure(sessionId);
      ThreadFront.setSessionId(sessionId);
      const recordingTarget = await recordingTargetCache.readAsync(replayClient);
      dispatch(actions.setRecordingTarget(recordingTarget));

      // We don't want to show the non-dev version of the app for node replays.
      if (recordingTarget === "node") {
        dispatch(setViewMode("dev"));
      }

      dispatch(actions.setUploading(null));
      dispatch(actions.setAwaitingSourcemaps(false));

      ThreadFront.on("paused", ({ point }) => dispatch(setCurrentPoint(point)));

      await ThreadFront.waitForSession();
      await dispatch(jumpToInitialPausePoint());

      dispatch(actions.setLoadingFinished(true));

      const focusWindow = await replayClient.getFocusWindow();
      if (
        !focusRegion ||
        focusRegion.begin.point !== focusWindow.begin.point ||
        focusRegion.end.point !== focusWindow.end.point
      ) {
        dispatch(setFocusRegion(focusWindow));
      }
    } catch (e: any) {
      const currentError = getUnexpectedError(getState());

      // Don't overwrite an existing error.
      if (!currentError) {
        dispatch(
          setUnexpectedError({
            message: "Unexpected session error",
            content: e.message || "The session has closed due to an error.",
            action: "library",
          })
        );
      }
    }
  };
}

export function onUploadedData({ uploaded, length }: uploadedData): UIThunkAction {
  return dispatch => {
    const uploadedMB = (uploaded / (1024 * 1024)).toFixed(2);
    const lengthMB = length ? (length / (1024 * 1024)).toFixed(2) : undefined;
    dispatch(actions.setUploading({ total: lengthMB, amount: uploadedMB }));
  };
}

export function clearTrialExpired() {
  return setTrialExpired(false);
}
