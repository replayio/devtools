import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import KeyValueRenderer from "@bvaughn/components/inspector/KeyValueRenderer";
import Loader from "@bvaughn/components/Loader";
import { PauseContext } from "@bvaughn/src/contexts/PauseContext";
import { EventTypeLog } from "@bvaughn/src/suspense/EventsCache";
import { formatTimestamp } from "@bvaughn/src/utils/time";
import { useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { memo, Suspense, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import Source from "../Source";

import styles from "./shared.module.css";

function EventTypeRenderer({
  eventTypeLog,
  isFocused,
}: {
  eventTypeLog: EventTypeLog;
  isFocused: boolean;
}) {
  const client = useContext(ReplayClientContext);
  const { showTimestamps } = useContext(ConsoleFiltersContext);

  const ref = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  const { pauseId: currentPauseId } = useContext(PauseContext);

  useLayoutEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isFocused]);

  const { pauseId, values } = eventTypeLog;

  let className = styles.Row;
  if (isFocused) {
    className = `${className} ${styles.Focused}`;
  }

  if (currentPauseId === pauseId) {
    className = `${className} ${styles.CurrentlyPausedAt}`;
  }

  const location = eventTypeLog.location[0];

  const contents = values.map((value, index) => (
    <KeyValueRenderer
      key={index}
      isNested={false}
      layout="horizontal"
      pauseId={pauseId!}
      protocolValue={value}
    />
  ));

  const primaryContent = (
    <div
      className={
        showTimestamps ? styles.PrimaryRowWithTimestamps : styles.PrimaryRowWithoutTimestamps
      }
    >
      {showTimestamps && (
        <span className={styles.TimeStamp}>{formatTimestamp(eventTypeLog.time, true)}</span>
      )}
      <div className={styles.LogContents}>{contents}</div>
      <Suspense fallback={<Loader />}>
        <div className={styles.Source}>{location && <Source location={location} />}</div>
      </Suspense>
    </div>
  );

  return (
    <div
      ref={ref}
      className={className}
      data-test-name="Message"
      role="listitem"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {primaryContent}
      {
        isHovered && null /* TODO (console-event-type) Add hover button support
        <MessageHoverButton
          pauseId={pauseId}
          showAddCommentButton={false}
          targetRef={ref}
          timeStampedPoint={eventTypeLog.timeStampedHitPoint}
        />*/
      }
    </div>
  );
}

export default memo(EventTypeRenderer) as typeof EventTypeRenderer;
