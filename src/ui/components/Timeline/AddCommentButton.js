import React from "react";
import { ThreadFront } from "protocol/thread";
import { connect } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";

import { selectors } from "ui/reducers";
import { actions } from "ui/actions";

function AddCommentButton({
  currentTime,
  recordingId,
  viewMode,
  setModal,
  setSelectedPanel,
  setPendingComment,
}) {
  const { isAuthenticated } = useAuth0();

  const onClick = () => {
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

  return (
    <button className="add-comment" onClick={onClick}>
      <div className="img plus-circle" />
      <span>Comment</span>
    </button>
  );
}

export default connect(
  state => ({
    currentTime: selectors.getCurrentTime(state),
    recordingId: selectors.getRecordingId(state),
    viewMode: selectors.getViewMode(state),
  }),
  {
    setModal: actions.setModal,
    setSelectedPanel: actions.setSelectedPanel,
    setPendingComment: actions.setPendingComment,
  }
)(AddCommentButton);
