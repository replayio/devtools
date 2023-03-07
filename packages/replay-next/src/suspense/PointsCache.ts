import { RecordingId } from "@replayio/protocol";
import { createCache } from "suspense";

import { Point } from "shared/client/types";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { getPoints as getPointsGraphQL } from "shared/graphql/Points";

export const {
  cache: setLatestIDBValue,
  getValueIfCached: getPointsIfCached,
  read: getPointsSuspense,
  readAsync: getPointsAsync,
} = createCache<
  [recordingId: RecordingId, graphQLClient: GraphQLClientInterface, accessToken: string | null],
  Point[]
>({
  debugLabel: "PointsCache: getPointsGraphQL",
  load: async (
    recordingId: RecordingId,
    graphQLClient: GraphQLClientInterface,
    accessToken: string | null
  ) => await getPointsGraphQL(graphQLClient, recordingId, accessToken),
  getKey: (recordingId: RecordingId) => recordingId,
});
