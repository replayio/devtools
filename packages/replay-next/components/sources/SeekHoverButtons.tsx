import { TimeStampedPoint } from "@replayio/protocol";
import { MouseEvent, Suspense, useContext } from "react";

import Icon from "replay-next/components/Icon";
import { findLastHitPoint } from "replay-next/components/sources/utils/findLastHitPoint";
import { findNextHitPoint } from "replay-next/components/sources/utils/findNextHitPoints";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { hitPointsForLocationCache } from "replay-next/src/suspense/HitPointsCache";
import { Source } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { HitPointStatus, LineHitCounts } from "shared/client/types";
import { TOO_MANY_POINTS_TO_FIND } from "shared/constants";

import styles from "./SeekHoverButtons.module.css";

type Props = {
  lineHitCounts: LineHitCounts;
  lineNumber: number;
  source: Source;
};

type EventHandler = (event: MouseEvent) => void;

export function SeekHoverButtons(props: Props) {
  return (
    <Suspense fallback={<Buttons />}>
      <SuspendingComponent {...props} />
    </Suspense>
  );
}

function SuspendingComponent({ lineHitCounts, lineNumber, source }: Props) {
  const { rangeForSuspense: focusRange } = useContext(FocusContext);
  const replayClient = useContext(ReplayClientContext);
  const { executionPoint, update } = useContext(TimelineContext);

  let hitPoints: TimeStampedPoint[] | null = null;
  let hitPointStatus: HitPointStatus | null = null;
  if (lineHitCounts != null && lineHitCounts.count < TOO_MANY_POINTS_TO_FIND && focusRange) {
    const tuple = hitPointsForLocationCache.read(
      replayClient,
      { begin: focusRange.begin.point, end: focusRange.end.point },
      {
        column: lineHitCounts.firstBreakableColumnIndex,
        line: lineNumber,
        sourceId: source.id,
      },
      null
    );

    hitPoints = tuple[0];
    hitPointStatus = tuple[1];
  }

  let goToPrevPoint: undefined | EventHandler = undefined;
  let goToNextPoint: undefined | EventHandler = undefined;
  if (executionPoint && hitPoints !== null && hitPointStatus !== "too-many-points-to-find") {
    const prevTargetPoint = findLastHitPoint(hitPoints, executionPoint);
    if (prevTargetPoint) {
      goToPrevPoint = () => {
        const location = {
          column: lineHitCounts?.firstBreakableColumnIndex ?? 0,
          line: lineNumber,
          sourceId: source.id,
        };
        update(prevTargetPoint.time, prevTargetPoint.point, false, location);
      };
    }

    const nextTargetPoint = findNextHitPoint(hitPoints, executionPoint);
    if (nextTargetPoint) {
      goToNextPoint = () => {
        const location = {
          column: lineHitCounts?.firstBreakableColumnIndex ?? 0,
          line: lineNumber,
          sourceId: source.id,
        };
        update(nextTargetPoint.time, nextTargetPoint.point, false, location);
      };
    }
  }

  return <Buttons goToNextPoint={goToNextPoint} goToPrevPoint={goToPrevPoint} />;
}

function Buttons({
  goToNextPoint,
  goToPrevPoint,
}: {
  goToNextPoint?: EventHandler | undefined;
  goToPrevPoint?: EventHandler | undefined;
}) {
  return (
    <div className={styles.Buttons}>
      <button
        className={styles.Button}
        data-test-name="RewindButton"
        disabled={goToPrevPoint == null}
        onClick={goToPrevPoint}
      >
        <Icon className={styles.Icon} type="rewind" />
      </button>
      <button
        className={styles.Button}
        data-test-name="FastForwardButton"
        disabled={goToNextPoint == null}
        onClick={goToNextPoint}
      >
        <Icon className={styles.Icon} type="fast-forward" />
      </button>
    </div>
  );
}
