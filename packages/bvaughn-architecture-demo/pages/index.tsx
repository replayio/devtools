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
import { KeyboardModifiersContextRoot } from "@bvaughn/src/contexts/KeyboardModifiersContext";
import { PointsContextRoot } from "@bvaughn/src/contexts/PointsContext";
import { SourcesContextRoot } from "@bvaughn/src/contexts/SourcesContext";
import { TerminalContextRoot } from "@bvaughn/src/contexts/TerminalContext";
import { TimelineContextRoot } from "@bvaughn/src/contexts/TimelineContext";
import usePreferredColorScheme from "@bvaughn/src/hooks/usePreferredColorScheme";
import React, {
  Suspense,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import createReplayClientRecorder from "shared/client/createReplayClientRecorder";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { hasFlag } from "shared/utils/url";

import styles from "./index.module.css";
import { InspectorContext } from "@bvaughn/src/contexts/InspectorContext";

// TODO There's a potential hot loop in this code when an error happens (e.g. Linker too old to support Console.findMessagesInRange)
// where React keeps quickly retrying after an error is thrown, rather than rendering an error boundary.
// Filed https://github.com/facebook/react/issues/24634

const recordData = hasFlag("record");

export default function HomePage() {
  // TODO As we finalize the client implementation to interface with Replay backend,
  // we can inject a wrapper here that also reports cache hits and misses to this UI in a debug panel.

  // TODO wat
  const recordFlag = useSyncExternalStore(
    () => () => {},
    () => new URL(window.location.href).searchParams.has("record"),
    () => false
  );

  // Used to record mock data for e2e tests when a URL parameter is present:
  const client = useContext(ReplayClientContext);
  const replayClientRecorder = useMemo(() => {
    return recordFlag ? createReplayClientRecorder(client) : client;
  }, [client, recordFlag]);
  const [panel, setPanel] = useState("sources");
  const [isPending, startTransition] = useTransition();

  const setPanelTransition = (panel: string) => {
    startTransition(() => setPanel(panel));
  };

  usePreferredColorScheme();

  const inspectorContext = useMemo(
    () => ({
      inspectFunctionDefinition: null,
      inspectHTMLElement: null,
      showCommentsPanel: () => setPanel("comments"),
    }),
    []
  );

  const content = (
    <Initializer>
      <InspectorContext.Provider value={inspectorContext}>
        <KeyboardModifiersContextRoot>
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
                        <Suspense fallback={<Loader />}>
                          {panel == "comments" && <CommentList />}
                          {panel == "sources" && <SourceExplorer />}
                        </Suspense>
                      </div>
                      <div className={styles.SourcesContainer}>
                        <Suspense fallback={<Loader />}>
                          <Sources />
                        </Suspense>
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
                      <Suspense fallback={<Loader />}>
                        <Focuser />
                      </Suspense>
                    </div>
                  </div>
                </FocusContextRoot>
              </TimelineContextRoot>
            </PointsContextRoot>
          </SourcesContextRoot>
        </KeyboardModifiersContextRoot>
      </InspectorContext.Provider>
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
