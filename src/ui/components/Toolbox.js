import React from "react";
import classnames from "classnames";
import KeyShortcuts from "devtools/client/shared/key-shortcuts";

import DebuggerApp from "devtools/client/debugger/src/components/App";
import UserOptions from "ui/components/Header/UserOptions";
import IconWithTooltip from "ui/components/shared/IconWithTooltip";

import { connect } from "react-redux";
import { actions } from "../actions";
import { selectors } from "../reducers";

import "./Toolbox.css";

const shortcuts = new KeyShortcuts({ window, target: document });

class Toolbox extends React.Component {
  state = {
    debuggerMode: "explorer",
  };

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
      <div className="toolbox-toolbar-container">
        <div id="toolbox-toolbar">
          <div
            className={classnames("toolbar-panel-button", {
              active: selectedPrimaryPanel == "explorer",
            })}
          >
            <IconWithTooltip
              icon={<div className="img explorer-panel toolbar-panel-icon" />}
              content={"Source Explorer"}
              handleClick={() => this.selectPanel("explorer")}
            />
          </div>
          <div
            className={classnames("toolbar-panel-button", {
              active: selectedPrimaryPanel == "debug",
            })}
          >
            <IconWithTooltip
              icon={<div className="img debugger-panel toolbar-panel-icon" />}
              content={"Pause Information"}
              handleClick={() => this.selectPanel("debug")}
            />
          </div>
        </div>
        <UserOptions />
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
    selectedPanel: selectors.getSelectedPanel(state),
  }),
  {
    setSelectedPrimaryPanel: actions.setSelectedPrimaryPanel,
    togglePaneCollapse: actions.togglePaneCollapse,
  }
)(Toolbox);
