import React, { useState, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "../hooks";

import Header from "./Header/index";
import { isTest } from "ui/utils/environment";

import { actions } from "../actions";
import { selectors } from "../reducers";
import { UIState } from "ui/state";
import { BlankLoadingScreen, BlankProgressScreen } from "./shared/BlankScreen";
import NonDevView from "./Views/NonDevView";
import WaitForReduxSlice from "./WaitForReduxSlice";

import "ui/setup/dynamic/devtools";

const DevView = React.lazy(() => import("./Views/DevView"));

function _DevTools({
  loading,
  uploading,
  awaitingSourcemaps,
  recordingId,
  setExpectedError,
  selectedPanel,
  viewMode,
  setRecordingWorkspace,
}: DevToolsProps) {
  const [finishedLoading, setFinishedLoading] = useState(false);
  const { recording, loading: recordingQueryLoading } = hooks.useGetRecording(recordingId);
  const expectedError = hooks.useHasExpectedError(recordingId);
  const { loading: settingsQueryLoading } = hooks.useGetUserSettings();

  const queriesAreLoading = recordingQueryLoading || settingsQueryLoading;

  useEffect(() => {
    // This shouldn't hit when the selectedPanel is "comments"
    // as that's not dealt with in toolbox, however we still
    // need to init the toolbox so we're not checking for
    // that in the if statement here.
    if (loading == 100) {
      gToolbox.init(selectedPanel);
    }
  }, [loading]);

  useEffect(() => {
    if (!recording) {
      return;
    }
    if (recording.title) {
      document.title = `${recording.title} - Replay`;
    }
    if (recording.workspace) {
      setRecordingWorkspace(recording.workspace);
    }
  }, [recording]);

  useEffect(() => {
    if (recordingId && expectedError) {
      setExpectedError(expectedError);
    }
  }, [recordingId, expectedError]);

  if (expectedError) {
    return <BlankLoadingScreen />;
  }

  if (!isTest() && (uploading || awaitingSourcemaps || queriesAreLoading)) {
    let message;
    let color: "blue-gradient" | "white" = "blue-gradient";

    // The backend send events in this order: uploading replay -> uploading sourcemaps.
    if (awaitingSourcemaps) {
      message = "Uploading sourcemaps";
    } else if (uploading) {
      message = "Uploading Replay";
    } else {
      color = "white";
      message = "Fetching data";
    }

    return <BlankLoadingScreen statusMessage={message} background={color} />;
  }

  if (!finishedLoading) {
    return <BlankProgressScreen setFinishedLoading={setFinishedLoading} progress={loading} />;
  }

  return (
    <>
      <Header />
      {viewMode == "dev" ? <DevView /> : <NonDevView />}
    </>
  );
}

const connector = connect(
  (state: UIState) => ({
    recordingId: selectors.getRecordingId(state)!,
    loading: selectors.getLoading(state),
    uploading: selectors.getUploading(state),
    selectedPanel: selectors.getSelectedPanel(state),
    viewMode: selectors.getViewMode(state),
    awaitingSourcemaps: selectors.getAwaitingSourcemaps(state),
  }),
  {
    setExpectedError: actions.setExpectedError,
    setRecordingWorkspace: actions.setRecordingWorkspace,
  }
);
type DevToolsProps = ConnectedProps<typeof connector>;
const ConnectedDevTools = connector(_DevTools);

const DevTools = () => (
  <WaitForReduxSlice slice="messages">
    <ConnectedDevTools />
  </WaitForReduxSlice>
);

export default DevTools;
