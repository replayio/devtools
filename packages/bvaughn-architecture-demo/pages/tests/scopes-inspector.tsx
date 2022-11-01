import { Suspense, useContext } from "react";

import Inspector from "bvaughn-architecture-demo/components/inspector";
import ScopesInspector from "bvaughn-architecture-demo/components/inspector/ScopesInspector";
import Loader from "bvaughn-architecture-demo/components/Loader";
import { getObjectWithPreviewSuspense } from "bvaughn-architecture-demo/src/suspense/ObjectPreviews";
import {
  evaluateSuspense,
  getPauseForExecutionPointSuspense,
} from "bvaughn-architecture-demo/src/suspense/PauseCache";
import { getClosestPointForTimeSuspense } from "bvaughn-architecture-demo/src/suspense/PointsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import createTest from "./utils/createTest";
import styles from "./styles.module.css";

const DEFAULT_RECORDING_ID = "9fd8381f-05e6-40c2-8b4f-59e40c2c3886";

function Scopes() {
  return (
    <div className={styles.Grid1Column}>
      <div className={styles.HorizontalContainer}>
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

  // This code is roughly approximating the shape of data from the Scopes panel.

  const { returned: globalValue } = evaluateSuspense(replayClient, pauseId, null, "globalValues");
  const { returned: windowValue } = evaluateSuspense(replayClient, pauseId, null, "window");

  const globalClientValue = getObjectWithPreviewSuspense(
    replayClient,
    pauseId,
    globalValue?.object!,
    true
  );

  const fakeScopeProperties = [
    { name: "<this>", object: windowValue!.object },
    ...globalClientValue!.preview!.properties!.sort((a, b) => a.name.localeCompare(b.name)),
  ];

  const fakeWindowScope = {
    name: "Window",
    object: windowValue!.object!,
  };

  return (
    <div className={styles.ScopesPanel}>
      <ScopesInspector name="Block" pauseId={pauseId} protocolValues={fakeScopeProperties} />
      <Inspector context="default" pauseId={pauseId} protocolValue={fakeWindowScope} />
    </div>
  );
}

export default createTest(Scopes, DEFAULT_RECORDING_ID);
