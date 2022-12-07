import classnames from "classnames";
import { HTMLProps, Ref } from "react";

import { prefs } from "ui/utils/prefs";

type RefProp = {
  refToForward?: Ref<HTMLElement>;
};

export function Redacted({
  className,
  refToForward,
  ...rest
}: HTMLProps<HTMLDivElement> & RefProp) {
  const showRedactions = prefs.showRedactions;
  return (
    <div
      {...rest}
      data-private={true}
      className={classnames(className, { showRedactions })}
      ref={refToForward as Ref<HTMLDivElement>}
    />
  );
}

export function RedactedSpan({
  className,
  refToForward,
  ...rest
}: HTMLProps<HTMLSpanElement> & RefProp) {
  const showRedactions = prefs.showRedactions;
  return (
    <span
      {...rest}
      data-private={true}
      className={classnames(className, { showRedactions })}
      ref={refToForward}
    />
  );
}
