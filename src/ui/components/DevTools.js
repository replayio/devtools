import React, { useState, useEffect } from "react";
import { connect } from "react-redux";

import Toolbox from "./Toolbox";
import Comments from "./Comments";
import Recordings from "./Recordings/index";
import Tooltip from "./Tooltip";
import Header from "./Header";
import Loader from "./shared/Loader";
import { UserPrompt } from "./Account/index";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import RightSidebar from "./RightSidebar";
import RecordingLoadingScreen from "./RecordingLoadingScreen";

import { actions } from "../actions";
import { selectors } from "../reducers";
import { screenshotCache, nextPaintEvent, getClosestPaintPoint } from "protocol/graphics";

function Viewer({ tooltip }) {
  return (
    <div id="outer-viewer">
      <div id="viewer">
        <canvas id="graphics"></canvas>
        <div id="highlighter-root"></div>
      </div>
      <RightSidebar />
      <Tooltip tooltip={tooltip} />
    </div>
  );
}

function DevtoolsSplitBox({ updateTimelineDimensions, tooltip }) {
  const toolbox = <Toolbox />;
  const viewer = <Viewer tooltip={tooltip} />;

  return (
    <SplitBox
      style={{ width: "100vw", overflow: "hidden" }}
      splitterSize={1}
      initialSize="50%"
      minSize="20%"
      maxSize="80%"
      vert={false}
      onMove={num => updateTimelineDimensions()}
      startPanel={viewer}
      endPanel={toolbox}
      endPanelControl={false}
    />
  );
}

export function DevTools({
  unfocusComment,
  loading,
  tooltip,
  hasFocusedComment,
  updateTimelineDimensions,
  recordingDuration,
  sessionId,
}) {
  const recordingIsUploaded = sessionId !== null;
  const recordingIsFetchedFromServer = recordingDuration !== null;
  const recordingIsLoading = loading < 100;

  if (!recordingIsFetchedFromServer || !recordingIsUploaded) {
    return <Loader />;
  } else if (recordingIsLoading) {
    return <RecordingLoadingScreen />;
  }

  return (
    <>
      <Header />
      <Comments />
      {hasFocusedComment && <div className="app-mask" onClick={unfocusComment} />}
      <DevtoolsSplitBox tooltip={tooltip} updateTimelineDimensions={updateTimelineDimensions} />
    </>
  );
}

export default connect(
  state => ({
    loading: selectors.getLoading(state),
    tooltip: selectors.getTooltip(state),
    hasFocusedComment: selectors.hasFocusedComment(state),
    recordingDuration: selectors.getRecordingDuration(state),
    sessionId: selectors.getSessionId(state),
  }),
  {
    updateTimelineDimensions: actions.updateTimelineDimensions,
    unfocusComment: actions.unfocusComment,
  }
)(DevTools);
