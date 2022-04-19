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
  title?: React.ReactNode;
  hiddenTabs?: T[];
}

function SettingNavigationItem<T extends string, P extends Record<string, unknown>>({
  setting,
  selectedTab,
  setSelectedTab,
}: SettingNavigationItemProps<T, P>) {
  const { title, icon } = setting;
  const onClick = () => {
    setSelectedTab(title);
  };

  return (
    <li onClick={onClick} className={classnames({ selected: title === selectedTab })}>
      <MaterialIcon iconSize="lg">{icon!}</MaterialIcon>
      <span>{title}</span>
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
    <nav style={{ maxWidth: 240 }}>
      <SettingsHeader>{title}</SettingsHeader>
      <ul>
        {settings
          .filter(setting => !hiddenTabs || !hiddenTabs.includes(setting.title))
          .map((setting, index) => (
            <SettingNavigationItem {...{ selectedTab, setSelectedTab, setting }} key={index} />
          ))}
      </ul>
    </nav>
  );
}
