import { Value as ProtocolValue } from "@replayio/protocol";
import { Fragment, MouseEvent, useMemo, useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { Suspense, memo, useContext } from "react";

import useConsoleContextMenu from "replay-next/components/console/useConsoleContextMenu";
import Expandable from "replay-next/components/Expandable";
import Icon from "replay-next/components/Icon";
import Inspector from "replay-next/components/inspector";
import Loader from "replay-next/components/Loader";
import { ConsoleFiltersContext } from "replay-next/src/contexts/ConsoleFiltersContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { UncaughtException } from "replay-next/src/suspense/ExceptionsCache";
import { formatTimestamp } from "replay-next/src/utils/time";

import MessageHoverButton from "../MessageHoverButton";
import Source from "../Source";
import StackRenderer from "../StackRenderer";
import styles from "./shared.module.css";

const EMPTY_ARRAY: any[] = [];

function UncaughtExceptionRenderer({
  index,
  isFocused,
  uncaughtException,
}: {
  index: number;
  isFocused: boolean;
  uncaughtException: UncaughtException;
}) {
  const { showTimestamps } = useContext(ConsoleFiltersContext);
  const { executionPoint: currentExecutionPoint } = useContext(TimelineContext);

  const { contextMenu, onContextMenu } = useConsoleContextMenu(uncaughtException);

  const locations = useMemo(() => {
    return Array.isArray(uncaughtException.location)
      ? uncaughtException.location
      : [uncaughtException.location];
  }, [uncaughtException.location]);

  const ref = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  useLayoutEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isFocused]);

  let className = styles.ErrorRow;
  if (isFocused) {
    className = `${className} ${styles.Focused}`;
  }

  const frames = uncaughtException.data.frames || EMPTY_ARRAY;
  const showExpandable = frames.length > 0;

  const argumentValues = uncaughtException.values || EMPTY_ARRAY;
  const primaryContent =
    argumentValues.length > 0 ? (
      <span className={styles.LogContents} data-test-name="LogContents">
        <Suspense fallback={<Loader />}>
          {argumentValues.map((argumentValue: ProtocolValue, index: number) => (
            <Fragment key={index}>
              <Inspector
                context="console"
                pauseId={uncaughtException.pauseId}
                protocolValue={argumentValue}
              />
              {index < argumentValues.length - 1 && " "}
            </Fragment>
          ))}
        </Suspense>
      </span>
    ) : (
      " "
    );

  return (
    <>
      <div
        ref={ref}
        className={className}
        data-search-index={index}
        data-test-message-type="exception"
        data-test-paused-here={uncaughtException.point === currentExecutionPoint}
        data-test-name="Message"
        onContextMenu={onContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="listitem"
      >
        {showTimestamps && (
          <span className={styles.TimeStamp}>{formatTimestamp(uncaughtException.time, true)} </span>
        )}
        <Icon className={styles.ErrorIcon} type="error" />
        <span className={styles.Source}>
          <Suspense fallback={<Loader />}>
            {locations.length > 0 && <Source locations={locations} />}
          </Suspense>
        </span>
        {showExpandable ? (
          <Expandable
            children={
              <StackRenderer frames={frames} stack={frames.map(({ frameId }) => frameId)} />
            }
            className={styles.Expandable}
            header={primaryContent}
            useBlockLayoutWhenExpanded={false}
          />
        ) : (
          primaryContent
        )}
        {isHovered && (
          <MessageHoverButton
            executionPoint={uncaughtException.point}
            locations={locations}
            showAddCommentButton={true}
            time={uncaughtException.time}
          />
        )}
      </div>
      {contextMenu}
    </>
  );
}

export default memo(UncaughtExceptionRenderer) as typeof UncaughtExceptionRenderer;
