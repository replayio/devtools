import { ExecutionPoint, PauseId } from "@replayio/protocol";
import {
  KeyboardEvent,
  Suspense,
  useCallback,
  useContext,
  useLayoutEffect,
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
import { STATUS_REJECTED, STATUS_RESOLVED, useImperativeCacheValue } from "suspense";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import { PanelLoader } from "replay-next/components/PanelLoader";
import { useDebounce } from "replay-next/src/hooks/useDebounce";
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
import { getDefaultSelectedReactElementId, getProcessorBacked } from "ui/reducers/app";
import { isPlaying as isPlayingSelector } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";
import {
  ReactOperationsAnnotation,
  reactComponentTreeCache,
  reactDevToolsAnnotationsCache,
} from "ui/suspense/annotationsCaches";

import { ReactElement } from "../types";
import styles from "./ReactDevToolsPanel.module.css";

export function ReactDevToolsPanel({
  executionPoint,
  pauseId,
}: {
  executionPoint: ExecutionPoint | null;
  pauseId: PauseId | null;
}) {
  const processorBacked = useAppSelector(getProcessorBacked);

  if (executionPoint == null || pauseId == null) {
    return <PanelLoader />;
  } else if (processorBacked) {
    return <ComponentTreeReactDevToolsPanel executionPoint={executionPoint} pauseId={pauseId} />;
  } else {
    return <AnnotationsReactDevToolsPanel executionPoint={executionPoint} pauseId={pauseId} />;
  }
}

function AnnotationsReactDevToolsPanel({
  executionPoint,
  pauseId,
}: {
  executionPoint: ExecutionPoint;
  pauseId: PauseId;
}) {
  const replayClient = useContext(ReplayClientContext);

  const annotations = reactDevToolsAnnotationsCache.read(replayClient);

  return (
    <ReactDevToolsPanelInner
      annotations={annotations}
      executionPoint={executionPoint}
      pauseId={pauseId}
    />
  );
}

interface ResolvedComponentTree {
  annotations: ReactOperationsAnnotation[];
  executionPoint: ExecutionPoint;
  pauseId: PauseId;
}

// Keeps showing the last loaded tree while the tree for a new point loads,
// rather than suspending and replacing the panel with a loader on every pause.
function ComponentTreeReactDevToolsPanel({
  executionPoint,
  pauseId,
}: {
  executionPoint: ExecutionPoint;
  pauseId: PauseId;
}) {
  const replayClient = useContext(ReplayClientContext);

  const { status, value } = useImperativeCacheValue(
    reactComponentTreeCache,
    replayClient,
    executionPoint
  );

  const [resolved, setResolved] = useState<ResolvedComponentTree | null>(null);
  if (
    status === STATUS_RESOLVED &&
    (resolved?.annotations !== value || resolved.executionPoint !== executionPoint)
  ) {
    setResolved({ annotations: value, executionPoint, pauseId });
  }

  if (status === STATUS_REJECTED) {
    return (
      <div className={styles.ProtocolFailedMessage} data-test-id="ReactDevToolsPanel">
        <div>The React component tree could not be loaded.</div>
        <div>Try picking a different point on the timeline or reloading the page.</div>
      </div>
    );
  } else if (resolved == null) {
    return <PanelLoader />;
  }

  return (
    <ReactDevToolsPanelInner
      annotations={resolved.annotations}
      executionPoint={resolved.executionPoint}
      pauseId={resolved.pauseId}
    />
  );
}

function ReactDevToolsPanelInner({
  annotations,
  executionPoint,
  pauseId,
}: {
  annotations: ReactOperationsAnnotation[];
  executionPoint: ExecutionPoint | null;
  pauseId: PauseId | null;
}) {
  const [collapsedLeft, setCollapsedLeft] = useState(false);
  const [collapsedRight, setCollapsedRight] = useState(false);
  const [protocolCheckFailed, setProtocolCheckFailed] = useState(false);

  const defaultSelectedReactElementId = useAppSelector(getDefaultSelectedReactElementId);
  const isPlaying = useAppSelector(isPlayingSelector);

  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);

  const { bridge, store, wall } = useReplayWall({
    setProtocolCheckFailed,
  });

  const listData = useMemo(() => new ReactDevToolsListData(store), [store]);

  useLayoutEffect(() => {
    if (listData != null) {
      listData.setDefaultSelectedElementId(defaultSelectedReactElementId);
    }
  }, [defaultSelectedReactElementId, listData]);

  const selectedIndex = useSyncExternalStore(
    listData ? listData.subscribeToSelectedIndex : () => () => {},
    listData ? listData.getSelectedIndex : () => null,
    listData ? listData.getSelectedIndex : () => null
  );
  const selectedElement =
    listData && selectedIndex != null ? listData.getItemAtIndex(selectedIndex) : null;

  const [debounceElementDetails, setDebounceElementDetails] = useState(false);
  const selectedElementDebounced = useDebounce(selectedElement, 500);
  const selectedElementForDetailsPanel = debounceElementDetails
    ? selectedElementDebounced
    : selectedElement;

  const selectElementHighPriority = useCallback(
    (element: ReactElement | null) => {
      listData.selectElement(element);
      setDebounceElementDetails(false);
    },
    [listData]
  );

  const selectElementLowPriority = useCallback(
    (element: ReactElement | null) => {
      listData.selectElement(element);
      setDebounceElementDetails(true);
    },
    [listData]
  );

  const hasReactMounted = useReactDevToolsAnnotations({
    annotations,
    executionPoint,
    listData,
    pauseId,
    wall,
  });

  if (isPlaying) {
    return (
      <div className={styles.DisabledDuringPlaybackMessage} data-test-id="ReactDevToolsPanel">
        This panel is disabled during playback.
      </div>
    );
  } else if (!hasReactMounted) {
    return (
      <div className={styles.NotMountedYetMessage} data-test-id="ReactDevToolsPanel">
        <div>React application has not been mounted.</div>
        <div>Try picking a different point on the timeline.</div>
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
      <div className={styles.ProtocolFailedMessage} data-test-id="ReactDevToolsPanel">
        <div>React DevTools could not be initialized.</div>
        <div>
          Try picking a different point on the timeline or reloading the page. If the problem
          persists, try creating a new recording with the latest version of the Replay browser.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.Panel} data-test-id="ReactDevToolsPanel">
      <PanelGroup autoSaveId="ReactDevTools" direction="horizontal">
        <Panel
          className={styles.LeftPanel}
          collapsible
          defaultSize={65}
          id="tree"
          minSize={25}
          onCollapse={() => setCollapsedLeft(true)}
          onExpand={() => setCollapsedLeft(false)}
          order={1}
          ref={leftPanelRef}
        >
          <div className={styles.LeftPanelTopRow}>
            <InspectButton wall={wall} />
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
                    selectElementHighPriority={selectElementHighPriority}
                    selectElementLowPriority={selectElementLowPriority}
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
          minSize={25}
          onCollapse={() => setCollapsedRight(true)}
          onExpand={() => setCollapsedRight(false)}
          order={2}
          ref={rightPanelRef}
        >
          {listData && pauseId && selectedElementForDetailsPanel ? (
            <InlineErrorBoundary
              fallback={
                <SelectedElementErrorBoundaryFallback element={selectedElementForDetailsPanel} />
              }
              name="ReactDevToolsPanelProperties"
              resetKey={`${pauseId}:${selectedElementForDetailsPanel.id}`}
            >
              <Suspense
                fallback={<SelectedElementLoader element={selectedElementForDetailsPanel} />}
              >
                <SelectedElement
                  bridge={bridge}
                  element={selectedElementForDetailsPanel}
                  isDebounceDelayed={selectedElementForDetailsPanel.id !== selectedElement?.id}
                  listData={listData}
                  pauseId={pauseId}
                  replayWall={wall}
                  store={store}
                />
              </Suspense>
            </InlineErrorBoundary>
          ) : null}
        </Panel>
      </PanelGroup>
    </div>
  );
}
