import React, { useState, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "../hooks";

const Header = require("./Header/index").default;
const SkeletonLoader = require("./SkeletonLoader").default;
const NonDevView = require("./Views/NonDevView").default;
const DevView = require("./Views/DevView").default;
const { prefs } = require("ui/utils/prefs");
import { isTest } from "ui/utils/environment";

import { actions } from "../actions";
import { selectors } from "../reducers";
import { UIState } from "ui/state";
import { BlankLoadingScreen } from "./shared/BlankScreen";

function DevTools({
  loading,
  uploading,
  recordingDuration,
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
    if (expectedError) {
      setExpectedError(expectedError);
    }
  }, [expectedError]);

  if (expectedError) {
    return <BlankLoadingScreen />;
  }

  // Skip loading screens when running tests
  if (!isTest() && queriesAreLoading) {
    return <BlankLoadingScreen />;
  }

  if (!isTest() && (recordingDuration === null || uploading)) {
    return <BlankLoadingScreen />;
  }

  if (!finishedLoading) {
    return (
      <SkeletonLoader
        setFinishedLoading={setFinishedLoading}
        progress={loading}
        content={"Scanning the recording..."}
      />
    );
  }

  return (
    <>
      <Header />
      {!prefs.video && viewMode == "dev" ? <DevView /> : <NonDevView />}
    </>
  );
}

const connector = connect(
  (state: UIState) => ({
    recordingId: selectors.getRecordingId(state)!,
    loading: selectors.getLoading(state),
    uploading: selectors.getUploading(state),
    recordingDuration: selectors.getRecordingDuration(state),
    selectedPanel: selectors.getSelectedPanel(state),
    viewMode: selectors.getViewMode(state),
  }),
  {
    setExpectedError: actions.setExpectedError,
    setRecordingWorkspace: actions.setRecordingWorkspace,
  }
);
type DevToolsProps = ConnectedProps<typeof connector>;
export default connector(DevTools);
