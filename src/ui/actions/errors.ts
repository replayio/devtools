import type { Action } from "redux";

import { UIThunkAction } from "ui/actions";
import * as selectors from "ui/reducers/app";
import { isDevelopment } from "ui/utils/environment";
import { sendTelemetryEvent } from "ui/utils/telemetry";
import type { ExpectedError, UnexpectedError } from "ui/state/app";
import { getRecordingId } from "ui/utils/recording";

export type SetUnexpectedErrorAction = Action<"set_unexpected_error"> & {
  error: UnexpectedError;
};

export type SetExpectedErrorAction = Action<"set_expected_error"> & { error: ExpectedError };

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

    dispatch({ type: "set_expected_error", error });
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

    dispatch({ type: "set_unexpected_error", error });
  };
}
