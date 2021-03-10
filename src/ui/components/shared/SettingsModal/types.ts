export type SelectedTab = "Appearance" | "Team" | "Privacy" | "Experimental" | "Support";

export type Settings = Setting[];

export interface Setting {
  title: SelectedTab;
  items: SettingItem[];
}

export interface SettingItem {
  label: string;
  key: SettingItemKey;
  description: string | null;
  disabled: boolean;
}

export type SettingItemKey = "team_sharing" | "show_elements" | "private_recordings";

export interface UserSettings {
  [key: string]: boolean;
}
