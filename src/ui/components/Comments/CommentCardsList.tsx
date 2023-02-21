import sortBy from "lodash/sortBy";
import React, { useMemo } from "react";

import CommentCard from "ui/components/Comments/CommentCard";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { Comment } from "ui/state/comments";
import useAuth0 from "ui/utils/useAuth0";
import LoginButton from "ui/components/LoginButton";

import styles from "./CommentCardsList.module.css";

export default function CommentCardsList() {
  const recordingId = hooks.useGetRecordingId();
  const { comments, loading } = hooks.useGetComments(recordingId);
  const recording = hooks.useGetRecording(recordingId);
  const auth = useAuth0();

  const { isAuthenticated } = useAuth0();

  const displayedComments = useMemo(() => {
    const clonedComments: Comment[] = [...comments];

    const sortedComments = sortBy(clonedComments, [
      c => c.time,
      c => BigInt(c.point || 0),
      "createdAt",
    ]);
    return sortedComments;
  }, [comments]);

  if (loading || auth.isLoading || recording.loading) {
    return null;
  }

  let content = null;
  if (displayedComments.length > 0) {
    content = displayedComments.map(comment => <CommentCard key={comment.id} comment={comment} />);
  } else {
    content = (
      <div className={styles.NoComments}>
        <MaterialIcon className={styles.NoCommentsIcon}>forum</MaterialIcon>
        <h2>{isAuthenticated ? "" : "Sign in to get started"}</h2>
        
        <>
          {isAuthenticated
            ? (<p>Add a comment to the video, a line of code, or a console message.</p>)
            : (<div><p>Once signed in, you can add comments and make your voice heard!</p><p><LoginButton /></p></div>)}
      </>
       
      </div>
    );
  }

  return (
    <div className={styles.Sidebar}>
      <div className={styles.Toolbar}>
        <div className={styles.ToolbarHeader}>Comments</div>
      </div>
      <div className={styles.List}>{content}</div>
    </div>
  );
}
