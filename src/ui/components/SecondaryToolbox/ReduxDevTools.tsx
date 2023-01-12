import { ExecutionPoint, Value } from "@replayio/protocol";
import classnames from "classnames";
import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";

import Inspector from "replay-next/components/inspector/Inspector";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getRecordingId } from "ui/utils/recording";

import {
  ReduxActionStateValues,
  calculateStateDiff,
  fetchReduxValuesAtPoint,
} from "./redux-devtools/injectReduxDevtoolsProcessing";
import { JSONDiff, labelRenderer } from "./redux-devtools/JSONDiff";
import type { ReduxActionAnnotation } from "./redux-devtools/redux-annotations";
import {
  exampleReduxAnnotations,
  processReduxAnnotations,
} from "./redux-devtools/redux-annotations";
import styles from "./ReduxDevTools.module.css";

const replayBase16Theme = {
  base00: "var(--body-bgcolor)",
  base01: "red",
  base02: "green",
  base03: "blue",
  base04: "#84898c",
  base05: "#9ea7a6",
  base06: "#a7cfa3",
  base07: "#b5d8f6",
  base08: "#2a5491",
  base09: "#43820d",
  base0A: "#a03b1e",
  base0B: "#237986",
  base0C: "#b02f30",
  base0D: "var(--body-color)",
  base0E: "#c59820",
  base0F: "#c98344",
};

interface RACProps {
  point: ExecutionPoint;
  time: number;
}

function ReduxActionContents({ point, time }: RACProps) {
  const replayClient = useContext(ReplayClientContext);
  const [reduxValues, setReduxValues] = useState<ReduxActionStateValues | null>(null);
  const [diff, setDiff] = useState<Record<string, unknown> | null>(null);

  useLayoutEffect(() => {
    async function fetchAction() {
      const res = await fetchReduxValuesAtPoint(replayClient, point, time);

      setReduxValues(res ?? null);

      const diffRes = await calculateStateDiff(replayClient, point, time);
      if (diffRes) {
        setDiff(diffRes);
      }
    }
    fetchAction();
  }, [replayClient, point, time]);

  const [pauseId, actionValue, stateValue] = reduxValues ?? [];
  return (
    <div>
      <h4 className="text-base font-bold">Action</h4>
      {actionValue && (
        <div className="font-mono text-sm">
          <Inspector
            key={point + "action"}
            pauseId={pauseId!}
            protocolValue={actionValue}
            context="console"
            expandByDefault={true}
          ></Inspector>
        </div>
      )}

      <h4 className="text-base font-bold">State</h4>
      {stateValue && (
        <div className="font-mono text-sm">
          <Inspector
            key={point + "state"}
            pauseId={pauseId!}
            protocolValue={stateValue}
            context="console"
            expandByDefault={true}
          ></Inspector>
        </div>
      )}

      <h4 className="text-base font-bold">Diff</h4>
      {diff && (
        <div className="font-mono text-sm">
          <JSONDiff
            delta={diff}
            base16Theme={replayBase16Theme}
            styling={() => ({})}
            invertTheme={false}
            isWideLayout={false}
            dataTypeKey=""
            labelRenderer={labelRenderer}
          />
        </div>
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
