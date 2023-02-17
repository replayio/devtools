import { RecordingId } from "@replayio/protocol";

import { Point } from "shared/client/types";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { getPoints as getPointsGraphQL } from "shared/graphql/Points";

import { createGenericCache } from "./createGenericCache";

export const {
  getValueSuspense: getPointsSuspense,
  getValueAsync: getPointsAsync,
  getValueIfCached: getPointsIfCached,
  addValue: setLatestIDBValue,
} = createGenericCache<
  [graphQLClient: GraphQLClientInterface, accessToken: string | null],
  [recordingId: RecordingId],
  Point[]
>(
  "PointsCache: getPointsGraphQL",
  async (
    graphQLClient: GraphQLClientInterface,
    accessToken: string | null,
    recordingId: RecordingId
  ) => await getPointsGraphQL(graphQLClient, recordingId, accessToken),
  (recordingId: RecordingId) => recordingId
);
