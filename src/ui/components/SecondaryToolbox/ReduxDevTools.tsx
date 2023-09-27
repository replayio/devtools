import { ExecutionPoint } from "@replayio/protocol";
import classnames from "classnames";
import React, { Suspense, useContext, useMemo, useState } from "react";
import { PanelGroup, PanelResizeHandle, Panel as ResizablePanel } from "react-resizable-panels";
import { useImperativeCacheValue } from "suspense";

import Icon from "replay-next/components/Icon";
import IndeterminateLoader from "replay-next/components/IndeterminateLoader";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { isExecutionPointsGreaterThan } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { isPointInRegion } from "shared/utils/time";
import { UIThunkAction } from "ui/actions";
import { seek } from "ui/actions/timeline";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { reduxDevToolsAnnotationsCache } from "ui/suspense/annotationsCaches";
import { reduxDispatchJumpLocationCache } from "ui/suspense/jumpToLocationCache";

import { JumpToCodeButton } from "../shared/JumpToCodeButton";
import Loader from "../shared/Loader";
import { ReduxActionAnnotation } from "./redux-devtools/redux-annotations";
import { ReduxDevToolsContents } from "./redux-devtools/ReduxDevToolsContents";
import styles from "./ReduxDevTools.module.css";

export const ReduxDevToolsPanel = () => {
  const client = useContext(ReplayClientContext);
  const [selectedPoint, setSelectedPoint] = useState<ExecutionPoint | null>(null);
  const { range: focusWindow } = useContext(FocusContext);
  const [searchValue, setSearchValue] = useState("");

  const { status: annotationsStatus, value: parsedAnnotations } = useImperativeCacheValue(
    reduxDevToolsAnnotationsCache,
    client
  );
  const currentTime = useAppSelector(getCurrentTime);

  const reduxAnnotations: ReduxActionAnnotation[] = useMemo(() => {
    const annotations = annotationsStatus === "resolved" ? parsedAnnotations : [];
    return annotations.filter(
      annotation =>
        focusWindow &&
        isPointInRegion(annotation.point, focusWindow) &&
        annotation.payload.actionType.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [parsedAnnotations, annotationsStatus, focusWindow, searchValue]);

  const annotation = reduxAnnotations.find(ann => ann.point === selectedPoint)!;

  const firstAnnotationInTheFuture =
    annotation &&
    reduxAnnotations.find(currAnnotation =>
      isExecutionPointsGreaterThan(currAnnotation.point, annotation.point)
    );

  return (
    <div
      className={classnames("flex min-h-full bg-bodyBgcolor text-xs", styles.actions)}
      data-test-id="ReduxDevtools"
    >
      <PanelGroup autoSaveId="ReduxDevTools" direction="horizontal">
        <ResizablePanel collapsible>
          <div className={styles.LeftPanel}>
            <ActionFilter searchValue={searchValue} onSearch={setSearchValue} />
            <div role="list" className={styles.list}>
              {annotationsStatus === "pending" ? (
                <IndeterminateLoader />
              ) : (
                reduxAnnotations.map(annotation => (
                  <ActionItem
                    key={annotation.point}
                    annotation={annotation}
                    selectedPoint={selectedPoint}
                    setSelectedPoint={setSelectedPoint}
                    firstAnnotationInTheFuture={firstAnnotationInTheFuture === annotation}
                  />
                ))
              )}
            </div>
          </div>
        </ResizablePanel>
        <PanelResizeHandle className="h-full w-1 bg-chrome" />
        <ResizablePanel collapsible>
          {selectedPoint && annotation && (
            <Suspense fallback={<Loader />}>
              <ReduxDevToolsContents point={selectedPoint} time={annotation.time} />
            </Suspense>
          )}
        </ResizablePanel>
      </PanelGroup>
    </div>
  );
};

function ActionFilter({
  searchValue,
  onSearch,
}: {
  searchValue: string;
  onSearch: (value: string) => void;
}) {
  return (
    <div className={styles.SearchRow}>
      <label className={styles.SearchIconAndInput} id="redux-search">
        <Icon className={styles.SearchIcon} type="search" />
        <input
          autoComplete="off"
          className={styles.SearchInput}
          id="redux-searchbox"
          onChange={e => onSearch(e.target.value)}
          placeholder="Filter actions"
          type="text"
          value={searchValue}
        />
      </label>
    </div>
  );
}

function jumpToLocationForReduxDispatch(point: ExecutionPoint, time: number): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    const sourcesState = getState().sources;
    const jumpLocation = await reduxDispatchJumpLocationCache.readAsync(
      replayClient,
      point,
      time,
      sourcesState
    );

    if (jumpLocation) {
      dispatch(
        seek({ executionPoint: jumpLocation.point, openSource: true, time: jumpLocation.time })
      );
    }
  };
}

function ActionItem({
  annotation,
  selectedPoint,
  setSelectedPoint,
  firstAnnotationInTheFuture,
}: {
  annotation: ReduxActionAnnotation;
  selectedPoint: ExecutionPoint | null;
  setSelectedPoint: (point: ExecutionPoint | null) => void;
  firstAnnotationInTheFuture: boolean;
}) {
  const dispatch = useAppDispatch();
  const onSeek = () => {
    setSelectedPoint(annotation.point);
    dispatch(jumpToLocationForReduxDispatch(annotation.point, annotation.time));
  };

  return (
    <div
      key={annotation.point}
      className={classnames(styles.row, {
        [styles.selected]: annotation.point === selectedPoint,
        [styles.future]: firstAnnotationInTheFuture,
      })}
      role="listitem"
      onClick={() => setSelectedPoint(annotation.point)}
      data-test-id="ReduxActionItem"
    >
      <JumpToCodeButton
        className={styles["jump-to-code"]}
        currentExecutionPoint={selectedPoint}
        targetExecutionPoint={annotation.point}
        status="found"
        onClick={onSeek}
      />
      <div className={styles.actionLabel}>{annotation.payload.actionType}</div>
    </div>
  );
}

export default ReduxDevToolsPanel;
