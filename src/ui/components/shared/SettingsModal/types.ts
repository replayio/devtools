import { SettingsTabTitle } from "ui/state/app";

export type Settings = Setting[];

export interface Setting {
  title: SettingsTabTitle;
  items: SettingItem[];
  icon?: string;
}

export interface SettingItem {
  label: string;
  key: SettingItemKey;
  description: string | null;
  disabled: boolean;
  needsRefresh: boolean;
}

export type SettingItemKey = "show_elements" | "show_react" | "enable_teams";

export interface UserSettings {
  [key: string]: boolean;
}
