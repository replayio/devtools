import { ExecutionPoint } from "@replayio/protocol";
import classnames from "classnames";
import React, { useEffect, useRef, useState } from "react";

import { ThreadFront } from "protocol/thread";

import type { ReduxActionAnnotation } from "./redux-devtools/redux-annotations";
import { processReduxAnnotations } from "./redux-devtools/redux-annotations";
import { ReduxDevToolsContents } from "./redux-devtools/ReduxDevToolsContents";
import styles from "./ReduxDevTools.module.css";

export const ReduxDevToolsPanel = () => {
  const [reduxAnnotations, setReduxAnnotations] = useState<ReduxActionAnnotation[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<ExecutionPoint | null>(null);
  const isStrictEffectsSecondRenderRef = useRef(false);

  useEffect(() => {
    // React will double-run effects in dev. Avoid trying to subscribe twice,
    // as `socket.ts` throws errors if you call `getAnnotations()` more than once.
    if (isStrictEffectsSecondRenderRef.current) {
      return;
    }

    isStrictEffectsSecondRenderRef.current = true;

    // We only show this panel if we know that Redux annotations exist already
    ThreadFront.getAnnotations(annotations => {
      if (annotations.length) {
        // Pre-process Redux annotations by parsing the string messages,
        // then add them to the state array and pass down via context.
        setReduxAnnotations(prevAnnotations =>
          prevAnnotations.concat(processReduxAnnotations(annotations))
        );
      }
    }, "redux-devtools-data");
  }, []);

  // TODO Right now we're going to show _all_ actions in the list.
  // This could be a very long list, and the user may have intended
  // to have some of them filtered out via RDT options, which we
  // now have as `annotation.payload.shouldIgnoreAction`.
  // We could start filtering those out if appropriate.
  const renderedActions = reduxAnnotations.map(annotation => {
    return (
      <div
        key={annotation.point}
        className={classnames("font-mono text-sm", {
          [styles.selected]: annotation.point === selectedPoint,
        })}
        role="listitem"
        onClick={() => setSelectedPoint(annotation.point)}
      >
        {annotation.payload.actionType}
      </div>
    );
  });

  let contents: React.ReactNode;

  if (selectedPoint) {
    const annotation = reduxAnnotations.find(ann => ann.point === selectedPoint)!;
    contents = <ReduxDevToolsContents point={selectedPoint} time={annotation.time} />;
  }

  return (
    <div className={classnames("flex min-h-full bg-bodyBgcolor p-1", styles.actions)}>
      <div className="border-right-black max-w-s flex flex-col pr-2">
        <h3 className="text-lg font-bold">Actions</h3>
        <div role="list" className="overflow-auto">
          {renderedActions}
        </div>
      </div>
      <div className="ml-1 grow">{contents}</div>
    </div>
  );
};

export default ReduxDevToolsPanel;
