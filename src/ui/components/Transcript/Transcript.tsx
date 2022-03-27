import React, { useReducer } from "react";
import { useSelector } from "react-redux";
import { selectors } from "ui/reducers";
import sortBy from "lodash/sortBy";
import hooks from "ui/hooks";
import { Comment } from "ui/state/comments";
import useAuth0 from "ui/utils/useAuth0";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import NewCommentCard from "../Comments/TranscriptComments/NewCommentCard";

export default function Transcript() {
  const recordingId = hooks.useGetRecordingId();
  const { loading } = hooks.useGetRecording(recordingId);
  const { isAuthenticated } = useAuth0();

  // Apollo Comments
  const { comments } = hooks.useGetComments(recordingId);

  // Redux Comments
  const [localComments, dispatch] = useReducer(
    (
      state: Comment[],
      action:
        | { type: "ADD_COMMENT"; comment: Comment }
        | { type: "UPDATE_COMMENT"; comment: Comment }
        | { type: "REMOVE_COMMENT"; id: string }
    ) => {
      switch (action.type) {
        case "ADD_COMMENT":
          return [...state, action.comment];
        case "UPDATE_COMMENT":
          return [...state.filter(x => x.id !== action.comment.id), action.comment];
        case "REMOVE_COMMENT":
          return state.filter(x => x.id !== action.id);
      }
    },
    []
  );
  const dedupedFromServer = comments.filter(x => localComments.map(y => y.id).includes(x.id));

  if (loading) {
    return null;
  }

  const displayedComments: Comment[] = [...dedupedFromServer, ...localComments];
  const sortedComments = sortBy(displayedComments, ["time", "createdAt"]);

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
            {sortedComments.map(comment => (
              <NewCommentCard comment={comment} key={comment.id} />
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
