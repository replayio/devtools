import { useMemo } from "react";

import {
  VisualComment,
  isVisualCommentTypeData,
} from "replay-next/components/sources/utils/comments";
import { Comment } from "shared/graphql/types";
import VideoComment from "ui/components/Comments/VideoComments/VideoComment";
import hooks from "ui/hooks";
import { getHoveredCommentId, getSelectedCommentId } from "ui/reducers/app";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

function findComment({ comments, currentTime }: { comments: Comment[]; currentTime: number }) {
  return comments.filter(
    comment =>
      isVisualCommentTypeData(comment.type, comment.typeData) && comment.time == currentTime
  ) as VisualComment[];
}

export default function CommentsOverlay({ showComments }: { showComments: boolean }) {
  const recordingId = hooks.useGetRecordingId();
  const { comments: allComments } = hooks.useGetComments(recordingId);

  const currentTime = useAppSelector(getCurrentTime);
  const hoveredCommentId = useAppSelector(getHoveredCommentId);
  const selectedCommentId = useAppSelector(getSelectedCommentId);

  const commentsAtTime = useMemo(
    () => findComment({ comments: allComments, currentTime }),
    [allComments, currentTime]
  );

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
