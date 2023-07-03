import { Suspense, useCallback, useTransition } from "react";
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
import { PointsContextRoot } from "replay-next/src/contexts/points/PointsContext";
import { SelectedFrameContextRoot } from "replay-next/src/contexts/SelectedFrameContext";
import { SourcesContextRoot } from "replay-next/src/contexts/SourcesContext";
import { TerminalContextRoot } from "replay-next/src/contexts/TerminalContext";
import { TimelineContextRoot } from "replay-next/src/contexts/TimelineContext";
import usePreferredColorScheme from "replay-next/src/hooks/usePreferredColorScheme";
import { ReplayNextCurrentPanel } from "shared/user-data/LocalStorage/config";
import useLocalStorageUserData from "shared/user-data/LocalStorage/useLocalStorageUserData";

import styles from "./index.module.css";

// TODO There's a potential hot loop in this code when an error happens (e.g. Linker too old to support Console.findMessagesInRange)
// where React keeps quickly retrying after an error is thrown, rather than rendering an error boundary.
// Filed https://github.com/facebook/react/issues/24634

type Panel = "comments" | "protocol-viewer" | "search" | "sources";

export default function HomePage({ apiKey }: { apiKey?: string }) {
  // TODO As we finalize the client implementation to interface with Replay backend,
  // we can inject a wrapper here that also reports cache hits and misses to this UI in a debug panel.

  const [isPending, startTransition] = useTransition();

  const [panel, setPanel] = useLocalStorageUserData("replayNextCurrentPanel");
  const setPanelTransition = useCallback(
    (value: ReplayNextCurrentPanel) => {
      startTransition(() => {
        setPanel(value);
      });
    },
    [setPanel]
  );

  const showCommentsPanel = useCallback(() => setPanelTransition("comments"), [setPanelTransition]);
  const showSourcesPanel = useCallback(() => setPanelTransition("sources"), [setPanelTransition]);

  usePreferredColorScheme();

  return (
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
                            onClick={() => setPanelTransition("comments")}
                          >
                            <Icon className={styles.TabIcon} type="comments" />
                          </button>
                          <button
                            className={panel === "sources" ? styles.TabSelected : styles.Tab}
                            data-test-id="TabButton-Sources"
                            disabled={isPending}
                            onClick={() => setPanelTransition("sources")}
                          >
                            <Icon className={styles.TabIcon} type="source-explorer" />
                          </button>
                          <button
                            className={panel === "search" ? styles.TabSelected : styles.Tab}
                            data-test-id="TabButton-Search"
                            disabled={isPending}
                            onClick={() => setPanelTransition("search")}
                          >
                            <Icon className={styles.TabIcon} type="search" />
                          </button>
                          <button
                            className={
                              panel === "protocol-viewer" ? styles.TabSelected : styles.Tab
                            }
                            data-test-id="TabButton-ProtocolViewer"
                            disabled={isPending}
                            onClick={() => setPanelTransition("protocol-viewer")}
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
}
