import { RecordingId } from "@replayio/protocol";

import useIndexedDB from "replay-next/src/hooks/useIndexedDB";

import { POINTS_DATABASE } from "../constants";
import { LocalPointsObject } from "../types";

export type SetLocalPoints = (
  points: LocalPointsObject | ((prevPoints: LocalPointsObject) => LocalPointsObject)
) => void;

export default function useLocalPoints({
  recordingId,
}: {
  recordingId: RecordingId;
}): [localPoints: LocalPointsObject, setLocalPoints: SetLocalPoints] {
  const { setValue, value } = useIndexedDB<LocalPointsObject>({
    database: POINTS_DATABASE,
    initialValue: {},
    recordName: recordingId,
    storeName: "points",
  });

  return [value, setValue];
}
