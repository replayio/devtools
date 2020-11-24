import React from "react";
import KeyShortcuts from "devtools/client/shared/key-shortcuts";

import DebuggerApp from "devtools/client/debugger/src/components/App";

import { connect } from "react-redux";
import { actions } from "../actions";
import { selectors } from "../reducers";

import "./Toolbox.css";

const shortcuts = new KeyShortcuts({ window, target: document });

class Toolbox extends React.Component {
  state = {
    debuggerMode: "explorer",
  };

  async componentDidMount() {
    const selectedPanel = "debugger";
    await gToolbox.init(selectedPanel);

    shortcuts.on("Esc", this.onEscape);
  }

  onEscape = e => {
    if (e.cancelBubble) {
      return;
    }

    this.toggleSplitConsole(!this.props.splitConsoleOpen);
  };

  toggleSplitConsole(open) {
    this.props.setSplitConsole(open);
  }

  renderToolbar() {
    return (
      <div id="toolbox-toolbar">
        <div
          className={"toolbar-panel-button active"}
          id="toolbox-toolbar-debugger"
          onClick={() => gToolbox.selectTool("debugger")}
        >
          <div className="toolbar-panel-icon"></div>
        </div>
        <div
          className="toolbar-panel-button toolbar-panel-button-sub"
          onClick={() => this.setState({ debuggerMode: "explorer" })}
        >
          <div
            className="img document toolbar-panel-icon"
            style={{ background: "#c9c9cb", height: "20px", width: "20px" }}
          />
        </div>
        <div
          className="toolbar-panel-button toolbar-panel-button-sub"
          onClick={() => this.setState({ debuggerMode: "debug" })}
        >
          <div style={{ height: "20px", width: "20px" }} className="img log toolbar-panel-icon" />
        </div>
      </div>
    );
  }

  getSplitBoxDimensions() {
    const { selectedPanel, splitConsoleOpen } = this.props;

    if (selectedPanel == "console") {
      // We intentionally don't pass in the `initialSize: "0%"` here. This is
      // important for when the split console is open, and we switch panels from
      // uncontrolled (console) to controlled (debugger/inspector). This way, the
      // controlled height is not stuck at 0% until we resize the panel manually.
      return {
        minSize: 0,
        maxSize: 0,
      };
    }

    if (splitConsoleOpen) {
      return {
        initialSize: "50%",
        minSize: "0%",
        maxSize: "100%",
      };
    }

    return {
      initialSize: "50%",
      minSize: "100%",
      maxSize: "100%",
    };
  }

  render() {
    const { debuggerMode } = this.state;

    const topPanels = (
      <div className="toolbox-top-panels">
        <div className="toolbox-panel" id="toolbox-content-debugger">
          <DebuggerApp debuggerMode={debuggerMode} />
        </div>
      </div>
    );

    return (
      <div id="toolbox">
        {this.renderToolbar()}
        {topPanels}
      </div>
    );
  }
}
export default connect(
  state => ({
    initializedPanels: selectors.getInitializedPanels(state),
    toolboxExpanded: selectors.getToolboxExpanded(state),
  }),
  {
    setSelectedPanel: actions.setSelectedPanel,
  }
)(Toolbox);
