import { Suspense, useContext } from "react";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import Loader from "replay-next/components/Loader";
import { GraphQLClientContext } from "replay-next/src/contexts/GraphQLClientContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { commentsCache } from "replay-next/src/suspense/CommentsCache";

import Comment from "./Comment";
import styles from "./CommentList.module.css";

// TODO Dim comments that are outside of the focus window

export default function CommentList() {
  const graphQLClient = useContext(GraphQLClientContext);
  const { accessToken, recordingId } = useContext(SessionContext);
  const commentList = commentsCache.read(graphQLClient, accessToken, recordingId);

  return (
    <InlineErrorBoundary name="CommentList">
      <Suspense fallback={<Loader />}>
        <div className={styles.List}>
          <div className={styles.Header}>Comments</div>
          {commentList.map((comment, commentIndex) => (
            <Comment key={commentIndex} comment={comment} />
          ))}
        </div>
      </Suspense>
    </InlineErrorBoundary>
  );
}
