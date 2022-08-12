import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import KeyValueRenderer from "@bvaughn/components/inspector/KeyValueRenderer";
import Loader from "@bvaughn/components/Loader";
import { InspectableTimestampedPointContext } from "@bvaughn/src/contexts/InspectorContext";
import { EventLog } from "@bvaughn/src/suspense/EventsCache";
import { formatTimestamp } from "@bvaughn/src/utils/time";
import { Fragment, MouseEvent, useMemo, useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { memo, Suspense, useContext } from "react";

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

  const location = eventLog.location[0];

  const content =
    values.length > 0
      ? values.map((value, index) => (
          <Fragment key={index}>
            <KeyValueRenderer
              isNested={false}
              layout="horizontal"
              pauseId={pauseId}
              protocolValue={value}
            />
            {index < values.length - 1 && " "}
          </Fragment>
        ))
      : " ";

  const showContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    show(eventLog, { x: event.pageX, y: event.pageY });
  };

  const primaryContent = (
    <>
      {showTimestamps && (
        <span className={styles.TimeStamp}>{formatTimestamp(eventLog.time, true)} </span>
      )}
      <span className={styles.LogContents}>{content}</span>
    </>
  );

  return (
    <InspectableTimestampedPointContext.Provider value={context}>
      <div
        ref={ref}
        className={className}
        data-search-index={index}
        data-test-name="Message"
        role="listitem"
        onContextMenu={showContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className={styles.Source}>
          <Suspense fallback={<Loader />}>{location && <Source location={location} />}</Suspense>
        </span>
        {primaryContent}
        {isHovered && (
          <MessageHoverButton
            executionPoint={eventLog.point}
            location={location}
            showAddCommentButton={true}
            time={eventLog.time}
          />
        )}
      </div>
    </InspectableTimestampedPointContext.Provider>
  );
}

export default memo(EventLogRenderer) as typeof EventLogRenderer;
