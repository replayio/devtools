import lodashSortBy from "lodash/sortBy";
import React, { useContext, useMemo, useRef } from "react";

import { SessionContext } from "replay-next/src/contexts/SessionContext";
import CommentCard from "ui/components/Comments/CommentCard";
import CommentDropDownMenu from "ui/components/Comments/CommentDropDownMenu";
import useUserCommentPreferences from "ui/components/Comments/useUserCommentPreferences";
import LoginButton from "ui/components/LoginButton";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { Comment } from "ui/state/comments";
import useAuth0 from "ui/utils/useAuth0";

import styles from "./CommentCardsList.module.css";

export default function CommentCardsList() {
  const { currentUserInfo } = useContext(SessionContext);

  const recordingId = hooks.useGetRecordingId();
  const { comments, loading } = hooks.useGetComments(recordingId);
  const recording = hooks.useGetRecording(recordingId);
  const auth = useAuth0();

  const { filter, sortBy } = useUserCommentPreferences();

  const { isAuthenticated } = useAuth0();

  const displayedComments = useMemo(() => {
    let filteredComments = comments;
    if (filter !== null) {
      if (currentUserInfo === null) {
        filteredComments = [];
      } else {
        filteredComments = comments.filter(comment => {
          if (comment.user?.id === currentUserInfo.id) {
            return true;
          } else {
            return comment.replies.some(reply => reply.user?.id === currentUserInfo.id);
          }
        });
      }
    }

    const sortByArray =
      sortBy === "created-at"
        ? ["createdAt"]
        : [
            (comment: Comment) => comment.time,
            (comment: Comment) => BigInt(comment.point || 0),
            "createdAt",
          ];

    const sortedComments = lodashSortBy(filteredComments, sortByArray);

    return sortedComments;
  }, [comments, currentUserInfo, filter, sortBy]);

  const content = useMemo(() => {
    if (displayedComments.length > 0) {
      return displayedComments.map(comment => <CommentCard key={comment.id} comment={comment} />);
    } else {
      return (
        <div className={styles.NoComments}>
          <MaterialIcon className={styles.NoCommentsIcon}>forum</MaterialIcon>
          <h2>{isAuthenticated ? "" : "Sign in to get started"}</h2>

          <>
            {isAuthenticated ? (
              <p>Add a comment to the video, a line of code, or a console message.</p>
            ) : (
              <div>
                <p>Once signed in, you can add comments and make your voice heard!</p>
                <p>
                  <LoginButton />
                </p>
              </div>
            )}
          </>
        </div>
      );
    }
  }, [displayedComments, isAuthenticated]);

  if (loading || auth.isLoading || recording.loading) {
    return null;
  }

  return (
    <div className={styles.Sidebar}>
      <div className={styles.Toolbar}>
        <div className={styles.ToolbarHeader}>Comments</div>
        <CommentDropDownMenu />
      </div>
      <div className={styles.List}>{content}</div>
    </div>
  );
}
