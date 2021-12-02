import React from "react";
import { UserSettings } from "ui/types";

export type Settings<T extends string, P extends Record<string, unknown>> = Setting<T, P>[];

export type SettingType = "checkbox" | "dropdown";

export interface SettingWithComponent<T extends string, P extends Record<string, unknown>> {
  title: T;
  component: React.ComponentType<P>;
  icon?: string;
  noTitle?: boolean;
}

export type Setting<T extends string, P extends Record<string, unknown>> = SettingWithComponent<
  T,
  P
>;

export interface SettingItem<V> {
  label: string;
  type: SettingType;
  key: keyof V;
  description: string | null;
  disabled: boolean;
}

export type SettingItemKey = keyof UserSettings;
