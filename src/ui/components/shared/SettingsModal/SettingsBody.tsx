import classnames from "classnames";
import React from "react";

import { Setting } from "./types";

interface SettingsBodyProps<T extends string, P extends Record<string, unknown>> {
  selectedSetting: Setting<T, P>;
  panelProps: P;
}

function SettingsBodyWrapper({ children }: { children: (React.ReactNode | null)[] }) {
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-card p-8 text-sm text-card-foreground">
      {children}
    </main>
  );
}

export function SettingsHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={classnames("font-semibold tracking-tight text-foreground", className ?? "text-xl")}
    >
      {children}
    </h1>
  );
}

export function SettingsBodyHeader({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-foreground">{children}</h2>;
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
