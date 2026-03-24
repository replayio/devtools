import React, { ReactNode, useContext, useEffect, useState } from "react";

import { SupportContext } from "replay-next/components/errors/SupportContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { recordingCapabilitiesCache } from "replay-next/src/suspense/BuildIdCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import useLocalStorageUserData from "shared/user-data/LocalStorage/useLocalStorageUserData";
import { setModal } from "ui/actions/app";
import { setToolboxLayout } from "ui/actions/layout";
import { AvatarImage } from "ui/components/Avatar";
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
  const { showSupportForm } = useContext(SupportContext);
  const { accessToken, currentUserInfo } = useContext(SessionContext);

  const dispatch = useAppDispatch();
  const toolboxLayout = useAppSelector(getToolboxLayout);
  const viewMode = useAppSelector(getViewMode);

  const [videoPanelCollapsed, setVideoPanelCollapsed] = useLocalStorageUserData(
    "replayVideoPanelCollapsed"
  );

  const [expanded, setExpanded] = useState(false);

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
          <div className="inactive-row group border-b border-border px-4 py-3">
            <span className="flex-1 text-left text-sm font-medium text-foreground">Layout</span>

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
        </>
      );
    } else {
      devLayoutOptions = (
        <>
          <div className="inactive-row group border-b border-border px-4 py-3">
            <span className="flex-1 text-left text-sm font-medium text-foreground">Layout</span>

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
        </>
      );
    }
  }

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
    showSupportForm({
      context: { id: "contact-us" },
      promptText: "Bugs, suggestions, questions are all welcome!",
      title: "Support",
    });

    setExpanded(false);
  };

  const onVideoPanelCollapseChange = (collapsed: boolean) => {
    setVideoPanelCollapsed(collapsed);
    trackEvent(collapsed ? "video.settings.set_collapsed" : "video.settings.set_expanded");
  };

  const signedInMenuHeader =
    accessToken && currentUserInfo ? (
      <div className="border-b border-border px-4 py-3">
        <div className="text-xs text-muted-foreground">Signed in as</div>
        <div className="truncate text-sm font-medium text-foreground">{currentUserInfo.email}</div>
      </div>
    ) : null;

  const triggerContent =
    accessToken && currentUserInfo ? (
      <>
        {currentUserInfo.picture ? (
          <AvatarImage
            alt={`${currentUserInfo.name ?? "User"} avatar`}
            className="h-8 w-8 shrink-0 rounded-full"
            referrerPolicy="no-referrer"
            src={currentUserInfo.picture}
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
            {currentUserInfo.name?.charAt(0) ?? "?"}
          </div>
        )}
      </>
    ) : (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <MaterialIcon iconSize="lg">person</MaterialIcon>
      </div>
    );

  return (
    <>
      <div style={{ display: "none" }}>
        <Icon filename="docs" className="bg-iconColor" />
        <Icon filename="help" className="bg-iconColor" />
        <Icon filename="logout" className="bg-iconColor" />
        <Icon filename="settings" className="bg-iconColor" />
        <Icon filename="replay-logo" className="bg-iconColor" />
      </div>
      <div className="user-options">
        <Dropdown
          buttonClassName="flex max-w-[220px] items-center gap-3 rounded-md px-2 py-1.5 text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-60 md:px-3"
          buttonContent={triggerContent}
          dataTestId="UserOptions"
          expanded={expanded}
          orientation="bottom"
          setExpanded={setExpanded}
        >
          {signedInMenuHeader}
          {devLayoutOptions}

          <div className="py-1">
            <button
              className="row group flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-medium text-foreground hover:bg-accent"
              onClick={onSettingsClick}
              type="button"
            >
              <Icon className="h-5 w-5 shrink-0 bg-iconColor" filename="settings" size="small" />
              Settings
            </button>

            <button
              className="row group flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-medium text-foreground hover:bg-accent"
              onClick={onDocsClick}
              type="button"
            >
              <Icon className="h-5 w-5 shrink-0 bg-iconColor" filename="docs" size="small" />
              Docs
            </button>

            <button
              className="row group flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-medium text-foreground hover:bg-accent"
              onClick={onSupportClick}
              type="button"
            >
              <Icon className="h-5 w-5 shrink-0 bg-iconColor" filename="help" size="small" />
              Support
            </button>

            <LoginButton iconPosition="left" />
          </div>
        </Dropdown>
      </div>
    </>
  );
}
