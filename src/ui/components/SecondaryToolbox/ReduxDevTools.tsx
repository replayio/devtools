import { ExecutionPoint } from "@replayio/protocol";
import classnames from "classnames";
import React, { useContext, useMemo, useState } from "react";
import { PanelGroup, PanelResizeHandle, Panel as ResizablePanel } from "react-resizable-panels";
import { useImperativeCacheValue } from "suspense";

import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { isPointInRegion } from "shared/utils/time";
import { UIThunkAction } from "ui/actions";
import { seek } from "ui/actions/timeline";
import { getCurrentTime, getFocusWindow } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { reduxDevToolsAnnotationsCache } from "ui/suspense/annotationsCaches";
import { reduxDispatchJumpLocationCache } from "ui/suspense/jumpToLocationCache";

import { JumpToCodeButton } from "../shared/JumpToCodeButton";
import { ReduxActionAnnotation } from "./redux-devtools/redux-annotations";
import { ReduxDevToolsContents } from "./redux-devtools/ReduxDevToolsContents";
import styles from "./ReduxDevTools.module.css";

export const ReduxDevToolsPanel = () => {
  const client = useContext(ReplayClientContext);
  const [selectedPoint, setSelectedPoint] = useState<ExecutionPoint | null>(null);
  const focusWindow = useAppSelector(getFocusWindow);
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

  const firstAnnotationInTheFuture = reduxAnnotations.find(
    annotation => annotation.time >= currentTime
  );

  return (
    <div className={classnames("flex min-h-full bg-bodyBgcolor text-xs", styles.actions)}>
      <PanelGroup autoSaveId="ReduxDevTools" direction="horizontal">
        <ResizablePanel collapsible>
          <ActionFilter searchValue={searchValue} onSearch={setSearchValue} />
          <div role="list" className={styles.list}>
            {reduxAnnotations.map(annotation => (
              <ActionItem
                key={annotation.point}
                annotation={annotation}
                selectedPoint={selectedPoint}
                setSelectedPoint={setSelectedPoint}
                firstAnnotationInTheFuture={firstAnnotationInTheFuture === annotation}
              />
            ))}
          </div>
        </ResizablePanel>
        <PanelResizeHandle className="h-full w-1 bg-chrome" />
        <ResizablePanel collapsible>
          {selectedPoint && annotation && (
            <ReduxDevToolsContents point={selectedPoint} time={annotation.time} />
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
    <div className="inspector devtools-toolbar devtools-input-toolbar">
      <div
        id="redux-search"
        className={classnames(
          "devtools-searchbox grow text-themeTextFieldColor",
          styles.ActionFilter
        )}
      >
        <input
          id="redux-searchbox"
          className="devtools-searchinput"
          type="input"
          placeholder="Filter..."
          autoComplete="off"
          value={searchValue}
          onChange={e => onSearch(e.target.value)}
        />
      </div>
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
