import React from "react";
import classnames from "classnames";
import { connect, ConnectedProps } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";

import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { assert } from "protocol/utils";

import "./ReplyButton.css";
import { Comment, PendingComment, Event } from "ui/state/comments";

type ReplyButtonProps = PropsFromRedux & {
  item: Comment | Event | PendingComment;
};

function ReplyButton({
  recordingId,
  canvas,
  item,
  pendingComment,
  activeComment,
  seek,
  setModal,
  setPendingComment,
}: ReplyButtonProps) {
  assert(recordingId);
  const { isAuthenticated } = useAuth0();
  const isDisabled = !!pendingComment || !!activeComment;

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      return setModal("login");
    }

    const { point, time } = item;
    if ("has_frames" in item) {
      seek(point, time, item.has_frames);
    } else {
      seek(point, time, false);
    }

    let pendingComment: PendingComment = {
      content: "",
      recording_id: recordingId,
      time,
      point,
      has_frames: false,
      source_location: null,
      position: null,
    };

    if ("comment" in item && item.comment) {
      // Add a reply to an event's root comment.
      pendingComment = { ...pendingComment, parent_id: item.comment.id };
    } else if ("id" in item) {
      // Add a reply to a non-event's root comment.
      pendingComment = {
        ...pendingComment,
        has_frames: "has_frames" in item && item.has_frames,
        parent_id: item.id,
      };
    } else {
      // Add a root comment to an event.
      pendingComment = {
        ...pendingComment,
        position: {
          x: canvas!.width * 0.5,
          y: canvas!.height * 0.5,
        },
      };
    }

    setPendingComment(pendingComment);
  };

  return (
    <button
      className={classnames("transcript-entry-action img reply", { disabled: isDisabled })}
      onClick={onClick}
      disabled={isDisabled}
    />
  );
}

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
    recordingId: selectors.getRecordingId(state),
    viewMode: selectors.getViewMode(state),
    canvas: selectors.getCanvas(state),
    activeComment: selectors.getActiveComment(state),
    pendingComment: selectors.getPendingComment(state),
  }),
  {
    setModal: actions.setModal,
    seek: actions.seek,
    setSelectedPanel: actions.setSelectedPanel,
    setPendingComment: actions.setPendingComment,
    clearPendingComment: actions.clearPendingComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ReplyButton);
