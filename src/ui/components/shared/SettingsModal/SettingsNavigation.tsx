import React from "react";
import { useHistory } from "react-router-dom";
import classnames from "classnames";
import { getWorkspaceSettingsRoute, useGetSettingsTab, useGetWorkspaceId } from "ui/utils/routes";
import { Setting, Settings } from "./types";
import MaterialIcon from "../MaterialIcon";
import { SettingsHeader } from "./SettingsBody";

import "./SettingsNavigation.css";

interface SettingNavigationItemProps<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
> {
  setting: Setting<T, V, P>;
}

interface SettingNavigationProps<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
> {
  settings: Settings<T, V, P>;
  title?: string;
  hiddenTabs?: T[];
}

function SettingNavigationItem<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
>({ setting }: SettingNavigationItemProps<T, V, P>) {
  const { title, icon } = setting;
  const history = useHistory();
  const workspaceId = useGetWorkspaceId()!;
  const selectedTab = useGetSettingsTab()!;
  const onClick = () => {
    history.push(getWorkspaceSettingsRoute(workspaceId, title));
  };

  return (
    <li onClick={onClick} className={classnames({ selected: title === selectedTab })}>
      <MaterialIcon>{icon!}</MaterialIcon>
      <span>{title}</span>
    </li>
  );
}

export default function SettingNavigation<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
>({ hiddenTabs, settings, title = "Settings" }: SettingNavigationProps<T, V, P>) {
  return (
    <nav>
      <SettingsHeader>{title}</SettingsHeader>
      <ul>
        {settings
          .filter(setting => !hiddenTabs || !hiddenTabs.includes(setting.title))
          .map((setting, index) => (
            <SettingNavigationItem {...{ setting }} key={index} />
          ))}
      </ul>
    </nav>
  );
}
