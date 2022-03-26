import React from "react";
import { useSelector } from "react-redux";
import { selectors } from "ui/reducers";
import sortBy from "lodash/sortBy";
import hooks from "ui/hooks";
import { Comment } from "ui/state/comments";
import CommentCard from "ui/components/Comments/TranscriptComments/CommentCard";
import useAuth0 from "ui/utils/useAuth0";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { commentKeys } from "ui/utils/comments";
import NewCommentCard from "../Comments/TranscriptComments/NewCommentCard";

export default function Transcript() {
  const recordingId = hooks.useGetRecordingId();
  const { comments } = hooks.useGetComments(recordingId);
  const { loading } = hooks.useGetRecording(recordingId);
  const pendingComment = useSelector(selectors.getPendingComment);
  const { isAuthenticated } = useAuth0();

  if (loading) {
    return null;
  }

  const displayedComments: Comment[] = [...comments];

  console.log({ ids: displayedComments.map(x => x.id), pendingId: pendingComment?.comment.id });
  if (
    pendingComment?.type == "new_comment" &&
    !comments.map(x => x.id).includes(pendingComment.comment.id)
  ) {
    displayedComments.push(pendingComment.comment);
  }

  const sortedComments = sortBy(displayedComments, ["time", "createdAt"]);
  const keys = commentKeys(sortedComments);

  return (
    <div className="right-sidebar">
      <div className="right-sidebar-toolbar">
        <div className="right-sidebar-toolbar-item comments">Comments</div>
      </div>
      <div className="transcript-list flex h-full flex-grow flex-col items-center overflow-auto overflow-x-hidden bg-themeBodyBgcolor text-xs">
        {displayedComments.length > 0 ? (
          <div className="w-full flex-grow overflow-auto bg-themeBodyBgcolor">
            {/* {sortedComments.map((comment, i) => {
              return <CommentCard comments={sortedComments} comment={comment} key={keys[i]} />;
            })} */}
            {sortedComments.map((comment, i) => {
              return <NewCommentCard comment={comment} key={keys[i]} />;
            })}
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
