import React from "react";
import classnames from "classnames";
import { connect } from "react-redux";
import { actions } from "../actions";
import { selectors } from "../reducers";

import UserOptions from "ui/components/Header/UserOptions";
import IconWithTooltip from "ui/components/shared/IconWithTooltip";

function Toolbar({
  selectedPrimaryPanel,
  setSelectedPrimaryPanel,
  togglePaneCollapse,
  panelCollapsed,
}) {
  const onClick = panel => {
    if (panelCollapsed || (selectedPrimaryPanel == panel && !panelCollapsed)) {
      togglePaneCollapse();
    }

    if (selectedPrimaryPanel != panel) {
      setSelectedPrimaryPanel(panel);
    }
  };

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
            handleClick={() => onClick("explorer")}
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
            handleClick={() => onClick("debug")}
          />
        </div>
      </div>
      <UserOptions mode="devtools" />
    </div>
  );
}

export default connect(
  state => ({
    initializedPanels: selectors.getInitializedPanels(state),
    panelCollapsed: selectors.getPaneCollapse(state),
    selectedPrimaryPanel: selectors.getSelectedPrimaryPanel(state),
    selectedPanel: selectors.getSelectedPanel(state),
  }),
  {
    setSelectedPrimaryPanel: actions.setSelectedPrimaryPanel,
    togglePaneCollapse: actions.togglePaneCollapse,
  }
)(Toolbar);
