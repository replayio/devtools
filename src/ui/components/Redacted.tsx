import React from "react";
import classnames from "classnames";
import { prefs } from "ui/utils/prefs";
import hooks from "ui/hooks";

export function Redacted({
  className,
  allowOptIn = false,
  ...rest
}: { allowOptIn?: boolean } & React.HTMLProps<HTMLDivElement>) {
  const { userSettings } = hooks.useGetUserSettings();

  // TODO: Add user pref for opting in to session replay
  const showRedactions = prefs.showRedactions;
  return (
    <div
      {...rest}
      data-private={!allowOptIn || !userSettings.enableLogRocket ? true : undefined}
      className={classnames(className, { showRedactions })}
    />
  );
}
