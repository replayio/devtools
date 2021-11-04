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
import { Redacted } from "../Redacted";
import ToolboxOptions from "./ToolboxOptions";
import { trackEvent } from "ui/utils/telemetry";
import * as inspectorReducers from "devtools/client/inspector/reducers";
import { extendStore } from "ui/setup/store";

import "ui/setup/dynamic/inspector";

let extendedStore = false;

const InspectorApp = React.lazy(() => import("devtools/client/inspector/components/App"));

interface PanelButtonsProps {
  selectedPanel: PanelName;
  setSelectedPanel: (panel: PanelName) => any;
  isNode: boolean;
  hasReactComponents: boolean;
}

function PanelButtons({
  selectedPanel,
  setSelectedPanel,
  isNode,
  hasReactComponents,
}: PanelButtonsProps) {
  const { userSettings } = hooks.useGetUserSettings();

  const showReact = userSettings.showReact;
  const showElements = userSettings.showElements;

  const onClick = (panel: PanelName) => {
    setSelectedPanel(panel);
    trackEvent(`toolbox.secondary.${panel}_select`);

    // The comments panel doesn't have to be initialized by the toolbox,
    // only the console and the inspector.
    if (panel !== "comments") {
      gToolbox.selectTool(panel);
    }
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

function SecondaryToolbox({
  selectedPanel,
  setSelectedPanel,
  recordingTarget,
  hasReactComponents,
}: PropsFromRedux) {
  const { userSettings } = hooks.useGetUserSettings();
  const showReact = userSettings.showReact;
  const isNode = recordingTarget === "node";

  return (
    <div className={classnames(`secondary-toolbox rounded-lg pt-2`, { node: isNode })}>
      {!isDemo() && (
        <header className="secondary-toolbox-header rounded-t-lg">
          <PanelButtons
            selectedPanel={selectedPanel}
            setSelectedPanel={setSelectedPanel}
            isNode={isNode}
            hasReactComponents={hasReactComponents}
          />
          <ToolboxOptions />
        </header>
      )}
      <Redacted className="secondary-toolbox-content text-xs">
        {selectedPanel === "console" ? <ConsolePanel /> : null}
        {selectedPanel === "inspector" ? <InspectorPanel /> : null}
        {showReact && hasReactComponents && selectedPanel === "react-components" ? (
          <ReactDevtoolsPanel />
        ) : null}
      </Redacted>
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
