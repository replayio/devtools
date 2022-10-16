import Loader from "@bvaughn/components/Loader";
import { SourcesContext } from "@bvaughn/src/contexts/SourcesContext";
import { getSource } from "@bvaughn/src/suspense/SourcesCache";
import { getSourceFileName } from "@bvaughn/src/utils/source";
import { Suspense, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import Icon from "../Icon";
import LazyOffscreen from "../LazyOffscreen";

import Source from "./Source";
import styles from "./Sources.module.css";

export default function Sources() {
  const { closeSource, focusedSourceId, openSource, openSourceIds } = useContext(SourcesContext);
  const client = useContext(ReplayClientContext);

  return (
    <div className={styles.Sources} data-test-id="SourcesRoot">
      <div className={styles.Tabs}>
        {openSourceIds.map(sourceId => {
          const source = getSource(client, sourceId);
          const fileName = (source && getSourceFileName(source, true)) || "unknown";
          return (
            <div
              key={sourceId}
              className={sourceId === focusedSourceId ? styles.SelectedTab : styles.Tab}
              data-test-id={`SourceTab-${sourceId}`}
            >
              <button className={styles.OpenButton} onClick={() => openSource(sourceId)}>
                {fileName}
              </button>
              <button className={styles.CloseButton} onClick={() => closeSource(sourceId)}>
                <Icon className={styles.Icon} type="close" />
              </button>
            </div>
          );
        })}
      </div>
      <div className={styles.Content}>
        {openSourceIds.length === 0 && <div className={styles.NoOpenSources}>Sources</div>}
        {openSourceIds.map(sourceId => {
          const source = getSource(client, sourceId);
          return (
            <LazyOffscreen
              key={sourceId}
              mode={sourceId === focusedSourceId ? "visible" : "hidden"}
            >
              <Suspense fallback={<Loader />}>
                <Source source={source!} />
              </Suspense>
            </LazyOffscreen>
          );
        })}
      </div>
    </div>
  );
}
