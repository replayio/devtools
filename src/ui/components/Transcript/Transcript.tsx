import React, { useMemo } from "react";
import hooks from "ui/hooks";
import useAuth0 from "ui/utils/useAuth0";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { flatToHierarchicalComments, sortHierarchicalComments } from "./utils.comments";
import { CommentItem } from "./CommentItem";

const Transcript = (): JSX.Element | null => {
  const recordingId = hooks.useGetRecordingId();
  const { comments } = hooks.useGetComments(recordingId);
  const { loading } = hooks.useGetRecording(recordingId);
  const { isAuthenticated } = useAuth0();

  if (loading) {
    return null;
  }

  comments.map(c => JSON.stringify(c.content, null, 4)).forEach(console.log);

  const sortedHierarchicalComments = useMemo(() => {
    const hierarchicalComments = flatToHierarchicalComments(comments);
    const sortedHierarchicalComments = sortHierarchicalComments(hierarchicalComments);
    return sortedHierarchicalComments;
  }, [comments]);

  return (
    <div className="right-sidebar">
      <div className="border-b border-b-splitter p-2 text-sm font-normal leading-5 text-bodyColor">
        Comments
      </div>

      <div className="transcript-list flex h-full flex-grow flex-col items-center overflow-auto overflow-x-hidden bg-themeBodyBgcolor text-xs">
        {sortedHierarchicalComments.length > 0 ? (
          <div className="w-full flex-grow overflow-auto bg-themeBodyBgcolor">
            {sortedHierarchicalComments.map(comment => {
              return <CommentItem key={comment.id} comment={comment} />;
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
};

export default Transcript;
