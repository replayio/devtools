import { Suspense, useContext } from "react";

import SourcePreviewInspector from "replay-next/components/inspector/SourcePreviewInspector";
import Loader from "replay-next/components/Loader";
import { SourcesContextRoot } from "replay-next/src/contexts/SourcesContext";
import { getClosestPointForTimeSuspense } from "replay-next/src/suspense/ExecutionPointsCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { pauseEvaluationsCache, pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import createTest from "./utils/createTest";
import styles from "./styles.module.css";

const DEFAULT_RECORDING_ID = "b1849642-40a3-445c-96f8-4bcd2c35586e";

function SourcePreview() {
  return (
    <SourcesContextRoot>
      <div className={styles.Grid1Column}>
        <div className={styles.Block}>
          <Suspense fallback={<Loader />}>
            <Suspender />
          </Suspense>
        </div>
      </div>
    </SourcesContextRoot>
  );
}

function Suspender() {
  const replayClient = useContext(ReplayClientContext);
  const time = 1000;
  const point = getClosestPointForTimeSuspense(replayClient, time);
  const pauseId = pauseIdCache.read(replayClient, point, time);
  const { returned } = pauseEvaluationsCache.read(
    replayClient,
    pauseId,
    null,
    "globalValues",
    undefined
  );

  const objectWithPreview = objectCache.read(
    replayClient,
    pauseId,
    returned!.object!,
    "canOverflow"
  );
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
