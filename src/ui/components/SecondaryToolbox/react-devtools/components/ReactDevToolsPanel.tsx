import { ExecutionPoint, PauseId } from "@replayio/protocol";
import {
  KeyboardEvent,
  Suspense,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import AutoSizer from "react-virtualized-auto-sizer";

import ErrorBoundary from "replay-next/components/ErrorBoundary";
import { PanelLoader } from "replay-next/components/PanelLoader";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { InspectButton } from "ui/components/SecondaryToolbox/react-devtools/components/InspectButton";
import { ReactDevToolsList } from "ui/components/SecondaryToolbox/react-devtools/components/ReactDevToolsList";
import { Search } from "ui/components/SecondaryToolbox/react-devtools/components/Search";
import { SelectedElement } from "ui/components/SecondaryToolbox/react-devtools/components/SelectedElement";
import { SelectedElementErrorBoundaryFallback } from "ui/components/SecondaryToolbox/react-devtools/components/SelectedElementErrorBoundaryFallback";
import { SelectedElementLoader } from "ui/components/SecondaryToolbox/react-devtools/components/SelectedElementLoader";
import { useReactDevToolsAnnotations } from "ui/components/SecondaryToolbox/react-devtools/hooks/useReactDevToolsAnnotations";
import { useReplayWall } from "ui/components/SecondaryToolbox/react-devtools/hooks/useReplayWall";
import { ReactDevToolsListData } from "ui/components/SecondaryToolbox/react-devtools/ReactDevToolsListData";
import {
  ParsedReactDevToolsAnnotation,
  reactDevToolsAnnotationsCache,
} from "ui/suspense/annotationsCaches";

import styles from "./ReactDevToolsPanel.module.css";

export function ReactDevToolsPanel({
  executionPoint,
  pauseId,
}: {
  executionPoint: ExecutionPoint | null;
  pauseId: PauseId | null;
}) {
  const replayClient = useContext(ReplayClientContext);

  if (executionPoint == null || pauseId == null) {
    return <PanelLoader />;
  }

  const annotations = reactDevToolsAnnotationsCache.read(replayClient);

  return (
    <ReactDevToolsPanelInner
      annotations={annotations}
      executionPoint={executionPoint}
      pauseId={pauseId}
    />
  );
}

function ReactDevToolsPanelInner({
  annotations,
  executionPoint,
  pauseId,
}: {
  annotations: ParsedReactDevToolsAnnotation[];
  executionPoint: ExecutionPoint | null;
  pauseId: PauseId | null;
}) {
  const [collapsedLeft, setCollapsedLeft] = useState(false);
  const [collapsedRight, setCollapsedRight] = useState(false);
  const [protocolCheckFailed, setProtocolCheckFailed] = useState(false);

  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);

  const { bridge, store, wall } = useReplayWall({
    setProtocolCheckFailed,
  });

  const listData = useMemo(() => new ReactDevToolsListData(store), [store]);

  const selectedIndex = useSyncExternalStore(
    listData ? listData.subscribeToSelectedIndex : () => () => {},
    listData ? listData.getSelectedIndex : () => null,
    listData ? listData.getSelectedIndex : () => null
  );
  const selectedElement =
    listData && selectedIndex != null ? listData.getItemAtIndex(selectedIndex) : null;

  const hasReactMounted = useReactDevToolsAnnotations({
    annotations,
    executionPoint,
    listData,
    pauseId,
    wall,
  });
  if (!hasReactMounted) {
    return (
      <div className={styles.ProtocolFailedPanel} data-test-id="ReactDevToolsPanel">
        <div className={styles.NotMountedYetMessage}>
          <div>React application has not been mounted.</div>
          <div>Try picking a different point on the timeline.</div>
        </div>
      </div>
    );
  }

  let resizeHandleClassName = styles.ResizeHandle;
  if (collapsedLeft) {
    resizeHandleClassName = styles.ResizeHandleCollapsedLeft;
  } else if (collapsedRight) {
    resizeHandleClassName = styles.ResizeHandleCollapsedRight;
  }

  const onResizeHandleClick = () => {
    if (collapsedLeft) {
      leftPanelRef.current?.expand();
    } else if (collapsedRight) {
      rightPanelRef.current?.expand();
    }
  };

  const onResizeHandleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Enter": {
        if (collapsedLeft) {
          leftPanelRef.current?.expand();
        } else if (collapsedRight) {
          rightPanelRef.current?.expand();
        }
        break;
      }
    }
  };

  if (protocolCheckFailed) {
    return (
      <div className={styles.ProtocolFailedPanel} data-test-id="ReactDevToolsPanel">
        <div className={styles.ProtocolFailedMessage}>
          <div>React DevTools could not be initialized.</div>
          <div>
            Try picking a different point on the timeline or reloading the page. If the problem
            persists, try creating a new recording with the latest version of the Replay browser.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.Panel} data-test-id="ReactDevToolsPanel">
      <PanelGroup autoSaveId="ReactDevToolsRoot" direction="horizontal">
        <Panel
          className={styles.LeftPanel}
          collapsible
          defaultSizePercentage={65}
          id="tree"
          minSizePercentage={25}
          onCollapse={() => setCollapsedLeft(true)}
          onExpand={() => setCollapsedLeft(false)}
          order={1}
          ref={leftPanelRef}
        >
          <div className={styles.LeftPanelTopRow}>
            <InspectButton bridge={bridge} wall={wall} />
            <Search listData={listData} pauseId={pauseId} />
          </div>

          <div className={styles.LeftPanelBottomRow}>
            {listData != null && pauseId != null && (
              <AutoSizer>
                {({ height, width }: { height: number; width: number }) => (
                  <ReactDevToolsList
                    bridge={bridge}
                    height={height}
                    listData={listData}
                    pauseId={pauseId}
                    store={store}
                    wall={wall}
                    width={width}
                  />
                )}
              </AutoSizer>
            )}
          </div>
        </Panel>
        <div onClick={onResizeHandleClick} onKeyDown={onResizeHandleKeyDown}>
          <PanelResizeHandle className={resizeHandleClassName} />
        </div>
        <Panel
          className={styles.RightPanel}
          collapsible
          id="properties"
          minSizePercentage={25}
          onCollapse={() => setCollapsedRight(true)}
          onExpand={() => setCollapsedRight(false)}
          order={2}
          ref={rightPanelRef}
        >
          {listData && pauseId && selectedElement ? (
            <ErrorBoundary
              fallback={<SelectedElementErrorBoundaryFallback element={selectedElement} />}
              name="ReactDevToolsPanelProperties"
              resetKey={`${pauseId}:${selectedElement.id}`}
            >
              <Suspense fallback={<SelectedElementLoader element={selectedElement} />}>
                <SelectedElement
                  bridge={bridge}
                  element={selectedElement}
                  listData={listData}
                  pauseId={pauseId}
                  replayWall={wall}
                  store={store}
                />
              </Suspense>
            </ErrorBoundary>
          ) : null}
        </Panel>
      </PanelGroup>
    </div>
  );
}
