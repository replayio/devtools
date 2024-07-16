import { ExecutionPoint } from "@replayio/protocol";
import { Suspense, useContext } from "react";

import { PanelLoader } from "replay-next/components/PanelLoader";
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

  const depGraphValue = depGraphCache.read(replayClient, point ?? null, mode ?? null);
  const valueDescending = depGraphValue?.slice().reverse();

  return (
    <div className={styles.Panel}>
      {valueDescending?.map((entry, index) => (
        <Item
          key={index}
          isCurrent={index === 0}
          location={null}
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
      ))}
    </div>
  );
}
