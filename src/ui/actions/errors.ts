import { UIThunkAction } from "ui/actions";
import * as selectors from "ui/reducers/app";
import {
  setExpectedError as setExpectedErrorAction,
  setUnexpectedError as setUnexpectedErrorAction,
} from "ui/reducers/app";
import type { ExpectedError, UnexpectedError } from "ui/state/app";
import { isDevelopment } from "ui/utils/environment";
import { getRecordingId } from "ui/utils/recording";
import { sendTelemetryEvent } from "ui/utils/telemetry";

export function setExpectedError(error: ExpectedError): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();

    sendTelemetryEvent("DevtoolsExpectedError", {
      message: error.message,
      action: error.action,
      recordingId: getRecordingId(),
      sessionId: selectors.getSessionId(state),
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
        sessionId: selectors.getSessionId(state),
        environment: isDevelopment() ? "dev" : "prod",
      });
    }

    dispatch(setUnexpectedErrorAction(error));
  };
}
