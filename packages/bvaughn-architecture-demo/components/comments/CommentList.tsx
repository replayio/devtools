import { useContext } from "react";

import { getCommentList } from "../../src/suspense/CommentsCache";
import { SessionContext } from "../../src/contexts/SessionContext";

import Comment from "./Comment";
import styles from "./CommentList.module.css";

// TODO Dim comments that are outside of the focus window

export default function CommentList() {
  const { accessToken, currentUserInfo, recordingId } = useContext(SessionContext);
  const commentList = getCommentList(recordingId, accessToken);

  return (
    <div className={styles.List}>
      <div className={styles.Header}>
        {currentUserInfo && (
          <div className={styles.HeaderLeft}>
            <img className={styles.Avatar} src={currentUserInfo.picture} />
            {currentUserInfo.name}
          </div>
        )}
        <div className={styles.HeaderRight}>Comments</div>
      </div>
      {commentList.map((comment, commentIndex) => (
        <Comment key={commentIndex} comment={comment} />
      ))}
    </div>
  );
}
