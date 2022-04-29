import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectors } from "ui/reducers";
import sortBy from "lodash/sortBy";
import hooks from "ui/hooks";
import { Comment } from "ui/state/comments";
import CommentCard from "ui/components/Comments/TranscriptComments/CommentCard";
import useAuth0 from "ui/utils/useAuth0";
import MaterialIcon from "ui/components/shared/MaterialIcon";

export default function Transcript() {
  const recordingId = hooks.useGetRecordingId();
  const { comments, loading } = hooks.useGetComments(recordingId);
  const recording = hooks.useGetRecording(recordingId);
  const auth = useAuth0();

  const pendingComment = useSelector(selectors.getPendingComment);
  const { isAuthenticated } = useAuth0();

  const displayedComments = useMemo(() => {
    const clonedComments: Comment[] = [...comments];

    if (pendingComment?.type == "new_comment") {
      clonedComments.push(pendingComment.comment);
    }

    const sortedComments = sortBy(clonedComments, ["point", "createdAt"]);
    return sortedComments;
  }, [comments, pendingComment]);

  if (loading || auth.isLoading || recording.loading) {
    return null;
  }

  return (
    <div className="sidebar">
      <div className="sidebar-toolbar">
        <div className="sidebar-toolbar-item comments">Comments</div>
      </div>
      <div className="transcript-list flex h-full flex-grow flex-col items-center overflow-auto overflow-x-hidden bg-bodyBgcolor text-xs">
        {displayedComments.length > 0 ? (
          <div className="w-full flex-grow overflow-auto bg-bodyBgcolor">
            {displayedComments.map(comment => (
              <CommentCard key={comment.id} comments={displayedComments} comment={comment} />
            ))}
          </div>
        ) : (
          <div className="transcript-list onboarding-text space-y-3 self-stretch p-3 text-base text-gray-500">
            <MaterialIcon className="forum large-icon">forum</MaterialIcon>
            <h2>{isAuthenticated ? "Start a conversation" : "Sign in to get started"}</h2>
            <p>
              {isAuthenticated
                ? "Add a comment to the video, a line of code, or a console message."
                : "Once signed in, you can add comments and make your voice heard!"}
            </p>
            <img src="/images/comment-onboarding-arrow.svg" className="arrow" />
          </div>
        )}
      </div>
    </div>
  );
}
