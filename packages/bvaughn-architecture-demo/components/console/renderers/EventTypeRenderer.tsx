import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import KeyValueRenderer from "@bvaughn/components/inspector/KeyValueRenderer";
import Loader from "@bvaughn/components/Loader";
import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { EventTypeLog } from "@bvaughn/src/suspense/EventsCache";
import { formatTimestamp } from "@bvaughn/src/utils/time";
import { useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { memo, Suspense, useContext } from "react";

import Source from "../Source";

import styles from "./shared.module.css";
import MessageHoverButton from "../MessageHoverButton";

function EventTypeRenderer({
  eventTypeLog,
  isFocused,
}: {
  eventTypeLog: EventTypeLog;
  isFocused: boolean;
}) {
  const { showTimestamps } = useContext(ConsoleFiltersContext);

  const ref = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  const { executionPoint: currentExecutionPoint } = useContext(TimelineContext);

  useLayoutEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isFocused]);

  const { point, pauseId, values } = eventTypeLog;

  let className = styles.Row;
  if (isFocused) {
    className = `${className} ${styles.Focused}`;
  }

  if (currentExecutionPoint === point) {
    className = `${className} ${styles.CurrentlyPausedAt}`;
  }

  const location = eventTypeLog.location[0];

  const contents = values.map((value, index) => (
    <KeyValueRenderer
      key={index}
      isNested={false}
      layout="horizontal"
      pauseId={pauseId}
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
      {isHovered && (
        <MessageHoverButton
          executionPoint={eventTypeLog.point}
          showAddCommentButton={false}
          targetRef={ref}
          time={eventTypeLog.time}
        />
      )}
    </div>
  );
}

export default memo(EventTypeRenderer) as typeof EventTypeRenderer;
