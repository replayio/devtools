import { RecordingId } from "@replayio/protocol";

import { Point } from "shared/client/types";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { getPoints as getPointsGraphQL } from "shared/graphql/Points";

import { Cache, createCache } from "suspense";

export const pointsCache: Cache<
  [graphQLClient: GraphQLClientInterface, accessToken: string | null, recordingId: RecordingId],
  Point[]
> = createCache({
  config: { immutable: true },
  debugLabel: "Points",
  getKey: ([graphQLClient, accessToken, recordingId]) => recordingId,
  load: async ([graphQLClient, accessToken, recordingId]) =>
    await getPointsGraphQL(graphQLClient, recordingId, accessToken),
});
