import type { Action } from "redux";

import { UIThunkAction } from "ui/actions";
import * as selectors from "ui/reducers/app";
import { isDevelopment } from "ui/utils/environment";
import { sendTelemetryEvent } from "ui/utils/telemetry";
import type { ExpectedError, UnexpectedError } from "ui/state/app";
import { getRecordingId } from "ui/utils/recording";
import {
  setExpectedError as setExpectedErrorAction,
  setUnexpectedError as setUnexpectedErrorAction,
} from "ui/reducers/app";

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
