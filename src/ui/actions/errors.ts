import type { UIThunkAction } from "ui/actions";
import {
  setExpectedError as setExpectedErrorAction,
  setUnexpectedError as setUnexpectedErrorAction,
} from "ui/reducers/app";
import type { UIState } from "ui/state";
import type { ExpectedError, UnexpectedError } from "ui/state/app";
import { isDevelopment } from "ui/utils/environment";
import { getRecordingId } from "ui/utils/recording";
import { sendTelemetryEvent } from "ui/utils/telemetry";

const getSessionId = (state: UIState) => state.app.sessionId;

export function setExpectedError(error: ExpectedError): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();

    sendTelemetryEvent("DevtoolsExpectedError", {
      message: error.message,
      action: error.action,
      recordingId: getRecordingId(),
      sessionId: getSessionId(state),
      environment: isDevelopment() ? "dev" : "prod",
    });

    dispatch(setExpectedErrorAction(error));
  };
}

export function setUnexpectedError(error: UnexpectedError, skipTelemetry = false): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();

    if (!skipTelemetry) {
      sendTelemetryEvent("DevtoolsUnexpectedError", {
        ...error,
        recordingId: getRecordingId(),
        sessionId: getSessionId(state),
        environment: isDevelopment() ? "dev" : "prod",
      });
    }

    dispatch(setUnexpectedErrorAction(error));
  };
}
