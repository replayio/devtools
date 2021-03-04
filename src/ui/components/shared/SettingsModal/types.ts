export type SelectedTab = "Appearance" | "Team" | "Privacy" | "Experimental" | "Support";

export type Settings = Setting[];

export interface Setting {
  title: SelectedTab;
  items: SettingItem[];
}

export interface SettingItem {
  label: string;
  key: string;
  description: string | null;
  disabled: boolean;
}
