import { RecordingId } from "@replayio/protocol";
import { createCache } from "suspense";

import { getComments as getCommentsGraphQL } from "shared/graphql/Comments";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { Comment } from "shared/graphql/types";

export const {
  cache: setLatestIDBValue,
  getValueIfCached: getCommentListIfCached,
  read: getCommentListSuspense,
  readAsync: getCommentListAsync,
} = createCache<
  [recordingId: RecordingId, graphQLClient: GraphQLClientInterface, accessToken: string | null],
  Comment[]
>({
  debugLabel: "CommentsCache",
  load: async (
    recordingId: RecordingId,
    graphQLClient: GraphQLClientInterface,
    accessToken: string | null
  ) => await getCommentsGraphQL(graphQLClient, recordingId, accessToken),
  getKey: (recordingId: RecordingId) => recordingId,
});
