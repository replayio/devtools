import lodashSortBy from "lodash/sortBy";
import { ReactNode, useContext, useMemo } from "react";

import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { Comment } from "shared/graphql/types";
import CommentCard, { PauseOverlayPosition } from "ui/components/Comments/CommentCard";
import CommentDropDownMenu from "ui/components/Comments/CommentDropDownMenu";
import useUserCommentPreferences from "ui/components/Comments/useUserCommentPreferences";
import LoginButton from "ui/components/LoginButton";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { getAccessToken } from "ui/reducers/app";
import { getCurrentTime, isPlaying as isPlayingSelector } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

import styles from "./CommentCardsList.module.css";

export default function CommentCardsList() {
  const { currentUserInfo } = useContext(SessionContext);

  const recordingId = hooks.useGetRecordingId();
  const { comments, loading } = hooks.useGetComments(recordingId);
  const recording = hooks.useGetRecording(recordingId);

  const { filter, sortBy } = useUserCommentPreferences();

  const isAuthenticated = !!useAppSelector(getAccessToken);
  const currentTime = useAppSelector(getCurrentTime);
  const isPlaying = useAppSelector(isPlayingSelector);

  // We don't render this indicator during playback–
  // so we can avoid breaking memoization below unnecessarily by referencing it.
  const showPauseOverlayAtTime = isPlaying ? null : currentTime;

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
      let hasShownPauseOverlay = false;

      const renderedComments: ReactNode[] = [];
      displayedComments.forEach((comment, index) => {
        let pauseOverlayPosition: PauseOverlayPosition | null = null;
        if (showPauseOverlayAtTime !== null && !hasShownPauseOverlay) {
          if (comment.time == showPauseOverlayAtTime) {
            hasShownPauseOverlay = true;
          } else if (comment.time > showPauseOverlayAtTime) {
            hasShownPauseOverlay = true;
            pauseOverlayPosition = "before";
          } else if (index === displayedComments.length - 1) {
            hasShownPauseOverlay = true;
            pauseOverlayPosition = "after";
          }
        }

        renderedComments.push(
          <CommentCard
            key={comment.id}
            comment={comment}
            pauseOverlayPosition={pauseOverlayPosition}
            pauseOverlayTime={showPauseOverlayAtTime ? currentTime : null}
          />
        );
      });
      return renderedComments;
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
  }, [currentTime, displayedComments, isAuthenticated, showPauseOverlayAtTime]);

  if (loading || recording.loading) {
    return null;
  }

  return (
    <div className={styles.Sidebar} data-test-name="CommentCardList">
      <div className={styles.Toolbar}>
        <div className={styles.ToolbarHeader}>Comments</div>
        <CommentDropDownMenu />
      </div>
      <div className={styles.List}>{content}</div>
    </div>
  );
}
