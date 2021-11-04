import React, { useEffect, useState } from "react";
import Modal from "ui/components/shared/Modal";
import SettingsNavigation from "./SettingsNavigation";
import SettingsBody from "./SettingsBody";

import { Settings } from "./types";

import classnames from "classnames";

export default function SettingsModal<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
>({
  tab,
  hiddenTabs,
  loading,
  onChange,
  panelProps,
  settings,
  values,
  size = "sm",
  title,
}: {
  tab?: T;
  hiddenTabs?: T[];
  loading?: boolean;
  onChange?: (key: keyof V, value: any) => void;
  panelProps: P;
  settings: Settings<T, V, P>;
  values?: V;
  size?: "sm" | "lg";
  title?: string;
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
        <SettingsNavigation {...{ hiddenTabs, settings, selectedTab, setSelectedTab, title }} />
        <SettingsBody
          values={values}
          selectedSetting={selectedSetting}
          onChange={onChange}
          panelProps={panelProps}
        />
      </Modal>
    </div>
  );
}
