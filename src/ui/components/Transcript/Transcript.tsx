import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import sortBy from "lodash/sortBy";
import hooks from "ui/hooks";
import "./Transcript.css";
import { UIState } from "ui/state";
import { Comment, PendingNewComment } from "ui/state/comments";
import CommentCard from "ui/components/Comments/TranscriptComments/CommentCard";
import useAuth0 from "ui/utils/useAuth0";
import useDraftJS from "ui/components/Comments/TranscriptComments/CommentEditor/use-draftjs";
import MaterialIcon from "ui/components/shared/MaterialIcon";

function Transcript({ recordingId, pendingComment }: PropsFromRedux) {
  const { comments } = hooks.useGetComments(recordingId!);
  const { recording, loading } = hooks.useGetRecording(recordingId!);
  const { userId } = hooks.useGetUserId();
  const load = useDraftJS();
  const isAuthor = userId && userId == recording?.userId;

  useEffect(() => {
    let idle: NodeJS.Timeout | undefined = setTimeout(() => {
      load().then(() => {
        idle = undefined;
      });
    }, 1000);

    return () => idle && clearTimeout(idle);
  }, []);

  if (loading) {
    return null;
  }

  const displayedComments: (Comment | PendingNewComment)[] = [...comments];
  if (pendingComment?.type == "new_comment") {
    displayedComments.push(pendingComment.comment);
  }

  const { isAuthenticated } = useAuth0();

  return (
    <div className="right-sidebar">
      <div className="right-sidebar-toolbar">
        <div className="right-sidebar-toolbar-item comments">Comments</div>
      </div>
      <div className="transcript-list flex-grow overflow-auto overflow-x-hidden flex flex-col items-center bg-white h-full">
        {displayedComments.length > 0 ? (
          <div className="p-3 overflow-auto w-full flex-grow space-y-3">
            {sortBy(displayedComments, ["time"]).map(comment => {
              return <CommentCard comment={comment} key={"id" in comment ? comment.id : 0} />;
            })}
          </div>
        ) : (
          <div className="transcript-list p-4 self-stretch space-y-4 text-lg text-gray-500 onboarding-text">
            <MaterialIcon className="forum large-icon">forum</MaterialIcon>
            <h2>{isAuthenticated ? "Start a conversation" : "Sign in to get started"}</h2>

            <p>
              {isAuthenticated
                ? "Add a comment to the video, a line of code, or (soon!) a console message."
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
  recordingId: selectors.getRecordingId(state),
  pendingComment: selectors.getPendingComment(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Transcript);
