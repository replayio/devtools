import React, { useState, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";

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
import UploadScreen from "./UploadScreen";
import { Recording } from "ui/types";

type DevToolsProps = PropsFromRedux & {
  recording: Recording;
  userId?: string;
};

function DevTools({
  recording,
  userId,
  loading,
  uploading,
  recordingDuration,
  selectedPanel,
  viewMode,
  recordingTarget,
  setRecordingWorkspace,
}: DevToolsProps) {
  const [finishedLoading, setFinishedLoading] = useState(false);

  useEffect(() => {
    if (loading == 100) {
      gToolbox.init(selectedPanel);
    }
  }, [loading]);
  useEffect(() => {
    if (recording.title) {
      document.title = `${recording.title} - Replay`;
    }
    if (recording.workspace) {
      setRecordingWorkspace(recording.workspace);
    }
  }, [recording]);

  // Skip showing these screens if we're in a test.
  if (!isTest()) {
    const isAuthor = userId === recording.userId;

    if (!recording.isInitialized && isAuthor) {
      return <UploadScreen recording={recording} />;
    }

    if (recordingDuration === null || uploading) {
      return <BlankLoadingScreen />;
    }
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
      {(!prefs.video && viewMode == "dev") || recordingTarget == "node" ? (
        <DevView />
      ) : (
        <NonDevView />
      )}
    </>
  );
}

const connector = connect(
  (state: UIState) => ({
    loading: selectors.getLoading(state),
    uploading: selectors.getUploading(state),
    recordingDuration: selectors.getRecordingDuration(state),
    selectedPanel: selectors.getSelectedPanel(state),
    viewMode: selectors.getViewMode(state),
    narrowMode: selectors.getNarrowMode(state),
    recordingTarget: selectors.getRecordingTarget(state),
  }),
  {
    updateTimelineDimensions: actions.updateTimelineDimensions,
    setExpectedError: actions.setExpectedError,
    setRecordingWorkspace: actions.setRecordingWorkspace,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DevTools);
