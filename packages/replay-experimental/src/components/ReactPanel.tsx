import { createSelector } from "@reduxjs/toolkit";
import { ExecutionPoint, Location, TimeStampedPoint } from "@replayio/protocol";
import classnames from "classnames";
import { CSSProperties, ReactNode, Suspense, useContext, useMemo, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";

import { selectLocation } from "devtools/client/debugger/src/actions/sources/select";
import AccessibleImage from "devtools/client/debugger/src/components/shared/AccessibleImage";
import { getExecutionPoint, getThreadContext } from "devtools/client/debugger/src/reducers/pause";
import {
  ReactUpdateScheduled,
  reactRendersIntervalCache,
} from "replay-experimental/src/suspense/reactInternalsCaches";
import IndeterminateLoader from "replay-next/components/IndeterminateLoader";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { UIThunkAction } from "ui/actions";
import { seek } from "ui/actions/timeline";
import { JumpToCodeButton, JumpToCodeStatus } from "ui/components/shared/JumpToCodeButton";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getSourceIdsByUrl } from "ui/reducers/sources";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import cardsListStyles from "ui/components/Comments/CommentCardsList.module.css";
import styles from "ui/components/Events/Event.module.css";

export function jumpToTimeAndLocationForQueuedRender(
  hitPoint: TimeStampedPoint,
  location: Location | undefined,
  jumpBehavior: "timeOnly" | "timeAndLocation",
  onSeek: (point: ExecutionPoint, time: number) => void
): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    onSeek(hitPoint.point, hitPoint.time);

    if (jumpBehavior === "timeAndLocation" && location) {
      const cx = getThreadContext(getState());
      dispatch(selectLocation(cx, location));
    }
  };
}

const Label = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden overflow-ellipsis whitespace-pre font-normal">{children}</div>
);

interface QueuedRenderItemData {
  currentTime: number;
  executionPoint: string;
  onSeek: (point: string, time: number) => void;
  entries: ReactUpdateScheduled[];
}

function ReactQueuedRenderListItem({
  data,
  index,
  style,
}: {
  data: QueuedRenderItemData;
  index: number;
  style: CSSProperties;
}) {
  const dispatch = useAppDispatch();
  const renderDetails = data.entries[index];
  const { executionPoint, onSeek, currentTime } = data;
  const { point, frame, functionName, resultPoint } = renderDetails;
  const isPaused = point.time === currentTime && executionPoint === point.point;
  const [jumpToCodeStatus] = useState<JumpToCodeStatus>("not_checked");

  const onClickSeek = (e: React.MouseEvent) => {
    e.stopPropagation();

    dispatch(
      jumpToTimeAndLocationForQueuedRender(
        resultPoint,
        frame?.executionLocation,
        "timeOnly",
        onSeek
      )
    );
  };

  const onClickJumpToCode = async () => {
    dispatch(
      jumpToTimeAndLocationForQueuedRender(
        resultPoint,
        frame?.executionLocation,
        "timeAndLocation",
        onSeek
      )
    );
  };

  let eventType = "react";
  if (renderDetails.allFrames.some(frame => frame.source?.url?.includes("react-redux"))) {
    eventType = "redux";
  }

  return (
    <div style={style}>
      <div
        className={classnames(styles.eventRow, "group block w-full", {
          "text-lightGrey": currentTime < point.time,
          "font-semibold text-primaryAccent": isPaused,
        })}
        onClick={onClickSeek}
      >
        <div className="flex flex-row items-center space-x-2 overflow-hidden">
          {eventType ? (
            <AccessibleImage className={`${eventType} `} />
          ) : (
            <MaterialIcon iconSize="xl">ads_click</MaterialIcon>
          )}
          <Label>{functionName ?? "Unknown"}</Label>
        </div>
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100">
          {
            <JumpToCodeButton
              onClick={onClickJumpToCode}
              status={jumpToCodeStatus}
              currentExecutionPoint={executionPoint}
              targetExecutionPoint={renderDetails.point.point}
            />
          }
        </div>
      </div>
    </div>
  );
}

export const getReactDomSourceUrl = createSelector(getSourceIdsByUrl, sourcesByUrl => {
  const reactDomUrl = Object.keys(sourcesByUrl).find(key => {
    return key.includes("react-dom.");
  });
  return reactDomUrl;
});

export function ReactPanelSuspends() {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const executionPoint = useAppSelector(getExecutionPoint);
  const { range: focusRange } = useContext(FocusContext);
  const replayClient = useContext(ReplayClientContext);

  const allReactRenderEntries = reactRendersIntervalCache.read(
    BigInt(focusRange!.begin.point),
    BigInt(focusRange!.end.point),
    replayClient
  );

  const itemData: QueuedRenderItemData = useMemo(() => {
    const allScheduledEntries = allReactRenderEntries.filter(
      (entry): entry is ReactUpdateScheduled => entry.type === "scheduled"
    );
    const onlyUserEntries = allScheduledEntries.filter(entry => entry.cause === "user");
    const onSeek = (executionPoint: string, time: number) => {
      dispatch(seek({ executionPoint, time }));
    };

    return {
      executionPoint: executionPoint!,
      currentTime,
      entries: onlyUserEntries,
      onSeek,
    };
  }, [allReactRenderEntries, dispatch, currentTime, executionPoint]);

  // TODO Add the red "current time" line from `Events.tsx`

  return (
    <div style={{ flex: "1 1 auto", height: "100%" }}>
      <AutoSizer disableWidth>
        {({ height }: { height: number }) => {
          return (
            <List
              children={ReactQueuedRenderListItem}
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
  );
}

export function ReactPanel() {
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
        <div className={cardsListStyles.ToolbarHeader}>React State Updates</div>
      </div>
      <Suspense
        fallback={
          <div style={{ flexShrink: 1 }}>
            <IndeterminateLoader />
          </div>
        }
      >
        <ReactPanelSuspends />
      </Suspense>
    </div>
  );
}
