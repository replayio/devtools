import React from "react";

import { Setting } from "./types";

interface SettingsBodyProps<T extends string, P extends Record<string, unknown>> {
  selectedSetting: Setting<T, P>;
  panelProps: P;
}

function SettingsBodyWrapper({ children }: { children: (React.ReactChild | null)[] }) {
  return <main className="flex w-full flex-col overflow-hidden p-8 text-sm">{children}</main>;
}

export function SettingsHeader({ children }: { children: React.ReactNode }) {
  return <h1 className="text-2xl">{children}</h1>;
}

export function SettingsBodyHeader({ children }: { children: React.ReactChild }) {
  return <h2 className="text-lg">{children}</h2>;
}

export default function SettingsBody<T extends string, P extends Record<string, unknown>>({
  panelProps,
  selectedSetting,
}: SettingsBodyProps<T, P>) {
  const { noTitle, title, titleComponent: TitleComponent } = selectedSetting;

  return (
    <SettingsBodyWrapper>
      {noTitle ? null : (
        <SettingsHeader>
          {TitleComponent ? <TitleComponent location="body" /> : title}
        </SettingsHeader>
      )}
      <selectedSetting.component {...panelProps} />
    </SettingsBodyWrapper>
  );
}
