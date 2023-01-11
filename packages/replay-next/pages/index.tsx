import React, { Suspense, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import CommentList from "replay-next/components/comments/CommentList";
import ConsoleRoot from "replay-next/components/console";
import Focuser from "replay-next/components/console/Focuser";
import Icon from "replay-next/components/Icon";
import Initializer from "replay-next/components/Initializer";
import LazyOffscreen from "replay-next/components/LazyOffscreen";
import Loader from "replay-next/components/Loader";
import ProtocolViewer from "replay-next/components/protocol/ProtocolViewer";
import SearchFiles from "replay-next/components/search-files/SearchFiles";
import SourceExplorer from "replay-next/components/sources/SourceExplorer";
import Sources from "replay-next/components/sources/Sources";
import { FocusContextRoot } from "replay-next/src/contexts/FocusContext";
import { InspectorContextRoot } from "replay-next/src/contexts/InspectorContext";
import { KeyboardModifiersContextRoot } from "replay-next/src/contexts/KeyboardModifiersContext";
import { PointsContextRoot } from "replay-next/src/contexts/PointsContext";
import { SelectedFrameContextRoot } from "replay-next/src/contexts/SelectedFrameContext";
import { SourcesContextRoot } from "replay-next/src/contexts/SourcesContext";
import { TerminalContextRoot } from "replay-next/src/contexts/TerminalContext";
import { TimelineContextRoot } from "replay-next/src/contexts/TimelineContext";
import useLocalStorage from "replay-next/src/hooks/useLocalStorage";
import usePreferredColorScheme from "replay-next/src/hooks/usePreferredColorScheme";
import createReplayClientRecorder from "shared/client/createReplayClientRecorder";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { hasFlag } from "shared/utils/url";

import styles from "./index.module.css";

// TODO There's a potential hot loop in this code when an error happens (e.g. Linker too old to support Console.findMessagesInRange)
// where React keeps quickly retrying after an error is thrown, rather than rendering an error boundary.
// Filed https://github.com/facebook/react/issues/24634

const recordData = hasFlag("record");

type Panel = "comments" | "protocol-viewer" | "search" | "sources";

export default function HomePage({ apiKey }: { apiKey?: string }) {
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
  const [panel, setPanel, isPending] = useLocalStorage<Panel>("bvaughn:panel", "sources", true);

  const showCommentsPanel = useCallback(() => setPanel("comments"), [setPanel]);
  const showSourcesPanel = useCallback(() => setPanel("sources"), [setPanel]);

  usePreferredColorScheme();

  const content = (
    <Initializer accessToken={apiKey || null}>
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
                            data-test-id="TabButton-Comments"
                            disabled={isPending}
                            onClick={() => setPanel("comments")}
                          >
                            <Icon className={styles.TabIcon} type="comments" />
                          </button>
                          <button
                            className={panel === "sources" ? styles.TabSelected : styles.Tab}
                            data-test-id="TabButton-Sources"
                            disabled={isPending}
                            onClick={() => setPanel("sources")}
                          >
                            <Icon className={styles.TabIcon} type="source-explorer" />
                          </button>
                          <button
                            className={panel === "search" ? styles.TabSelected : styles.Tab}
                            data-test-id="TabButton-Search"
                            disabled={isPending}
                            onClick={() => setPanel("search")}
                          >
                            <Icon className={styles.TabIcon} type="search" />
                          </button>
                          <button
                            className={
                              panel === "protocol-viewer" ? styles.TabSelected : styles.Tab
                            }
                            data-test-id="TabButton-ProtocolViewer"
                            disabled={isPending}
                            onClick={() => setPanel("protocol-viewer")}
                          >
                            <Icon className={styles.TabIcon} type="protocol-viewer" />
                          </button>
                        </div>
                        <div className={styles.PanelGroup}>
                          <PanelGroup autoSaveId="bvaughn-layout-main" direction="horizontal">
                            <Panel
                              className={styles.Panel}
                              collapsible
                              defaultSize={15}
                              minSize={10}
                              maxSize={20}
                            >
                              <div className={styles.CommentsContainer}>
                                <Suspense fallback={<Loader />}>
                                  <LazyOffscreen mode={panel == "comments" ? "visible" : "hidden"}>
                                    <CommentList />
                                  </LazyOffscreen>
                                  <LazyOffscreen
                                    mode={panel == "protocol-viewer" ? "visible" : "hidden"}
                                  >
                                    <ProtocolViewer />
                                  </LazyOffscreen>
                                  <LazyOffscreen mode={panel == "search" ? "visible" : "hidden"}>
                                    <SearchFiles />
                                  </LazyOffscreen>
                                  <LazyOffscreen mode={panel == "sources" ? "visible" : "hidden"}>
                                    <SourceExplorer />
                                  </LazyOffscreen>
                                </Suspense>
                              </div>
                            </Panel>
                            <PanelResizeHandle className={styles.PanelResizeHandle}>
                              <div className={styles.PanelResizeHandleInner} />
                            </PanelResizeHandle>
                            <Panel className={styles.Panel} defaultSize={50} minSize={35}>
                              <div className={styles.SourcesContainer}>
                                <Suspense fallback={<Loader />}>
                                  <Sources />
                                </Suspense>
                              </div>
                            </Panel>
                            <PanelResizeHandle className={styles.PanelResizeHandle}>
                              <div className={styles.PanelResizeHandleInner} />
                            </PanelResizeHandle>
                            <Panel className={styles.Panel} defaultSize={35} minSize={25}>
                              <div className={styles.ConsoleContainer}>
                                <TerminalContextRoot>
                                  <ConsoleRoot showSearchInputByDefault={false} />
                                </TerminalContextRoot>
                              </div>
                            </Panel>
                          </PanelGroup>
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
