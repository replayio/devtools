import React from "react";
import { ThreadFront } from "protocol/thread";
import { connect, ConnectedProps } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";

import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { assert } from "protocol/utils";

function AddCommentButton({
  currentTime,
  recordingId,
  viewMode,
  setModal,
  setSelectedPanel,
  setPendingComment,
  canvas,
}: PropsFromRedux) {
  assert(recordingId);
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
      position: {
        x: canvas!.width * 0.5,
        y: canvas!.height * 0.5,
      },
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

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
    recordingId: selectors.getRecordingId(state),
    viewMode: selectors.getViewMode(state),
    canvas: selectors.getCanvas(state),
  }),
  {
    setModal: actions.setModal,
    setSelectedPanel: actions.setSelectedPanel,
    setPendingComment: actions.setPendingComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(AddCommentButton);
