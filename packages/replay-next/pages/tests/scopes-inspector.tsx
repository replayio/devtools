import { Suspense, useContext } from "react";

import Inspector from "replay-next/components/inspector";
import ScopesInspector from "replay-next/components/inspector/ScopesInspector";
import Loader from "replay-next/components/Loader";
import { getObjectWithPreviewSuspense } from "replay-next/src/suspense/ObjectPreviews";
import { evaluateSuspense, getPauseIdSuspense } from "replay-next/src/suspense/PauseCache";
import { getClosestPointForTimeSuspense } from "replay-next/src/suspense/PointsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import createTest from "./utils/createTest";
import styles from "./styles.module.css";

const DEFAULT_RECORDING_ID = "b1849642-40a3-445c-96f8-4bcd2c35586e";

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

  const time = 1000;
  const point = getClosestPointForTimeSuspense(replayClient, time);
  const pauseId = getPauseIdSuspense(replayClient, point, time);

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
