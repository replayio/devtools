import { Fragment, useMemo, useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { Suspense, memo, useContext } from "react";

import useConsoleContextMenu from "replay-next/components/console/useConsoleContextMenu";
import Inspector from "replay-next/components/inspector";
import Loader from "replay-next/components/Loader";
import { ConsoleFiltersContext } from "replay-next/src/contexts/ConsoleFiltersContext";
import { InspectableTimestampedPointContext } from "replay-next/src/contexts/InspectorContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { EventLog, eventsCache } from "replay-next/src/suspense/EventsCache";
import { formatTimestamp } from "replay-next/src/utils/time";

import MessageHoverButton from "../MessageHoverButton";
import Source from "../Source";
import styles from "./shared.module.css";

function EventLogRenderer({
  eventLog,
  index,
  isFocused,
}: {
  eventLog: EventLog;
  index: number;
  isFocused: boolean;
}) {
  const { executionPoint: currentExecutionPoint } = useContext(TimelineContext);

  const ref = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  const { point, time } = eventLog;

  const context = useMemo(
    () => ({
      executionPoint: point,
      time,
    }),
    [point, time]
  );

  useLayoutEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isFocused]);

  let className = styles.Row;
  if (isFocused) {
    className = `${className} ${styles.Focused}`;
  }

  const { contextMenu, onContextMenu } = useConsoleContextMenu(eventLog);

  return (
    <>
      <InspectableTimestampedPointContext.Provider value={context}>
        <div
          ref={ref}
          className={className}
          data-search-index={index}
          data-test-message-type="event"
          data-test-paused-here={eventLog.point === currentExecutionPoint}
          data-test-name="Message"
          role="listitem"
          onContextMenu={onContextMenu}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span className={styles.Source}>
            <Suspense fallback={<Loader />}>
              <Source locations={eventLog.frame!} />
            </Suspense>
          </span>
          <Suspense fallback={<Loader />}>
            <AnalyzedContent eventLog={eventLog} />
          </Suspense>
          {isHovered && (
            <MessageHoverButton
              executionPoint={eventLog.point}
              locations={eventLog.frame!}
              showAddCommentButton={true}
              time={eventLog.time}
            />
          )}
        </div>
      </InspectableTimestampedPointContext.Provider>
      {contextMenu}
    </>
  );
}

function AnalyzedContent({ eventLog }: { eventLog: EventLog }) {
  const { showTimestamps } = useContext(ConsoleFiltersContext);

  const { pauseId, values } = eventsCache.resultsCache.read(
    eventLog.point,
    eventLog.eventType,
    eventLog.label
  );

  const content =
    values.length > 0
      ? values.map((value, index) => (
          <Fragment key={index}>
            <Inspector context="console" pauseId={pauseId} protocolValue={value} />
            {index < values.length - 1 && " "}
          </Fragment>
        ))
      : null;

  return (
    <>
      {showTimestamps && (
        <span className={styles.TimeStamp}>{formatTimestamp(eventLog.time, true)} </span>
      )}
      {content ? (
        <span className={styles.LogContents} data-test-name="LogContents">
          <span className={styles.LogContentsEmpty}>({eventLog.label})</span> {content}
        </span>
      ) : (
        <span className={styles.LogContentsEmpty} data-test-name="LogContents">
          No data to display.
        </span>
      )}
    </>
  );
}

export default memo(EventLogRenderer) as typeof EventLogRenderer;
