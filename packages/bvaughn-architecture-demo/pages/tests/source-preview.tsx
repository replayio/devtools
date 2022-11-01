import SourcePreviewInspector from "bvaughn-architecture-demo/components/inspector/SourcePreviewInspector";
import Loader from "bvaughn-architecture-demo/components/Loader";
import { getObjectWithPreviewSuspense } from "bvaughn-architecture-demo/src/suspense/ObjectPreviews";
import {
  evaluateSuspense,
  getPauseForExecutionPointSuspense,
} from "bvaughn-architecture-demo/src/suspense/PauseCache";
import { getClosestPointForTimeSuspense } from "bvaughn-architecture-demo/src/suspense/PointsCache";
import { Suspense, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./styles.module.css";
import createTest from "./utils/createTest";

const DEFAULT_RECORDING_ID = "9fd8381f-05e6-40c2-8b4f-59e40c2c3886";

function SourcePreview() {
  return (
    <div className={styles.Grid1Column}>
      <div className={styles.Block}>
        <Suspense fallback={<Loader />}>
          <Suspender />
        </Suspense>
      </div>
    </div>
  );
}

function Suspender() {
  const replayClient = useContext(ReplayClientContext);
  const point = getClosestPointForTimeSuspense(replayClient, 1000);
  const { pauseId } = getPauseForExecutionPointSuspense(replayClient, point);
  const { returned } = evaluateSuspense(replayClient, pauseId, null, "globalValues");

  const objectWithPreview = getObjectWithPreviewSuspense(replayClient, pauseId, returned!.object!);
  return (
    <>
      {objectWithPreview.preview!.properties!.map(property => (
        <SourcePreviewInspector
          key={property.name}
          className={styles.Box}
          pauseId={pauseId}
          protocolValue={property}
        />
      ))}
    </>
  );
}

export default createTest(SourcePreview, DEFAULT_RECORDING_ID);
