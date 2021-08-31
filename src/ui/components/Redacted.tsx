import React from "react";
import classnames from "classnames";
import { prefs } from "ui/utils/prefs";

export function Redacted({ className, ...rest }: React.HTMLProps<HTMLDivElement>) {
  // TODO: Add user pref for opting in to session replay
  const shouldRedact = true;
  const showRedactions = prefs.showRedactions;
  return (
    <div
      {...rest}
      data-private={shouldRedact}
      className={classnames(className, { showRedactions })}
    />
  );
}
