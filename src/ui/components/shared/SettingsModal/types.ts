export type SelectedTab =
  | "Appearance"
  | "Team"
  | "Privacy"
  | "Experimental"
  | "Support"
  | "Invitations";

export type Settings = Setting[];

export interface Setting {
  title: SelectedTab;
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
