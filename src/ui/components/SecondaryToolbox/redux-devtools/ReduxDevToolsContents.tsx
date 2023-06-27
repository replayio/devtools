import { ExecutionPoint, Value } from "@replayio/protocol";
import classnames from "classnames";
import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";

import Inspector from "replay-next/components/inspector/Inspector";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import {
  ReduxActionStateValues,
  actionStateValuesCache,
  diffCache,
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

// TODO This UI layout doesn't distinguish between multiple "instances" in a page.
// The backend data _ought_ to be set up so that each unique instance has its own
// current/previous state at all times, so clicking on any given action _should_
// result in a correct diff, but the list of actions will be all intermingled.
// Figure out a way to present that info in this UI - a dropdown next to the buttons?

export function ReduxDevToolsContents({ point, time }: RDTCProps) {
  const replayClient = useContext(ReplayClientContext);
  const [reduxValues, setReduxValues] = useState<ReduxActionStateValues | null>(null);
  const [diff, setDiff] = useState<Record<string, unknown> | null>(null);
  const [selectedTab, setSelectedTab] = useState<SelectedContentsTab>("action");

  useLayoutEffect(() => {
    async function fetchAction() {
      switch (selectedTab) {
        case "action":
        case "state": {
          const res = await actionStateValuesCache.readAsync(replayClient, point, time);
          setReduxValues(res ?? null);
          break;
        }
        case "diff": {
          const diffRes = await diffCache.readAsync(replayClient, point, time);
          setDiff(diffRes ?? null);
          break;
        }
      }
    }
    fetchAction();
  }, [replayClient, point, time, selectedTab]);

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
        />
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
      <div className={classnames("p3 flex h-full w-full overflow-auto", styles.tabsContainer)}>
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

      <div className="font-mono">{contents}</div>
    </>
  );
}
