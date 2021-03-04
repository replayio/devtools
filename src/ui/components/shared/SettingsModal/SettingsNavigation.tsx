import React from "react";
import classnames from "classnames";
import { Setting, Settings, SelectedTab } from "./types";
import "./SettingsNavigation.css";

interface SettingNavigationItemProps {
  setting: Setting;
  selectedTab: SelectedTab;
  setSelectedTab: (title: SelectedTab) => void;
}

interface SettingNavigationProps {
  settings: Settings;
  selectedTab: SelectedTab;
  setSelectedTab: (title: SelectedTab) => void;
}

function SettingNavigationItem({
  setting,
  selectedTab,
  setSelectedTab,
}: SettingNavigationItemProps) {
  const { title } = setting;
  const onClick = () => {
    setSelectedTab(title);
  };

  return (
    <li onClick={onClick} className={classnames({ selected: title === selectedTab })}>
      <div className={`img settings-${title.toLowerCase()}`} />
      <span>{title}</span>
    </li>
  );
}

export default function SettingNavigation({
  settings,
  selectedTab,
  setSelectedTab,
}: SettingNavigationProps) {
  return (
    <nav>
      <h1>Settings</h1>
      <ul>
        {settings.map((setting, index) => (
          <SettingNavigationItem {...{ setting, selectedTab, setSelectedTab }} key={index} />
        ))}
      </ul>
    </nav>
  );
}
