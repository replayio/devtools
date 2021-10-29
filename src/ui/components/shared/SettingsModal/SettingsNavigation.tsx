import React from "react";
import classnames from "classnames";
import { Setting, Settings } from "./types";
import "./SettingsNavigation.css";
import MaterialIcon from "../MaterialIcon";
import { SettingsHeader } from "./SettingsBody";

interface SettingNavigationItemProps<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
> {
  setting: Setting<T, V, P>;
  selectedTab?: T;
  setSelectedTab: (title: T) => void;
}

interface SettingNavigationProps<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
> {
  settings: Settings<T, V, P>;
  selectedTab?: T;
  setSelectedTab: (title: T) => void;
  title?: string;
  hiddenTabs?: T[];
}

function SettingNavigationItem<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
>({ setting, selectedTab, setSelectedTab }: SettingNavigationItemProps<T, V, P>) {
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

export default function SettingNavigation<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
>({
  hiddenTabs,
  settings,
  selectedTab,
  setSelectedTab,
  title = "Settings",
}: SettingNavigationProps<T, V, P>) {
  return (
    <nav>
      <SettingsHeader>{title}</SettingsHeader>
      <ul>
        {settings
          .filter(setting => !hiddenTabs || !hiddenTabs.includes(setting.title))
          .map((setting, index) => (
            <SettingNavigationItem {...{ setting, selectedTab, setSelectedTab }} key={index} />
          ))}
      </ul>
    </nav>
  );
}
