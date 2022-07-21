import CommentList from "@bvaughn/components/comments/CommentList";
import ConsoleRoot from "@bvaughn/components/console";
import Focuser from "@bvaughn/components/console/Focuser";
import Icon from "@bvaughn/components/Icon";
import Initializer from "@bvaughn/components/Initializer";
import Input from "@bvaughn/components/console/Input";
import Loader from "@bvaughn/components/Loader";
import SourceExplorer from "@bvaughn/components/sources/SourceExplorer";
import Sources from "@bvaughn/components/sources/Sources";
import { FocusContextRoot } from "@bvaughn/src/contexts/FocusContext";
import { TerminalContextRoot } from "@bvaughn/src/contexts/TerminalContext";
import { TimelineContextRoot } from "@bvaughn/src/contexts/TimelineContext";
import { PointsContextRoot } from "@bvaughn/src/contexts/PointsContext";
import { SourcesContextRoot } from "@bvaughn/src/contexts/SourcesContext";
import React, { Suspense, useContext, useMemo, useState, useTransition } from "react";
import createReplayClientRecorder from "shared/client/createReplayClientRecorder";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { hasFlag } from "shared/utils/url";

import styles from "./index.module.css";

// TODO There's a potential hot loop in this code when an error happens (e.g. Linker too old to support Console.findMessagesInRange)
// where React keeps quickly retrying after an error is thrown, rather than rendering an error boundary.
// Filed https://github.com/facebook/react/issues/24634

const recordData = hasFlag("record");

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
      <SourcesContextRoot>
        <PointsContextRoot>
          <TimelineContextRoot>
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
                    <TerminalContextRoot>
                      <ConsoleRoot
                        showSearchInputByDefault={false}
                        terminalInput={
                          <Suspense fallback={<Loader />}>
                            <Input />
                          </Suspense>
                        }
                      />
                    </TerminalContextRoot>
                  </div>
                </div>
                <div className={styles.Row}>
                  <Focuser />
                </div>
              </div>
            </FocusContextRoot>
          </TimelineContextRoot>
        </PointsContextRoot>
      </SourcesContextRoot>
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
