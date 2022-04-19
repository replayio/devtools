import classnames from "classnames";
import React from "react";
import { prefs } from "ui/utils/prefs";

export function Redacted({ className, ...rest }: React.HTMLProps<HTMLDivElement>) {
  const showRedactions = prefs.showRedactions;
  return (
    <div {...rest} data-private={true} className={classnames(className, { showRedactions })} />
  );
}

export function RedactedSpan({ className, ...rest }: React.HTMLProps<HTMLSpanElement>) {
  const showRedactions = prefs.showRedactions;
  return (
    <span {...rest} data-private={true} className={classnames(className, { showRedactions })} />
  );
}
