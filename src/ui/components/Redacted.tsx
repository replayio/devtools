import React from "react";
import classnames from "classnames";
import { prefs } from "ui/utils/prefs";

export function Redacted({ children }: { children: React.ReactChild }) {
  // TODO: Add user pref for opting in to session replay
  const shouldRedact = true;
  const showRedactions = prefs.showRedactions;
  return (
    <div data-private={shouldRedact} className={classnames("", { showRedactions })}>
      {children}
    </div>
  );
}
