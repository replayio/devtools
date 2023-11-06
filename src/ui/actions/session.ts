import { ApolloError } from "@apollo/client";
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
import { recordingCapabilitiesCache } from "replay-next/src/suspense/BuildIdCache";
import { extractGraphQLError } from "shared/graphql/apolloClient";
import { Recording } from "shared/graphql/types";
import { userData } from "shared/user-data/GraphQL/UserData";
import { getPausePointParams, isTest } from "shared/utils/environment";
import { UIThunkAction } from "ui/actions";
import * as actions from "ui/actions/app";
import { getRecording } from "ui/hooks/recordings";
import { getUserId, getUserInfo } from "ui/hooks/users";
import {
  clearExpectedError,
  getExpectedError,
  getUnexpectedError,
  setTrialExpired,
} from "ui/reducers/app";
import { getToolboxLayout } from "ui/reducers/layout";
import {
  ProtocolEvent,
  ReceivedProtocolMessage,
  RequestSummary,
  protocolMessagesReceived,
} from "ui/reducers/protocolMessages";
import { setFocusWindow } from "ui/reducers/timeline";
import type { ExpectedError, UnexpectedError } from "ui/state/app";
import LogRocket from "ui/utils/logrocket";
import { endMixpanelSession } from "ui/utils/mixpanel";
import { registerRecording, trackEvent } from "ui/utils/telemetry";
import tokenManager from "ui/utils/tokenManager";
import { subscriptionExpired } from "ui/utils/workspace";

import { setExpectedError, setUnexpectedError } from "./errors";
import { setToolboxLayout, setViewMode } from "./layout";
import { jumpToInitialPausePoint } from "./timeline";

export { setExpectedError, setUnexpectedError };

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
  const isAuthorized = !!(isTest() || recording);
  const isAuthenticated = !!(isTest() || !!tokenManager.getState()?.token);

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
export function createSocket(recordingId: string): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    try {
      assert(recordingId, "no recordingId");
      dispatch(actions.setRecordingId(recordingId));
      const [userInfo, recording] = await Promise.all([getUserInfo(), getRecording(recordingId)]);
      assert(recording, "failed to load recording");

      if (recording.workspace) {
        dispatch(actions.setRecordingWorkspace(recording.workspace));
      }

      LogRocket.createSession({
        recording,
        userInfo,
        auth0User: tokenManager.auth0Client?.user,
      });

      registerRecording({ recording });

      if (
        recording.workspace &&
        subscriptionExpired(recording.workspace, new Date(recording.date))
      ) {
        return dispatch(setTrialExpired());
      }

      const experimentalSettings: ExperimentalSettings = {
        disableScanDataCache: userData.get("backend_disableScanDataCache"),
        disableCache: userData.get("backend_disableCache"),
        listenForMetrics: userData.get("backend_listenForMetrics"),
        profileWorkerThreads: userData.get("backend_profileWorkerThreads"),
        enableRoutines: userData.get("backend_enableRoutines"),
        rerunRoutines: userData.get("backend_rerunRoutines"),
        disableRecordingAssetsInDatabase: userData.get("backend_disableRecordingAssetsInDatabase"),
        sampleAllTraces: userData.get("backend_sampleAllTraces"),
        disableIncrementalSnapshots: userData.get("backend_disableIncrementalSnapshots"),
        disableConcurrentControllerLoading: userData.get(
          "backend_disableConcurrentControllerLoading"
        ),
        disableProtocolQueryCache: userData.get("backend_disableProtocolQueryCache"),
      };

      const restartParam = new URL(window.location.href).searchParams.get("restart") || undefined;
      if (restartParam) {
        const url = new URL(window.location.href);
        url.searchParams.delete("restart");
        window.history.replaceState({}, "", url.toString());
      }

      if (restartParam || userData.get("backend_newControllerOnRefresh")) {
        experimentalSettings.controllerKey = String(Date.now());
      }

      const loadPoint = new URL(window.location.href).searchParams.get("point") || undefined;

      const queuedProtocolMessages: ReceivedProtocolMessage[] = [];
      let flushTimeoutId: NodeJS.Timeout | null = null;

      function flushQueuedProtocolMessages() {
        flushTimeoutId = null;

        const messages = queuedProtocolMessages.splice(0);
        dispatch(protocolMessagesReceived(messages));
      }

      // WebSocket messages may be sent by a component that Suspends during render.
      // Dispatching these Redux actions after a tick avoids potentially scheduling a React update while another component is rendering.
      function queueProtocolMessage(message: ReceivedProtocolMessage) {
        queuedProtocolMessages.push(message);

        if (flushTimeoutId === null) {
          flushTimeoutId = setTimeout(flushQueuedProtocolMessages, 250);
        }
      }

      const focusWindowFromParams = getPausePointParams().focusWindow;

      const sessionId = await createSession(
        recordingId,
        loadPoint,
        experimentalSettings,
        focusWindowFromParams !== null ? focusWindowFromParams : undefined,
        {
          onEvent: (event: ProtocolEvent) => {
            // no-op but required, apparently
          },
          onRequest: (request: CommandRequest) => {
            if (userData.get("feature_protocolPanel")) {
              queueProtocolMessage({
                type: "request",
                // a couple fields will be filled in on the reducer side
                value: { ...request, recordedAt: window.performance.now() } as RequestSummary,
              });
            }
          },
          onResponse: (response: CommandResponse) => {
            if (userData.get("feature_protocolPanel")) {
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
              queueProtocolMessage({
                type: "response",
                value: clonedResponse,
              });
            }
          },
          onResponseError: (error: CommandResponse) => {
            if (userData.get("feature_protocolPanel")) {
              queueProtocolMessage({
                type: "error",
                value: { ...error, recordedAt: window.performance.now() },
              });
            }
          },
          onSocketError: (evt: Event, initial: boolean) => {
            console.error("Socket Error", evt);
            if (initial) {
              dispatch(
                setUnexpectedError({
                  action: "refresh",
                  content:
                    "A connection to our server could not be established. Please check your connection.",
                  message: "Unable to establish socket connection",
                  ...evt,
                })
              );
            } else {
              dispatch(
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
              dispatch(setUnexpectedError(getDisconnectionError(), true));
            }
          },
        }
      );

      Sentry.configureScope(scope => {
        scope.setExtra("sessionId", sessionId);
      });

      window.sessionId = sessionId;
      await replayClient.configure(sessionId);
      const recordingTarget = await recordingTargetCache.readAsync(replayClient);
      dispatch(actions.setRecordingTarget(recordingTarget));

      // We don't want to show the non-dev version of the app for node replays.
      if (recordingTarget === "node") {
        dispatch(setViewMode("dev"));
      }

      // We don't want to show the wrong default layout for recordings that don't have graphics.
      const recordingCapabilities = await recordingCapabilitiesCache.readAsync(replayClient);
      if (!recordingCapabilities.supportsRepaintingGraphics) {
        const toolboxLayout = getToolboxLayout(getState());
        switch (toolboxLayout) {
          case "full":
          case "left":
            // The current layout is okay.
            break;
          default:
            dispatch(setToolboxLayout("left"));
            break;
        }
      }

      dispatch(actions.setUploading(null));
      dispatch(actions.setAwaitingSourcemaps(false));

      await replayClient.waitForSession();
      await dispatch(jumpToInitialPausePoint());

      dispatch(actions.setLoadingFinished(true));

      const focusWindow = replayClient.getCurrentFocusWindow();
      assert(focusWindow !== null); // replayClient.configure() sets this value
      if (
        !focusWindowFromParams ||
        focusWindowFromParams.begin.time !== focusWindow.begin.time ||
        focusWindowFromParams.end.time !== focusWindow.end.time
      ) {
        dispatch(setFocusWindow({ begin: focusWindow.begin.time, end: focusWindow.end.time }));
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
