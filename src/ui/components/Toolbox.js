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
    const {
      selectedPrimaryPanel,
      setSelectedPrimaryPanel,
      togglePaneCollapse,
      panelCollapsed,
    } = this.props;

    if (panelCollapsed || (selectedPrimaryPanel == panel && !panelCollapsed)) {
      togglePaneCollapse();
    }

    if (selectedPrimaryPanel != panel) {
      setSelectedPrimaryPanel(panel);
    }
  }

  renderToolbar() {
    const { selectedPrimaryPanel } = this.props;

    return (
      <div id="toolbox-toolbar">
        <div
          className={classnames("toolbar-panel-button", {
            active: selectedPrimaryPanel == "explorer",
          })}
          onClick={() => this.selectPanel("explorer")}
        >
          <div className="img explorer-panel toolbar-panel-icon"></div>
        </div>
        <div
          className={classnames("toolbar-panel-button", {
            active: selectedPrimaryPanel == "debug",
          })}
          onClick={() => this.selectPanel("debug")}
        >
          <div className="img debugger-panel toolbar-panel-icon"></div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div id="toolbox">
        {this.renderToolbar()}
        <div className="toolbox-top-panels">
          <div className="toolbox-panel" id="toolbox-content-debugger">
            <DebuggerApp />
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
