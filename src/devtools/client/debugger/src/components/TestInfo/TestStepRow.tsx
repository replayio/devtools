import classnames from "classnames";
import React, { forwardRef } from "react";

interface TestStepRowProps {
  error?: boolean;
  active?: boolean;
  pending?: boolean;
}

export function TestStepRowBase({
  clientRef,
  className,
  active,
  pending,
  error,
  ...rest
}: TestStepRowProps & React.HTMLProps<HTMLDivElement> & { clientRef?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      {...rest}
      ref={clientRef}
      className={classnames(
        className,
        "group/step relative flex items-start gap-1 border-b border-l-2 border-themeBase-90 py-2 pl-3 pr-1 font-mono",
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
          "bg-testsuitesStepsBgcolor hover:bg-testsuitesStepsBgcolorHover": pending && !error,
          "hover:bg-testsuitesStepsBgcolorHover": !pending && !active && !error,
        }
      )}
    />
  );
}

export const TestStepRow = forwardRef<
  HTMLDivElement,
  TestStepRowProps & React.HTMLProps<HTMLDivElement>
>(function TestStepRow(props, ref) {
  return <TestStepRowBase {...props} clientRef={ref} />;
});
