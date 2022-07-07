import Expandable from "@bvaughn/components/Expandable";
import Icon from "@bvaughn/components/Icon";
import Inspector from "@bvaughn/components/inspector";
import Loader from "@bvaughn/components/Loader";
import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { PauseContext } from "@bvaughn/src/contexts/PauseContext";
import { formatTimestamp } from "@bvaughn/src/utils/time";
import { Message as ProtocolMessage, Value as ProtocolValue } from "@replayio/protocol";
import { useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { memo, Suspense, useContext } from "react";

import MessageHoverButton from "./MessageHoverButton";
import styles from "./MessageRenderer.module.css";
import MessageStackRenderer from "./MessageStackRenderer";
import Source from "./Source";

// This is a crappy approximation of the console; the UI isn't meant to be the focus of this branch.
// It would be nice to re-implement the whole Console UI though and re-write all of the legacy object inspector code.
function MessageRenderer({ isFocused, message }: { isFocused: boolean; message: ProtocolMessage }) {
  const ref = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  const { pauseId: currentPauseId } = useContext(PauseContext);
  const { showTimestamps } = useContext(ConsoleFiltersContext);

  useLayoutEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isFocused]);

  let className = styles.MessageRow;
  let icon = null;
  let showExpandable = false;
  switch (message.level) {
    case "error": {
      className = styles.MessageRowError;
      icon = <Icon className={styles.ErrorIcon} type="error" />;
      showExpandable = true;
      break;
    }
    case "trace": {
      className = styles.MessageRowTrace;
      showExpandable = true;
      break;
    }
    case "warning": {
      className = styles.MessageRowWarning;
      icon = <Icon className={styles.WarningIcon} type="warning" />;
      showExpandable = true;
      break;
    }
  }

  if (isFocused) {
    className = `${className} ${styles.Focused}`;
  }

  if (currentPauseId === message.pauseId) {
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
          pauseId={message.pauseId}
          showAddCommentButton={true}
          targetRef={ref}
          timeStampedPoint={message.point}
        />
      )}
    </div>
  );
}

export default memo(MessageRenderer) as typeof MessageRenderer;
