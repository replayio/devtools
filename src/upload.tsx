import React, { useEffect } from "react";
import { combineReducers, applyMiddleware } from "redux";
import { connect, ConnectedProps } from "react-redux";
const LogRocket = require("ui/utils/logrocket").default;
import { isDevelopment, skipTelemetry } from "ui/utils/environment";
import { sanityCheckMiddleware } from "ui/utils/sanitize";
const configureStore = require("devtools/client/debugger/src/actions/utils/create-store").default;
import reducer from "ui/reducers/app";
import { setExpectedError } from "ui/actions/session";
import { useGetRecording, useHasExpectedError } from "ui/hooks/recordings";
import { BlankLoadingScreen } from "ui/components/shared/BlankScreen";
import UploadScreen from "ui/components/UploadScreen";

const url = new URL(window.location.href);
const recordingId = url.searchParams.get("id")!;

function _UploadScreenWrapper({ setExpectedError }: PropsFromRedux) {
  const expectedError = useHasExpectedError(recordingId);
  const { recording } = useGetRecording(recordingId);

  useEffect(() => {
    if (expectedError) {
      setExpectedError(expectedError);
    }
  }, [expectedError]);

  useEffect(() => {
    if (recording?.isInitialized) {
      window.onbeforeunload = null;
      document.location.reload();
    }
  });

  if (expectedError) {
    return null;
  }

  return recording ? <UploadScreen recording={recording} /> : <BlankLoadingScreen />;
}

const connector = connect(null, { setExpectedError });
type PropsFromRedux = ConnectedProps<typeof connector>;
const UploadScreenWrapper = connector(_UploadScreenWrapper);

export async function initialize() {
  const middleware = skipTelemetry()
    ? isDevelopment()
      ? applyMiddleware(sanityCheckMiddleware)
      : undefined
    : applyMiddleware(LogRocket.reduxMiddleware());

  const createStore = configureStore();
  const store = createStore(combineReducers({ app: reducer }), {}, middleware);
  store.dispatch({ type: "setup_app", recordingId });

  return { store, Page: UploadScreenWrapper };
}
