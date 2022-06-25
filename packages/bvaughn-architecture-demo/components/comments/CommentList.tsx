import { getCommentList } from "@source/suspense/CommentsCache";
import { GraphQLClientContext } from "@source/contexts/GraphQLClientContext";
import { SessionContext } from "@source/contexts/SessionContext";
import { useContext } from "react";

import Comment from "./Comment";
import styles from "./CommentList.module.css";

// TODO Dim comments that are outside of the focus window

export default function CommentList() {
  const graphQLClient = useContext(GraphQLClientContext);
  const { accessToken, currentUserInfo, recordingId } = useContext(SessionContext);
  const commentList = getCommentList(graphQLClient, recordingId, accessToken);

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
