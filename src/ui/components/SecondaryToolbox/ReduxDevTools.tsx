import { ExecutionPoint } from "@replayio/protocol";
import classnames from "classnames";
import React, { useContext, useMemo, useState } from "react";
import { PanelGroup, PanelResizeHandle, Panel as ResizablePanel } from "react-resizable-panels";
import { useImperativeCacheValue } from "suspense";

import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { isPointInRegion } from "shared/utils/time";
import { seek } from "ui/actions/timeline";
import { getCurrentTime, getFocusWindow } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { reduxDevToolsAnnotationsCache } from "ui/suspense/annotationsCaches";

import { JumpToCodeButton } from "../shared/JumpToCodeButton";
import { ReduxActionAnnotation } from "./redux-devtools/redux-annotations";
import { ReduxDevToolsContents } from "./redux-devtools/ReduxDevToolsContents";
import styles from "./ReduxDevTools.module.css";

export const ReduxDevToolsPanel = () => {
  const client = useContext(ReplayClientContext);
  const [selectedPoint, setSelectedPoint] = useState<ExecutionPoint | null>(null);
  const focusWindow = useAppSelector(getFocusWindow);

  const { status: annotationsStatus, value: parsedAnnotations } = useImperativeCacheValue(
    reduxDevToolsAnnotationsCache,
    client
  );
  const currentTime = useAppSelector(getCurrentTime);

  const reduxAnnotations: ReduxActionAnnotation[] = useMemo(() => {
    const annotations = annotationsStatus === "resolved" ? parsedAnnotations : [];
    return annotations.filter(
      annotation => focusWindow && isPointInRegion(annotation.point, focusWindow)
    );
  }, [parsedAnnotations, annotationsStatus, focusWindow]);

  const annotation = reduxAnnotations.find(ann => ann.point === selectedPoint)!;

  const firstAnnotationInTheFuture = reduxAnnotations.find(
    annotation => annotation.time >= currentTime
  );

  return (
    <div className={classnames("flex min-h-full bg-bodyBgcolor p-1 text-xs", styles.actions)}>
      <PanelGroup autoSaveId="ReduxDevTools" direction="horizontal">
        <ResizablePanel collapsible>
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
        <PanelResizeHandle className={styles.ResizeHandle}>
          <div className={styles.ResizeHandleBar} />
        </PanelResizeHandle>

        <ResizablePanel collapsible>
          {selectedPoint && annotation && (
            <ReduxDevToolsContents point={selectedPoint} time={annotation.time} />
          )}
        </ResizablePanel>
      </PanelGroup>
    </div>
  );
};

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
    dispatch(seek(annotation.point, annotation.time, true));
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
