import { ExecutionPoint, Value } from "@replayio/protocol";
import classnames from "classnames";
import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";

import Inspector from "replay-next/components/inspector/Inspector";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getRecordingId } from "ui/utils/recording";

import {
  ReduxActionStateValues,
  fetchReduxValuesAtPoint,
} from "./redux-devtools/injectReduxDevtoolsProcessing";
import type { ReduxActionAnnotation } from "./redux-devtools/redux-annotations";
import {
  exampleReduxAnnotations,
  processReduxAnnotations,
} from "./redux-devtools/redux-annotations";
import styles from "./ReduxDevTools.module.css";

interface RACProps {
  point: ExecutionPoint;
  time: number;
}

function ReduxActionContents({ point, time }: RACProps) {
  const replayClient = useContext(ReplayClientContext);
  const [reduxValues, setReduxValues] = useState<ReduxActionStateValues | null>(null);

  useLayoutEffect(() => {
    async function fetchAction() {
      const res = await fetchReduxValuesAtPoint(replayClient, point, time);

      setReduxValues(res ?? null);
    }
    fetchAction();
  }, [replayClient, point, time]);

  const [pauseId, actionValue, stateValue] = reduxValues ?? [];
  return (
    <div>
      <h4 className="text-base font-bold">Action</h4>
      {actionValue && (
        <Inspector
          key={point + "action"}
          pauseId={pauseId!}
          protocolValue={actionValue}
          context="console"
          expandByDefault={true}
        ></Inspector>
      )}

      <h4 className="text-base font-bold">State</h4>
      {stateValue && (
        <Inspector
          key={point + "state"}
          pauseId={pauseId!}
          protocolValue={stateValue}
          context="console"
          expandByDefault={true}
        ></Inspector>
      )}
    </div>
  );
}

export const ReduxDevToolsPanel = () => {
  const [reduxAnnotations, setReduxAnnotations] = useState<ReduxActionAnnotation[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<ExecutionPoint | null>(null);
  const isStrictEffectsSecondRenderRef = useRef(false);

  useEffect(() => {
    // TODO Re-enable Redux DevTools annotations handling
    const recordingId = getRecordingId();

    if (recordingId !== "1ff386de-f3b4-4ff1-a5a3-8c137387b620") {
      return;
    }

    // React will double-run effects in dev. Avoid trying to subscribe twice,
    // as `socket.ts` throws errors if you call `getAnnotations()` more than once.
    if (isStrictEffectsSecondRenderRef.current) {
      return;
    }

    isStrictEffectsSecondRenderRef.current = true;

    if (exampleReduxAnnotations.length) {
      // Pre-process Redux annotations by parsing the string messages,
      // then add them to the state array and pass down via context.
      setReduxAnnotations(prevAnnotations =>
        prevAnnotations.concat(processReduxAnnotations(exampleReduxAnnotations))
      );
    }
  }, []);

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
    contents = <ReduxActionContents point={selectedPoint} time={annotation.time} />;
  }

  return (
    <div className={classnames("flex min-h-full bg-bodyBgcolor p-1", styles.frames)}>
      <div className="border-right-black max-w-s flex flex-col pr-2">
        <h3 className="text-lg font-bold">Actions</h3>
        <div role="list">{renderedActions}</div>
      </div>
      <div className="ml-1 grow">
        <h3 className="text-lg font-bold">Contents</h3>
        {contents}
      </div>
    </div>
  );
};
