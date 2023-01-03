import { Suspense, useContext } from "react";

import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import Loader from "bvaughn-architecture-demo/components/Loader";
import { GraphQLClientContext } from "bvaughn-architecture-demo/src/contexts/GraphQLClientContext";
import { SessionContext } from "bvaughn-architecture-demo/src/contexts/SessionContext";
import { getCommentListSuspense } from "bvaughn-architecture-demo/src/suspense/CommentsCache";

import Comment from "./Comment";
import styles from "./CommentList.module.css";

// TODO Dim comments that are outside of the focus window

export default function CommentList() {
  const graphQLClient = useContext(GraphQLClientContext);
  const { accessToken, recordingId } = useContext(SessionContext);
  const commentList = getCommentListSuspense(graphQLClient, recordingId, accessToken);

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
