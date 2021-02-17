import React from "react";
import classnames from "classnames";
import { ThreadFront } from "protocol/thread";
import { connect, ConnectedProps } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";

import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import { UIState } from "ui/state";
import { assert } from "protocol/utils";

import "./AddCommentButton.css";
import { PendingComment } from "ui/state/comments";

function AddCommentButton({
  currentTime,
  recordingId,
  pendingComment,
  canvas,
  setModal,
  setPendingComment,
}: PropsFromRedux) {
  assert(recordingId);
  const { isAuthenticated } = useAuth0();
  const { comments } = hooks.useGetComments(recordingId!);
  const isDisabled = !!comments.find(comment => comment.time === currentTime);

  const onClick = () => {
    if (!isAuthenticated) {
      return setModal("login");
    }

    const pendingComment: PendingComment = {
      content: "",
      recording_id: recordingId,
      time: currentTime,
      point: ThreadFront.currentPoint,
      has_frames: ThreadFront.currentPointHasFrames,
      source_location: null,
      position: {
        x: canvas!.width * 0.5,
        y: canvas!.height * 0.5,
      },
    };

    setPendingComment(pendingComment);
  };

  return (
    <button
      className={classnames("add-comment", { disabled: isDisabled })}
      disabled={isDisabled}
      onClick={onClick}
    >
      <span>Add a Comment</span>
    </button>
  );
}

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
    recordingId: selectors.getRecordingId(state),
    pendingComment: selectors.getPendingComment(state),
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
