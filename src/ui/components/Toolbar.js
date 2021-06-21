import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { connect } from "react-redux";
import { actions } from "../actions";
import { selectors } from "../reducers";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import IconWithTooltip from "ui/components/shared/IconWithTooltip";
import MaterialIcon from "ui/components/shared/MaterialIcon";

function IndexingLoader({ progressPercentage, viewMode }) {
  const [isDone, setDone] = useState(false);

  // Set the indexing loader to done immediately, if
  // the loader just mounted and is at 100
  useEffect(() => {
    if (progressPercentage == 100) {
      setDone(true);
    }
  }, []);

  useEffect(() => {
    let timeout;
    if (!isDone && progressPercentage == 100) {
      timeout = setTimeout(() => setDone(true), 2000);
    }

    return () => clearTimeout(timeout);
  }, [progressPercentage]);

  if (isDone || progressPercentage === null || viewMode == "non-dev") {
    return null;
  }

  return (
    <div className="w-8 h-8" title={`Indexing (${progressPercentage.toFixed()}%)`}>
      <CircularProgressbar
        value={progressPercentage}
        strokeWidth={10}
        styles={buildStyles({ pathColor: `#353535`, trailColor: `#ECECED` })}
      />
    </div>
  );
}

function Toolbar({
  selectedPrimaryPanel,
  setSelectedPrimaryPanel,
  togglePaneCollapse,
  panelCollapsed,
  progressPercentage,
  viewMode,
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
    <div className="toolbox-toolbar-container flex flex-col items-center justify-between p-2 pb-6">
      <div id="toolbox-toolbar">
        <div
          className={classnames("toolbar-panel-button", {
            active: selectedPrimaryPanel == "comments",
          })}
        >
          <IconWithTooltip
            icon={<MaterialIcon className="forum toolbar-panel-icon">forum</MaterialIcon>}
            content={"Comments"}
            handleClick={() => onClick("comments")}
          />
        </div>

        <div
          className={classnames("toolbar-panel-button", {
            active: selectedPrimaryPanel == "events",
          })}
        >
          <IconWithTooltip
            icon={<MaterialIcon className="list toolbar-panel-icon">list</MaterialIcon>}
            content={"Events"}
            handleClick={() => onClick("events")}
          />
        </div>

        {viewMode == "dev" ? (
          <>
            <div
              className={classnames("toolbar-panel-button", {
                active: selectedPrimaryPanel == "explorer",
              })}
            >
              <IconWithTooltip
                icon={
                  <MaterialIcon className="description toolbar-panel-icon">
                    description
                  </MaterialIcon>
                }
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
                  <MaterialIcon className="motion_photos_paused toolbar-panel-icon">
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
      <IndexingLoader {...{ progressPercentage, viewMode }} />
    </div>
  );
}

export default connect(
  state => ({
    initializedPanels: selectors.getInitializedPanels(state),
    panelCollapsed: selectors.getPaneCollapse(state),
    selectedPrimaryPanel: selectors.getSelectedPrimaryPanel(state),
    selectedPanel: selectors.getSelectedPanel(state),
    progressPercentage: selectors.getIndexing(state),
    viewMode: selectors.getViewMode(state),
  }),
  {
    setSelectedPrimaryPanel: actions.setSelectedPrimaryPanel,
    togglePaneCollapse: actions.togglePaneCollapse,
  }
)(Toolbar);
