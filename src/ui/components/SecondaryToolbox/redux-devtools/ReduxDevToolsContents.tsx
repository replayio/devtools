import {
  ExecutionPoint,
  PauseId,
  PointDescription,
  NamedValue as ProtocolNamedValue,
  Value as ProtocolValue,
} from "@replayio/protocol";
import classnames from "classnames";
import React, { Suspense, useContext, useState } from "react";

import NewFrames from "devtools/client/debugger/src/components/SecondaryPanes/Frames/NewFrames";
import IndeterminateLoader from "replay-next/components/IndeterminateLoader";
import Inspector from "replay-next/components/inspector";
import PropertiesRenderer from "replay-next/components/inspector/PropertiesRenderer";
import Loader from "replay-next/components/Loader";
import { clientValueCache, objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useAppSelector } from "ui/setup/hooks";
import { reduxDispatchJumpLocationCache } from "ui/suspense/jumpToLocationCache";

import {
  ReduxActionStateValues,
  actionStateValuesCache,
  diffCache,
} from "./injectReduxDevtoolsProcessing";
import { JSONDiff, labelRenderer } from "./JSONDiff";
import styles from "./ReduxDevToolsContents.module.css";

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
      className={classnames(styles.Tab, {
        [styles.SelectedTab]: selected,
      })}
      onClick={() => onClick(name)}
    >
      <div>{children}</div>
    </button>
  );
};

function RDTInspector({
  pauseId,
  protocolValue,
  path,
}: {
  path?: string;
  pauseId: PauseId;
  protocolValue: ProtocolValue | ProtocolNamedValue;
}) {
  const client = useContext(ReplayClientContext);
  const clientValue = clientValueCache.read(client, pauseId, protocolValue);

  switch (clientValue.type) {
    case "array":
    case "function":
    case "html-element":
    case "html-text":
    case "map":
    case "object":
    case "regexp":
    case "set": {
      const objectWithPreview = objectCache.read(
        client,
        pauseId,
        clientValue.objectId!,
        "canOverflow"
      );
      if (objectWithPreview == null) {
        throw Error(`Could not find object with ID "${clientValue.objectId!}"`);
      }

      return (
        <div className={styles.RDTInspector}>
          <Suspense fallback={<Loader />}>
            <PropertiesRenderer
              hidePrototype
              path={path}
              object={objectWithPreview}
              pauseId={pauseId}
            />
          </Suspense>
        </div>
      );
    }
    default: {
      return (
        <div className={styles.RDTInspector}>
          <Suspense fallback={<Loader />}>
            <Inspector
              className={styles.Inspector}
              context="default"
              expandByDefault={true}
              pauseId={pauseId!}
              protocolValue={protocolValue}
            />
          </Suspense>
        </div>
      );
    }
  }
}

interface RDTCProps {
  point: ExecutionPoint;
  time: number;
}

type SelectedContentsTab = "action" | "state" | "diff" | "trace";

// TODO This UI layout doesn't distinguish between multiple "instances" in a page.
// The backend data _ought_ to be set up so that each unique instance has its own
// current/previous state at all times, so clicking on any given action _should_
// result in a correct diff, but the list of actions will be all intermingled.
// Figure out a way to present that info in this UI - a dropdown next to the buttons?

export function ReduxDevToolsContents({ point, time }: RDTCProps) {
  const [selectedTab, setSelectedTab] = useState<SelectedContentsTab>("action");

  return (
    <div className={styles.Container}>
      <div className={styles.TabsContainer} data-test-id="ReduxTabsContainer">
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
        <PanelButton
          selected={selectedTab === "trace"}
          name="trace"
          onClick={() => {
            setSelectedTab("trace");
          }}
        >
          Stack
        </PanelButton>
      </div>

      <div className={styles.ContentsContainer} data-test-id="ReduxDevToolsContents">
        <Suspense fallback={<IndeterminateLoader />}>
          <TabContents selectedTab={selectedTab} point={point} time={time} />
        </Suspense>
      </div>
    </div>
  );
}

function TabContents({
  selectedTab,
  point,
  time,
}: RDTCProps & { selectedTab: SelectedContentsTab }) {
  const replayClient = useContext(ReplayClientContext);
  let reduxValues: ReduxActionStateValues | null = null;
  let diff: Record<string, unknown> | null = null;
  let jumpLocation: PointDescription | null = null;
  const sourcesState = useAppSelector(state => state.sources);

  switch (selectedTab) {
    case "action":
    case "state": {
      const res = actionStateValuesCache.read(replayClient, point, time);
      reduxValues = res ?? null;
      break;
    }
    case "diff": {
      const diffRes = diffCache.read(replayClient, point, time);
      diff = diffRes ?? null;
      break;
    }
    case "trace": {
      const jumpLocationRes = reduxDispatchJumpLocationCache.read(replayClient, point, time);
      jumpLocation = jumpLocationRes ?? null;
      break;
    }
  }

  const [pauseId, actionValue, stateValue] = reduxValues ?? [];
  let contents: React.ReactNode;

  switch (selectedTab) {
    case "action": {
      contents = actionValue && (
        <RDTInspector key={point + "action"} pauseId={pauseId!} protocolValue={actionValue} />
      );
      break;
    }
    case "state": {
      contents = stateValue && (
        <RDTInspector key={point + "state"} pauseId={pauseId!} protocolValue={stateValue} />
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
    case "trace": {
      contents = jumpLocation && (
        <NewFrames panel="debugger" point={jumpLocation.point} time={jumpLocation.time} />
      );
      break;
    }
  }

  return contents ?? null;
}
