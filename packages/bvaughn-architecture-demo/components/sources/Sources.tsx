import Loader from "@bvaughn/components/Loader";
import { SessionContext } from "@bvaughn/src/contexts/SessionContext";
import { getSource } from "@bvaughn/src/suspense/SourcesCache";
import { SourceId as ProtocolSourceId } from "@replayio/protocol";
import { Suspense, useContext, useState } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";
import LazyOffscreen from "../LazyOffscreen";

import Source from "./Source";
import styles from "./Sources.module.css";

export default function Sources() {
  const { sourceIds } = useContext(SessionContext);
  const client = useContext(ReplayClientContext);

  const sourcesIdsToDisplay = getSourcesIdsToDisplay(client, sourceIds);

  const [selectedSourceId, setSelectedSourceId] = useState<string | undefined>(
    sourcesIdsToDisplay[0]
  );

  return (
    <div className={styles.Sources} data-test-id="SourcesRoot">
      <div className={styles.Tabs}>
        {sourcesIdsToDisplay.map(sourceId => {
          const source = getSource(client, sourceId);
          const fileName = source?.url?.split("/")?.pop();
          return (
            <button
              key={sourceId}
              className={sourceId === selectedSourceId ? styles.SelectedTab : styles.Tab}
              onClick={() => setSelectedSourceId(sourceId)}
            >
              {fileName}
            </button>
          );
        })}
      </div>
      <div className={styles.Content}>
        {sourcesIdsToDisplay.map(sourceId => {
          const source = getSource(client, sourceId);
          return (
            <LazyOffscreen
              key={sourceId}
              mode={sourceId === selectedSourceId ? "visible" : "hidden"}
            >
              <Suspense fallback={<Loader />}>
                <Source source={source!} sourceId={sourceId} />
              </Suspense>
            </LazyOffscreen>
          );
        })}
      </div>
    </div>
  );
}

function getSourcesIdsToDisplay(
  client: ReplayClientInterface,
  sourceIds: ProtocolSourceId[]
): ProtocolSourceId[] {
  return sourceIds.filter(sourceId => {
    const source = getSource(client, sourceId);
    return source != null && source.kind !== "inlineScript";
  });
}
