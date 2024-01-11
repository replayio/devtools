import { useContext, useEffect, useState } from "react";

import { IndeterminateProgressBar } from "replay-next/components/IndeterminateLoader";
import { TestRunsContext } from "ui/components/Library/Team/View/NewTestRuns/TestRunsContextRoot";

import styles from "./TestRunPanelWrapper.module.css";

export function TestRunPanelWrapper({ children }: { children: React.ReactNode }) {
  const [deferredPending, setDeferredPending] = useState(false);
  const { testRunId, testRunIdForDisplay } = useContext(TestRunsContext);

  const isPending = testRunId !== testRunIdForDisplay;

  useEffect(() => {
    if (isPending) {
      const timer = setTimeout(() => {
        setDeferredPending(true);
      }, 200);

      return () => {
        clearTimeout(timer);
      };
    } else {
      setDeferredPending(false);
    }
  }, [isPending]);

  return (
    <div
      className={`flex h-full w-full flex-col text-sm transition ${styles.wrapper}`}
      data-pending={deferredPending}
    >
      {deferredPending ? <IndeterminateProgressBar /> : null}
      {children}
    </div>
  );
}
