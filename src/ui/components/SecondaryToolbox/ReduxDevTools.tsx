import { ExecutionPoint } from "@replayio/protocol";
import classnames from "classnames";
import React, { useContext, useState } from "react";
import { PanelGroup, PanelResizeHandle, Panel as ResizablePanel } from "react-resizable-panels";
import { useImperativeCacheValue } from "suspense";

import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { reduxDevToolsAnnotationsCache } from "ui/suspense/annotationsCaches";

import { ReduxActionAnnotation } from "./redux-devtools/redux-annotations";
import { ReduxDevToolsContents } from "./redux-devtools/ReduxDevToolsContents";
import styles from "./ReduxDevTools.module.css";

export const ReduxDevToolsPanel = () => {
  const client = useContext(ReplayClientContext);
  const [selectedPoint, setSelectedPoint] = useState<ExecutionPoint | null>(null);

  const { status: annotationsStatus, value: parsedAnnotations } = useImperativeCacheValue(
    reduxDevToolsAnnotationsCache,
    client
  );

  const reduxAnnotations: ReduxActionAnnotation[] =
    annotationsStatus === "resolved" ? parsedAnnotations : [];

  const annotation = reduxAnnotations.find(ann => ann.point === selectedPoint)!;

  return (
    <div className={classnames("flex min-h-full bg-bodyBgcolor p-1 text-xs", styles.actions)}>
      <PanelGroup autoSaveId="ReduxDevTools" direction="horizontal">
        <ResizablePanel collapsible>
          <div role="list" className="h-full overflow-y-auto">
            {reduxAnnotations.map(annotation => (
              <ActionItem
                key={annotation.point}
                annotation={annotation}
                selectedPoint={selectedPoint}
                setSelectedPoint={setSelectedPoint}
              />
            ))}
          </div>
        </ResizablePanel>
        <PanelResizeHandle className={styles.ResizeHandle}>
          <div className={styles.ResizeHandleBar} />
        </PanelResizeHandle>

        <ResizablePanel collapsible>
          <div className="ml-1 grow">
            {selectedPoint && (
              <ReduxDevToolsContents point={selectedPoint} time={annotation.time} />
            )}
          </div>
        </ResizablePanel>
      </PanelGroup>
    </div>
  );
};

function ActionItem({
  annotation,
  selectedPoint,
  setSelectedPoint,
}: {
  annotation: ReduxActionAnnotation;
  selectedPoint: ExecutionPoint | null;
  setSelectedPoint: (point: ExecutionPoint | null) => void;
}) {
  return (
    <div
      key={annotation.point}
      className={classnames("cursor-pointer text-xs", {
        [styles.selected]: annotation.point === selectedPoint,
      })}
      role="listitem"
      onClick={() => setSelectedPoint(annotation.point)}
    >
      {annotation.payload.actionType}
    </div>
  );
}

export default ReduxDevToolsPanel;
