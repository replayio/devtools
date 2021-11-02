import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import sortBy from "lodash/sortBy";
import hooks from "ui/hooks";
// import "./Transcript.css";
import { UIState } from "ui/state";
import { Comment } from "ui/state/comments";
import CommentCard from "ui/components/Comments/TranscriptComments/CommentCard";
import useAuth0 from "ui/utils/useAuth0";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { commentKeys } from "ui/utils/comments";

function Transcript({ pendingComment }: PropsFromRedux) {
  const recordingId = hooks.useGetRecordingId();
  const { comments } = hooks.useGetComments(recordingId);
  const { loading } = hooks.useGetRecording(recordingId);
  const { isAuthenticated } = useAuth0();

  if (loading) {
    return null;
  }

  const displayedComments: Comment[] = [...comments];
  if (pendingComment?.type == "new_comment") {
    displayedComments.push(pendingComment.comment);
  }

  const sortedComments = sortBy(displayedComments, ["time", "createdAt"]);
  const keys = commentKeys(sortedComments);

  return (
    <div className="right-sidebar">
      <div className="right-sidebar-toolbar">
        <div className="right-sidebar-toolbar-item comments">Comments</div>
      </div>
      <div className="transcript-list flex-grow overflow-auto overflow-x-hidden flex flex-col items-center bg-white h-full text-xs">
        {displayedComments.length > 0 ? (
          <div className="overflow-auto w-full flex-grow">
            {sortedComments.map((comment, i) => {
              return <CommentCard comments={sortedComments} comment={comment} key={keys[i]} />;
            })}
          </div>
        ) : (
          <div className="transcript-list p-3 self-stretch space-y-3 text-base text-gray-500 onboarding-text">
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
const connector = connect((state: UIState) => ({
  pendingComment: selectors.getPendingComment(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Transcript);
