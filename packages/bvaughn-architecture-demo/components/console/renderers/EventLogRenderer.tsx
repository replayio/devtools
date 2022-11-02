import { Fragment, MouseEvent, useMemo, useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { Suspense, memo, useContext } from "react";

import Inspector from "bvaughn-architecture-demo/components/inspector";
import Loader from "bvaughn-architecture-demo/components/Loader";
import { ConsoleFiltersContext } from "bvaughn-architecture-demo/src/contexts/ConsoleFiltersContext";
import { InspectableTimestampedPointContext } from "bvaughn-architecture-demo/src/contexts/InspectorContext";
import { TimelineContext } from "bvaughn-architecture-demo/src/contexts/TimelineContext";
import { EventLog } from "bvaughn-architecture-demo/src/suspense/EventsCache";
import { formatTimestamp } from "bvaughn-architecture-demo/src/utils/time";

import { ConsoleContextMenuContext } from "../ConsoleContextMenuContext";
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
  const { show } = useContext(ConsoleContextMenuContext);
  const { showTimestamps } = useContext(ConsoleFiltersContext);
  const { executionPoint: currentExecutionPoint } = useContext(TimelineContext);

  const ref = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  const { point, pauseId, time, values } = eventLog;

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

  const content =
    values.length > 0
      ? values.map((value, index) => (
          <Fragment key={index}>
            <Inspector context="console" pauseId={pauseId} protocolValue={value} />
            {index < values.length - 1 && " "}
          </Fragment>
        ))
      : null;

  const showContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    show(eventLog, { x: event.pageX, y: event.pageY });
  };

  const primaryContent = (
    <>
      {showTimestamps && (
        <span className={styles.TimeStamp}>{formatTimestamp(eventLog.time, true)} </span>
      )}
      {content ? (
        <span className={styles.LogContents} data-test-name="LogContents">
          {content}
        </span>
      ) : (
        <span className={styles.LogContentsEmpty} data-test-name="LogContents">
          No data to display.
        </span>
      )}
    </>
  );

  return (
    <InspectableTimestampedPointContext.Provider value={context}>
      <div
        ref={ref}
        className={className}
        data-search-index={index}
        data-test-message-type="event"
        data-test-paused-here={eventLog.point === currentExecutionPoint}
        data-test-name="Message"
        role="listitem"
        onContextMenu={showContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className={styles.Source}>
          <Suspense fallback={<Loader />}>
            <Source locations={eventLog.location} />
          </Suspense>
        </span>
        {primaryContent}
        {isHovered && (
          <MessageHoverButton
            executionPoint={eventLog.point}
            locations={eventLog.location}
            showAddCommentButton={true}
            time={eventLog.time}
          />
        )}
      </div>
    </InspectableTimestampedPointContext.Provider>
  );
}

export default memo(EventLogRenderer) as typeof EventLogRenderer;
