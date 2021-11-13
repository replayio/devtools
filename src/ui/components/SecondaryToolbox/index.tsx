import React, { useEffect, useState } from "react";
import { connect, ConnectedProps, useStore } from "react-redux";
import classnames from "classnames";
import hooks from "ui/hooks";
import WebConsoleApp from "devtools/client/webconsole/components/App";

import NodePicker from "../NodePicker";
import { selectors } from "../../reducers";
import { actions } from "../../actions";
import ReactDevtoolsPanel from "./ReactDevTools";
import { UIState } from "ui/state";
import { PanelName } from "ui/state/app";
import { isDemo } from "ui/utils/environment";
import ToolboxOptions from "./ToolboxOptions";
import { trackEvent } from "ui/utils/telemetry";
import * as inspectorReducers from "devtools/client/inspector/reducers";
import { extendStore } from "ui/setup/store";

import "ui/setup/dynamic/inspector";
import { ConnectedRequestTable } from "../NetworkMonitor/RequestTable";
import { features } from "ui/utils/prefs";

let extendedStore = false;

const InspectorApp = React.lazy(() => import("devtools/client/inspector/components/App"));

interface PanelButtonsProps {
  hasReactComponents: boolean;
  isNode: boolean;
  selectedPanel: PanelName;
  setSelectedPanel: (panel: PanelName) => any;
}

function PanelButtons({
  hasReactComponents,
  isNode,
  selectedPanel,
  setSelectedPanel,
}: PanelButtonsProps) {
  const { userSettings } = hooks.useGetUserSettings();

  const showReact = userSettings.showReact;
  const showElements = userSettings.showElements;

  const onClick = (panel: PanelName) => {
    setSelectedPanel(panel);
    trackEvent(`toolbox.secondary.${panel}_select`);

    gToolbox.selectTool(panel);
  };

  return (
    <div className="flex flex-row items-center overflow-hidden text-sm">
      {showElements && !isNode && <NodePicker />}
      <button
        className={classnames("console-panel-button", {
          expanded: selectedPanel === "console",
        })}
        onClick={() => onClick("console")}
      >
        <div className="label">Console</div>
      </button>
      {showElements && !isNode && (
        <button
          className={classnames("inspector-panel-button", {
            expanded: selectedPanel === "inspector",
          })}
          onClick={() => onClick("inspector")}
        >
          <div className="label">Elements</div>
        </button>
      )}
      {hasReactComponents && showReact && (
        <button
          className={classnames("components-panel-button", {
            expanded: selectedPanel === "react-components",
          })}
          onClick={() => onClick("react-components")}
        >
          <div className="label">React</div>
        </button>
      )}
      {features.network && (
        <button
          className={classnames("console-panel-button", {
            expanded: selectedPanel === "network",
          })}
          onClick={() => onClick("network")}
        >
          <div className="label">Network</div>
        </button>
      )}
    </div>
  );
}

function ConsolePanel() {
  return (
    <div className="toolbox-bottom-panels">
      <div className={classnames("toolbox-panel")} id="toolbox-content-console">
        <WebConsoleApp />
      </div>
    </div>
  );
}

function InspectorPanel() {
  const store = useStore();
  const [extended, setExtended] = useState(extendedStore);

  useEffect(() => {
    if (!extended && store) {
      extendStore(store, {}, inspectorReducers, {});
      extendedStore = true;
      setExtended(true);
    }
  }, [store, extended]);

  if (!extended) return null;

  return (
    <div className={classnames("toolbox-panel theme-body")} id="toolbox-content-inspector">
      <React.Suspense fallback={null}>
        <InspectorApp />
      </React.Suspense>
    </div>
  );
}

function Panel({
  selectedPanel,
  hasReactComponents,
}: {
  selectedPanel: PanelName;
  hasReactComponents: boolean;
}) {
  const { userSettings } = hooks.useGetUserSettings();
  const showReact = userSettings.showReact;

  if (selectedPanel === "network") {
    return <ConnectedRequestTable />;
  }

  if (selectedPanel === "console") {
    return <ConsolePanel />;
  }

  if (selectedPanel === "inspector") {
    return <InspectorPanel />;
  }

  if (showReact && hasReactComponents && selectedPanel === "react-components") {
    <ReactDevtoolsPanel />;
  }

  return <ConsolePanel />;
}

function SecondaryToolbox({
  selectedPanel,
  setSelectedPanel,
  recordingTarget,
  hasReactComponents,
}: PropsFromRedux) {
  const isNode = recordingTarget === "node";

  return (
    <div className={classnames(`secondary-toolbox rounded-lg`, { node: isNode })}>
      {!isDemo() && (
        <header className="secondary-toolbox-header">
          <PanelButtons
            selectedPanel={selectedPanel}
            setSelectedPanel={setSelectedPanel}
            isNode={isNode}
            hasReactComponents={hasReactComponents}
          />
          <ToolboxOptions />
        </header>
      )}
      <div className="secondary-toolbox-content text-xs">
        <Panel selectedPanel={selectedPanel} hasReactComponents={hasReactComponents} />
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    selectedPanel: selectors.getSelectedPanel(state),
    recordingTarget: selectors.getRecordingTarget(state),
    showVideoPanel: selectors.getShowVideoPanel(state),
    hasReactComponents: selectors.hasReactComponents(state),
  }),
  { setSelectedPanel: actions.setSelectedPanel, setShowVideoPanel: actions.setShowVideoPanel }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(SecondaryToolbox);
