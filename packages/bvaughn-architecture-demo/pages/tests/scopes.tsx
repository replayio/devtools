import Inspector from "@bvaughn/components/inspector";
import Loader from "@bvaughn/components/Loader";
import { evaluate, getPauseForExecutionPoint } from "@bvaughn/src/suspense/PauseCache";
import { getClosestPointForTime } from "@bvaughn/src/suspense/PointsCache";
import { NamedValue } from "@replayio/protocol";
import { Suspense, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./styles.module.css";
import createTest from "./utils/createTest";

const DEFAULT_RECORDING_ID = "bd42974e-7751-4179-b114-53b3d2779778";

function Scopes() {
  return (
    <div className={styles.Grid1Column}>
      <div className={styles.VerticalContainer}>
        <Suspense fallback={<Loader />}>
          <Suspender />
        </Suspense>
      </div>
    </div>
  );
}

function Suspender() {
  const replayClient = useContext(ReplayClientContext);
  const point = getClosestPointForTime(replayClient, 1000);
  const { pauseId } = getPauseForExecutionPoint(replayClient, point);
  const { returned } = evaluate(replayClient, pauseId, null, "globalValues");

  const namedValue: NamedValue = {
    name: "globalValues",
    ...returned,
  };

  return <Inspector context="default" pauseId={pauseId} protocolValue={namedValue} />;
}

export default createTest(Scopes, DEFAULT_RECORDING_ID);
