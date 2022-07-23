import ClientValueValueRenderer from "@bvaughn/components/inspector/values/ClientValueValueRenderer";
import KeyValueRenderer from "@bvaughn/components/inspector/KeyValueRenderer";
import Loader from "@bvaughn/components/Loader";
import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { PointInstance } from "@bvaughn/src/contexts/PointsContext";
import { runAnalysis } from "@bvaughn/src/suspense/AnalysisCache";
import { primitiveToClientValue } from "@bvaughn/src/utils/protocol";
import { formatTimestamp } from "@bvaughn/src/utils/time";
import { useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { memo, Suspense, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import MessageHoverButton from "../MessageHoverButton";
import Source from "../Source";

import styles from "./shared.module.css";
import { ExecutionPoint } from "@replayio/protocol";
import { getClosestPointForTime } from "@bvaughn/src/suspense/PointsCache";

// Renders PointInstances with enableLogging=true.
function LogPointRenderer({
  isFocused,
  logPointInstance,
}: {
  isFocused: boolean;
  logPointInstance: PointInstance;
}) {
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {primaryContent}
      <MessageHoverButtonWithWithPause
        executionPoint={logPointInstance.timeStampedHitPoint.point}
        isHovered={isHovered}
        targetRef={ref}
        time={logPointInstance.timeStampedHitPoint.time}
      />
    </div>
  );
}

function MessageHoverButtonWithWithPause({
  executionPoint,
  isHovered,
  targetRef,
  time,
}: {
  executionPoint: ExecutionPoint;
  isHovered: boolean;
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
      pauseId={pauseId}
      showAddCommentButton={false}
      targetRef={targetRef}
      time={time}
    />
  );
}

function AnalyzedContent({ logPointInstance }: { logPointInstance: PointInstance }) {
  const client = useContext(ReplayClientContext);

  const { isRemote, pauseId, values } = runAnalysis(
    client,
    logPointInstance.point.location,
    logPointInstance.timeStampedHitPoint,
    logPointInstance.point.content
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

  return <>{children}</>;
}

export default memo(LogPointRenderer) as typeof LogPointRenderer;
