import { useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

// import Comment from "./Comment";
import styles from "./SourceExplorer.module.css";
import { getSourcesToDisplay } from "@bvaughn/src/suspense/SourcesCache";

// TODO Dim comments that are outside of the focus window

export default function SourceExplorer() {
  const client = useContext(ReplayClientContext);
  const sources = getSourcesToDisplay(client);

  console.log("!!", sources);
  const sourceTree = useMemo(() => {
    const tree = [];
    let protocol: string | null = null;
    let origin: string | null = null;
    sources.forEach(source => {
      if (!source.url) {
        return;
      }
      const url = new URL(source.url);
      if (url.protocol == "replay-content:") {
        return;
      }
      if (
        url.protocol != "replay-content:" &&
        url.protocol != "https:" &&
        url.protocol !== protocol
      ) {
        tree.push({
          type: "protocol",
          protocol: url.protocol,
        });
        protocol = url.protocol;
      }
      if (url.origin != null && url.origin !== origin) {
        tree.push({
          type: "origin",
          origin: url.origin,
        });
        origin = url.origin;
      }
      if (url.pathname) {
        tree.push({
          type: "source",
          source: source,
          path: url.pathname,
        });
      }
    });
    return tree;
  }, [sources]);

  console.log(`sourceTree`, sourceTree);
  return (
    <div className={styles.List}>
      <div className={styles.Header}>Sources</div>
      <div className={styles.SourceTree}>
        {sourceTree.map(node => {
          if (node.type == "protocol") {
            return <div key={node.protocol}>{node.protocol}</div>;
          }

          if (node.type == "origin") {
            return (
              <div key={node.origin} className={styles.Origin}>
                {node.origin}
              </div>
            );
          }
          if (node.type == "source") {
            return (
              <div key={node.source.sourceId} className={styles.Source}>
                {node.path}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
