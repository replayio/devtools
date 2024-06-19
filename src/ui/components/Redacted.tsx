import classnames from "classnames";
import { HTMLProps, Ref } from "react";

import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";

type RefProp = {
  refToForward?: Ref<HTMLElement>;
};

export function Redacted({
  className,
  refToForward,
  ...rest
}: HTMLProps<HTMLDivElement> & RefProp) {
  const [showRedactions] = useGraphQLUserData("global_showRedactions");
  return (
    <div
      {...rest}
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
  const [showRedactions] = useGraphQLUserData("global_showRedactions");
  return (
    <span {...rest} className={classnames(className, { showRedactions })} ref={refToForward} />
  );
}
