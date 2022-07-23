import Icon from "@bvaughn/components/Icon";
import { SourcesContext } from "@bvaughn/src/contexts/SourcesContext";
import { getSourcesToDisplay } from "@bvaughn/src/suspense/SourcesCache";
import { protocolSourcesToSourceTree } from "@bvaughn/src/utils/protocol";
import { newSource as Source, SourceId } from "@replayio/protocol";
import { useContext, useMemo, useState } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./SourceExplorer.module.css";

export default function SourceExplorer() {
  const client = useContext(ReplayClientContext);
  const { focusedSourceId, openSource } = useContext(SourcesContext);

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
              const sourceId = node.source.sourceId;
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
                  {node.path}
                </div>
              );
            }
          }
        })}
      </div>
    </div>
  );
}
