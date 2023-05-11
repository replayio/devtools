import classnames from "classnames";
import classNames from "classnames";
import React, { useContext, useEffect, useState } from "react";

import { getPauseId } from "devtools/client/debugger/src/selectors";
import useLocalStorage from "replay-next/src/hooks/useLocalStorage";
import { framesCache } from "replay-next/src/suspense/FrameCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import IconWithTooltip from "ui/components/shared/IconWithTooltip";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { useFeature } from "ui/hooks/settings";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { PrimaryPanelName } from "ui/state/layout";
import { shouldShowTour } from "ui/utils/onboarding";
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
        fill="var(--theme-base-100)"
        d="M188.702 177.211C184.316 190.807 177.737 200.895 168.526 208.351C159.316 215.807 147.035 219.754 131.684 221.07L128.614 200.895C138.702 199.579 146.158 197.386 150.982 193.877C152.737 192.561 156.246 188.614 156.246 188.614L119.842 71.9474H150.105L171.158 159.228L193.526 71.9474H222.912L188.702 177.211ZM83 68C90.0175 68 96.5965 68.8772 101.86 71.0702C107.561 73.2632 112.825 76.3333 118.088 80.7193L105.807 97.386C102.298 94.7544 98.7895 93 95.7193 91.6842C92.6491 90.3684 88.7018 89.9298 85.193 89.9298C70.2807 89.9298 62.8246 101.333 62.8246 124.579C62.8246 136.421 64.5789 144.754 68.5263 149.579C72.4737 154.842 77.7368 157.035 85.193 157.035C88.7018 157.035 92.2105 156.596 95.2807 155.281C98.3509 153.965 101.86 152.211 106.246 149.579L118.526 167.123C108.439 175.456 97.0351 179.404 83.8772 179.404C73.3509 179.404 64.5789 177.211 56.6842 172.825C49.2281 168.439 43.0877 161.86 39.1404 153.526C35.193 145.193 33 135.544 33 124.14C33 113.175 35.193 103.088 39.1404 94.7544C43.0877 85.9825 49.2281 79.4035 56.6842 74.5789C64.1404 70.6316 72.9123 68 83 68Z"
      />
    </svg>
  );
}

function PlaywrightIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
    >
      <path
        d="M16.166 26.2296V23.9863L9.93313 25.7537C9.93313 25.7537 10.3937 23.0777 13.6443 22.1556C14.6301 21.8762 15.4712 21.8781 16.166 22.0123V12.811H19.2868C18.947 11.761 18.6183 10.9526 18.3422 10.3909C17.8855 9.46115 17.4173 10.0775 16.3544 10.9665C15.6058 11.5919 13.7138 12.9261 10.8667 13.6933C8.01955 14.461 5.71779 14.2574 4.75741 14.0911C3.3959 13.8562 2.68376 13.5572 2.75038 14.5928C2.80836 15.5062 3.02594 16.9224 3.52434 18.7928C4.60261 22.8433 8.16619 30.6481 14.9009 28.8342C16.6601 28.3602 17.9018 27.4232 18.7625 26.229L16.166 26.2296ZM6.10837 18.8484L10.8945 17.5876C10.8945 17.5876 10.755 19.4288 8.96076 19.9018C7.16603 20.3743 6.10837 18.8484 6.10837 18.8484Z"
        fill="currentColor"
        fillOpacity="0.5"
      />

      <path
        d="M14.1944 24.5451L13.107 24.8537C13.3639 26.3019 13.8167 27.6917 14.5274 28.9195C14.6511 28.8922 14.7749 28.8687 14.9009 28.8342C15.2311 28.7451 15.5362 28.6348 15.831 28.5145C15.0369 27.3361 14.5116 25.9789 14.1944 24.5451ZM13.7698 14.3451C13.211 16.4307 12.7111 19.4326 12.8487 22.4436C13.095 22.3367 13.3553 22.2376 13.6443 22.1556L13.8455 22.1101C13.6001 18.8939 14.1306 15.6165 14.7282 13.3866C14.8797 12.8225 15.0316 12.2978 15.183 11.8085C14.9391 11.9637 14.6765 12.1228 14.3774 12.2867C14.1757 12.9093 13.972 13.5898 13.7698 14.3451Z"
        fill="currentColor"
      />

      <path
        d="M34.1786 12.9174C32.9345 13.1355 29.9498 13.4072 26.2612 12.4185C22.5716 11.4304 20.1236 9.70222 19.1537 8.88992C17.7788 7.73832 17.174 6.938 16.5788 8.14855C16.0526 9.21628 15.3797 10.954 14.7284 13.3866C13.3171 18.6543 12.2623 29.7706 20.9867 32.1098C29.7093 34.447 34.353 24.292 35.7644 19.0238C36.4157 16.5917 36.7013 14.75 36.7799 13.5625C36.8695 12.2173 35.9455 12.6078 34.1786 12.9174ZM16.6497 17.2756C16.6497 17.2756 18.0246 15.1372 20.3565 15.8C22.6899 16.4628 22.8706 19.0425 22.8706 19.0425L16.6497 17.2756ZM22.342 26.8713C18.2403 25.6698 17.6077 22.399 17.6077 22.399L28.6262 25.4796C28.6262 25.4791 26.4021 28.0578 22.342 26.8713ZM26.2377 20.1495C26.2377 20.1495 27.6107 18.0126 29.9422 18.6773C32.2736 19.3411 32.4572 21.9208 32.4572 21.9208L26.2377 20.1495Z"
        fill="currentColor"
      />

      <path
        d="M22.527 26.9163L22.342 26.8713C18.2403 25.6698 17.6077 22.399 17.6077 22.399L23.289 23.9872L26.2971 12.4281L26.2612 12.4185C22.5716 11.4304 20.1236 9.70222 19.1537 8.88992C17.7788 7.73832 17.174 6.938 16.5788 8.14855C16.0526 9.21628 15.3797 10.954 14.7284 13.3866C13.3171 18.6543 12.2623 29.7706 20.9867 32.1098L21.1655 32.15L22.527 26.9163ZM16.6497 17.2756C16.6497 17.2756 18.0246 15.1372 20.3565 15.8C22.6899 16.4628 22.8706 19.0425 22.8706 19.0425L16.6497 17.2756Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ReactIcon() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="10" fill="black" />
        <path
          d="M20.3559 12.006C20.3559 12.3256 20.1995 12.6778 19.8158 13.0485C19.4307 13.4206 18.8471 13.7788 18.0852 14.0902C16.5637 14.712 14.4274 15.108 12.042 15.108C9.65656 15.108 7.52022 14.712 5.99878 14.0902C5.23683 13.7788 4.6533 13.4206 4.26817 13.0485C3.88449 12.6778 3.7281 12.3256 3.7281 12.006C3.7281 11.6865 3.88449 11.3343 4.26817 10.9636C4.6533 10.5914 5.23683 10.2333 5.99878 9.92189C7.52022 9.30012 9.65656 8.90405 12.042 8.90405C14.4274 8.90405 16.5637 9.30012 18.0852 9.92189C18.8471 10.2333 19.4307 10.5914 19.8158 10.9636C20.1995 11.3343 20.3559 11.6865 20.3559 12.006Z"
          stroke="white"
        />
        <path
          d="M16.1989 4.806C16.4757 4.96579 16.7025 5.27731 16.8317 5.79495C16.9614 6.31455 16.9798 6.99897 16.8685 7.81454C16.6463 9.44303 15.9211 11.4912 14.7284 13.557C13.5357 15.6229 12.1245 17.2749 10.8253 18.2817C10.1747 18.7858 9.57272 19.1121 9.05789 19.2596C8.545 19.4065 8.1618 19.3658 7.88504 19.2061C7.60828 19.0463 7.38147 18.7347 7.25226 18.2171C7.12256 17.6975 7.10415 17.0131 7.21545 16.1975C7.4377 14.569 8.16286 12.5209 9.35558 10.455C10.5483 8.3892 11.9595 6.7371 13.2587 5.73039C13.9093 5.22621 14.5112 4.89994 15.0261 4.75247C15.539 4.60555 15.9222 4.64621 16.1989 4.806Z"
          stroke="white"
        />
        <path
          d="M7.88503 4.806C8.1618 4.64621 8.54499 4.60555 9.05788 4.75247C9.57272 4.89994 10.1747 5.22621 10.8253 5.73039C12.1245 6.73711 13.5357 8.3892 14.7284 10.455C15.9211 12.5209 16.6463 14.569 16.8685 16.1975C16.9798 17.0131 16.9614 17.6975 16.8317 18.2171C16.7025 18.7347 16.4757 19.0463 16.1989 19.2061C15.9222 19.3658 15.539 19.4065 15.0261 19.2596C14.5112 19.1121 13.9093 18.7858 13.2586 18.2817C11.9595 17.2749 10.5483 15.6229 9.35557 13.557C8.16286 11.4912 7.4377 9.44303 7.21545 7.81454C7.10414 6.99897 7.12255 6.31455 7.25225 5.79495C7.38146 5.27731 7.60827 4.96579 7.88503 4.806Z"
          stroke="white"
        />
        <circle cx="11.9479" cy="11.9609" r="1.36394" fill="white" />
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
    case "playwright": {
      iconContents = <PlaywrightIcon />;
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

  const [showCommentsBadge, setShowCommentsBadge] = useState(false);
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const { comments, loading } = hooks.useGetComments(recordingId);
  const { value: logProtocolExperimentEnabled } = useFeature("logProtocol");
  const { value: reactPanelExperimentEnabled } = useFeature("reactPanel");
  const { value: showPassport } = useFeature("showPassport");
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
        {showPassport ? (
          <ToolbarButton
            icon="menu_book"
            name="passport"
            label="Replay Passport"
            onClick={handleButtonClick}
          />
        ) : null}
        {recording?.metadata?.test?.runner ? (
          recording?.metadata?.test?.runner?.name === "cypress" ? (
            <ToolbarButton
              icon="cypress"
              label="Cypress Panel"
              name="cypress"
              onClick={handleButtonClick}
            />
          ) : (
            <ToolbarButton
              icon="playwright"
              label="Test Info"
              name="cypress"
              onClick={handleButtonClick}
            />
          )
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
            {reactPanelExperimentEnabled && (
              <ToolbarButton icon="react" name="react" label="React" onClick={handleButtonClick} />
            )}
          </>
        ) : null}
        {logProtocolExperimentEnabled && viewMode === "dev" ? (
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
