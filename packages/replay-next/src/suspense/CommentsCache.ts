import { RecordingId } from "@replayio/protocol";
import { unstable_getCacheForType as getCacheForType } from "react";

import { getComments as getCommentsGraphQL } from "shared/graphql/Comments";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { Comment } from "shared/graphql/types";

import { createWakeable } from "../utils/suspense";
import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

type CommentRecord = {
  record: Record<Comment[]> | null;
};

function createCommentRecord(): CommentRecord {
  return {
    record: null,
  };
}

export function getCommentListSuspense(
  graphQLClient: GraphQLClientInterface,
  recordingId: RecordingId,
  accessToken: string | null
): Comment[] {
  const commentRecord = getCacheForType(createCommentRecord);
  if (commentRecord.record === null) {
    const wakeable = createWakeable<Comment[]>("getCommentListSuspense");

    commentRecord.record = {
      status: STATUS_PENDING,
      value: wakeable,
    };

    fetchCommentList(graphQLClient, recordingId, accessToken, commentRecord.record, wakeable);
  }

  if (commentRecord.record.status === STATUS_RESOLVED) {
    return commentRecord.record.value;
  } else {
    throw commentRecord.record.value;
  }
}

async function fetchCommentList(
  graphQLClient: GraphQLClientInterface,
  recordingId: RecordingId,
  accessToken: string | null,
  record: Record<Comment[]>,
  wakeable: Wakeable<Comment[]>
) {
  try {
    const commentList = await getCommentsGraphQL(graphQLClient, recordingId, accessToken);

    record.status = STATUS_RESOLVED;
    record.value = commentList;

    wakeable.resolve(commentList);
  } catch (error) {
    record.status = STATUS_REJECTED;
    record.value = error;

    wakeable.reject(error);
  }
}
