import { Location, TimeStampedPoint } from "@replayio/protocol";

import { selectDependencyGraphNode } from "devtools/client/debugger/src/components/SecondaryPanes/DependencyGraph/selectDependencyGraphNode";
import { useIsCurrentItem } from "devtools/client/debugger/src/components/SecondaryPanes/DependencyGraph/useIsCurrentItem";
import { getRawSourceURL } from "devtools/client/debugger/src/utils/source";
import { getURL } from "devtools/client/debugger/src/utils/sources-tree";
import { formatTimestamp } from "replay-next/src/utils/time";
import { useAppDispatch } from "ui/setup/hooks";
import { LocationWithUrl } from "ui/suspense/depGraphCache";

import styles from "./Item.module.css";

export function Item({
  name,
  location,
  timeStampedPoint,
}: {
  name: string;
  location: Location | LocationWithUrl | null;
  timeStampedPoint: TimeStampedPoint | null;
}) {
  const dispatch = useAppDispatch();

  const isCurrent = useIsCurrentItem(timeStampedPoint, location);

  const isDisabled = !location || !timeStampedPoint;

  const onClick = async () => {
    if (!location || !timeStampedPoint) {
      return;
    }

    dispatch(selectDependencyGraphNode(location, timeStampedPoint));
  };

  let source = null;
  if (location && "url" in location) {
    source = `${getRawSourceURL(getURL(location).filename)}:${location.line}`;
  }

  return (
    <div
      className={styles.Item}
      data-selected={isCurrent || undefined}
      data-disabled={isDisabled || undefined}
      onClick={isCurrent ? undefined : onClick}
    >
      <div className={styles.NameColumn}>{name}</div>
      {timeStampedPoint && (
        <div className={styles.TimestampColumn}>({formatTimestamp(timeStampedPoint.time)})</div>
      )}
      {source && <div className={styles.LocationColumn}>{source}</div>}
    </div>
  );
}
