import React from "react";
import { UserSettings } from "ui/types";

export type Settings<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
> = Setting<T, V, P>[];

export type SettingType = "checkbox" | "dropdown";

export interface SettingWithItems<T extends string, V extends Record<string, unknown>> {
  title: T;
  items: SettingItem<V>[];
  icon?: string;
}

export interface SettingWithComponent<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
> {
  title: T;
  component: React.ComponentType<{ settings?: V } & P>;
  icon?: string;
  noTitle?: boolean;
}

export type Setting<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
> = SettingWithItems<T, V> | SettingWithComponent<T, V, P>;

export interface SettingItem<V> {
  label: string;
  type: SettingType;
  key: keyof V;
  description: string | null;
  disabled: boolean;

  // Used to indicate that a feature is coming soon, but not
  // yet ready to experiment with
  comingSoon?: boolean;
}

export type SettingItemKey = keyof UserSettings;
