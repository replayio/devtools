import ClientValueValueRenderer from "@bvaughn/components/inspector/values/ClientValueValueRenderer";
import KeyValueRenderer from "@bvaughn/components/inspector/KeyValueRenderer";
import Loader from "@bvaughn/components/Loader";
import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { InspectableTimestampedPointContext } from "@bvaughn/src/contexts/InspectorContext";
import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { Badge, PointInstance } from "@bvaughn/src/contexts/PointsContext";
import { runAnalysis } from "@bvaughn/src/suspense/AnalysisCache";
import { getClosestPointForTime } from "@bvaughn/src/suspense/PointsCache";
import { primitiveToClientValue } from "@bvaughn/src/utils/protocol";
import { formatTimestamp } from "@bvaughn/src/utils/time";
import { ExecutionPoint, Location } from "@replayio/protocol";
import { MouseEvent, useMemo, useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { memo, Suspense, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { ConsoleContextMenuContext } from "../ConsoleContextMenuContext";
import MessageHoverButton from "../MessageHoverButton";
import Source from "../Source";

import styles from "./shared.module.css";

// Renders PointInstances with enableLogging=true.
function LogPointRenderer({
  isFocused,
  logPointInstance,
}: {
  isFocused: boolean;
  logPointInstance: PointInstance;
}) {
  const { show } = useContext(ConsoleContextMenuContext);
  const { showTimestamps } = useContext(ConsoleFiltersContext);

  const ref = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  const { executionPoint: currentExecutionPoint } = useContext(TimelineContext);

  useLayoutEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isFocused]);

  let className = styles.Row;
  if (isFocused) {
    className = `${className} ${styles.Focused}`;
  }

  if (currentExecutionPoint === logPointInstance.timeStampedHitPoint.point) {
    className = `${className} ${styles.CurrentlyPausedAt}`;
  }

  const showContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    show(logPointInstance, { x: event.pageX, y: event.pageY });
  };

  const primaryContent = (
    <div
      className={
        showTimestamps ? styles.PrimaryRowWithTimestamps : styles.PrimaryRowWithoutTimestamps
      }
    >
      {showTimestamps && (
        <span className={styles.TimeStamp}>
          {formatTimestamp(logPointInstance.timeStampedHitPoint.time, true)}
        </span>
      )}
      <div className={styles.LogContents}>
        {logPointInstance.point.badge && <BadgeRenderer badge={logPointInstance.point.badge} />}
        <Suspense fallback={<Loader />}>
          <AnalyzedContent logPointInstance={logPointInstance} />
        </Suspense>
      </div>
      <Suspense fallback={<Loader />}>
        <div className={styles.Source}>
          {location && <Source location={logPointInstance.point.location} />}
        </div>
      </Suspense>
    </div>
  );

  return (
    <div
      ref={ref}
      className={className}
      data-test-name="Message"
      role="listitem"
      onContextMenu={showContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {primaryContent}
      <MessageHoverButtonWithWithPause
        executionPoint={logPointInstance.timeStampedHitPoint.point}
        isHovered={isHovered}
        location={logPointInstance.point.location}
        targetRef={ref}
        time={logPointInstance.timeStampedHitPoint.time}
      />
    </div>
  );
}

function MessageHoverButtonWithWithPause({
  executionPoint,
  isHovered,
  location,
  targetRef,
  time,
}: {
  executionPoint: ExecutionPoint;
  isHovered: boolean;
  location: Location;
  targetRef: React.RefObject<HTMLDivElement>;
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
      targetRef={targetRef}
      time={time}
    />
  );
}

function AnalyzedContent({ logPointInstance }: { logPointInstance: PointInstance }) {
  const client = useContext(ReplayClientContext);

  const { point, timeStampedHitPoint } = logPointInstance;

  const { isRemote, pauseId, values } = runAnalysis(
    client,
    point.location,
    timeStampedHitPoint,
    point.content
  );

  const context = useMemo(
    () => ({
      executionPoint: timeStampedHitPoint.point,
      time: timeStampedHitPoint.time,
    }),
    [timeStampedHitPoint]
  );

  const children = isRemote
    ? values.map((value, index) => (
        <KeyValueRenderer
          key={index}
          isNested={false}
          layout="horizontal"
          pauseId={pauseId!}
          protocolValue={value}
        />
      ))
    : values.map((value, index) => (
        <ClientValueValueRenderer
          key={index}
          clientValue={primitiveToClientValue(value)}
          isNested={false}
        />
      ));

  return (
    <InspectableTimestampedPointContext.Provider value={context}>
      {children}
    </InspectableTimestampedPointContext.Provider>
  );
}

function BadgeRenderer({ badge }: { badge: Badge }) {
  switch (badge) {
    case "unicorn":
      return <div className={styles.UnicornBadge} />;
      break;
    default:
      return (
        <div
          className={styles.ColorBadge}
          style={{
            // @ts-ignore
            "--badge-color": `var(--badge-${badge}-color)`,
          }}
        />
      );
  }
}

export default memo(LogPointRenderer) as typeof LogPointRenderer;
