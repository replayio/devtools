import Inspector from "@bvaughn/components/inspector";
import Loader from "@bvaughn/components/Loader";
import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import Expandable from "@bvaughn/components/Expandable";
import { UncaughtException } from "@bvaughn/src/suspense/AnalysisCache";
import { getClosestPointForTime } from "@bvaughn/src/suspense/PointsCache";
import { formatTimestamp } from "@bvaughn/src/utils/time";
import { ExecutionPoint, Location, Value as ProtocolValue } from "@replayio/protocol";
import { Fragment, MouseEvent, useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { memo, Suspense, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { ConsoleContextMenuContext } from "../ConsoleContextMenuContext";
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
  const { show } = useContext(ConsoleContextMenuContext);
  const { showTimestamps } = useContext(ConsoleFiltersContext);

  const location = Array.isArray(uncaughtException.location)
    ? uncaughtException.location[0]
    : uncaughtException.location;

  const ref = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  useLayoutEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isFocused]);

  let className = styles.ErrorRow;
  if (isFocused) {
    className = `${className} ${styles.Focused}`;
  }

  const showContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    show(uncaughtException, { x: event.pageX, y: event.pageY });
  };

  const frames = uncaughtException.data.frames || EMPTY_ARRAY;
  const showExpandable = frames.length > 0;

  const argumentValues = uncaughtException.values || EMPTY_ARRAY;
  const primaryContent = (
    <>
      {showTimestamps && (
        <span className={styles.TimeStamp}>{formatTimestamp(uncaughtException.time, true)} </span>
      )}
      <span className={styles.LogContents}>
        <Suspense fallback={<Loader />}>
          {argumentValues.map((argumentValue: ProtocolValue, index: number) => (
            <Fragment key={index}>
              <Inspector pauseId={uncaughtException.pauseId} protocolValue={argumentValue} />
              {index < argumentValues.length - 1 && " "}
            </Fragment>
          ))}
        </Suspense>
      </span>
    </>
  );

  return (
    <div
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
          children={<StackRenderer frames={frames} stack={frames.map(({ frameId }) => frameId)} />}
          className={styles.Expandable}
          header={primaryContent}
          useBlockLayoutWhenExpanded={false}
        />
      ) : (
        primaryContent
      )}
      <MessageHoverButtonWithWithPause
        executionPoint={uncaughtException.point}
        isHovered={isHovered}
        location={location}
        time={uncaughtException.time}
      />
    </div>
  );
}

function MessageHoverButtonWithWithPause({
  executionPoint,
  isHovered,
  location,
  time,
}: {
  executionPoint: ExecutionPoint;
  isHovered: boolean;
  location: Location;
  time: number;
}) {
  const client = useContext(ReplayClientContext);

  // Events don't have pause IDs, just execution points.
  // So we need to load the nearest one before we can seek to it.
  const pauseId = getClosestPointForTime(client, time);

  if (!isHovered) {
    return null;
  }

  return (
    <MessageHoverButton
      executionPoint={executionPoint}
      location={location}
      pauseId={pauseId}
      showAddCommentButton={false}
      time={time}
    />
  );
}

export default memo(UncaughtExceptionRenderer) as typeof UncaughtExceptionRenderer;
