import React from "react";
import {flushSync} from "react-dom";
import { connect } from "react-redux";
import classnames from "classnames";
import hooks from "ui/hooks";
import Video from "../Video";
import WebConsoleApp from "devtools/client/webconsole/components/App";
import InspectorApp from "devtools/client/inspector/components/App";
import {
  createBridge,
  createStore,
  initialize as createDevTools
} from 'react-devtools-inline/frontend';
import { ThreadFront } from "protocol/thread";

import "./SecondaryToolbox.css";
import NodePicker from "../NodePicker";
import { selectors } from "../../reducers";
import { actions } from "../../actions";

let bridge, store, wall, DevTools;

function InitDevTools() {
  const target = {
    postMessage: function() {
    },
  };

  wall = {
    emit({ data }) {},
    listen(listener) {
      wall._listener = listener;
    },
    send(event: string, payload: any, transferable?: Array<any>) {
      wall._listener({event, payload});
    },
  };

  bridge = createBridge(target, wall);
  store = createStore(bridge);
  DevTools = createDevTools(target, {bridge, store});
}

InitDevTools();

const messages = [];
ThreadFront.getAnnotations(({ annotations }) => {
  for (const { point, time, kind, contents } of annotations) {
    const message = JSON.parse(contents);
    messages.push({point, time, message});
  }
});

let currentTime = null;
let rerenderComponentsTab;

ThreadFront.on("paused", data => {
  if (currentTime === data.time) {
    return;
  }

  InitDevTools()

  // TODO Use point AND time eventually
  messages
    .filter(({ time }) => time <= data.time)
    .forEach(({message}) => {
      if (message.event === 'operations') {
        wall.send(message.event, message.payload);
      }
    });

  // HACK TODO This should use a subscription
  if (typeof rerenderComponentsTab === 'function') {
    rerenderComponentsTab();
  }
});

function PanelButtons({ selectedPanel, setSelectedPanel, narrowMode }) {
  const {
    userSettings: { show_elements },
  } = hooks.useGetUserSettings();

  const onClick = panel => {
    setSelectedPanel(panel);

    // The comments panel doesn't have to be initialized by the toolbox,
    // only the console and the inspector.
    if (panel !== "comments") {
      gToolbox.selectTool(panel);
    }
  };

  return (
    <div className="panel-buttons">
      <NodePicker />
      <button
        className={classnames("console-panel-button", { expanded: selectedPanel === "console" })}
        onClick={() => onClick("console")}
      >
        <div className="label">Console</div>
      </button>
      {show_elements && (
        <button
          className={classnames("inspector-panel-button", {
            expanded: selectedPanel === "inspector",
          })}
          onClick={() => onClick("inspector")}
        >
          <div className="label">Elements</div>
        </button>
      )}
      {narrowMode ? (
        <button
          className={classnames("viewer-panel-button", { expanded: selectedPanel === "viewer" })}
          onClick={() => onClick("viewer")}
        >
          <div className="label">Viewer</div>
        </button>
      ) : null}
      <button
        className={classnames("components-panel-button", { expanded: selectedPanel === "components" })}
        onClick={() => onClick("components")}
      >
        <div className="label">⚛️ Components</div>
      </button>
    </div>
  );
}

function ConsolePanel() {
  return (
    <div className="toolbox-bottom-panels" style={{ overflow: "hidden" }}>
      <div className={classnames("toolbox-panel")} id="toolbox-content-console">
        <WebConsoleApp />
      </div>
    </div>
  );
}

function InspectorPanel() {
  return (
    <div className={classnames("toolbox-panel theme-body")} id="toolbox-content-inspector">
      <InspectorApp />
    </div>
  );
}

// TODO Pass custom bridge
// TODO Use portal containers for Profiler & Components
function Components() {
  const [count, setCount] = React.useState(0);

  // HACK TODO This hack handles the fact that DevTools wasn't writen
  // with the expectation that a new Bridge or Store prop would be pasesd
  // and doens't handle that case properly.
  rerenderComponentsTab = () => {
    setCount(count+1);
  };

  return (
    <DevTools
      bridge={bridge}
      browserTheme="light"
      enabledInspectedElementContextMenu={false}
      overrideTab="components"
      showTabBar={false}
      store={store}
    />
  );
}

function SecondaryToolbox({ selectedPanel, setSelectedPanel, narrowMode }) {
  const {
    userSettings: { show_elements },
  } = hooks.useGetUserSettings();

  return (
    <div className="secondary-toolbox">
      <header className="secondary-toolbox-header">
        <PanelButtons
          narrowMode={narrowMode}
          selectedPanel={selectedPanel}
          setSelectedPanel={setSelectedPanel}
        />
      </header>
      <div className="secondary-toolbox-content">
        {selectedPanel == "console" ? <ConsolePanel /> : null}
        {selectedPanel == "inspector" && show_elements ? <InspectorPanel /> : null}
        {selectedPanel == "viewer" && narrowMode ? <Video /> : null}
        {selectedPanel == "components" ? <Components /> : null}
      </div>
    </div>
  );
}

export default connect(
  state => ({
    selectedPanel: selectors.getSelectedPanel(state),
    narrowMode: selectors.getNarrowMode(state),
  }),
  { setSelectedPanel: actions.setSelectedPanel }
)(SecondaryToolbox);
