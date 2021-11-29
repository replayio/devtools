import React from "react";

import { Setting } from "./types";

interface SettingsBodyProps<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
> {
  selectedSetting: Setting<T, V, P>;
  values?: V;
  panelProps: P;
}

function SettingsBodyWrapper({ children }: { children: (React.ReactChild | null)[] }) {
  return <main className="text-sm">{children}</main>;
}

export function SettingsHeader({ children }: { children: React.ReactChild }) {
  return (
    <h1 className="text-2xl" style={{ maxWidth: "121px" }}>
      {children}
    </h1>
  );
}

export function SettingsBodyHeader({ children }: { children: React.ReactChild }) {
  return <h2 className="text-lg">{children}</h2>;
}

export default function SettingsBody<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
>({ panelProps, selectedSetting, values }: SettingsBodyProps<T, V, P>) {
  const { title } = selectedSetting;

  return (
    <SettingsBodyWrapper>
      {selectedSetting.noTitle ? null : <SettingsHeader>{title}</SettingsHeader>}
      <selectedSetting.component settings={values} {...panelProps} />
    </SettingsBodyWrapper>
  );
}
