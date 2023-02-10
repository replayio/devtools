import { RecordingId } from "@replayio/protocol";

import useIndexedDB from "replay-next/src/hooks/useIndexedDB";

import { POINTS_DATABASE } from "./constants";
import { PointBehaviorsObject } from "./types";

export default function useLocalPointBehaviors({
  recordingId,
}: {
  recordingId: RecordingId;
}): [
  pointBehaviors: PointBehaviorsObject,
  setPointBehaviors: (
    pointBehaviors:
      | PointBehaviorsObject
      | ((prevPointBehaviors: PointBehaviorsObject) => PointBehaviorsObject)
  ) => void
] {
  const { setValue, value } = useIndexedDB<PointBehaviorsObject>({
    database: POINTS_DATABASE,
    initialValue: {},
    recordName: recordingId,
    storeName: "point-behaviors",
  });

  return [value, setValue];
}
