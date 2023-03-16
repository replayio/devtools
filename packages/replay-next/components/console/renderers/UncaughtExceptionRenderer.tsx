import { Value as ProtocolValue } from "@replayio/protocol";
import { Fragment, useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { Suspense, memo, useContext } from "react";

import useConsoleContextMenu from "replay-next/components/console/useConsoleContextMenu";
import Expandable from "replay-next/components/Expandable";
import Icon from "replay-next/components/Icon";
import Inspector from "replay-next/components/inspector";
import Loader from "replay-next/components/Loader";
import { ConsoleFiltersContext } from "replay-next/src/contexts/ConsoleFiltersContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { UncaughtException, getExceptionSuspense } from "replay-next/src/suspense/ExceptionsCache";
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

  const locations = uncaughtException.frame ?? null;

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
          {locations && locations.length > 0 ? (
            <Suspense fallback={<Loader />}>
              <Source locations={locations} />
            </Suspense>
          ) : (
            "Unknown location"
          )}
        </span>
        <Suspense fallback={<Loader />}>
          <AnalyzedContent uncaughtException={uncaughtException} />
        </Suspense>
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

function AnalyzedContent({ uncaughtException }: { uncaughtException: UncaughtException }) {
  const uncaughtExceptionResult = getExceptionSuspense(uncaughtException.point);

  const frames = uncaughtExceptionResult.data.frames || EMPTY_ARRAY;
  const showExpandable = frames.length > 0;

  const argumentValues = uncaughtExceptionResult.values || EMPTY_ARRAY;
  const primaryContent =
    argumentValues.length > 0 ? (
      <span className={styles.LogContents} data-test-name="LogContents">
        <Suspense fallback={<Loader />}>
          {argumentValues.map((argumentValue: ProtocolValue, index: number) => (
            <Fragment key={index}>
              <Inspector
                context="console"
                pauseId={uncaughtExceptionResult.pauseId}
                protocolValue={argumentValue}
              />
              {index < argumentValues.length - 1 && " "}
            </Fragment>
          ))}
        </Suspense>
      </span>
    ) : (
      <>" "</>
    );

  return showExpandable ? (
    <Expandable
      children={<StackRenderer frames={frames} stack={frames.map(({ frameId }) => frameId)} />}
      className={styles.Expandable}
      header={primaryContent}
      useBlockLayoutWhenExpanded={false}
    />
  ) : (
    primaryContent
  );
}

export default memo(UncaughtExceptionRenderer) as typeof UncaughtExceptionRenderer;
