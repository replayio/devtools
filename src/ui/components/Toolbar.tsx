import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "../actions";
import { selectors } from "../reducers";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import IconWithTooltip from "ui/components/shared/IconWithTooltip";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { UIState } from "ui/state";
import { PrimaryPanelName } from "ui/state/app";
import { isDemo } from "ui/utils/environment";

// TODO [ryanjduffy]: Refactor shared styling more completely
import "./Toolbox.css";
import { useIntercom } from "react-use-intercom";
import useAuth0 from "ui/utils/useAuth0";

function IndexingLoader({
  progressPercentage,
  viewMode,
}: Pick<PropsFromRedux, "progressPercentage" | "viewMode">) {
  const [isDone, setDone] = useState(false);

  // Set the indexing loader to done immediately, if
  // the loader just mounted and is at 100
  useEffect(() => {
    if (progressPercentage == 100) {
      setDone(true);
    }
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isDone && progressPercentage == 100) {
      timeout = setTimeout(() => setDone(true), 2000);
    }

    return () => clearTimeout(timeout);
  }, [progressPercentage]);

  if (isDone || progressPercentage === null || viewMode == "non-dev") {
    return null;
  }

  return (
    <div className="w-8 h-8 p-1" title={`Indexing (${progressPercentage.toFixed()}%)`}>
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
  isPaused,
}: PropsFromRedux) {
  const onClick = (panel: PrimaryPanelName) => {
    if (panelCollapsed || (selectedPrimaryPanel == panel && !panelCollapsed)) {
      togglePaneCollapse();
    }

    if (selectedPrimaryPanel != panel) {
      setSelectedPrimaryPanel(panel);
    }
  };

  if (isDemo()) {
    return <div></div>;
  }

  return (
    <div className="toolbox-toolbar-container flex flex-col items-center justify-between p-1.5 pb-4">
      <div id="toolbox-toolbar">
        <div
          className={classnames("toolbar-panel-button comments", {
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
          className={classnames("toolbar-panel-button events", {
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
              className={classnames("toolbar-panel-button explorer", {
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
              className={classnames("toolbar-panel-button debug", {
                active: selectedPrimaryPanel == "debug",
                paused: isPaused,
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
      <div className="flex flex-col space-y-1 items-center">
        <LaunchIntercomMessengerButton />
        <IndexingLoader {...{ progressPercentage, viewMode }} />
      </div>
    </div>
  );
}

function LaunchIntercomMessengerButton() {
  const { show } = useIntercom();
  const { isAuthenticated } = useAuth0();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="toolbar-panel-button">
      <IconWithTooltip
        icon={<MaterialIcon className="toolbar-panel-icon">contact_support</MaterialIcon>}
        content={"Chat with us"}
        handleClick={show}
      />
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
