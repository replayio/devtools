import { RecordingId } from "@replayio/protocol";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { getPointsAsync } from "replay-next/src/suspense/PointsCache";
import { Point } from "shared/client/types";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";

export default function useRemotePoints({
  accessToken,
  graphQLClient,
  recordingId,
}: {
  accessToken: string | null;
  graphQLClient: GraphQLClientInterface;
  recordingId: RecordingId;
}): [remotePoints: Point[], setRemotePoints: Dispatch<SetStateAction<Point[]>>] {
  // Note that we fetch Points using async helpers rather than Suspense,
  // because it's better to load the rest of the app earlier than to wait on Points.
  const [remotePoints, setRemotePoints] = useState<Point[]>([]);

  useEffect(() => {
    async function fetchRemotePoints() {
      let points = await getPointsAsync(recordingId, graphQLClient, accessToken);

      // Shared log points are the primary use case here.
      // Sharing points that are break-only causes a weird UX, so we filter them.
      points = points.filter(point => !!point.content);

      setRemotePoints(points);
    }

    fetchRemotePoints();
  }, [graphQLClient, recordingId, accessToken]);

  return [remotePoints, setRemotePoints];
}
