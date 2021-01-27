import React from "react";
import { ThreadFront } from "protocol/thread";
import { connect } from "react-redux";

import { getMarkerLeftOffset } from "ui/utils/timeline";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { useAuth0 } from "@auth0/auth0-react";

const markerWidth = 19;

function NewCommentButton({
  timelineDimensions,
  currentTime,
  zoomRegion,
  recordingId,
  comments,
  setSelectedPanel,
  viewMode,
  setPendingComment,
  setModal,
}) {
  const { isAuthenticated } = useAuth0();
  // Skip rendering the button if any of the following applies:
  // - There is already a comment at that time.
  // - That time is not currently visible in the timeline
  // - There is a timeline comment that is currently focused.
  const isOnExistingComment = comments.some(comment => comment.time == currentTime);
  if (isOnExistingComment || zoomRegion.endTime < currentTime) {
    return null;
  }

  const handleClick = () => {
    if (!isAuthenticated) {
      return setModal("login");
    }

    if (viewMode === "dev") {
      setSelectedPanel("comments");
    }

    const pendingComment = {
      content: "",
      recording_id: recordingId,
      time: currentTime,
      point: ThreadFront.currentPoint,
      has_frames: ThreadFront.currentPointHasFrames,
    };

    setPendingComment(pendingComment);
  };

  const leftOffset = getMarkerLeftOffset({
    time: currentTime,
    overlayWidth: timelineDimensions.width,
    zoom: zoomRegion,
    markerWidth: markerWidth,
  });

  return (
    <button
      className="create-comment"
      style={{
        left: `${leftOffset}%`,
      }}
      onClick={handleClick}
    />
  );
}

export default connect(
  state => ({
    timelineDimensions: selectors.getTimelineDimensions(state),
    zoomRegion: selectors.getZoomRegion(state),
    currentTime: selectors.getCurrentTime(state),
    recordingId: selectors.getRecordingId(state),
    viewMode: selectors.getViewMode(state),
  }),
  {
    setModal: actions.setModal,
    setSelectedPanel: actions.setSelectedPanel,
    setPendingComment: actions.setPendingComment,
  }
)(NewCommentButton);
