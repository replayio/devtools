import Icon from "@bvaughn/components/Icon";
import { getSourcesToDisplay } from "@bvaughn/src/suspense/SourcesCache";
import { protocolSourcesToSourceTree } from "@bvaughn/src/utils/protocol";
import { useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import styles from "./SourceExplorer.module.css";

export default function SourceExplorer() {
  const client = useContext(ReplayClientContext);
  const sources = getSourcesToDisplay(client);

  const sourceTree = useMemo(() => protocolSourcesToSourceTree(sources), [sources]);

  return (
    <div className={styles.List}>
      <div className={styles.Header}>Sources</div>
      <div className={styles.SourceTree}>
        {sourceTree.map((node, index) => {
          switch (node.type) {
            case "origin":
              return (
                <div key={index} className={styles.ListItem}>
                  <Icon className={styles.Icon} type="folder" />
                  {node.origin}
                </div>
              );
            case "protocol":
              return (
                <div key={index} className={styles.ListItem}>
                  <Icon className={styles.Icon} type="protocol" />
                  {node.protocol}
                </div>
              );
            case "source":
              return (
                <div key={index} className={styles.ListItem}>
                  <Icon className={styles.Icon} type="document" />
                  {node.path}
                </div>
              );
          }
        })}
      </div>
    </div>
  );
}
