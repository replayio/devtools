import Expandable from "@bvaughn/components/Expandable";
import Icon from "@bvaughn/components/Icon";
import Inspector from "@bvaughn/components/inspector";
import Loader from "@bvaughn/components/Loader";
import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { InspectableTimestampedPointContext } from "@bvaughn/src/contexts/InspectorContext";
import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { formatTimestamp } from "@bvaughn/src/utils/time";
import { Message as ProtocolMessage, Value as ProtocolValue } from "@replayio/protocol";
import { useMemo, useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { memo, Suspense, useContext } from "react";

import MessageHoverButton from "../MessageHoverButton";
import MessageStackRenderer from "../MessageStackRenderer";
import Source from "../Source";

import styles from "./shared.module.css";

// This is a crappy approximation of the console; the UI isn't meant to be the focus of this branch.
// It would be nice to re-implement the whole Console UI though and re-write all of the legacy object inspector code.
function MessageRenderer({ isFocused, message }: { isFocused: boolean; message: ProtocolMessage }) {
  const ref = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  const { executionPoint: currentExecutionPoint } = useContext(TimelineContext);
  const { showTimestamps } = useContext(ConsoleFiltersContext);

  const context = useMemo(
    () => ({
      executionPoint: message.point.point,
      time: message.point.time,
    }),
    [message.point]
  );

  useLayoutEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isFocused]);

  let className = styles.Row;
  let icon = null;
  let showExpandable = false;
  switch (message.level) {
    case "error": {
      className = styles.ErrorRow;
      icon = <Icon className={styles.ErrorIcon} type="error" />;
      showExpandable = true;
      break;
    }
    case "trace": {
      className = styles.TraceRow;
      showExpandable = true;
      break;
    }
    case "warning": {
      className = styles.WarningRow;
      icon = <Icon className={styles.WarningIcon} type="warning" />;
      showExpandable = true;
      break;
    }
  }

  if (isFocused) {
    className = `${className} ${styles.Focused}`;
  }

  if (currentExecutionPoint === message.point.point) {
    className = `${className} ${styles.CurrentlyPausedAt}`;
  }

  const frame = message.data.frames ? message.data.frames[message.data.frames.length - 1] : null;
  const location = frame ? frame.location[0] : null;

  const logContents = (
    <div className={styles.LogContents}>
      {icon}
      {message.text && <span className={styles.MessageText}>{message.text}</span>}
      <Suspense fallback={<Loader />}>
        {message.argumentValues?.map((argumentValue: ProtocolValue, index: number) => (
          <Inspector key={index} pauseId={message.pauseId} protocolValue={argumentValue} />
        ))}
      </Suspense>
    </div>
  );

  return (
    <InspectableTimestampedPointContext.Provider value={context}>
      <div
        ref={ref}
        className={className}
        data-test-name="Message"
        role="listitem"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={
            showTimestamps ? styles.PrimaryRowWithTimestamps : styles.PrimaryRowWithoutTimestamps
          }
        >
          {showTimestamps && (
            <span className={styles.TimeStamp}>{formatTimestamp(message.point.time, true)}</span>
          )}
          {showExpandable ? (
            <Expandable
              children={<MessageStackRenderer message={message} />}
              className={styles.Expandable}
              header={logContents}
            />
          ) : (
            logContents
          )}
          <Suspense fallback={<Loader />}>
            <div className={styles.Source}>{location && <Source location={location} />}</div>
          </Suspense>
        </div>

        {isHovered && (
          <MessageHoverButton
            executionPoint={message.point.point}
            pauseId={message.pauseId}
            showAddCommentButton={true}
            targetRef={ref}
            time={message.point.time}
          />
        )}
      </div>
    </InspectableTimestampedPointContext.Provider>
  );
}

export default memo(MessageRenderer) as typeof MessageRenderer;
