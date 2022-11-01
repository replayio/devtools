import CommentList from "bvaughn-architecture-demo/components/comments/CommentList";
import ConsoleRoot from "bvaughn-architecture-demo/components/console";
import Focuser from "bvaughn-architecture-demo/components/console/Focuser";
import Icon from "bvaughn-architecture-demo/components/Icon";
import Initializer from "bvaughn-architecture-demo/components/Initializer";
import Input from "bvaughn-architecture-demo/components/console/Input";
import LazyOffscreen from "bvaughn-architecture-demo/components/LazyOffscreen";
import Loader from "bvaughn-architecture-demo/components/Loader";
import ProtocolViewer from "bvaughn-architecture-demo/components/protocol/ProtocolViewer";
import SourceExplorer from "bvaughn-architecture-demo/components/sources/SourceExplorer";
import Sources from "bvaughn-architecture-demo/components/sources/Sources";
import { FocusContextRoot } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import { InspectorContextRoot } from "bvaughn-architecture-demo/src/contexts/InspectorContext";
import { KeyboardModifiersContextRoot } from "bvaughn-architecture-demo/src/contexts/KeyboardModifiersContext";
import { PointsContextRoot } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { SelectedFrameContextRoot } from "bvaughn-architecture-demo/src/contexts/SelectedFrameContext";
import { SourcesContextRoot } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { TerminalContextRoot } from "bvaughn-architecture-demo/src/contexts/TerminalContext";
import { TimelineContextRoot } from "bvaughn-architecture-demo/src/contexts/TimelineContext";
import usePreferredColorScheme from "bvaughn-architecture-demo/src/hooks/usePreferredColorScheme";
import React, {
  Suspense,
  useCallback,
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

// TODO There's a potential hot loop in this code when an error happens (e.g. Linker too old to support Console.findMessagesInRange)
// where React keeps quickly retrying after an error is thrown, rather than rendering an error boundary.
// Filed https://github.com/facebook/react/issues/24634

const recordData = hasFlag("record");

type Panel = "comments" | "protocol-viewer" | "sources";

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
  const [panel, setPanel] = useState<Panel>("sources");
  const [isPending, startTransition] = useTransition();

  const setPanelTransition = (panel: Panel) => {
    startTransition(() => setPanel(panel));
  };

  const showCommentsPanel = useCallback(() => setPanel("comments"), []);
  const showSourcesPanel = useCallback(() => setPanel("sources"), []);

  usePreferredColorScheme();

  const content = (
    <Initializer>
      <KeyboardModifiersContextRoot>
        <SourcesContextRoot>
          <InspectorContextRoot
            showCommentsPanel={showCommentsPanel}
            showSourcesPanel={showSourcesPanel}
          >
            <PointsContextRoot>
              <TimelineContextRoot>
                <FocusContextRoot>
                  <SelectedFrameContextRoot>
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
                          <button
                            className={
                              panel === "protocol-viewer" ? styles.TabSelected : styles.Tab
                            }
                            disabled={isPending}
                            onClick={() => setPanelTransition("protocol-viewer")}
                          >
                            <Icon className={styles.TabIcon} type="protocol-viewer" />
                          </button>
                        </div>
                        <div className={styles.CommentsContainer}>
                          <Suspense fallback={<Loader />}>
                            <LazyOffscreen mode={panel == "comments" ? "visible" : "hidden"}>
                              <CommentList />
                            </LazyOffscreen>
                            <LazyOffscreen mode={panel == "protocol-viewer" ? "visible" : "hidden"}>
                              <ProtocolViewer />
                            </LazyOffscreen>
                            <LazyOffscreen mode={panel == "sources" ? "visible" : "hidden"}>
                              <SourceExplorer />
                            </LazyOffscreen>
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
                  </SelectedFrameContextRoot>
                </FocusContextRoot>
              </TimelineContextRoot>
            </PointsContextRoot>
          </InspectorContextRoot>
        </SourcesContextRoot>
      </KeyboardModifiersContextRoot>
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
