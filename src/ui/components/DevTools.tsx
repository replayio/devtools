import React, { useState, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";

const Header = require("./Header/index").default;
const SkeletonLoader = require("./SkeletonLoader").default;
const NonDevView = require("./Views/NonDevView").default;
const DevView = require("./Views/DevView").default;
const { prefs } = require("ui/utils/prefs");
import { isTest } from "ui/utils/environment";

import { selectors } from "../reducers";
import { UIState } from "ui/state";
import { BlankLoadingScreen } from "./shared/BlankScreen";
import UploadScreen from "./UploadScreen";
import { Recording } from "ui/types";

type DevToolsProps = PropsFromRedux & {
  userId: string;
  recording: Recording;
};

function DevTools({
  userId,
  recording,
  loading,
  uploading,
  recordingDuration,
  selectedPanel,
  viewMode,
  recordingTarget,
}: DevToolsProps) {
  const [finishedLoading, setFinishedLoading] = useState(false);
  const isAuthor = userId === recording.userId;
  const showUploadScreen = !recording.isInitialized && isAuthor && !isTest();

  useEffect(() => {
    if (loading == 100) {
      gToolbox.init(selectedPanel);
    }
  }, [loading]);

  if (showUploadScreen) {
    return <UploadScreen recording={recording} />;
  }

  if (recordingDuration === null || uploading) {
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
      {(!prefs.video && viewMode == "dev") || recordingTarget == "node" ? (
        <DevView />
      ) : (
        <NonDevView />
      )}
    </>
  );
}

const connector = connect((state: UIState) => ({
  loading: selectors.getLoading(state),
  uploading: selectors.getUploading(state),
  recordingDuration: selectors.getRecordingDuration(state),
  selectedPanel: selectors.getSelectedPanel(state),
  viewMode: selectors.getViewMode(state),
  recordingTarget: selectors.getRecordingTarget(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DevTools);
