import classnames from "classnames";
import React, { useEffect, useState } from "react";
import Modal from "ui/components/shared/Modal";

import SettingsBody from "./SettingsBody";
import SettingsNavigation from "./SettingsNavigation";
import { Settings } from "./types";

export default function SettingsModal<T extends string, P extends Record<string, unknown>>({
  tab,
  hiddenTabs,
  loading,
  panelProps,
  settings,
  size = "sm",
  title,
}: {
  tab?: T;
  hiddenTabs?: T[];
  loading?: boolean;
  panelProps: P;
  settings: Settings<T, P>;
  size?: "sm" | "lg";
  title?: React.ReactNode;
}) {
  const [selectedTab, setSelectedTab] = useState<T | undefined>(tab);
  const selectedSetting = settings.find(setting => setting.title === selectedTab)!;

  useEffect(() => {
    if (tab) {
      setSelectedTab(tab);
    }
  }, [tab]);

  if (loading) {
    return (
      <div className="settings-modal">
        <Modal></Modal>
      </div>
    );
  }

  return (
    <div className={classnames("settings-modal", { "settings-modal-large": size === "lg" })}>
      <Modal>
        <SettingsNavigation {...{ hiddenTabs, selectedTab, setSelectedTab, settings, title }} />
        <SettingsBody selectedSetting={selectedSetting} panelProps={panelProps} />
      </Modal>
    </div>
  );
}
