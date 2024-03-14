import { Suspense, useContext, useEffect, useMemo, useState } from "react";
import { PanelGroup, PanelResizeHandle, Panel as ResizablePanel } from "react-resizable-panels";
import { useImperativeCacheValue } from "suspense";

import { getExecutionPoint } from "devtools/client/debugger/src/selectors";
import IndeterminateLoader from "replay-next/components/IndeterminateLoader";
import Loader from "replay-next/components/Loader";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { isExecutionPointsGreaterThan } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { isPointInRegion } from "shared/utils/time";
import { ActionFilter } from "ui/components/SecondaryToolbox/redux-devtools/ActionFilter";
import { ReduxActionAnnotation } from "ui/components/SecondaryToolbox/redux-devtools/annotations";
import { ReduxDevToolsContents } from "ui/components/SecondaryToolbox/redux-devtools/ReduxDevToolsContents";
import { ReduxDevToolsList } from "ui/components/SecondaryToolbox/redux-devtools/ReduxDevToolsList";
import { useAppSelector } from "ui/setup/hooks";
import { reduxDevToolsAnnotationsCache } from "ui/suspense/annotationsCaches";
import { applyMiddlewareDeclCache } from "ui/suspense/jumpToLocationCache";

import styles from "./ReduxDevToolsPanel.module.css";

const POSSIBLE_TIMEOUT_AFTER_MS = 30_000;

export default function ReduxDevToolsPanel() {
  const client = useContext(ReplayClientContext);
  const { range: focusWindow } = useContext(FocusContext);

  const [selectedAnnotation, selectAnnotation] = useState<ReduxActionAnnotation | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const currentExecutionPoint = useAppSelector(getExecutionPoint);

  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const { status: annotationsStatus, value: parsedAnnotations } = useImperativeCacheValue(
    reduxDevToolsAnnotationsCache,
    client
  );

  useEffect(() => {
    switch (annotationsStatus) {
      case "pending": {
        const timeout = setTimeout(() => {
          setShowTimeoutMessage(true);
        }, POSSIBLE_TIMEOUT_AFTER_MS);
        return () => {
          clearTimeout(timeout);
        };
      }
      default: {
        setShowTimeoutMessage(false);
        break;
      }
    }
  }, [annotationsStatus]);

  const [filteredAnnotations, firstAnnotationAfterCurrentExecutionPoint] = useMemo(() => {
    let filteredAnnotations: ReduxActionAnnotation[] = [];
    let firstAnnotationAfterCurrentExecutionPoint: ReduxActionAnnotation | null = null;

    if (annotationsStatus === "resolved" && parsedAnnotations) {
      parsedAnnotations.forEach(annotation => {
        if (
          focusWindow &&
          isPointInRegion(annotation.point, focusWindow) &&
          annotation.payload.actionType.toLowerCase().includes(searchValue.toLowerCase())
        ) {
          filteredAnnotations.push(annotation);
        }

        if (firstAnnotationAfterCurrentExecutionPoint == null && currentExecutionPoint != null) {
          if (
            annotation.point === currentExecutionPoint ||
            isExecutionPointsGreaterThan(annotation.point, currentExecutionPoint)
          ) {
            firstAnnotationAfterCurrentExecutionPoint = annotation;
          }
        }
      });
    }

    return [filteredAnnotations, firstAnnotationAfterCurrentExecutionPoint];
  }, [annotationsStatus, currentExecutionPoint, focusWindow, parsedAnnotations, searchValue]);

  useEffect(() => {
    // Preload the cache for where `applyMiddleware` is defined
    // This will speed up the first click on a Redux "J2C" button
    applyMiddlewareDeclCache.prefetch(client);
  }, [client]);

  return (
    <div className={styles.Container} data-test-id="ReduxDevtools">
      <PanelGroup autoSaveId="ReduxDevTools" direction="horizontal">
        <ResizablePanel minSize={35}>
          <div className={styles.LeftPanel}>
            <ActionFilter searchValue={searchValue} onSearch={setSearchValue} />
            <div className={styles.ListContainer}>
              {annotationsStatus === "pending" ? (
                <IndeterminateLoader
                  message={
                    <>
                      <p>Processing Redux actions…</p>
                      {showTimeoutMessage && (
                        <p className={styles.TimeoutPossibleErrorMessage}>
                          This is taking longer than expected, which may indicate an error.
                        </p>
                      )}
                    </>
                  }
                />
              ) : (
                <ReduxDevToolsList
                  annotations={filteredAnnotations}
                  firstAnnotationAfterCurrentExecutionPoint={
                    firstAnnotationAfterCurrentExecutionPoint
                  }
                  selectedAnnotation={selectedAnnotation}
                  selectAnnotation={selectAnnotation}
                />
              )}
            </div>
          </div>
        </ResizablePanel>
        <PanelResizeHandle className={styles.ResizeHandle} />
        <ResizablePanel minSize={35}>
          {selectedAnnotation && (
            <Suspense fallback={<Loader />}>
              <ReduxDevToolsContents
                point={selectedAnnotation.point}
                time={selectedAnnotation.time}
              />
            </Suspense>
          )}
        </ResizablePanel>
      </PanelGroup>
    </div>
  );
}
