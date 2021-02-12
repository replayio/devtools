import React from "react";
import classnames from "classnames";
import { connect } from "react-redux";
import { actions } from "../actions";
import { selectors } from "../reducers";

import IconWithTooltip from "ui/components/shared/IconWithTooltip";

function Toolbar({
  selectedPrimaryPanel,
  setSelectedPrimaryPanel,
  togglePaneCollapse,
  panelCollapsed,
  isPaused,
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
            active: selectedPrimaryPanel == "comments",
          })}
        >
          <IconWithTooltip
            icon={<div className="img comments-panel-icon toolbar-panel-icon" />}
            content={"Transcript and Comments"}
            handleClick={() => onClick("comments")}
          />
        </div>
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
            icon={
              <div
                className={classnames("img debugger-panel toolbar-panel-icon", {
                  paused: isPaused,
                })}
              />
            }
            content={"Pause Information"}
            handleClick={() => onClick("debug")}
          />
        </div>
      </div>
    </div>
  );
}

export default connect(
  state => ({
    initializedPanels: selectors.getInitializedPanels(state),
    panelCollapsed: selectors.getPaneCollapse(state),
    selectedPrimaryPanel: selectors.getSelectedPrimaryPanel(state),
    selectedPanel: selectors.getSelectedPanel(state),
    isPaused: selectors.getFrames(state)?.length > 0,
  }),
  {
    setSelectedPrimaryPanel: actions.setSelectedPrimaryPanel,
    togglePaneCollapse: actions.togglePaneCollapse,
  }
)(Toolbar);
