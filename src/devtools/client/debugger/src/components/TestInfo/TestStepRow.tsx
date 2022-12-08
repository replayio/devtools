import classnames from "classnames";
import React from "react";

interface TestStepRowProps {
  error?: boolean;
  active?: boolean;
  pending?: boolean;
}

export function TestStepRow({
  className,
  active,
  pending,
  error,
  ...rest
}: TestStepRowProps & React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={classnames(
        className,
        "group/step relative flex items-start gap-1 border-b border-l-2 border-themeBase-90 px-3 py-2 font-mono",
        {
          // border
          "border-l-transparent": pending,
          "border-l-red-500": (!pending || active) && error,
          "border-l-primaryAccent": (!pending || active) && !error,

          // background / foreground
          "text-testsuitesErrorColor": error,
          "bg-testsuitesErrorBgcolor hover:bg-testsuitesErrorBgcolorHover": error && pending,
          "bg-testsuitesErrorBgcolorHover": error && active,
          "bg-toolbarBackgroundHover": active && !error,
          "bg-testsuitesStepsBgcolor hover:bg-toolbarBackgroundHover": pending && !error,
          "hover:bg-toolbarBackgroundHover": !pending && !active && !error,
        }
      )}
    />
  );
}
