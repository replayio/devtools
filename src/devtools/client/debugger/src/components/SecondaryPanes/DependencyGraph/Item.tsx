import { TimeStampedPoint } from "@replayio/protocol";

import { getRawSourceURL } from "devtools/client/debugger/src/utils/source";
import { getURL } from "devtools/client/debugger/src/utils/sources-tree";
import { formatTimestamp } from "replay-next/src/utils/time";
import { seek } from "ui/actions/timeline";
import { useAppDispatch } from "ui/setup/hooks";
import { LocationWithUrl } from "ui/suspense/depGraphCache";

import styles from "./Item.module.css";

export function Item({
  isCurrent,
  name,
  location,
  timeStampedPoint,
}: {
  name: string;
  isCurrent?: boolean;
  location: LocationWithUrl | null;
  timeStampedPoint: TimeStampedPoint | null;
}) {
  const dispatch = useAppDispatch();

  const onClick = () => {
    timeStampedPoint &&
      dispatch(
        seek({
          executionPoint: timeStampedPoint.point,
          openSource: true,
          time: timeStampedPoint.time,
        })
      );
  };

  let source = null;
  if (location) {
    source = `${getRawSourceURL(getURL(location).filename)}:${location.line}`;
  }

  return (
    <div
      className={styles.Item}
      data-selected={isCurrent || undefined}
      data-disabled={!timeStampedPoint || undefined}
      onClick={isCurrent ? undefined : onClick}
      title={location?.url}
    >
      <div className={styles.NameColumn}>{name}</div>
      {timeStampedPoint && (
        <div className={styles.TimestampColumn}>({formatTimestamp(timeStampedPoint.time)})</div>
      )}
      {source && <div className={styles.LocationColumn}>{source}</div>}
    </div>
  );
}
