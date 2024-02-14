import { useContext, useMemo } from "react";

import { isVisualCommentTypeData } from "replay-next/components/sources/utils/comments";
import { Comment } from "shared/graphql/types";
import { getRecordingTarget } from "ui/actions/app";
import VideoComment from "ui/components/Comments/VideoComments/VideoComment";
import { NodePickerContext } from "ui/components/NodePickerContext";
import hooks from "ui/hooks";
import { getHoveredCommentId, getSelectedCommentId } from "ui/reducers/app";
import { getCurrentTime, getPlayback } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

function findComment({ comments, currentTime }: { comments: Comment[]; currentTime: number }) {
  return comments.filter(
    comment =>
      isVisualCommentTypeData(comment.type, comment.typeData) && comment.time == currentTime
  );
}

export default function CommentsOverlay() {
  const { status: nodePickerStatus } = useContext(NodePickerContext);

  const recordingId = hooks.useGetRecordingId();
  const { comments: allComments } = hooks.useGetComments(recordingId);

  const currentTime = useAppSelector(getCurrentTime);
  const playback = useAppSelector(getPlayback);
  const recordingTarget = useAppSelector(getRecordingTarget);
  const hoveredCommentId = useAppSelector(getHoveredCommentId);
  const selectedCommentId = useAppSelector(getSelectedCommentId);

  const commentsAtTime = useMemo(
    () => findComment({ comments: allComments, currentTime }),
    [allComments, currentTime]
  );

  const showComments =
    !playback &&
    recordingTarget !== "node" &&
    nodePickerStatus !== "active" &&
    nodePickerStatus !== "initializing";

  return (
    <div className="canvas-overlay">
      {showComments && (
        <div className="canvas-comments">
          {commentsAtTime.map(comment => {
            return (
              <VideoComment
                comment={comment}
                isHighlighted={hoveredCommentId === comment.id || selectedCommentId === comment.id}
                key={comment.id}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
