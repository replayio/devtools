import { ExecutionPoint, Value } from "@replayio/protocol";
import classnames from "classnames";
import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";

import Inspector from "replay-next/components/inspector/Inspector";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import {
  ReduxActionStateValues,
  calculateStateDiff,
  fetchReduxValuesAtPoint,
} from "./injectReduxDevtoolsProcessing";
import { JSONDiff, labelRenderer } from "./JSONDiff";
import styles from "../ReduxDevTools.module.css";

// TODO Get the rest of these replaced with intentional colors
// `react-json-tree` uses specific field names to look up its colors.
// For now I've just inserted our background and text colors in the
// right fields, so it sorta follows our theming.
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

interface PanelButtonProps {
  selected: boolean;
  children: React.ReactNode;
  name: string;
  onClick: (name: string) => void;
}

const PanelButton = ({ selected, children, name, onClick }: PanelButtonProps) => {
  return (
    <button
      className={classnames(styles.contentsTab, {
        [styles.selectedTab]: selected,
      })}
      onClick={() => onClick(name)}
    >
      <div>{children}</div>
    </button>
  );
};

interface RDTCProps {
  point: ExecutionPoint;
  time: number;
}

type SelectedContentsTab = "action" | "state" | "diff";

export function ReduxDevToolsContents({ point, time }: RDTCProps) {
  const replayClient = useContext(ReplayClientContext);
  const [reduxValues, setReduxValues] = useState<ReduxActionStateValues | null>(null);
  const [diff, setDiff] = useState<Record<string, unknown> | null>(null);
  const [selectedTab, setSelectedTab] = useState<SelectedContentsTab>("action");

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

  let contents: React.ReactNode;

  switch (selectedTab) {
    case "action": {
      contents = actionValue && (
        <Inspector
          key={point + "action"}
          pauseId={pauseId!}
          protocolValue={actionValue}
          context="console"
          expandByDefault={true}
        ></Inspector>
      );
      break;
    }
    case "state": {
      contents = stateValue && (
        <Inspector
          key={point + "state"}
          pauseId={pauseId!}
          protocolValue={stateValue}
          context="console"
          expandByDefault={true}
        ></Inspector>
      );
      break;
    }
    case "diff": {
      contents = diff && (
        <JSONDiff
          delta={diff}
          base16Theme={replayBase16Theme}
          styling={() => ({})}
          invertTheme={false}
          isWideLayout={false}
          dataTypeKey=""
          labelRenderer={labelRenderer}
        />
      );
      break;
    }
  }

  return (
    <>
      <div className="p3 flex">
        <PanelButton
          selected={selectedTab === "action"}
          name="action"
          onClick={() => {
            setSelectedTab("action");
          }}
        >
          Action
        </PanelButton>
        <PanelButton
          selected={selectedTab === "state"}
          name="state"
          onClick={() => {
            setSelectedTab("state");
          }}
        >
          State
        </PanelButton>
        <PanelButton
          selected={selectedTab === "diff"}
          name="diff"
          onClick={() => {
            setSelectedTab("diff");
          }}
        >
          Diff
        </PanelButton>
      </div>

      <div className="font-mono text-sm">{contents}</div>
    </>
  );
}
