import { useContext, useMemo, useState } from "react";

import Icon from "replay-next/components/Icon";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import {
  isIndexedSource,
  shouldSourceBeDisplayed,
  sourcesCache,
} from "replay-next/src/suspense/SourcesCache";
import { protocolSourcesToSourceTree } from "replay-next/src/utils/protocol";
import { getSourceFileName } from "replay-next/src/utils/source";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./SourceExplorer.module.css";

export default function SourceExplorer() {
  const client = useContext(ReplayClientContext);
  const { openSource } = useContext(SourcesContext);

  const sources = sourcesCache.read(client).filter(shouldSourceBeDisplayed);
  const sourceTree = useMemo(() => protocolSourcesToSourceTree(sources), [sources]);

  // TODO Select on click, keyboard, expand/collapse folders
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  return (
    <div className={styles.List}>
      <div className={styles.Header}>Sources</div>
      <div className={styles.SourceTree}>
        {sourceTree.map((node, index) => {
          const isFocused = index === selectedIndex;

          switch (node.type) {
            case "origin": {
              return (
                <div
                  key={index}
                  className={isFocused ? styles.FocusedListItem : styles.ListItem}
                  onClick={() => setSelectedIndex(index)}
                >
                  <Icon className={styles.Icon} type="folder" />
                  {node.origin}
                </div>
              );
            }
            case "protocol": {
              return (
                <div
                  key={index}
                  className={isFocused ? styles.FocusedListItem : styles.ListItem}
                  onClick={() => setSelectedIndex(index)}
                >
                  <Icon className={styles.Icon} type="protocol" />
                  {node.protocol}
                </div>
              );
            }
            case "source": {
              const source = node.source;
              const { sourceId } = source;

              if (isIndexedSource(source)) {
                if (!source.doesContentHashChange && source.contentHashIndex > 0) {
                  return null;
                }
              }

              return (
                <div
                  key={index}
                  className={isFocused ? styles.FocusedListItem : styles.ListItem}
                  data-test-id={`SourceExplorerSource-${sourceId}`}
                  onClick={() => {
                    setSelectedIndex(index);
                    openSource("view-source", sourceId);
                  }}
                >
                  <Icon className={styles.Icon} type="document" />
                  {getSourceFileName(node.source, true)}
                </div>
              );
            }
          }
        })}
      </div>
    </div>
  );
}
