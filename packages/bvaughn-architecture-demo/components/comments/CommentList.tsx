import AvatarImage from "@bvaughn/components/AvatarImage";
import { getCommentList } from "@bvaughn/src/suspense/CommentsCache";
import { GraphQLClientContext } from "@bvaughn/src/contexts/GraphQLClientContext";
import { SessionContext } from "@bvaughn/src/contexts/SessionContext";
import ErrorBoundary from "@bvaughn/components/ErrorBoundary";
import Loader from "@bvaughn/components/Loader";
import { Suspense, useContext } from "react";

import Comment from "./Comment";
import styles from "./CommentList.module.css";

// TODO Dim comments that are outside of the focus window

export default function CommentList() {
  const graphQLClient = useContext(GraphQLClientContext);
  const { accessToken, recordingId } = useContext(SessionContext);
  const commentList = getCommentList(graphQLClient, recordingId, accessToken);

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loader />}>
        <div className={styles.List}>
          <div className={styles.Header}>Comments</div>
          {commentList.map((comment, commentIndex) => (
            <Comment key={commentIndex} comment={comment} />
          ))}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
