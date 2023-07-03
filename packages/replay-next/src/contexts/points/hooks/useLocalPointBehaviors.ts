import { RecordingId } from "@replayio/protocol";

import { POINTS_DATABASE } from "shared/user-data/IndexedDB/config";
import useIndexedDBUserData from "shared/user-data/IndexedDB/useIndexedDBUserData";

import { PointBehaviorsObject } from "../types";

export type SetLocalPointBehaviors = (
  pointBehaviors:
    | PointBehaviorsObject
    | ((prevPointBehaviors: PointBehaviorsObject) => PointBehaviorsObject)
) => void;

export default function useLocalPointBehaviors({
  recordingId,
}: {
  recordingId: RecordingId;
}): [localPointBehaviors: PointBehaviorsObject, setLocalPointBehaviors: SetLocalPointBehaviors] {
  const { setValue, value } = useIndexedDBUserData<PointBehaviorsObject>({
    database: POINTS_DATABASE,
    initialValue: {},
    recordName: recordingId,
    storeName: "point-behaviors",
  });

  return [value, setValue];
}
