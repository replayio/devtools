import { ExecutionPoint, Value } from "@replayio/protocol";
import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";

import Inspector from "replay-next/components/inspector/Inspector";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import {
  ReduxActionStateValues,
  calculateStateDiff,
  fetchReduxValuesAtPoint,
} from "./injectReduxDevtoolsProcessing";
import { JSONDiff, labelRenderer } from "./JSONDiff";
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

interface RDTCProps {
  point: ExecutionPoint;
  time: number;
}

export function ReduxDevToolsContents({ point, time }: RDTCProps) {
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
