import { RecordingId } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { getComments as getCommentsGraphQL } from "shared/graphql/Comments";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { Comment } from "shared/graphql/types";

export const commentsCache: Cache<
  [graphQLClient: GraphQLClientInterface, accessToken: string | null, recordingId: RecordingId],
  Comment[]
> = createCache({
  config: { immutable: true },
  debugLabel: "CommentsGraphQL",
  getKey: ([graphQLClient, accessToken, recordingId]) => recordingId,
  load: async ([graphQLClient, accessToken, recordingId]) =>
    await getCommentsGraphQL(graphQLClient, recordingId, accessToken),
});
