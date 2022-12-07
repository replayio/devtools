import classnames from "classnames";
import React from "react";

interface TestStepRowProps {
  error?: boolean;
  pending?: boolean;
}

export function TestStepRow({
  className,
  pending,
  error,
  ...rest
}: TestStepRowProps & React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={classnames(
        className,
        "group/step relative flex items-start gap-1 border-b border-l-2 border-themeBase-90 px-3 py-2 font-mono hover:bg-toolbarBackground",
        {
          // border
          "border-l-transparent": pending,
          "border-l-red-500": !pending && error,
          "border-l-primaryAccent": !pending && !error,

          // background / foreground
          "bg-testsuitesErrorBgcolor text-testsuitesErrorColor hover:bg-testsuitesErrorBgcolorHover":
            !pending && error,
          "bg-toolbarBackground": !pending && !error,
          "bg-testsuitesStepsBgcolor": pending,
        }
      )}
    />
  );
}
