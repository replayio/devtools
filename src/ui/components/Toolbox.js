import React from "react";
import classnames from "classnames";
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
    await gToolbox.init("debugger");
  }

  selectPanel(panel) {
    if (
      this.props.panelCollapsed ||
      (this.state.debuggerMode == panel && !this.props.panelCollapsed)
    ) {
      this.props.togglePaneCollapse();
    }

    if (this.state.debuggerMode != panel) {
      this.setState({ debuggerMode: panel });
    }
  }

  renderToolbar() {
    const { debuggerMode } = this.state;
    return (
      <div id="toolbox-toolbar">
        <div
          className={classnames("toolbar-panel-button", { active: debuggerMode == "explorer" })}
          onClick={() => this.selectPanel("explorer")}
        >
          <div className="img explorer-panel toolbar-panel-icon"></div>
        </div>
        <div
          className={classnames("toolbar-panel-button", { active: debuggerMode == "debug" })}
          onClick={() => this.selectPanel("debug")}
        >
          <div className="img debugger-panel toolbar-panel-icon"></div>
        </div>
      </div>
    );
  }

  render() {
    const { debuggerMode } = this.state;

    return (
      <div id="toolbox">
        {this.renderToolbar()}
        <div className="toolbox-top-panels">
          <div className="toolbox-panel" id="toolbox-content-debugger">
            <DebuggerApp debuggerMode={debuggerMode} />
          </div>
        </div>
      </div>
    );
  }
}
export default connect(
  state => ({
    initializedPanels: selectors.getInitializedPanels(state),
    toolboxExpanded: selectors.getToolboxExpanded(state),
    panelCollapsed: selectors.getPaneCollapse(state),
    selectedPrimaryPanel: selectors.getSelectedPrimaryPanel(state),
  }),
  {
    setSelectedPrimaryPanel: actions.setSelectedPrimaryPanel,
    togglePaneCollapse: actions.togglePaneCollapse,
  }
)(Toolbox);
