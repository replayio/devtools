import { RecordingId } from "@replayio/protocol";

import { createGenericCache } from "replay-next/src/suspense/createGenericCache";
import { getComments as getCommentsGraphQL } from "shared/graphql/Comments";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { Comment } from "shared/graphql/types";

export const {
  getValueSuspense: getCommentListSuspense,
  getValueAsync: getCommentListAsync,
  getValueIfCached: getCommentListIfCached,
  addValue: setLatestIDBValue,
} = createGenericCache<
  [graphQLClient: GraphQLClientInterface, accessToken: string | null],
  [recordingId: RecordingId],
  Comment[]
>(
  "CommentsCache: getCommentsGraphQL",
  async (
    recordingId: RecordingId,
    graphQLClient: GraphQLClientInterface,
    accessToken: string | null
  ) => await getCommentsGraphQL(graphQLClient, recordingId, accessToken),
  (recordingId: RecordingId) => recordingId
);
