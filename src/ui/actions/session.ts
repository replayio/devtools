import { ApolloError } from "@apollo/client";
import { uploadedData } from "@replayio/protocol";
import { findAutomatedTests } from "ui/actions/find-tests";
import { videoReady } from "protocol/graphics";
import {
  addEventListener,
  CommandRequest,
  CommandResponse,
  createSession,
  ExperimentalSettings,
} from "protocol/socket";
import { ThreadFront as ThreadFrontType } from "protocol/thread";
import { assert, waitForTime } from "protocol/utils";
import { isTest, isMock } from "ui/utils/environment";
import { UIThunkAction } from "ui/actions";
import * as actions from "ui/actions/app";
import { getRecording } from "ui/hooks/recordings";
import { getUserSettings } from "ui/hooks/settings";
import { getUserId, getUserInfo } from "ui/hooks/users";
import { setTrialExpired, setCurrentPoint } from "ui/reducers/app";
import * as selectors from "ui/reducers/app";
import { getSelectedPanel } from "ui/reducers/layout";
import {
  eventReceived,
  requestSent,
  errorReceived,
  responseReceived,
  ProtocolEvent,
} from "ui/reducers/protocolMessages";
import type { ExpectedError, UnexpectedError } from "ui/state/app";
import { Recording } from "ui/types";
import { extractGraphQLError } from "ui/utils/apolloClient";
import LogRocket from "ui/utils/logrocket";
import { endMixpanelSession } from "ui/utils/mixpanel";
import { features, prefs } from "ui/utils/prefs";
import { registerRecording, trackEvent } from "ui/utils/telemetry";
import tokenManager from "ui/utils/tokenManager";
import { subscriptionExpired } from "ui/utils/workspace";

import { setUnexpectedError, setExpectedError } from "./errors";
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
    content: "Replays disconnect after 5 minutes to reduce server load.",
    message: "Ready when you are!",
  };
}

// Create a session to use while debugging.
// NOTE: This thunk is dispatched _before_ the rest of the devtools logic
// is initialized, so `extra.ThreadFront` isn't available yet.
// We pass `ThreadFront` in as an arg here instead.
export function createSocket(
  recordingId: string,
  ThreadFront: typeof ThreadFrontType
): UIThunkAction {
  return async (dispatch, getState) => {
    try {
      if (ThreadFront.recordingId) {
        assert(
          recordingId === ThreadFront.recordingId,
          "can't create a session for 2 different recordings"
        );
        return;
      }
      ThreadFront.recordingId = recordingId;

      const userSettings = await getUserSettings();
      const [userInfo, recording] = await Promise.all([getUserInfo(), getRecording(recordingId)]);
      assert(recording, "failed to load recording");

      if (recording.title) {
        document.title = recording.title;
      }
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
        listenForMetrics: !!prefs.listenForMetrics,
        disableCache: !!prefs.disableCache,
        useMultipleControllers: !!features.turboReplay,
        multipleControllerUseSnapshots: !!features.turboReplay,
      };

      dispatch(showLoadingProgress());

      const loadPoint = new URL(window.location.href).searchParams.get("point") || undefined;

      const sessionId = await createSession(recordingId, loadPoint, experimentalSettings, {
        onEvent: (event: ProtocolEvent) => {
          if (features.logProtocol) {
            dispatch(eventReceived({ ...event, recordedAt: window.performance.now() }));
          }
        },
        onRequest: (request: CommandRequest) => {
          if (features.logProtocol) {
            dispatch(requestSent({ ...request, recordedAt: window.performance.now() }));
          }
        },
        onResponse: (response: CommandResponse) => {
          if (features.logProtocol) {
            dispatch(responseReceived({ ...response, recordedAt: window.performance.now() }));
          }
        },
        onResponseError: (error: CommandResponse) => {
          if (features.logProtocol) {
            dispatch(errorReceived({ ...error, recordedAt: window.performance.now() }));
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
      });

      if (prefs.listenForMetrics) {
        window.sessionMetrics = [];
        addEventListener("Session.newMetric", ({ data }) => {
          window.sessionMetrics?.push(data);
        });
      }

      window.sessionId = sessionId;
      ThreadFront.setSessionId(sessionId);
      const recordingTarget = await ThreadFront.recordingTargetWaiter.promise;
      dispatch(actions.setRecordingTarget(recordingTarget));

      findAutomatedTests();

      // We don't want to show the non-dev version of the app for node replays.
      if (recordingTarget === "node") {
        dispatch(setViewMode("dev"));
        await dispatch(showLoadingProgress());
        dispatch(onLoadingFinished());
      } else {
        await videoReady.promise;
        dispatch(onLoadingFinished());
      }

      dispatch(actions.setUploading(null));
      dispatch(actions.setAwaitingSourcemaps(false));

      ThreadFront.on("paused", ({ point }) => store.dispatch(setCurrentPoint(point)));

      dispatch(jumpToInitialPausePoint());
    } catch (e: any) {
      const currentError = selectors.getUnexpectedError(getState());

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

export function showLoadingProgress(): UIThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    let displayedProgress = selectors.getLoading(getState());
    while (displayedProgress < 100) {
      await waitForTime(200);

      let progress = selectors.getLoading(getState());
      const increment = Math.random();
      const decayed = increment * ((100 - displayedProgress) / 40);
      displayedProgress = Math.max(displayedProgress + decayed, progress);

      dispatch(actions.setDisplayedLoadingProgress(displayedProgress));
    }
  };
}

function onLoadingFinished(): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    const selectedPanel = getSelectedPanel(getState());
    // This shouldn't hit when the selectedPanel is "comments"
    // as that's not dealt with in toolbox, however we still
    // need to init the toolbox so we're not checking for
    // that here.
    let i = 0;
    while (!(window as any).gToolbox && i < 30) {
      await waitForTime(1000);
      i++;
    }
    (window as any).gToolbox.init(selectedPanel);

    await waitForTime(300);
    await ThreadFront.initializedWaiter.promise;
    dispatch(actions.setLoadingFinished(true));
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

export function onConsoleOverflow() {
  trackEvent("console.overflow");
  // NOTE: Must match value generated by `reducers/messages`,
  // but left here as a string to avoid a circular import issue
  return { type: "messages/setConsoleOverflowed", payload: true };
}
