import classnames from "classnames";
import classNames from "classnames";
import React, { useContext, useEffect, useState } from "react";

import AccessibleImage from "devtools/client/debugger/src/components/shared/AccessibleImage";
import { getPauseId } from "devtools/client/debugger/src/selectors";
import useLocalStorage from "replay-next/src/hooks/useLocalStorage";
import { framesCache } from "replay-next/src/suspense/FrameCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import IconWithTooltip from "ui/components/shared/IconWithTooltip";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { useFeature } from "ui/hooks/settings";
import { Nag } from "ui/hooks/users";
import { useTestInfo } from "ui/hooks/useTestInfo";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { PrimaryPanelName } from "ui/state/layout";
import {
  shouldShowBreakpointAdd,
  shouldShowBreakpointEdit,
  shouldShowConsoleNavigate,
  shouldShowTour,
} from "ui/utils/onboarding";
// TODO [ryanjduffy]: Refactor shared styling more completely
import { trackEvent } from "ui/utils/telemetry";

import { actions } from "../actions";
import { selectors } from "../reducers";
import { sidePanelStorageKey } from "./DevTools";

function CypressIcon() {
  return (
    <svg
      width="256"
      height="256"
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
    >
      <path
        d="M128 2C197.645 2 254 58.3555 254 128C254 197.645 197.645 254 128 254C58.3555 254 2 197.645 2 128C2 58.3555 58.3555 2 128 2Z"
        fill="currentColor"
        stroke="transparent"
        strokeWidth="4"
      />
      <path
        d="M188.702 177.211C184.316 190.807 177.737 200.895 168.526 208.351C159.316 215.807 147.035 219.754 131.684 221.07L128.614 200.895C138.702 199.579 146.158 197.386 150.982 193.877C152.737 192.561 156.246 188.614 156.246 188.614L119.842 71.9474H150.105L171.158 159.228L193.526 71.9474H222.912L188.702 177.211ZM83 68C90.0175 68 96.5965 68.8772 101.86 71.0702C107.561 73.2632 112.825 76.3333 118.088 80.7193L105.807 97.386C102.298 94.7544 98.7895 93 95.7193 91.6842C92.6491 90.3684 88.7018 89.9298 85.193 89.9298C70.2807 89.9298 62.8246 101.333 62.8246 124.579C62.8246 136.421 64.5789 144.754 68.5263 149.579C72.4737 154.842 77.7368 157.035 85.193 157.035C88.7018 157.035 92.2105 156.596 95.2807 155.281C98.3509 153.965 101.86 152.211 106.246 149.579L118.526 167.123C108.439 175.456 97.0351 179.404 83.8772 179.404C73.3509 179.404 64.5789 177.211 56.6842 172.825C49.2281 168.439 43.0877 161.86 39.1404 153.526C35.193 145.193 33 135.544 33 124.14C33 113.175 35.193 103.088 39.1404 94.7544C43.0877 85.9825 49.2281 79.4035 56.6842 74.5789C64.1404 70.6316 72.9123 68 83 68Z"
        fill="white"
      />
    </svg>
  );
}

function ReactIcon() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width="20"
        height="20"
        fill="currentColor"
      >
        <path d="M8 9.2a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zM.68 8C.68 8.93 2 9.49 2.7 9.76c1.34.5 3.2.83 5.29.83 2.08 0 3.95-.32 5.3-.83.7-.27 2.02-.83 2.02-1.76S14 6.51 13.3 6.24A15.4 15.4 0 0 0 8 5.41c-2.08 0-3.95.32-5.3.83C2 6.51.69 7.07.69 8zm1.8-2.37C3.9 5.08 5.85 4.75 8 4.75c2.14 0 4.1.33 5.53.88 1 .38 2.45 1.1 2.45 2.37 0 1.26-1.45 2-2.45 2.37-1.43.55-3.39.88-5.53.88s-4.1-.33-5.53-.88C1.47 10 .02 9.27.02 8c0-1.26 1.45-2 2.45-2.37zM4.34 1.66c-.81.47-.63 1.9-.5 2.63.22 1.42.87 3.2 1.92 5a15.4 15.4 0 0 0 3.36 4.17c.59.48 1.73 1.35 2.54.88.81-.47.63-1.89.5-2.63a15.4 15.4 0 0 0-1.92-5 15.4 15.4 0 0 0-3.36-4.17c-.59-.48-1.73-1.35-2.54-.88zm2.95.36c1.2.97 2.45 2.5 3.53 4.35a16.05 16.05 0 0 1 2 5.23c.17 1.06.26 2.68-.83 3.31-1.1.63-2.45-.26-3.28-.93a16.05 16.05 0 0 1-3.53-4.35 16.05 16.05 0 0 1-2-5.23c-.17-1.06-.26-2.68.83-3.31 1.1-.63 2.45.26 3.28.93zM11.66 1.66c-.8-.47-1.95.4-2.54.88A15.4 15.4 0 0 0 5.76 6.7a15.4 15.4 0 0 0-1.93 5c-.12.75-.3 2.17.5 2.64.82.47 1.96-.4 2.55-.88a15.4 15.4 0 0 0 3.36-4.16 15.4 15.4 0 0 0 1.93-5c.12-.75.3-2.17-.5-2.64zm1.16 2.74a16.05 16.05 0 0 1-2 5.23 16.05 16.05 0 0 1-3.53 4.35c-.83.67-2.19 1.56-3.28.93-1.1-.63-1-2.25-.83-3.3.24-1.52.93-3.38 2-5.24a16.05 16.05 0 0 1 3.53-4.35c.83-.67 2.19-1.56 3.28-.93 1.1.63 1 2.25.83 3.3z" />
      </svg>
    </div>
  );
}

function ToolbarButtonTab({ active }: { active: boolean }) {
  return (
    <div
      className={classnames("absolute left-0 h-full w-1 bg-primaryAccent", {
        invisible: !active,
      })}
      style={{ borderRadius: "0 4px 4px 0" }}
    />
  );
}

function ToolbarButton({
  icon,
  label,
  name,
  onClick,
  showBadge,
}: {
  icon: string;
  label: string;
  name: PrimaryPanelName;
  onClick: (name: PrimaryPanelName) => void;
  showBadge?: boolean;
}) {
  const selectedPrimaryPanel = useAppSelector(selectors.getSelectedPrimaryPanel);
  const isActive = selectedPrimaryPanel == name;

  let iconContents: string | JSX.Element = icon;

  switch (icon) {
    case "cypress": {
      iconContents = <CypressIcon />;
      break;
    }
    case "react": {
      iconContents = <ReactIcon />;
      break;
    }
    default:
      break;
  }

  const imageIcon = (
    <MaterialIcon
      className={classNames("toolbar-panel-icon text-themeToolbarPanelIconColor", name)}
      iconSize="2xl"
    >
      {iconContents}
    </MaterialIcon>
  );
  return (
    <div className="relative px-2">
      <ToolbarButtonTab active={isActive} />
      <div
        className={classnames("toolbar-panel-button", name, {
          active: isActive,
        })}
      >
        <IconWithTooltip
          icon={imageIcon}
          content={label}
          dataTestName={`ToolbarButton-${label.replace(/ /g, "")}`}
          handleClick={() => onClick(name)}
        />
      </div>
      {showBadge ? (
        <div
          className="absolute h-2 w-2 rounded-full bg-secondaryAccent"
          style={{
            // FE-1096 Aiming for pixel perfect badge alignment over icons with inconsistent shapes
            right: name === "comments" ? ".9rem" : "1em",
            top: name === "debugger" ? ".6em" : "0.5em",
          }}
        />
      ) : null}
    </div>
  );
}

export default function Toolbar() {
  const dispatch = useAppDispatch();
  const replayClient = useContext(ReplayClientContext);
  const pauseId = useAppSelector(getPauseId);
  const frames = pauseId ? framesCache.getValueIfCached(replayClient, pauseId) : undefined;
  const hasFrames = frames && frames.length > 0;
  const viewMode = useAppSelector(selectors.getViewMode);
  const selectedPrimaryPanel = useAppSelector(getSelectedPrimaryPanel);

  const showReplayAssist = useAppSelector(selectors.getReplayAssist);

  const [showCommentsBadge, setShowCommentsBadge] = useState(false);
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const { comments, loading } = hooks.useGetComments(recordingId);
  const { value: logProtocol } = useFeature("logProtocol");
  const { value: showReactPanel } = useFeature("reactPanel");
  const [sidePanelCollapsed, setSidePanelCollapsed] = useLocalStorage(sidePanelStorageKey, false);
  const { nags } = hooks.useGetUserInfo();
  const showTour = shouldShowTour(nags);

  useEffect(() => {
    if (!loading && comments.length > 0) {
      setShowCommentsBadge(true);
    }
  }, [loading, comments.length]);

  useEffect(() => {
    if (selectedPrimaryPanel === "comments" && showCommentsBadge) {
      setShowCommentsBadge(false);
    }
  }, [selectedPrimaryPanel, showCommentsBadge]);

  const togglePanel = () => {
    setSidePanelCollapsed(!sidePanelCollapsed);
  };

  const handleButtonClick = (panelName: PrimaryPanelName) => {
    const samePanelSelected = selectedPrimaryPanel === panelName;
    const shouldTogglePanel = sidePanelCollapsed || samePanelSelected;

    if (!samePanelSelected) {
      trackEvent(`toolbox.primary.${panelName}_select`);
      dispatch(actions.setSelectedPrimaryPanel(panelName));
    }

    if (shouldTogglePanel) {
      trackEvent(`toolbox.toggle_sidebar`);
      togglePanel();
    }
  };

  return (
    <div className="toolbox-toolbar-container flex flex-col items-center justify-between py-1">
      <div id="toolbox-toolbar">
        {recording?.metadata?.test?.runner?.name !== "cypress" && showTour ? (
          <ToolbarButton
            icon="school"
            name="tour"
            label="Replay Tour"
            onClick={handleButtonClick}
          />
        ) : null}

        {!showReplayAssist ? (
          <ToolbarButton
            icon="school"
            name="assist"
            label="Replay Assist"
            onClick={handleButtonClick}
          />
        ) : null}

        {recording?.metadata?.test?.runner?.name == "cypress" ? (
          <ToolbarButton
            icon="cypress"
            label="Cypress Panel"
            name="cypress"
            onClick={handleButtonClick}
          />
        ) : (
          <ToolbarButton
            icon="info"
            label="Replay Info"
            name="events"
            onClick={handleButtonClick}
          />
        )}
        <ToolbarButton
          icon="forum"
          label="Comments"
          name="comments"
          showBadge={showCommentsBadge}
          onClick={handleButtonClick}
        />
        {viewMode == "dev" ? (
          <>
            <ToolbarButton
              icon="description"
              name="explorer"
              label="Source Explorer"
              onClick={handleButtonClick}
            />
            <ToolbarButton icon="search" name="search" label="Search" onClick={handleButtonClick} />
            <ToolbarButton
              icon="motion_photos_paused"
              name="debugger"
              label="Pause Information"
              showBadge={hasFrames}
              onClick={handleButtonClick}
            />
            {showReactPanel && (
              <ToolbarButton icon="react" name="react" label="React" onClick={handleButtonClick} />
            )}
          </>
        ) : null}
        {logProtocol && viewMode === "dev" ? (
          <ToolbarButton icon="code" label="Protocol" name="protocol" onClick={handleButtonClick} />
        ) : null}
        <div className="grow"></div>
        <div className="relative px-2">
          <div className="toolbar-panel-button">
            <IconWithTooltip
              icon={
                <MaterialIcon
                  className="toolbar-panel-icon text-themeToolbarPanelIconColor"
                  iconSize="2xl"
                >
                  {sidePanelCollapsed
                    ? "keyboard_double_arrow_right"
                    : "keyboard_double_arrow_left"}
                </MaterialIcon>
              }
              content={sidePanelCollapsed ? "Expand side panel" : "Collapse side panel"}
              dataTestName={`ToolbarButton-ExpandSidePanel`}
              handleClick={togglePanel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
