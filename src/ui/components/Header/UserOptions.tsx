import React, { ReactNode, useContext, useEffect, useState } from "react";

import { recordingCapabilitiesCache } from "replay-next/src/suspense/BuildIdCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import useLocalStorageUserData from "shared/user-data/LocalStorage/useLocalStorageUserData";
import { setModal } from "ui/actions/app";
import { setShowSupportForm, setToolboxLayout } from "ui/actions/layout";
import LoginButton from "ui/components/LoginButton";
import Dropdown from "ui/components/shared/Dropdown";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getToolboxLayout, getViewMode } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

import styles from "./UserOptions.module.css";

export default function UserOptions() {
  const replayClient = useContext(ReplayClientContext);

  const dispatch = useAppDispatch();
  const toolboxLayout = useAppSelector(getToolboxLayout);
  const viewMode = useAppSelector(getViewMode);

  const [videoPanelCollapsed, setVideoPanelCollapsed] = useLocalStorageUserData(
    "replayVideoPanelCollapsed"
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          setExpanded(false);
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // only show layout options in devtools
  let devLayoutOptions: ReactNode = null;
  if (viewMode === "dev") {
    const recordingCapabilities = recordingCapabilitiesCache.read(replayClient);

    if (recordingCapabilities.supportsRepaintingGraphics) {
      devLayoutOptions = (
        <>
          <div className="inactive-row group">
            <span className="flex-1 text-left">Layout</span>

            <div className="flex flex-row items-center space-x-1">
              <div
                className={styles.LayoutButton}
                data-test-id="ToggleVideoPlayerButton"
                data-test-video-collapsed={videoPanelCollapsed ? "collapsed" : "expanded"}
                onClick={() => onVideoPanelCollapseChange(!videoPanelCollapsed)}
                title={videoPanelCollapsed ? "Show Video" : "Hide Video"}
              >
                <MaterialIcon
                  className={styles.VideoIcon}
                  data-icon-selected={!videoPanelCollapsed ? "" : undefined}
                >
                  {videoPanelCollapsed ? "videocam_off" : "videocam_on"}
                </MaterialIcon>
              </div>

              <div>
                <div className={styles.VerticalDivider} />
              </div>

              <div
                className={styles.LayoutButton}
                data-layout-option="ide"
                data-layout-option-selected={toolboxLayout === "ide" || undefined}
                data-test-id="DockToBottomRightButton"
                onClick={() => onLayoutChange("ide")}
                title="Console on bottom-right"
              >
                <Icon filename="dock-bottom-right" className={styles.LayoutIcon} />
              </div>

              <div
                className={styles.LayoutButton}
                data-layout-option="left"
                data-layout-option-selected={toolboxLayout === "left" || undefined}
                data-test-id="DockToLeftButton"
                onClick={() => onLayoutChange("left")}
                title="Console on left"
              >
                <Icon filename="dock-left" className={styles.LayoutIcon} />
              </div>

              <div
                className={styles.LayoutButton}
                data-layout-option="bottom"
                data-layout-option-selected={toolboxLayout === "bottom" || undefined}
                data-test-id="DockToBottomButton"
                onClick={() => onLayoutChange("bottom")}
                title="Console on bottom"
              >
                <Icon filename="dock-bottom" className={styles.LayoutIcon} />
              </div>
            </div>
          </div>

          <div className={styles.HorizontalDivider}></div>
        </>
      );
    } else {
      devLayoutOptions = (
        <>
          <div className="inactive-row group">
            <span className="flex-1 text-left">Layout</span>

            <div className="flex space-x-1">
              <div
                className={styles.LayoutButton}
                data-layout-option="left"
                data-layout-option-selected={toolboxLayout === "left" || undefined}
                data-test-id="DockToLeftButton"
                onClick={() => onLayoutChange("left")}
                title="Split view"
              >
                <Icon filename="dock-left" className={styles.LayoutIcon} />
              </div>

              <div
                className={styles.LayoutButton}
                data-layout-option="full"
                data-layout-option-selected={toolboxLayout === "full" || undefined}
                data-test-id="DockToBottomButton"
                onClick={() => onLayoutChange("full")}
                title="Full view"
              >
                <Icon filename="dock-full" className={styles.LayoutIcon} />
              </div>
            </div>
          </div>

          <div className={styles.divider}></div>
        </>
      );
    }
  }

  const [expanded, setExpanded] = useState(false);
  const onDocsClick: React.MouseEventHandler = event => {
    trackEvent("user_options.select_docs");
    const docsUrl = `https://docs.replay.io`;

    if (event.metaKey) {
      return window.open(docsUrl, "replaydocs");
    }
    window.open(docsUrl, "replaydocs");
  };

  const onSettingsClick = () => {
    setExpanded(false);
    trackEvent("user_options.select_settings");
    dispatch(setModal("settings"));
  };

  const onLayoutChange = (orientation: "bottom" | "full" | "ide" | "left") => {
    dispatch(setToolboxLayout(orientation));
    trackEvent(`layout.settings.set_${orientation}`);
  };

  const onSupportClick = () => {
    dispatch(setShowSupportForm(true));
    setExpanded(false);
  };

  const onVideoPanelCollapseChange = (collapsed: boolean) => {
    setVideoPanelCollapsed(collapsed);
    trackEvent(collapsed ? "video.settings.set_collapsed" : "video.settings.set_expanded");
  };

  return (
    <>
      <div style={{ display: "none" }}>
        <Icon filename="docs" className="bg-iconColor" />
        <Icon filename="help" className="bg-iconColor" />
        <Icon filename="settings" className="bg-iconColor" />
        <Icon filename="replay-logo" className="bg-iconColor" />
      </div>
      <div className="user-options text-blue-400">
        <Dropdown
          buttonContent={<MaterialIcon iconSize="xl">more_horiz</MaterialIcon>}
          dataTestId="UserOptions"
          setExpanded={setExpanded}
          expanded={expanded}
          orientation="bottom"
        >
          {devLayoutOptions}

          <button className="row group" onClick={onSettingsClick}>
            <span className="flex-1 text-left">Settings</span>
            <Icon filename="settings" className="bg-iconColor" />
          </button>

          <button className="row group" onClick={onDocsClick}>
            <span className="flex-1 text-left">Docs</span>
            <Icon filename="docs" className="bg-iconColor" />
          </button>

          <button className="row group" onClick={onSupportClick}>
            <span className="flex-1 text-left">Support</span>
            <Icon filename="help" className="bg-iconColor" />
          </button>

          <LoginButton iconPosition="right" />
        </Dropdown>
      </div>
    </>
  );
}
