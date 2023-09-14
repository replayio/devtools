import { ComponentType, ReactNode } from "react";

export type Settings<T extends string, P extends Record<string, unknown>> = Setting<T, P>[];

export type SettingType = "checkbox" | "dropdown";

export interface SettingWithComponent<Title extends string, Props extends Record<string, unknown>> {
  component: ComponentType<Props>;
  icon: string;
  noTitle?: boolean;
  title: Title;
  titleComponent?: ComponentType<{
    location: "body" | "navigation";
  }>;
}

export type Setting<
  Type extends string,
  Props extends Record<string, unknown>
> = SettingWithComponent<Type, Props>;
