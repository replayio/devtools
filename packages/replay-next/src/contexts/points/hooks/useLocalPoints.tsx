import { Location, RecordingId } from "@replayio/protocol";
import { useContext, useEffect, useMemo } from "react";

import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { Badge, PartialUser, PointBehavior } from "shared/client/types";
import { createPointKey } from "shared/graphql/Points";
import { POINTS_DATABASE } from "shared/user-data/IndexedDB/config";
import useIndexedDBUserData from "shared/user-data/IndexedDB/useIndexedDBUserData";

import { LocalPointsObject } from "../types";

// TODO [FE-1138] Remove this legacy type after a few weeks with the new Points storage format
type LegacyPoint = {
  badge: Badge | null;
  condition: string | null;
  content: string;
  createdByUserId: string | null;
  createdAtTime: number;
  id: string;
  location: Location;
  recordingId: RecordingId;
  shouldLog: PointBehavior;
};

export type SetLocalPoints = (
  points: LocalPointsObject | ((prevPoints: LocalPointsObject) => LocalPointsObject)
) => void;

export default function useLocalPoints({
  recordingId,
}: {
  recordingId: RecordingId;
}): [localPoints: LocalPointsObject, setLocalPoints: SetLocalPoints] {
  const { currentUserInfo } = useContext(SessionContext);

  // TODO [FE-1138] Remove this legacy load after a few weeks with the new Points storage format
  const { setValue: setValueOld, value: valueOld } = useIndexedDBUserData<LegacyPoint[]>({
    database: POINTS_DATABASE,
    initialValue: [],
    recordName: recordingId,
    storeName: "high-priority",
  });

  const { setValue: setValueNew, value: valueNew } = useIndexedDBUserData<LocalPointsObject>({
    database: POINTS_DATABASE,
    initialValue: {},
    recordName: recordingId,
    storeName: "points",
  });

  // TODO [FE-1138] Remove points merging after a few weeks with the new Points storage format
  const valueMerged = useMemo<LocalPointsObject>(() => {
    if (Object.keys(valueNew).length > 0) {
      return valueNew;
    } else {
      const migrated: LocalPointsObject = {};
      valueOld.forEach(point => {
        const key = createPointKey(point.recordingId, currentUserInfo?.id ?? null, point.location);

        // Assume legacy log points were created by the current user.
        // See https://github.com/replayio/devtools/pull/8837
        const user: PartialUser | null = currentUserInfo
          ? {
              id: currentUserInfo.id,
              name: currentUserInfo.name,
              picture: currentUserInfo.picture,
            }
          : null;

        migrated[key] = {
          badge: point.badge,
          condition: point.condition,
          content: point.content,
          createdAt: new Date(point.createdAtTime),
          key,
          location: point.location,
          recordingId: point.recordingId,
          user,
        };
      });
      return migrated;
    }
  }, [currentUserInfo, valueNew, valueOld]);

  useEffect(() => {
    if (valueOld?.length > 0) {
      setValueOld([]);
      setValueNew(valueMerged);
    }
  }, [setValueNew, setValueOld, valueMerged, valueNew, valueOld]);

  return [valueMerged, setValueNew];
}
