import { RecordingId } from "@replayio/protocol";

import { createGenericCache } from "replay-next/src/suspense/createGenericCache";
import { getComments as getCommentsGraphQL } from "shared/graphql/Comments";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { Comment } from "shared/graphql/types";

export const {
  getValueSuspense: getCommentListSuspense,
  getValueAsync: getCommentListAsync,
  getValueIfCached: getCommentListIfCached,
  addValue: cacheFrames,
  addValue: setLatestIDBValue,
} = createGenericCache<
  [graphQLClient: GraphQLClientInterface],
  [recordingId: RecordingId, accessToken: string | null],
  Comment[]
>(
  "CommentsCache: getCommentsGraphQL",
  1,
  async (
    graphQLClient: GraphQLClientInterface,
    recordingId: RecordingId,
    accessToken: string | null
  ) => await getCommentsGraphQL(graphQLClient, recordingId, accessToken),
  (recordingId: RecordingId, _accessToken: string | null) => recordingId
);
