import { TimeStampedPoint } from "@replayio/protocol";

import { PointPanelWithHitPoints } from "replay-next/components/sources/log-point-panel/LogPointPanel";
import { Point } from "shared/client/types";

import styles from "./LogPointPanelDoubleBuffer.module.css";

export function LogPointPanelDoubleBuffer({ sourceId }: { sourceId: string }) {
  return (
    <div
      className={styles.LogPointPanelDoubleBuffer}
      data-test-id={`PointPanel-DoubleBuffer-${sourceId}`}
      data-test-name="PointPanel-DoubleBuffer"
    >
      <PointPanelWithHitPoints
        className=""
        enterFocusMode={noop}
        hitPoints={EMPTY_HIT_POINTS}
        hitPointStatus={null}
        pointForSuspense={EMPTY_POINT}
        pointWithPendingEdits={EMPTY_POINT}
        setFocusToBeginning={noop}
        setFocusToEnd={noop}
      />
    </div>
  );
}

function noop() {}

const EMPTY_HIT_POINTS = [] as TimeStampedPoint[];

const EMPTY_POINT: Point = {
  badge: null,
  condition: "fake",
  content: "fake",
  createdAt: new Date(),
  key: "fake",
  location: {
    column: 0,
    line: 0,
    sourceId: "fake",
  },
  recordingId: "fake",
  user: null,
};
