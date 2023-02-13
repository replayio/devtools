import classnames from "classnames";
import classNames from "classnames";
import React, { ReactNode, RefObject, useContext, useEffect, useState } from "react";
import { ImperativePanelHandle } from "react-resizable-panels";

import { getPauseId } from "devtools/client/debugger/src/selectors";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import IconWithTooltip from "ui/components/shared/IconWithTooltip";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { useFeature } from "ui/hooks/settings";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { PrimaryPanelName } from "ui/state/layout";
import { useGetFrames } from "ui/suspense/frameCache";
// TODO [ryanjduffy]: Refactor shared styling more completely
import { trackEvent } from "ui/utils/telemetry";

import { actions } from "../actions";
import { selectors } from "../reducers";

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
        stroke="white"
        strokeWidth="4"
      />
      <path
        d="M188.702 177.211C184.316 190.807 177.737 200.895 168.526 208.351C159.316 215.807 147.035 219.754 131.684 221.07L128.614 200.895C138.702 199.579 146.158 197.386 150.982 193.877C152.737 192.561 156.246 188.614 156.246 188.614L119.842 71.9474H150.105L171.158 159.228L193.526 71.9474H222.912L188.702 177.211ZM83 68C90.0175 68 96.5965 68.8772 101.86 71.0702C107.561 73.2632 112.825 76.3333 118.088 80.7193L105.807 97.386C102.298 94.7544 98.7895 93 95.7193 91.6842C92.6491 90.3684 88.7018 89.9298 85.193 89.9298C70.2807 89.9298 62.8246 101.333 62.8246 124.579C62.8246 136.421 64.5789 144.754 68.5263 149.579C72.4737 154.842 77.7368 157.035 85.193 157.035C88.7018 157.035 92.2105 156.596 95.2807 155.281C98.3509 153.965 101.86 152.211 106.246 149.579L118.526 167.123C108.439 175.456 97.0351 179.404 83.8772 179.404C73.3509 179.404 64.5789 177.211 56.6842 172.825C49.2281 168.439 43.0877 161.86 39.1404 153.526C35.193 145.193 33 135.544 33 124.14C33 113.175 35.193 103.088 39.1404 94.7544C43.0877 85.9825 49.2281 79.4035 56.6842 74.5789C64.1404 70.6316 72.9123 68 83 68Z"
        fill="white"
      />
    </svg>
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

  const imageIcon = (
    <MaterialIcon
      className={classNames("toolbar-panel-icon text-themeToolbarPanelIconColor", name)}
      iconSize="2xl"
    >
      {icon === "cypress" ? <CypressIcon /> : icon}
    </MaterialIcon>
  );
  return (
    <div className="relative px-2">
      <ToolbarButtonTab active={selectedPrimaryPanel == name} />
      <div
        className={classnames("toolbar-panel-button", name, {
          active: selectedPrimaryPanel == name,
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

export default function Toolbar({
  sidePanelCollapsed,
  sidePanelRef,
}: {
  sidePanelCollapsed: boolean;
  sidePanelRef: RefObject<ImperativePanelHandle>;
}) {
  const dispatch = useAppDispatch();
  const replayClient = useContext(ReplayClientContext);
  const pauseId = useAppSelector(getPauseId);
  const frames = useGetFrames(replayClient, pauseId);
  const hasFrames = !!frames.value?.length;
  const viewMode = useAppSelector(selectors.getViewMode);
  const selectedPrimaryPanel = useAppSelector(getSelectedPrimaryPanel);
  const [showCommentsBadge, setShowCommentsBadge] = useState(false);
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const { comments, loading } = hooks.useGetComments(recordingId);
  const { value: logProtocol } = useFeature("logProtocol");

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
    const panel = sidePanelRef.current;
    if (panel) {
      if (sidePanelCollapsed) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
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
          </>
        ) : null}
        {logProtocol ? (
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
