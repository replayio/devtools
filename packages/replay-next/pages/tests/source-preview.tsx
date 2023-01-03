import { Suspense, useContext } from "react";

import { ReplayClientContext } from "shared/client/ReplayClientContext";

import createTest from "./utils/createTest";
import styles from "./styles.module.css";

import SourcePreviewInspector from "replay-next/components/inspector/SourcePreviewInspector";
import Loader from "replay-next/components/Loader";
import { getObjectWithPreviewSuspense } from "replay-next/src/suspense/ObjectPreviews";
import { evaluateSuspense, getPauseIdSuspense } from "replay-next/src/suspense/PauseCache";
import { getClosestPointForTimeSuspense } from "replay-next/src/suspense/PointsCache";

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
  const time = 1000;
  const point = getClosestPointForTimeSuspense(replayClient, time);
  const pauseId = getPauseIdSuspense(replayClient, point, time);
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
