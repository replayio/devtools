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
import useFocusRange from "../hooks/useFocusRange";
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
          {formatTimestamp(logPointInstance.timeStampedHitPoint.time, true)}{" "}
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
      {primaryContent}
      <MessageHoverButtonWithWithPause
        executionPoint={logPointInstance.timeStampedHitPoint.point}
        isHovered={isHovered}
        location={logPointInstance.point.location}
        time={logPointInstance.timeStampedHitPoint.time}
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

function AnalyzedContent({ logPointInstance }: { logPointInstance: PointInstance }) {
  const client = useContext(ReplayClientContext);
  const focusRange = useFocusRange();

  const { point, timeStampedHitPoint } = logPointInstance;

  const analysisResults = runAnalysis(client, focusRange, point.location, point.content);

  const context = useMemo(
    () => ({
      executionPoint: timeStampedHitPoint.point,
      time: timeStampedHitPoint.time,
    }),
    [timeStampedHitPoint]
  );

  const entry = analysisResults(timeStampedHitPoint);
  if (entry === null) {
    console.error(`No analysis results found for execution point "${timeStampedHitPoint.point}"`);

    return <span className={styles.AnalysisError}>Analysis error</span>;
  }

  const { isRemote, pauseId, values } = entry;

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
