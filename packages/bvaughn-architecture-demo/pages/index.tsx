import CommentList from "@bvaughn/components/comments/CommentList";
import ConsoleRoot from "@bvaughn/components/console";
import Focuser from "@bvaughn/components/console/Focuser";
import Initializer from "@bvaughn/components/Initializer";
import SourceExplorer from "@bvaughn/components/source-explorer/SourceExplorer";
import Sources from "@bvaughn/components/sources/Sources";
import { FocusContextRoot } from "@bvaughn/src/contexts/FocusContext";
import { PauseContextRoot } from "@bvaughn/src/contexts/PauseContext";
import { PointsContextRoot } from "@bvaughn/src/contexts/PointsContext";
import React, { useContext, useMemo } from "react";
import Icon from "../components/Icon";

import createReplayClientRecorder from "../../shared/client/createReplayClientRecorder";
import { ReplayClientContext } from "../../shared/client/ReplayClientContext";

import styles from "./index.module.css";

// TODO There's a potential hot loop in this code when an error happens (e.g. Linker too old to support Console.findMessagesInRange)
// where React keeps quickly retrying after an error is thrown, rather than rendering an error boundary.
// Filed https://github.com/facebook/react/issues/24634

let recordData = false;
if (typeof window !== "undefined") {
  const url = new URL(window.location.href);
  recordData = url.searchParams.has("record");
}

export default function HomePage() {
  // TODO As we finalize the client implementation to interface with Replay backend,
  // we can inject a wrapper here that also reports cache hits and misses to this UI in a debug panel.

  // Used to record mock data for e2e tests when a URL parameter is present:
  const client = useContext(ReplayClientContext);
  const replayClientRecorder = useMemo(() => createReplayClientRecorder(client), [client]);
  const [panel, setPanel] = React.useState("sources");
  const content = (
    <Initializer>
      <PointsContextRoot>
        <PauseContextRoot>
          <FocusContextRoot>
            <div className={styles.VerticalContainer}>
              <div className={styles.HorizontalContainer}>
                <div className={styles.ToolBar}>
                  <div onClick={() => setPanel("comments")}>
                    <Icon
                      className={`${styles.Icon} ${panel == "comments" && styles.Selected}`}
                      type="comments"
                    />
                  </div>
                  <div onClick={() => setPanel("sources")}>
                    <Icon
                      className={`${styles.Icon} ${panel == "sources" && styles.Selected}`}
                      type="document"
                    />
                  </div>
                </div>
                <div className={styles.CommentsContainer}>
                  {panel == "comments" && <CommentList />}
                  {panel == "sources" && <SourceExplorer />}
                </div>
                <div className={styles.SourcesContainer}>
                  <Sources />
                </div>
                <div className={styles.ConsoleContainer}>
                  <ConsoleRoot />
                </div>
              </div>
              <div className={styles.Row}>
                <Focuser />
              </div>
            </div>
          </FocusContextRoot>
        </PauseContextRoot>
      </PointsContextRoot>
    </Initializer>
  );

  if (recordData) {
    return (
      <ReplayClientContext.Provider value={replayClientRecorder}>
        {content}
      </ReplayClientContext.Provider>
    );
  } else {
    return content;
  }
}
