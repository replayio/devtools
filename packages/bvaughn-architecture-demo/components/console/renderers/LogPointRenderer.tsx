import ClientValueValueRenderer from "@bvaughn/components/inspector/values/ClientValueValueRenderer";
import KeyValueRenderer from "@bvaughn/components/inspector/KeyValueRenderer";
import Loader from "@bvaughn/components/Loader";
import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { InspectableTimestampedPointContext } from "@bvaughn/src/contexts/InspectorContext";
import { Badge, PointInstance } from "@bvaughn/src/contexts/PointsContext";
import { runAnalysis } from "@bvaughn/src/suspense/AnalysisCache";
import { getClosestPointForTime } from "@bvaughn/src/suspense/PointsCache";
import { primitiveToClientValue } from "@bvaughn/src/utils/protocol";
import { formatTimestamp } from "@bvaughn/src/utils/time";
import { ExecutionPoint, Location } from "@replayio/protocol";
import { Fragment, MouseEvent, useMemo, useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { memo, Suspense, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { ConsoleContextMenuContext } from "../ConsoleContextMenuContext";
import MessageHoverButton from "../MessageHoverButton";
import Source from "../Source";

import styles from "./shared.module.css";

// Renders PointInstances with enableLogging=true.
function LogPointRenderer({
  index,
  isFocused,
  logPointInstance,
}: {
  index: number;
  isFocused: boolean;
  logPointInstance: PointInstance;
}) {
  const { show } = useContext(ConsoleContextMenuContext);
  const { showTimestamps } = useContext(ConsoleFiltersContext);

  const ref = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  useLayoutEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isFocused]);

  let className = styles.Row;
  if (isFocused) {
    className = `${className} ${styles.Focused}`;
  }

  const showContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    show(logPointInstance, { x: event.pageX, y: event.pageY });
  };

  const location = logPointInstance.point.location;

  // Note the Suspense key below is set to the log point expression's content/code.
  // This causes the Suspense boundary to immediately show a fallback state when content is edited,
  // rather than the default React behavior of updating in the background.
  // While that behavior is good for most scenarios, it makes log point edits feel sluggish.
  const primaryContent = (
    <>
      {showTimestamps && (
        <span className={styles.TimeStamp}>
          {formatTimestamp(logPointInstance.timeStampedHitPoint.time, true)}
        </span>
      )}
      <span className={styles.LogContents}>
        {logPointInstance.point.badge && <BadgeRenderer badge={logPointInstance.point.badge} />}
        <Suspense key={logPointInstance.point.content} fallback={<Loader />}>
          <AnalyzedContent logPointInstance={logPointInstance} />
        </Suspense>
      </span>
    </>
  );

  return (
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
      {primaryContent}
      <MessageHoverButtonWithWithPause
        executionPoint={logPointInstance.timeStampedHitPoint.point}
        isHovered={isHovered}
        location={logPointInstance.point.location}
        targetRef={ref}
        time={logPointInstance.timeStampedHitPoint.time}
      />
    </span>
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

  const analysisResults = runAnalysis(client, point.location, point.content);

  const entry = analysisResults(timeStampedHitPoint);
  if (entry === null) {
    throw Error(`No analysis results found for ${timeStampedHitPoint}`);
  }

  const { isRemote, pauseId, values } = entry;

  const context = useMemo(
    () => ({
      executionPoint: timeStampedHitPoint.point,
      time: timeStampedHitPoint.time,
    }),
    [timeStampedHitPoint]
  );

  const children = isRemote
    ? values.map((value, index) => (
        <Fragment key={index}>
          <KeyValueRenderer
            isNested={false}
            layout="horizontal"
            pauseId={pauseId!}
            protocolValue={value}
          />
          {index < values.length - 1 && " "}
        </Fragment>
      ))
    : values.map((value, index) => (
        <Fragment key={index}>
          <ClientValueValueRenderer clientValue={primitiveToClientValue(value)} isNested={false} />
          {index < values.length - 1 && " "}
        </Fragment>
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
      return <span className={styles.UnicornBadge} />;
      break;
    default:
      return (
        <span
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
