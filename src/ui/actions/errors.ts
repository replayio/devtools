import { isDevelopment } from "shared/utils/environment";
import { getRecordingId } from "shared/utils/recording";
import type { UIThunkAction } from "ui/actions";
import {
  setExpectedError as setExpectedErrorAction,
  setUnexpectedError as setUnexpectedErrorAction,
} from "ui/reducers/app";
import type { UIState } from "ui/state";
import type { ExpectedError, UnexpectedError } from "ui/state/app";
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

export function setUnexpectedError(error: UnexpectedError): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();

    sendTelemetryEvent("DevtoolsUnexpectedError", {
      ...error,
      recordingId: getRecordingId(),
      sessionId: getSessionId(state),
      environment: isDevelopment() ? "dev" : "prod",
    });

    dispatch(setUnexpectedErrorAction(error));
  };
}
