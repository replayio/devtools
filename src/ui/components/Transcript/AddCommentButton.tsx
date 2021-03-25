import React from "react";
import classnames from "classnames";
import { ThreadFront } from "protocol/thread";
import { connect, ConnectedProps } from "react-redux";
import useAuth0 from "ui/utils/useAuth0";

import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import { UIState } from "ui/state";
import { assert } from "protocol/utils";

import "./AddCommentButton.css";
import { PendingComment, PendingNewComment } from "ui/state/comments";

type AddCommentButtonProps = PropsFromRedux & {
  disabled: boolean;
};

function AddCommentButton({
  currentTime,
  recordingId,
  canvas,
  disabled,
  setModal,
  setPendingComment,
}: AddCommentButtonProps) {
  assert(recordingId);
  const { isAuthenticated } = useAuth0();
  const { comments } = hooks.useGetComments(recordingId!);
  const isDisabled = disabled || !!comments.find(comment => comment.time === currentTime);

  const onClick = async () => {
    if (!isAuthenticated) {
      return setModal("login");
    }

    const pendingComment: PendingComment = {
      type: "new_comment",
      comment: {
        content: "",
        time: currentTime,
        point: ThreadFront.currentPoint,
        has_frames: ThreadFront.currentPointHasFrames,
        source_location: (await ThreadFront.getCurrentPauseSourceLocation()) || null,
        position: {
          x: canvas!.width * 0.5,
          y: canvas!.height * 0.5,
        },
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
