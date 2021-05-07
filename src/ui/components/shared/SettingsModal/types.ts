import { SettingsTabTitle, UserSettings } from "ui/state/app";

export type Settings = Setting[];

export type SettingType = "checkbox" | "dropdown";

export interface Setting {
  title: SettingsTabTitle;
  items: SettingItem[];
  icon?: string;
}

export interface SettingItem {
  label: string;
  type: SettingType;
  key: SettingItemKey;
  description: string | null;
  disabled: boolean;
  needsRefresh: boolean;
}

export type SettingItemKey = keyof UserSettings;
