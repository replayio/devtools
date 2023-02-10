import { RecordingId } from "@replayio/protocol";

import useIndexedDB from "replay-next/src/hooks/useIndexedDB";
import { Point } from "shared/client/types";

import { POINTS_DATABASE } from "./PointsContext";
import { LocalPointsObject } from "./types";

export default function useLocalPoints({
  recordingId,
}: {
  recordingId: RecordingId;
}): [
  points: LocalPointsObject,
  setPoints: (
    points: LocalPointsObject | ((prevPoints: LocalPointsObject) => LocalPointsObject)
  ) => void
] {
  const { setValue, value } = useIndexedDB<LocalPointsObject>({
    database: POINTS_DATABASE,
    initialValue: {},
    recordName: recordingId,
    storeName: "points",
  });

  return [value, setValue];
}
