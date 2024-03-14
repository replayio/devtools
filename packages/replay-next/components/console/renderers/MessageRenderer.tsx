import { Value as ProtocolValue } from "@replayio/protocol";
import {
  Fragment,
  Suspense,
  memo,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ProtocolMessage } from "replay-next/components/console/LoggablesContext";
import useConsoleContextMenu from "replay-next/components/console/useConsoleContextMenu";
import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import Expandable from "replay-next/components/Expandable";
import Icon from "replay-next/components/Icon";
import Inspector from "replay-next/components/inspector";
import Loader from "replay-next/components/Loader";
import { ConsoleFiltersContext } from "replay-next/src/contexts/ConsoleFiltersContext";
import { InspectableTimestampedPointContext } from "replay-next/src/contexts/InspectorContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { clientValueCache } from "replay-next/src/suspense/ObjectPreviews";
import { formatTimestamp } from "replay-next/src/utils/time";
import { replayClient } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";

import ErrorStackRenderer from "../ErrorStackRenderer";
import MessageHoverButton from "../MessageHoverButton";
import Source from "../Source";
import StackRenderer from "../StackRenderer";
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

  const { showTimestamps } = useContext(ConsoleFiltersContext);
  const { executionPoint: currentExecutionPoint } = useContext(TimelineContext);

  const { contextMenu, onContextMenu } = useConsoleContextMenu(message);

  const context = useMemo(
    () => ({
      executionPoint: message.point.point,
      time: message.point.time,
    }),
    [message.point]
  );

  useLayoutEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isFocused]);

  const stack = message.stack || EMPTY_ARRAY;
  const frames = message.data.frames || EMPTY_ARRAY;
  const frame =
    stack.length > 0 && frames.length > 0
      ? frames.find(frame => frame.frameId === stack[0]) || null
      : null;

  let className = styles.Row;
  let icon = null;
  let showExpandable = false;
  let testMessageType = "console-log";
  switch (message.level) {
    case "error": {
      className = styles.ErrorRow;
      icon = <Icon className={styles.ErrorIcon} type="error" />;
      showExpandable = frames.length > 0;
      testMessageType = "console-error";
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
      testMessageType = "console-warning";
      break;
    }
  }

  if (isFocused) {
    className = `${className} ${styles.Focused}`;
  }

  const argumentValues = message.argumentValues || EMPTY_ARRAY;
  const primaryContent =
    argumentValues.length > 0 ? (
      <Suspense fallback={<Loader />}>
        {argumentValues.map((argumentValue: ProtocolValue, index: number) => (
          <ArgumentsRendererSuspends
            argumentValue={argumentValue}
            client={replayClient}
            index={index}
            key={index}
            message={message}
          />
        ))}
      </Suspense>
    ) : (
      " "
    );

  const logContents = (
    <span className={styles.LogContents} data-test-name="LogContents">
      {message.text && <span className={styles.MessageText}>{message.text}</span>}
      <InlineErrorBoundary
        name="MessageRenderer"
        fallback={<div className={styles.ErrorBoundaryFallback}>Something went wrong.</div>}
      >
        {primaryContent}
      </InlineErrorBoundary>
    </span>
  );

  return (
    <>
      <InspectableTimestampedPointContext.Provider value={context}>
        <div
          ref={ref}
          className={className}
          data-search-index={index}
          data-test-message-type={testMessageType}
          data-test-paused-here={message.point.point === currentExecutionPoint}
          data-test-name="Message"
          onContextMenu={onContextMenu}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          role="listitem"
        >
          {showTimestamps && (
            <span className={styles.TimeStamp}>{formatTimestamp(message.point.time, true)} </span>
          )}
          {icon}
          <span className={styles.Source}>
            <Suspense fallback={<Loader />}>
              {frame?.location?.length > 0 && <Source locations={frame.location} />}
            </Suspense>
          </span>
          {frame != null && message.stack != null && showExpandable ? (
            <Expandable
              children={<StackRenderer frames={frames} stack={message.stack} />}
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
              locations={frame?.location || null}
              showAddCommentButton={true}
              time={message.point.time}
            />
          )}
        </div>
      </InspectableTimestampedPointContext.Provider>
      {contextMenu}
    </>
  );
}

function ArgumentsRendererSuspends({
  argumentValue,
  client,
  index,
  message,
}: {
  argumentValue: ProtocolValue;
  client: ReplayClientInterface;
  index: number;
  message: ProtocolMessage;
}) {
  const clientValue = clientValueCache.read(client, message.pauseId, argumentValue);
  return (
    <Fragment>
      {index > 0 && " "}
      {clientValue.type === "error" && argumentValue.object ? (
        <>
          <Inspector context="console" pauseId={message.pauseId} protocolValue={argumentValue} />
          <ErrorStackRenderer errorObjectId={argumentValue.object} pauseId={message.pauseId} />
        </>
      ) : (
        <Inspector context="console" pauseId={message.pauseId} protocolValue={argumentValue} />
      )}
    </Fragment>
  );
}

export default memo(MessageRenderer) as typeof MessageRenderer;
