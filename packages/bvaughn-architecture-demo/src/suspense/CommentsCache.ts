import { RecordingId } from "@replayio/protocol";
import { unstable_getCacheForType as getCacheForType } from "react";

import { getComments as getCommentsGraphQL } from "../graphql/Comments";
import { createWakeable } from "../utils/suspense";
import { GraphQLClientInterface } from "../graphql/GraphQLClient";
import { Comment } from "../graphql/types";

import { Record, STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED, Wakeable } from "./types";

type CommentRecord = {
  record: Record<Comment[]> | null;
};

function createCommentRecord(): CommentRecord {
  return {
    record: null,
  };
}

export function getCommentList(
  graphQLClient: GraphQLClientInterface,
  recordingId: RecordingId,
  accessToken: string | null
): Comment[] {
  const commentRecord = getCacheForType(createCommentRecord);
  if (commentRecord.record === null) {
    const wakeable = createWakeable<Comment[]>();

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
