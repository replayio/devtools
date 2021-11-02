import React from "react";

import { Setting } from "./types";
import SettingsBodyItem from "./SettingsBodyItem";

// import "./SettingsBody.css";

interface SettingsBodyProps<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
> {
  onChange?: (key: keyof V, value: any) => void;
  selectedSetting: Setting<T, V, P>;
  values?: V;
  panelProps: P;
}

function SettingsBodyWrapper({ children }: { children: (React.ReactChild | null)[] }) {
  return <main className="text-sm">{children}</main>;
}

export function SettingsHeader({ children }: { children: React.ReactChild }) {
  return <h1 className="text-2xl">{children}</h1>;
}

export function SettingsBodyHeader({ children }: { children: React.ReactChild }) {
  return <h2 className="text-lg">{children}</h2>;
}

export default function SettingsBody<
  T extends string,
  V extends Record<string, unknown>,
  P extends Record<string, unknown>
>({ onChange, panelProps, selectedSetting, values }: SettingsBodyProps<T, V, P>) {
  const { title } = selectedSetting;

  if ("component" in selectedSetting) {
    return (
      <SettingsBodyWrapper>
        {selectedSetting.noTitle ? null : <SettingsHeader>{title}</SettingsHeader>}
        <selectedSetting.component settings={values} {...panelProps} />
      </SettingsBodyWrapper>
    );
  }

  if (!values) return null;

  return (
    <SettingsBodyWrapper>
      <SettingsHeader>{title}</SettingsHeader>
      <ul>
        {selectedSetting.items.map((item, index) => (
          <SettingsBodyItem item={item} values={values} key={index} onChange={onChange} />
        ))}
      </ul>
    </SettingsBodyWrapper>
  );
}
