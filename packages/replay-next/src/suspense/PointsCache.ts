import { RecordingId } from "@replayio/protocol";

import { Point } from "shared/client/types";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { getPoints as getPointsGraphQL } from "shared/graphql/Points";

import { createGenericCache } from "./createGenericCache";

export const {
  getValueSuspense: getPointsSuspense,
  getValueAsync: getPointsAsync,
  getValueIfCached: getPointsIfCached,
  addValue: cacheFrames,
  addValue: setLatestIDBValue,
} = createGenericCache<
  [graphQLClient: GraphQLClientInterface],
  [recordingId: RecordingId, accessToken: string | null],
  Point[]
>(
  "PointsCache: getPointsGraphQL",
  1,
  async (
    graphQLClient: GraphQLClientInterface,
    recordingId: RecordingId,
    accessToken: string | null
  ) => await getPointsGraphQL(graphQLClient, recordingId, accessToken),
  (recordingId: RecordingId, _accessToken: string | null) => recordingId
);
