import CommentList from "@bvaughn/components/comments/CommentList";
import ConsoleRoot from "@bvaughn/components/console";
import Focuser from "@bvaughn/components/console/Focuser";
import Initializer from "@bvaughn/components/Initializer";
import SourceExplorer from "@bvaughn/components/sources/SourceExplorer";
import Sources from "@bvaughn/components/sources/Sources";
import { FocusContextRoot } from "@bvaughn/src/contexts/FocusContext";
import { PauseContextRoot } from "@bvaughn/src/contexts/PauseContext";
import { PointsContextRoot } from "@bvaughn/src/contexts/PointsContext";
import React, { useContext, useMemo, useState, useTransition } from "react";
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
  const [panel, setPanel] = useState("sources");
  const [isPending, startTransition] = useTransition();

  const setPanelTransition = (panel: string) => {
    startTransition(() => setPanel(panel));
  };

  const content = (
    <Initializer>
      <PointsContextRoot>
        <PauseContextRoot>
          <FocusContextRoot>
            <div className={styles.VerticalContainer}>
              <div className={styles.HorizontalContainer}>
                <div className={styles.ToolBar}>
                  <button
                    className={panel === "comments" ? styles.TabSelected : styles.Tab}
                    disabled={isPending}
                    onClick={() => setPanelTransition("comments")}
                  >
                    <Icon className={styles.TabIcon} type="comments" />
                  </button>
                  <button
                    className={panel === "sources" ? styles.TabSelected : styles.Tab}
                    disabled={isPending}
                    onClick={() => setPanelTransition("sources")}
                  >
                    <Icon className={styles.TabIcon} type="source-explorer" />
                  </button>
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
