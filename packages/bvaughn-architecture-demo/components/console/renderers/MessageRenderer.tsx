import Expandable from "@bvaughn/components/Expandable";
import Icon from "@bvaughn/components/Icon";
import Inspector from "@bvaughn/components/inspector";
import Loader from "@bvaughn/components/Loader";
import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { InspectableTimestampedPointContext } from "@bvaughn/src/contexts/InspectorContext";
import { ProtocolMessage } from "@bvaughn/src/suspense/MessagesCache";
import { formatTimestamp } from "@bvaughn/src/utils/time";
import { Value as ProtocolValue } from "@replayio/protocol";
import { MouseEvent, useMemo, useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { memo, Suspense, useContext } from "react";

import { ConsoleContextMenuContext } from "../ConsoleContextMenuContext";
import MessageHoverButton from "../MessageHoverButton";
import MessageStackRenderer from "../MessageStackRenderer";
import Source from "../Source";

import styles from "./shared.module.css";

const EMPTY_ARRAY: any[] = [];

// This is a crappy approximation of the console; the UI isn't meant to be the focus of this branch.
// It would be nice to re-implement the whole Console UI though and re-write all of the legacy object inspector code.
function MessageRenderer({
  index,
  isFocused,
  message,
}: {
  index: number;
  isFocused: boolean;
  message: ProtocolMessage;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  const { show } = useContext(ConsoleContextMenuContext);
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

  const frames = message.data.frames || EMPTY_ARRAY;
  const frame = frames.length > 0 ? frames[frames.length - 1] : null;
  const location = frame ? frame.location[0] : null;

  let className = styles.Row;
  let icon = null;
  let showExpandable = false;
  switch (message.level) {
    case "error": {
      className = styles.ErrorRow;
      icon = <Icon className={styles.ErrorIcon} type="error" />;
      showExpandable = frames.length > 0;
      break;
    }
    case "trace": {
      className = styles.TraceRow;
      showExpandable = frames.length > 0;
      break;
    }
    case "warning": {
      className = styles.WarningRow;
      icon = <Icon className={styles.WarningIcon} type="warning" />;
      showExpandable = frames.length > 0;
      break;
    }
  }

  if (isFocused) {
    className = `${className} ${styles.Focused}`;
  }

  const showContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    show(message, { x: event.pageX, y: event.pageY });
  };

  const argumentValues = message.argumentValues || EMPTY_ARRAY;

  const logContents = (
    <>
      {showTimestamps && (
        <span className={styles.TimeStamp}>{formatTimestamp(message.point.time, true)}</span>
      )}
      <span className={styles.LogContents}>
        {icon}
        {message.text && <span className={styles.MessageText}>{message.text}</span>}
        <Suspense fallback={<Loader />}>
          {argumentValues.map((argumentValue: ProtocolValue, index: number) => (
            <>
              <Inspector key={index} pauseId={message.pauseId} protocolValue={argumentValue} />
              {index < argumentValues.length - 1 && " "}
            </>
          ))}
        </Suspense>
      </span>
    </>
  );

  return (
    <InspectableTimestampedPointContext.Provider value={context}>
      <span
        ref={ref}
        className={className}
        data-search-index={index}
        data-test-name="Message"
        onContextMenu={showContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="listitem"
      >
        <span className={styles.Source}>
          <Suspense fallback={<Loader />}>{location && <Source location={location} />}</Suspense>
        </span>
        {showExpandable ? (
          <Expandable
            children={<MessageStackRenderer message={message} />}
            className={styles.Expandable}
            header={logContents}
            useBlockLayoutWhenExpanded={false}
          />
        ) : (
          logContents
        )}

        {isHovered && (
          <MessageHoverButton
            executionPoint={message.point.point}
            location={location}
            pauseId={message.pauseId}
            showAddCommentButton={true}
            targetRef={ref}
            time={message.point.time}
          />
        )}
      </span>
    </InspectableTimestampedPointContext.Provider>
  );
}

export default memo(MessageRenderer) as typeof MessageRenderer;
