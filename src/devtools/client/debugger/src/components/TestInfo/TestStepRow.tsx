import classnames from "classnames";
import React, { forwardRef } from "react";

import styles from "./TestInfo.module.css";

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
        "group/step relative flex w-full items-start gap-1 border-b border-l-2 border-transparent py-2 pl-3 pr-1 font-mono",
        {
          // border
          [styles.BorderPending]: pending,
          [styles.BorderError]: (!pending || active) && error,
          [styles.BorderActive]: (!pending || active) && !error,
          [styles.BorderCurrent]: active && !error,

          // background / foreground
          [styles.TestsuitesErrorColor]: error,
          "bg-testsuitesErrorBgcolor hover:bg-testsuitesErrorBgcolorHover": error && pending,
          "bg-testsuitesErrorBgcolorHover": error && active,
          [styles.TestsuitesActiveBgcolor]: active && !error,
          "bg-testsuitesStepsBgcolor hover:bg-testsuitesStepsBgcolorHover": pending && !error,
          "hover:bg-testsuitesStepsBgcolorHover": !pending && !active && !error,
        }
      )}
    >
      <div className="w-5 text-center opacity-70">{index}</div>
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
