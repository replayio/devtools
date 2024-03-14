import { Location } from "@replayio/protocol";
import classNames from "classnames";
import { Fragment, useMemo, useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { Suspense, memo, useContext } from "react";

import { assert } from "protocol/utils";
import useConsoleContextMenu from "replay-next/components/console/useConsoleContextMenu";
import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import Icon from "replay-next/components/Icon";
import Inspector from "replay-next/components/inspector";
import ClientValueValueRenderer from "replay-next/components/inspector/values/ClientValueValueRenderer";
import Loader from "replay-next/components/Loader";
import { ConsoleFiltersContext } from "replay-next/src/contexts/ConsoleFiltersContext";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { InspectableTimestampedPointContext } from "replay-next/src/contexts/InspectorContext";
import { PointInstance } from "replay-next/src/contexts/points/types";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { getLogPointAnalysisResultSuspense } from "replay-next/src/suspense/LogPointAnalysisCache";
import { primitiveToClientValue } from "replay-next/src/utils/protocol";
import { formatTimestamp } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Badge } from "shared/client/types";
import { toPointRange } from "shared/utils/time";

import MessageHoverButton from "../MessageHoverButton";
import Source from "../Source";
import styles from "./shared.module.css";

const NEW_BADGE_THRESHOLD = 5_000;

// Renders PointInstances with logging enabled.
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

  const locations = useMemo<Location[]>(
    () => [logPointInstance.point.location],
    [logPointInstance.point]
  );

  const showNewBadgeFlash =
    Date.now() - logPointInstance.point.createdAt.getTime() < NEW_BADGE_THRESHOLD;

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
        <InlineErrorBoundary
          name="LogPointRenderer"
          fallback={<div className={styles.ErrorBoundaryFallback}>Something went wrong.</div>}
        >
          <Suspense key={logPointInstance.point.content} fallback={<Loader />}>
            <AnalyzedContent logPointInstance={logPointInstance} />
          </Suspense>
        </InlineErrorBoundary>
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
            <Source locations={locations} />
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
  const { rangeForSuspense: focusRange } = useContext(FocusContext);

  const { point, timeStampedHitPoint } = logPointInstance;

  const context = useMemo(
    () => ({
      executionPoint: timeStampedHitPoint.point,
      time: timeStampedHitPoint.time,
    }),
    [timeStampedHitPoint]
  );

  // if focusRange is null, the LoggablesContext won't create any logPointInstances
  // and hence LogPointRenderer won't be called
  assert(focusRange, "No focusRange in LogPointRenderer");
  const entry = getLogPointAnalysisResultSuspense(
    client,
    toPointRange(focusRange),
    timeStampedHitPoint,
    point.location,
    point.content,
    point.condition
  );

  const { failed, isRemote, pauseId, values } = entry;

  const children = failed ? (
    <span className={styles.Exception}>
      <Icon className={styles.ErrorIcon} type="error" />
      The expression could not be evaluated.
    </span>
  ) : isRemote ? (
    values.map((value, index) => (
      <Fragment key={index}>
        <Inspector context="console" pauseId={pauseId!} protocolValue={value} />
        {index < values.length - 1 && " "}
      </Fragment>
    ))
  ) : (
    values.map((value, index) => (
      <Fragment key={index}>
        <ClientValueValueRenderer context="console" clientValue={primitiveToClientValue(value)} />
        {index < values.length - 1 && " "}
      </Fragment>
    ))
  );

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
            data-test-name="LogpointBadge"
            data-test-badge={badge}
          />
        </span>
      );
      break;
    }
    case "unicorn":
      return (
        <span className={styles.UnicornBadge}>
          <span className={styles.Unicorn} data-test-name="LogpointBadge" data-test-badge={badge} />
        </span>
      );
    default:
      return (
        <span className={styles.BadgeContainer}>
          <span
            className={styles.ColorBadge}
            data-test-name="LogpointBadge"
            data-test-badge={badge}
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
