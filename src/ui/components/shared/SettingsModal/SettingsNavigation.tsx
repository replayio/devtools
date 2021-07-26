import React from "react";
import classnames from "classnames";
import { Setting, Settings } from "./types";
import "./SettingsNavigation.css";
import { SettingsTabTitle } from "ui/state/app";
import MaterialIcon from "../MaterialIcon";
import { SettingsHeader } from "./SettingsBody";

interface SettingNavigationItemProps {
  setting: Setting;
  selectedTab: SettingsTabTitle;
  setSelectedTab: (title: SettingsTabTitle) => void;
}

interface SettingNavigationProps {
  settings: Settings;
  selectedTab: SettingsTabTitle;
  setSelectedTab: (title: SettingsTabTitle) => void;
}

function SettingNavigationItem({
  setting,
  selectedTab,
  setSelectedTab,
}: SettingNavigationItemProps) {
  const { title, icon } = setting;
  const onClick = () => {
    setSelectedTab(title);
  };

  return (
    <li onClick={onClick} className={classnames({ selected: title === selectedTab })}>
      <MaterialIcon>{icon!}</MaterialIcon>
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
      <SettingsHeader>Settings</SettingsHeader>
      <ul>
        {settings.map((setting, index) => (
          <SettingNavigationItem {...{ setting, selectedTab, setSelectedTab }} key={index} />
        ))}
      </ul>
    </nav>
  );
}
