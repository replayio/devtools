import { RecordingId } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { Point } from "shared/client/types";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { getPoints as getPointsGraphQL } from "shared/graphql/Points";

export const pointsCache: Cache<
  [graphQLClient: GraphQLClientInterface, accessToken: string | null, recordingId: RecordingId],
  Point[]
> = createCache({
  debugLabel: "Points",
  getKey: ([graphQLClient, accessToken, recordingId]) => recordingId,
  load: async ([graphQLClient, accessToken, recordingId]) =>
    await getPointsGraphQL(graphQLClient, recordingId, accessToken),
});
