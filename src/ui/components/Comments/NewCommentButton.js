import React from "react";
import { ThreadFront } from "protocol/thread";
import { connect } from "react-redux";

import { getMarkerLeftOffset } from "ui/utils/timeline";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import { useAuth0 } from "@auth0/auth0-react";

const markerWidth = 19;

function NewCommentButton({
  timelineDimensions,
  currentTime,
  zoomRegion,
  recordingId,
  focusedCommentId,
  setFocusedCommentId,
  comments,
  hideTooltip,
  setExpectedError,
}) {
  const { isAuthenticated } = useAuth0();
  const addCommentCallback = id => {
    setFocusedCommentId(id);
    hideTooltip();
  };
  const addComment = hooks.useAddComment(addCommentCallback);

  // Skip rendering the button if any of the following applies:
  // - There is already a comment at that time.
  // - That time is not currently visible in the timeline
  // - There is a timeline comment that is currently focused.
  const isOnExistingComment = comments.some(comment => comment.time == currentTime);
  if (isOnExistingComment || focusedCommentId || zoomRegion.endTime < currentTime) {
    return null;
  }

  const handleClick = () => {
    if (!isAuthenticated) {
      return setExpectedError({
        message: "You need to sign in to leave a comment.",
        action: "sign-in",
      });
    }

    const newComment = {
      content: "",
      recording_id: recordingId,
      time: currentTime,
      point: ThreadFront.currentPoint,
      has_frames: ThreadFront.currentPointHasFrames,
    };

    addComment({
      variables: { object: newComment },
    });
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
    focusedCommentId: selectors.getFocusedCommentId(state),
  }),
  {
    setFocusedCommentId: actions.setFocusedCommentId,
    hideTooltip: actions.hideTooltip,
    setExpectedError: actions.setExpectedError,
  }
)(NewCommentButton);
