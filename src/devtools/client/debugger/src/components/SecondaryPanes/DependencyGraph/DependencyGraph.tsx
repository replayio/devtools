import { ExecutionPoint, Location } from "@replayio/protocol";
import { Suspense, useContext } from "react";

import { PanelLoader } from "replay-next/components/PanelLoader";
import { sourcesByIdCache, sourcesByUrlCache } from "replay-next/src/suspense/SourcesCache";
import { getSourceToDisplayForUrl } from "replay-next/src/utils/sources";
import { suspendInParallel } from "replay-next/src/utils/suspense";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { DependencyGraphMode } from "shared/client/types";
import { depGraphCache } from "ui/suspense/depGraphCache";

import { Item } from "./Item";
import styles from "./DependencyGraph.module.css";

type Props = {
  mode?: DependencyGraphMode;
  point: ExecutionPoint | undefined;
};

export function DependencyGraph(props: Props) {
  return (
    <Suspense fallback={<PanelLoader />}>
      <DependencyGraphSuspends {...props} />
    </Suspense>
  );
}

function DependencyGraphSuspends({ mode, point }: Props) {
  const replayClient = useContext(ReplayClientContext);

  const [depGraphValue, sourcesById, sourcesByUrl] = suspendInParallel(
    () => depGraphCache.read(replayClient, point ?? null, mode ?? null),
    () => sourcesByIdCache.read(replayClient),
    () => sourcesByUrlCache.read(replayClient)
  );

  const valueDescending = depGraphValue?.slice().reverse();

  return (
    <div className={styles.Panel}>
      {valueDescending?.map((entry, index) => {
        let location: Location | null = null;
        if ("calleeLocation" in entry && entry.calleeLocation != null) {
          const source = getSourceToDisplayForUrl(
            sourcesById,
            sourcesByUrl,
            entry.calleeLocation.url
          );
          if (source) {
            location = {
              ...entry.calleeLocation,
              sourceId: source.sourceId,
            };
          }
        }

        return (
          <Item
            key={index}
            location={location}
            name={entry.code}
            timeStampedPoint={
              entry.point != null && entry.time != null
                ? {
                    point: entry.point,
                    time: entry.time,
                  }
                : null
            }
          />
        );
      })}
    </div>
  );
}
