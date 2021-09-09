import React from "react";
import classnames from "classnames";
import { useGetSettingsTab } from "ui/utils/routes";
import Modal from "ui/components/shared/Modal";
import SettingsNavigation from "./SettingsNavigation";
import SettingsBody from "./SettingsBody";
import { Settings } from "./types";

import "./SettingsModal.css";

export default function SettingsModal<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
>({
  defaultSelectedTab,
  hiddenTabs,
  loading,
  onChange,
  panelProps,
  settings,
  values,
  size = "sm",
  title,
}: {
  defaultSelectedTab?: T;
  hiddenTabs?: T[];
  loading?: boolean;
  onChange?: (key: keyof V, value: any) => void;
  panelProps: P;
  settings: Settings<T, V, P>;
  values?: V;
  size?: "sm" | "lg";
  title?: string;
}) {
  const selectedTab = useGetSettingsTab();
  const selectedSetting = settings.find(setting => setting.title === selectedTab)!;

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
        <SettingsNavigation {...{ hiddenTabs, settings, selectedTab, title }} />
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
