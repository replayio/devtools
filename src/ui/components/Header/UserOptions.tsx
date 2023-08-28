import React, { useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import * as actions from "ui/actions/app";
import { setToolboxLayout } from "ui/actions/layout";
import LoginButton from "ui/components/LoginButton";
import Dropdown from "ui/components/shared/Dropdown";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getToolboxLayout } from "ui/reducers/layout";
import { getViewMode } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

import ExternalLink from "../shared/ExternalLink";
import styles from "./UserOptions.module.css";

interface UserOptionsProps extends PropsFromRedux {
  noBrowserItem?: boolean;
}

function UserOptions({ setModal, noBrowserItem }: UserOptionsProps) {
  const dispatch = useAppDispatch();
  const toolboxLayout = useAppSelector(getToolboxLayout);
  const viewMode = useAppSelector(getViewMode);

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
    setModal("settings");
  };

  const onLayoutChange = (orientation: "ide" | "left" | "bottom") => {
    dispatch(setToolboxLayout(orientation));
    trackEvent(`layout.settings.set_${orientation}`);
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
          setExpanded={setExpanded}
          expanded={expanded}
          orientation="bottom"
        >
          {viewMode === "dev" && ( // only show layout options in devtools
            <>
              <div className="row group">
                <span className="flex-1 text-left">Layout</span>

                <div className="flex space-x-1">
                  <div onClick={() => onLayoutChange("ide")}>
                    <Icon
                      filename="dock-bottom-right"
                      className={`${styles.icon} ${toolboxLayout === "ide" ? styles.selected : ""}`}
                    />
                  </div>

                  <div onClick={() => onLayoutChange("left")}>
                    <Icon
                      filename="dock-left"
                      className={`${styles.icon} ${
                        toolboxLayout === "left" ? styles.selected : ""
                      }`}
                    />
                  </div>

                  <div onClick={() => onLayoutChange("bottom")}>
                    <Icon
                      filename="dock-bottom"
                      className={`${styles.icon} ${
                        toolboxLayout === "bottom" ? styles.selected : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.divider}></div>
            </>
          )}

          <button className="row group" onClick={onSettingsClick}>
            <span className="flex-1 text-left">Settings</span>
            <Icon filename="settings" className="bg-iconColor" />
          </button>

          <button className="row group" onClick={onDocsClick}>
            <span className="flex-1 text-left">Docs</span>
            <Icon filename="docs" className="bg-iconColor" />
          </button>
          <ExternalLink className="row group" href="https://discord.gg/n2dTK6kcRX">
            <span className="flex-1 text-left">Chat with us</span>
            <Icon filename="help" className="bg-iconColor" />
          </ExternalLink>

          <LoginButton iconPosition="right" />
        </Dropdown>
      </div>
    </>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(UserOptions);
