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
import { trackEvent } from "ui/utils/telemetry";

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
    <div className="toolbox-toolbar-container flex flex-col items-center justify-between p-1.5 pb-4">
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
      <div className="flex flex-col space-y-1 items-center">
        {progressPercentage !== 100 && viewMode === "dev" ? (
          <IndexingLoader {...{ progressPercentage, viewMode }} />
        ) : null}
      </div>
    </div>
  );
}

const Help = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.2222 14.9922H12.9452V14.7301C12.9452 13.5987 13.4118 13.0554 14.377 12.4801C15.6043 11.7578 16.4161 10.831 16.4161 9.30327C16.4161 6.98295 14.5049 5.73011 11.8714 5.73011C9.46795 5.73011 7.48642 6.92543 7.44806 9.61009H10.3884C10.4076 8.72159 11.0851 8.18466 11.8458 8.18466C12.6001 8.18466 13.2009 8.68963 13.2009 9.45028C13.2009 10.2301 12.5937 10.7287 11.7947 11.2401C10.7783 11.892 10.2286 12.5632 10.2222 14.7301V14.9922ZM11.6349 19.1854C12.5106 19.1854 13.284 18.4439 13.2968 17.5234C13.284 16.6158 12.5106 15.8807 11.6349 15.8807C10.7144 15.8807 9.96014 16.6158 9.97292 17.5234C9.96014 18.4439 10.7144 19.1854 11.6349 19.1854Z"
      fill="currentColor"
    />
    <circle cx="12" cy="12" r="11.225" stroke="currentColor" strokeWidth="1.55" />
  </svg>
);

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
