import classnames from "classnames";
import React from "react";

import MaterialIcon from "../MaterialIcon";
import { SettingsHeader } from "./SettingsBody";
import { Setting, Settings } from "./types";

interface SettingNavigationItemProps<T extends string, P extends Record<string, unknown>> {
  setting: Setting<T, P>;
  selectedTab?: T;
  setSelectedTab: (title: T) => void;
}

interface SettingNavigationProps<T extends string, P extends Record<string, unknown>> {
  settings: Settings<T, P>;
  selectedTab?: T;
  setSelectedTab: (title: T) => void;
  title: React.ReactNode;
  hiddenTabs?: T[];
}

function SettingNavigationItem<T extends string, P extends Record<string, unknown>>({
  setting,
  selectedTab,
  setSelectedTab,
}: SettingNavigationItemProps<T, P>) {
  const { icon, title, titleComponent: TitleComponent } = setting;
  const selected = title === selectedTab;

  return (
    <li className="settings-modal-nav-item">
      <button
        type="button"
        onClick={() => setSelectedTab(title)}
        className={classnames("settings-modal-nav-button", { "is-selected": selected })}
      >
        <MaterialIcon iconSize="base" outlined className="settings-modal-nav-icon">
          {icon}
        </MaterialIcon>
        {TitleComponent ? (
          <TitleComponent location="navigation" />
        ) : (
          <span className="min-w-0 flex-1 truncate text-left">{title}</span>
        )}
      </button>
    </li>
  );
}

export default function SettingNavigation<T extends string, P extends Record<string, unknown>>({
  hiddenTabs,
  settings,
  selectedTab,
  setSelectedTab,
  title = "Settings",
}: SettingNavigationProps<T, P>) {
  return (
    <nav className="settings-modal-nav">
      <SettingsHeader className="text-lg">{title}</SettingsHeader>
      <ul className="settings-modal-nav-list">
        {settings
          .filter(setting => !hiddenTabs || !hiddenTabs.includes(setting.title))
          .map((setting, index) => (
            <SettingNavigationItem {...{ setting, selectedTab, setSelectedTab }} key={index} />
          ))}
      </ul>
    </nav>
  );
}
