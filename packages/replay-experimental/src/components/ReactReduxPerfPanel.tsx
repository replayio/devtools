import { ExecutionPoint, TimeStampedPoint } from "@replayio/protocol";
import classnames from "classnames";
import { CSSProperties, ReactNode, Suspense, useContext, useMemo, useRef, useState } from "react";
import {
  ImperativePanelHandle,
  PanelGroup,
  PanelResizeHandle,
  Panel as ResizablePanel,
} from "react-resizable-panels";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import AccessibleImage from "devtools/client/debugger/src/components/shared/AccessibleImage";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { jumpToTimeAndLocationForQueuedRender } from "replay-experimental/src/components/ReactPanel";
import { reactRendersIntervalCache } from "replay-experimental/src/suspense/reactInternalsCaches";
import {
  ReduxDispatchDetailsEntry,
  reduxDispatchesCache,
} from "replay-experimental/src/suspense/reduxInternalsCaches";
import Icon from "replay-next/components/Icon";
import IndeterminateLoader from "replay-next/components/IndeterminateLoader";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { isExecutionPointsGreaterThan } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { requestFocusWindow } from "ui/actions/timeline";
import { seek } from "ui/actions/timeline";
import { JumpToCodeButton, JumpToCodeStatus } from "ui/components/shared/JumpToCodeButton";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { formattedPointStackCache } from "ui/suspense/frameCache";

import cardsListStyles from "ui/components/Comments/CommentCardsList.module.css";
import eventStyles from "ui/components/Events/Event.module.css";
import panelStyles from "./ReactReduxPanels.module.css";

const Label = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden overflow-ellipsis whitespace-pre font-normal">{children}</div>
);

interface ReduxDispatchItemData {
  currentTime: number;
  executionPoint: string;
  onSeek: (point: string, time: number) => void;
  onEntrySelected: (point: ExecutionPoint) => void;
  entries: ReduxDispatchDetailsEntry[];
}

function ReduxDispatchListItem({
  data,
  index,
  style,
}: {
  data: ReduxDispatchItemData;
  index: number;
  style: CSSProperties;
}) {
  const dispatch = useAppDispatch();
  const replayClient = useContext(ReplayClientContext);
  const dispatchDetails = data.entries[index];
  const { executionPoint, onSeek, currentTime, onEntrySelected } = data;
  const { actionType, dispatchStart } = dispatchDetails;
  const isPaused = dispatchStart.time === currentTime && executionPoint === dispatchStart.point;
  const [jumpToCodeStatus] = useState<JumpToCodeStatus>("not_checked");

  const onClickJumpToCode = async () => {
    const formattedPointStack = await formattedPointStackCache.readAsync(
      replayClient,
      dispatchStart
    );

    dispatch(
      jumpToTimeAndLocationForQueuedRender(
        dispatchStart,
        formattedPointStack?.frame?.executionLocation,
        "timeAndLocation",
        onSeek
      )
    );
  };

  return (
    <div style={style}>
      <div
        className={classnames(eventStyles.eventRow, "group block w-full", {
          "text-lightGrey": currentTime < dispatchStart.time,
          "font-semibold text-primaryAccent": isPaused,
        })}
        onClick={() => onEntrySelected(dispatchStart.point)}
      >
        <div className="flex flex-row items-center space-x-2 overflow-hidden">
          <AccessibleImage className="redux" />
          <Label>{actionType}</Label>
        </div>
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100">
          {
            <JumpToCodeButton
              onClick={onClickJumpToCode}
              status={jumpToCodeStatus}
              currentExecutionPoint={executionPoint}
              targetExecutionPoint={dispatchStart.point}
            />
          }
        </div>
      </div>
    </div>
  );
}

function ReactReduxPerfPanelSuspends() {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const executionPoint = useAppSelector(getExecutionPoint);
  const { range: focusRange } = useContext(FocusContext);
  const replayClient = useContext(ReplayClientContext);
  const [selectedPoint, setSelectedPoint] = useState<ExecutionPoint | null>(null);

  const detailsPanelRef = useRef<ImperativePanelHandle>(null);

  const [detailsPanelCollapsed, setDetailsPanelCollapsed] = useState(false);

  const toggleDetailsPanel = () => {
    const panel = detailsPanelRef.current;
    if (panel) {
      const collapsed = panel.getCollapsed();
      if (collapsed) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  const reduxDispatchEntries = reduxDispatchesCache.read(
    BigInt(focusRange!.begin.point),
    BigInt(focusRange!.end.point),
    replayClient
  );

  const itemData: ReduxDispatchItemData = useMemo(() => {
    const onSeek = (executionPoint: string, time: number) => {
      dispatch(seek({ executionPoint, time }));
    };

    return {
      executionPoint: executionPoint!,
      currentTime,
      entries: reduxDispatchEntries,
      onSeek,
      onEntrySelected: (point: ExecutionPoint) => {
        setSelectedPoint(point);
        const panel = detailsPanelRef.current;
        if (panel) {
          const collapsed = panel.getCollapsed();
          if (collapsed) {
            panel.expand();
          }
        }
      },
    };
  }, [reduxDispatchEntries, dispatch, currentTime, executionPoint]);

  const selectedEntry = reduxDispatchEntries.find(
    entry => entry.dispatchStart.point === selectedPoint
  );

  return (
    <PanelGroup autoSaveId="TestRecordingPanel" direction="vertical">
      <ResizablePanel className={panelStyles.DispatchDetails} collapsible>
        <div className={panelStyles.ListContainer}>
          <AutoSizer disableWidth>
            {({ height }: { height: number }) => {
              return (
                <List
                  children={ReduxDispatchListItem}
                  height={height}
                  itemCount={itemData.entries.length}
                  itemData={itemData}
                  itemSize={30}
                  width="100%"
                />
              );
            }}
          </AutoSizer>
        </div>
      </ResizablePanel>
      <PanelResizeHandle className={panelStyles.ResizeHandle}>
        <div className={panelStyles.ResizeHandleBar} />
      </PanelResizeHandle>
      <ResizablePanel
        className={panelStyles.DispatchDetailsPanel}
        collapsible
        defaultSize={35}
        minSize={35}
        onCollapse={collapsed => setDetailsPanelCollapsed(collapsed)}
        ref={detailsPanelRef}
      >
        <div className={panelStyles.DispatchDetailsContainer}>
          <div className={panelStyles.DispatchDetailsHeader} onClick={toggleDetailsPanel}>
            <CollapseExpandArrow collapsed={detailsPanelCollapsed} /> Details
          </div>
          {selectedEntry ? <SelectedReduxDispatchDetails entry={selectedEntry} /> : null}
        </div>
      </ResizablePanel>
    </PanelGroup>
  );
}

// TODO This should be a shared component;
// we use this style in a bunch of places.
function CollapseExpandArrow({ collapsed }: { collapsed: boolean }) {
  return <div className={`img arrow ${collapsed ? "" : "expanded"}`} />;
}

interface RDDEntryProps {
  entry: ReduxDispatchDetailsEntry;
}

function ReactRenderQueuedSuspends({ entry }: RDDEntryProps) {
  const replayClient = useContext(ReplayClientContext);

  const { afterReducer, afterNotifications } = entry;

  const queuedRenders = reactRendersIntervalCache.read(
    BigInt(afterReducer.point),
    BigInt(afterNotifications.point),
    replayClient
  );

  return <b>{queuedRenders.length > 0 ? queuedRenders.length : "None"}</b>;
}

function ReactRenderDetailsSuspends({ entry }: RDDEntryProps) {
  const replayClient = useContext(ReplayClientContext);
  const { range: focusRange } = useContext(FocusContext);

  const { contextMenu: renderStartContextMenu, onContextMenu: onRenderStartContextMenu } =
    useDispatchContextMenu(entry.dispatchStart);
  const { contextMenu: renderCommitContextMenu, onContextMenu: onRenderEndContextMenu } =
    useDispatchContextMenu(entry.afterNotifications);

  const allRenderDataInRange = reactRendersIntervalCache.read(
    BigInt(focusRange!.begin.point),
    BigInt(focusRange!.end.point),
    replayClient
  );

  // TODO Looking for the next render after the dispatch is a horrible heuristic,
  // but we'll go with it for now to prove the concept.
  const nextRender = allRenderDataInRange.findIndex(
    r =>
      r.type === "sync_started" &&
      isExecutionPointsGreaterThan(r.point.point, entry.afterNotifications.point)
  );

  if (nextRender === -1) {
    console.log("No potential render found", entry.afterNotifications, allRenderDataInRange);
    return <i>None</i>;
  }

  const nextRenderStart = allRenderDataInRange[nextRender];
  const nextRenderCommitted = allRenderDataInRange[nextRender + 1];
  const isValidRenderPair =
    nextRenderStart.type === "sync_started" && nextRenderCommitted.type === "render_committed";
  if (!isValidRenderPair) {
    console.log(
      "No valid render pair found",
      entry.afterNotifications,
      nextRender,
      nextRenderStart,
      nextRenderCommitted,
      allRenderDataInRange
    );
    return <i>None</i>;
  }

  return (
    <ul className="ml-2 list-inside list-disc">
      <li>
        Time:{" "}
        <span onContextMenu={onRenderStartContextMenu}>
          {formatTimeMs(nextRenderStart.point.time)}
        </span>{" "}
        🡒{" "}
        <span onContextMenu={onRenderEndContextMenu}>
          {formatTimeMs(nextRenderCommitted.point.time)}
        </span>
      </li>
      <li>Duration: {formatTimeMs(nextRenderCommitted.point.time - nextRenderStart.point.time)}</li>
      {renderStartContextMenu}
      {renderCommitContextMenu}
    </ul>
  );
}

const formatTimeMs = (time: number) => {
  return `${time.toFixed(1)}ms`;
};

function useDispatchContextMenu(point: TimeStampedPoint) {
  const dispatch = useAppDispatch();

  const setFocusEnd = () => {
    dispatch(
      requestFocusWindow({
        end: point,
      })
    );
  };

  const setFocusStart = () => {
    dispatch(
      requestFocusWindow({
        begin: point,
      })
    );
  };

  return useContextMenu(
    <>
      <ContextMenuItem dataTestId="ConsoleContextMenu-SetFocusStartButton" onSelect={setFocusStart}>
        <>
          <Icon type="set-focus-start" />
          Set focus start
        </>
      </ContextMenuItem>
      <ContextMenuItem dataTestId="ConsoleContextMenu-SetFocusEndButton" onSelect={setFocusEnd}>
        <>
          <Icon type="set-focus-end" />
          Set focus end
        </>
      </ContextMenuItem>
    </>
  );
}

function SelectedReduxDispatchDetails({ entry }: RDDEntryProps) {
  const { contextMenu: dispatchStartContextMenu, onContextMenu: onDispatchStartContextMenu } =
    useDispatchContextMenu(entry.dispatchStart);
  const { contextMenu: dispatchEndContextMenu, onContextMenu: onDispatchEndContextMenu } =
    useDispatchContextMenu(entry.afterNotifications);

  return (
    <div style={{ minHeight: 200 }}>
      <b>{entry.actionType}</b>
      <ul className="ml-2 list-inside list-disc">
        <li>
          Time:{" "}
          <span onContextMenu={onDispatchStartContextMenu}>
            {formatTimeMs(entry.dispatchStart.time)}
          </span>{" "}
          🡒{" "}
          <span onContextMenu={onDispatchEndContextMenu}>
            {formatTimeMs(entry.afterNotifications.time)}
          </span>
        </li>
        <li>
          Durations:
          <ul className="ml-2 list-inside  list-disc">
            <li>Reducer: {formatTimeMs(entry.reducerDuration)}</li>
            <li>Subscribers: {formatTimeMs(entry.notificationDuration)}</li>
            <li>Total: {formatTimeMs(entry.afterNotifications.time - entry.dispatchStart.time)}</li>
          </ul>
        </li>
        <li>
          Component renders queued:{" "}
          <Suspense fallback={<i>Loading...</i>}>
            <ReactRenderQueuedSuspends entry={entry} key={entry.dispatchStart.point} />
          </Suspense>
        </li>
        <li>
          Probable render details:{" "}
          <Suspense fallback={<i>Loading...</i>}>
            <ReactRenderDetailsSuspends entry={entry} key={entry.dispatchStart.point} />
          </Suspense>
        </li>
      </ul>
      {dispatchStartContextMenu}
      {dispatchEndContextMenu}
    </div>
  );
}

export function ReactReduxPerfPanel() {
  const { range: focusRange } = useContext(FocusContext);
  const allSourcesReceived = useAppSelector(state => state.sources.allSourcesReceived);
  if (!focusRange?.begin) {
    return <div>No focus range</div>;
  } else if (!allSourcesReceived) {
    return <div>Loading sources...</div>;
  }

  return (
    <div className={cardsListStyles.Sidebar}>
      <div className={cardsListStyles.Toolbar}>
        <div className={cardsListStyles.ToolbarHeader}>Redux Dispatch Perf</div>
      </div>
      <div style={{ flexGrow: 2 }}>
        <Suspense
          fallback={
            <div style={{ flexShrink: 1 }}>
              <IndeterminateLoader />
            </div>
          }
        >
          <ReactReduxPerfPanelSuspends />
        </Suspense>
      </div>
    </div>
  );
}
