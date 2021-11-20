import React from "react";
import classnames from "classnames";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "../actions";
import { selectors } from "../reducers";

import IconWithTooltip from "ui/components/shared/IconWithTooltip";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { UIState } from "ui/state";
import { PrimaryPanelName } from "ui/state/app";
import { isDemo } from "ui/utils/environment";

// TODO [ryanjduffy]: Refactor shared styling more completely
import { trackEvent } from "ui/utils/telemetry";

function Toolbar({
  selectedPrimaryPanel,
  setSelectedPrimaryPanel,
  togglePaneCollapse,
  panelCollapsed,
  viewMode,
  isPaused,
}: PropsFromRedux) {
  const onClick = (panel: PrimaryPanelName) => {
    if (panelCollapsed || (selectedPrimaryPanel == panel && !panelCollapsed)) {
      trackEvent(`toolbox.toggle_sidebar`);
      togglePaneCollapse();
    }

    if (selectedPrimaryPanel != panel) {
      trackEvent(`toolbox.primary.${panel}_select`);
      setSelectedPrimaryPanel(panel);
    }
  };

  if (isDemo()) {
    return <div></div>;
  }

  return (
    <div className="toolbox-toolbar-container flex flex-col items-center justify-between p-2 pb-4">
      <div id="toolbox-toolbar">
        <div
          className={classnames("toolbar-panel-button comments", {
            active: selectedPrimaryPanel == "comments",
          })}
        >
          <IconWithTooltip
            icon={
              <MaterialIcon className="forum toolbar-panel-icon" iconSize="2xl">
                forum
              </MaterialIcon>
            }
            content={"Comments"}
            handleClick={() => onClick("comments")}
          />
        </div>
        <div
          className={classnames("toolbar-panel-button events", {
            active: selectedPrimaryPanel == "events",
          })}
        >
          <IconWithTooltip
            icon={
              <MaterialIcon className="list toolbar-panel-icon" iconSize="2xl">
                list
              </MaterialIcon>
            }
            content={"Events"}
            handleClick={() => onClick("events")}
          />
        </div>

        {viewMode == "dev" ? (
          <>
            <div
              className={classnames("toolbar-panel-button explorer", {
                active: selectedPrimaryPanel == "explorer",
              })}
            >
              <IconWithTooltip
                icon={
                  <MaterialIcon className="description toolbar-panel-icon" iconSize="2xl">
                    description
                  </MaterialIcon>
                }
                content={"Source Explorer"}
                handleClick={() => onClick("explorer")}
              />
            </div>
            <div
              className={classnames("toolbar-panel-button search", {
                active: selectedPrimaryPanel == "search",
              })}
            >
              <IconWithTooltip
                icon={
                  <MaterialIcon className="motion_photos_paused toolbar-panel-icon" iconSize="2xl">
                    search
                  </MaterialIcon>
                }
                content={"Search"}
                handleClick={() => onClick("search")}
              />
            </div>
            <div
              className={classnames("toolbar-panel-button debug", {
                active: selectedPrimaryPanel == "debug",
                paused: isPaused,
              })}
            >
              <IconWithTooltip
                icon={
                  <MaterialIcon className="motion_photos_paused toolbar-panel-icon" iconSize="2xl">
                    motion_photos_paused
                  </MaterialIcon>
                }
                content={"Pause Information"}
                handleClick={() => onClick("debug")}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    initializedPanels: selectors.getInitializedPanels(state),
    panelCollapsed: selectors.getPaneCollapse(state),
    selectedPrimaryPanel: selectors.getSelectedPrimaryPanel(state),
    selectedPanel: selectors.getSelectedPanel(state),
    progressPercentage: selectors.getIndexing(state),
    viewMode: selectors.getViewMode(state),
    isPaused: selectors.hasFrames(state),
  }),
  {
    setSelectedPrimaryPanel: actions.setSelectedPrimaryPanel,
    togglePaneCollapse: actions.togglePaneCollapse,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Toolbar);
