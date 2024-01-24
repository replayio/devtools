import { useContext } from "react";

import { IndeterminateProgressBar } from "replay-next/components/IndeterminateLoader";

import { TestRunsContext } from "./TestRunsContextRoot";
import styles from "./TestRunPanelWrapper.module.css";

export function TestRunPanelWrapper({ children }: { children: React.ReactNode }) {
  const { testRunPending } = useContext(TestRunsContext);

  return (
    <div
      className={`flex h-full w-full flex-col p-2 text-sm transition ${styles.wrapper}`}
      data-pending={testRunPending}
    >
      {testRunPending ? <IndeterminateProgressBar /> : null}
      {children}
    </div>
  );
}
