import classNames from "classnames";
import { Fragment, MouseEvent, useMemo, useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { Suspense, memo, useContext } from "react";

import useConsoleContextMenu from "bvaughn-architecture-demo/components/console/useConsoleContextMenu";
import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import Inspector from "bvaughn-architecture-demo/components/inspector";
import ClientValueValueRenderer from "bvaughn-architecture-demo/components/inspector/values/ClientValueValueRenderer";
import Loader from "bvaughn-architecture-demo/components/Loader";
import { ConsoleFiltersContext } from "bvaughn-architecture-demo/src/contexts/ConsoleFiltersContext";
import { FocusContext } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import { InspectableTimestampedPointContext } from "bvaughn-architecture-demo/src/contexts/InspectorContext";
import { PointInstance } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { TimelineContext } from "bvaughn-architecture-demo/src/contexts/TimelineContext";
import { runAnalysisSuspense } from "bvaughn-architecture-demo/src/suspense/AnalysisCache";
import { primitiveToClientValue } from "bvaughn-architecture-demo/src/utils/protocol";
import { formatTimestamp } from "bvaughn-architecture-demo/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Badge } from "shared/client/types";

import MessageHoverButton from "../MessageHoverButton";
import Source from "../Source";
import styles from "./shared.module.css";

const NEW_BADGE_THRESHOLD = 5_000;

// Renders PointInstances with shouldLog=true.
function LogPointRenderer({
  index,
  isFocused,
  logPointInstance,
}: {
  index: number;
  isFocused: boolean;
  logPointInstance: PointInstance;
}) {
  const { showTimestamps } = useContext(ConsoleFiltersContext);
  const { executionPoint: currentExecutionPoint } = useContext(TimelineContext);

  const { contextMenu, onContextMenu } = useConsoleContextMenu(logPointInstance);

  const ref = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  useLayoutEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isFocused]);

  let className = styles.Row;
  if (isFocused) {
    className = `${className} ${styles.Focused}`;
  }

  const locations = useMemo(
    () => [logPointInstance.point.location],
    [logPointInstance.point.location]
  );

  const showNewBadgeFlash = Date.now() - logPointInstance.point.createdAtTime < NEW_BADGE_THRESHOLD;

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
      <span className={styles.LogContents} data-test-name="LogContents">
        <BadgeRenderer badge={logPointInstance.point.badge} showNewBadgeFlash={showNewBadgeFlash} />
        <ErrorBoundary
          fallback={<div className={styles.ErrorBoundaryFallback}>Something went wrong.</div>}
        >
          <Suspense key={logPointInstance.point.content} fallback={<Loader />}>
            <AnalyzedContent logPointInstance={logPointInstance} />
          </Suspense>
        </ErrorBoundary>
      </span>
    </>
  );

  return (
    <>
      <div
        ref={ref}
        className={className}
        data-search-index={index}
        data-test-message-type="log-point"
        data-test-paused-here={logPointInstance.timeStampedHitPoint.point === currentExecutionPoint}
        data-test-name="Message"
        onContextMenu={onContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="listitem"
      >
        <span className={styles.Source}>
          <Suspense fallback={<Loader />}>
            {locations.length > 0 && <Source locations={locations} />}
          </Suspense>
        </span>
        {primaryContent}
        {isHovered && (
          <MessageHoverButton
            executionPoint={logPointInstance.timeStampedHitPoint.point}
            locations={locations}
            showAddCommentButton={true}
            time={logPointInstance.timeStampedHitPoint.time}
          />
        )}
      </div>
      {contextMenu}
    </>
  );
}

function AnalyzedContent({ logPointInstance }: { logPointInstance: PointInstance }) {
  const client = useContext(ReplayClientContext);
  const { range: focusRange } = useContext(FocusContext);

  const { point, timeStampedHitPoint } = logPointInstance;

  const pointRange = focusRange
    ? { begin: focusRange.begin.point, end: focusRange.end.point }
    : null;

  const analysisResults = runAnalysisSuspense(
    client,
    pointRange,
    point.location,
    point.content,
    point.condition
  );

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
          <Inspector context="console" pauseId={pauseId!} protocolValue={value} />
          {index < values.length - 1 && " "}
        </Fragment>
      ))
    : values.map((value, index) => (
        <Fragment key={index}>
          <ClientValueValueRenderer context="console" clientValue={primitiveToClientValue(value)} />
          {index < values.length - 1 && " "}
        </Fragment>
      ));

  return (
    <InspectableTimestampedPointContext.Provider value={context}>
      {children}
    </InspectableTimestampedPointContext.Provider>
  );
}

function BadgeRenderer({
  badge,
  showNewBadgeFlash,
}: {
  badge: Badge | null;
  showNewBadgeFlash: boolean;
}) {
  switch (badge) {
    case null: {
      return (
        <span className={styles.BadgeContainer}>
          <span
            className={classNames(
              styles.DefaultColorBadge,
              showNewBadgeFlash && styles.PulsingBadge
            )}
          />
        </span>
      );
      break;
    }
    case "unicorn":
      return (
        <span className={styles.UnicornBadge}>
          <span className={styles.Unicorn} />
        </span>
      );
    default:
      return (
        <span className={styles.BadgeContainer}>
          <span
            className={styles.ColorBadge}
            style={{
              // @ts-ignore
              "--badge-color": `var(--badge-${badge}-color)`,
            }}
          />
        </span>
      );
  }
}

export default memo(LogPointRenderer) as typeof LogPointRenderer;
