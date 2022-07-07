import ClientValueValueRenderer from "@bvaughn/components/inspector/values/ClientValueValueRenderer";
import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import KeyValueRenderer from "@bvaughn/components/inspector/KeyValueRenderer";
import Loader from "@bvaughn/components/Loader";
import { LogPointInstance } from "@bvaughn/src/contexts/LogPointsContext";
import { PauseContext } from "@bvaughn/src/contexts/PauseContext";
import { runAnalysis } from "@bvaughn/src/suspense/AnalysisCache";
import { primitiveToClientValue } from "@bvaughn/src/utils/protocol";
import { useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { memo, Suspense, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./LogPointInstanceRenderer.module.css";
import MessageHoverButton from "./MessageHoverButton";
import Source from "./Source";
import { formatTimestamp } from "@bvaughn/src/utils/time";

function LogPointInstanceRenderer({
  isFocused,
  logPointInstance,
}: {
  isFocused: boolean;
  logPointInstance: LogPointInstance;
}) {
  const client = useContext(ReplayClientContext);
  const { showTimestamps } = useContext(ConsoleFiltersContext);

  const ref = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  const { pauseId: currentPauseId } = useContext(PauseContext);

  useLayoutEffect(() => {
    if (isFocused) {
      ref.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isFocused]);

  const { isRemote, pauseId, values } = runAnalysis(
    client,
    logPointInstance.point.location,
    logPointInstance.timeStampedHitPoint,
    logPointInstance.point.content
  );

  let className = styles.LogPointRow;
  if (isFocused) {
    className = `${className} ${styles.Focused}`;
  }

  if (currentPauseId === pauseId) {
    className = `${className} ${styles.CurrentlyPausedAt}`;
  }

  const contents = isRemote
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

  const primaryContent = (
    <div className={styles.PrimaryRow}>
      {showTimestamps && (
        <span className={styles.TimeStamp}>
          {formatTimestamp(logPointInstance.timeStampedHitPoint.time, true)}
        </span>
      )}
      <div className={styles.LogContents}>{contents}</div>
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
      {isHovered && (
        <MessageHoverButton
          pauseId={pauseId}
          showAddCommentButton={false}
          targetRef={ref}
          timeStampedPoint={logPointInstance.timeStampedHitPoint}
        />
      )}
    </div>
  );
}

export default memo(LogPointInstanceRenderer) as typeof LogPointInstanceRenderer;
