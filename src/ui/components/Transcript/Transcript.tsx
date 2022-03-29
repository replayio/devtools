import React, { useMemo } from "react";
import hooks from "ui/hooks";
import useAuth0 from "ui/utils/useAuth0";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { flatToHierarchicalComments, sortHierarchicalComments } from "./utils.comments";
import { CommentItem } from "./CommentItem";
import { Comment, ROOT_COMMENT_ID } from "ui/state/comments";

const Transcript = (): JSX.Element | null => {
  const recordingId = hooks.useGetRecordingId();
  const { comments } = hooks.useGetComments(recordingId);
  const { loading } = hooks.useGetRecording(recordingId);
  const { isAuthenticated } = useAuth0();

  const sortedHierarchicalComments = useMemo(() => {
    if (loading) {
      return [];
    }

    const hierarchicalComments = flatToHierarchicalComments(comments);
    const sortedHierarchicalComments = sortHierarchicalComments(hierarchicalComments);
    return sortedHierarchicalComments;
  }, [comments, loading]);

  if (loading) {
    return null;
  }

  // by creating this faux "root comment", we can gather together all top-level
  // comments and a top-level pending comment under the same object and reuse
  // CommentItem component to render them like they are some regular comments
  const _rootComment = {
    id: ROOT_COMMENT_ID,
    replies: sortedHierarchicalComments.map(c => ({ ...c, parentId: ROOT_COMMENT_ID })),
  } as Comment;

  return (
    <div className="right-sidebar">
      <div className="border-b border-b-splitter p-2 text-sm font-normal leading-5 text-bodyColor">
        Comments
      </div>

      <div className="transcript-list bg-themeBodyBgcolor flex h-full flex-grow flex-col items-center overflow-auto overflow-x-hidden text-xs">
        {sortedHierarchicalComments.length > 0 ? (
          <div className="bg-themeBodyBgcolor w-full flex-grow overflow-auto">
            <CommentItem comment={_rootComment} />
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
