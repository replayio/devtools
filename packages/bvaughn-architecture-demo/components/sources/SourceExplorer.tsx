import Icon from "bvaughn-architecture-demo/components/Icon";
import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getSourcesToDisplay, isIndexedSource } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import { protocolSourcesToSourceTree } from "bvaughn-architecture-demo/src/utils/protocol";
import { getSourceFileName } from "bvaughn-architecture-demo/src/utils/source";
import { useContext, useMemo, useState } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./SourceExplorer.module.css";

export default function SourceExplorer() {
  const client = useContext(ReplayClientContext);
  const { openSource } = useContext(SourcesContext);

  const sources = getSourcesToDisplay(client);
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
                    openSource(sourceId);
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
