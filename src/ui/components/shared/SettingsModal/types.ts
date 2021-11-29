import React from "react";
import { UserSettings } from "ui/types";

export type Settings<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
> = Setting<T, V, P>[];

export type SettingType = "checkbox" | "dropdown";

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
> = SettingWithComponent<T, V, P>;

export interface SettingItem<V> {
  label: string;
  type: SettingType;
  key: keyof V;
  description: string | null;
  disabled: boolean;
}

export type SettingItemKey = keyof UserSettings;
