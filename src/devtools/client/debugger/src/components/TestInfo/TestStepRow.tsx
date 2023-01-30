import classnames from "classnames";
import React, { forwardRef } from "react";

import { ProgressBar } from "./ProgressBar";
import styles from "./TestStepItem.module.css";

interface TestStepRowProps {
  error?: boolean;
  active?: boolean;
  pending?: boolean;
  progress?: number;
  index?: number;
}

export function TestStepRowBase({
  children,
  clientRef,
  className,
  active,
  pending,
  error,
  index,
  progress,
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
          [styles.BorderPending]: pending,
          [styles.BorderError]: (!pending || active) && error,
          [styles.BorderActive]: (!pending || active) && !error,

          // background / foreground
          [styles.TestsuitesErrorColor]: error,
          "bg-testsuitesErrorBgcolor hover:bg-testsuitesErrorBgcolorHover": error && pending,
          "bg-testsuitesErrorBgcolorHover": error && active,
          "bg-toolbarBackgroundHover": active && !error,
          "bg-testsuitesStepsBgcolor hover:bg-testsuitesStepsBgcolorHover": pending && !error,
          "hover:bg-testsuitesStepsBgcolorHover": !pending && !active && !error,
        }
      )}
    >
      <div title={progress == null ? "" : String(progress)} className="flex h-4 w-4 items-center">
        {progress == null ? null : <ProgressBar progress={progress} error={!!error} />}
      </div>
      <div className="w-4 text-center opacity-70">{index}</div>
      {children}
    </div>
  );
}

export const TestStepRow = forwardRef<
  HTMLDivElement,
  TestStepRowProps & React.HTMLProps<HTMLDivElement>
>(function TestStepRow(props, ref) {
  return <TestStepRowBase {...props} clientRef={ref} />;
});
