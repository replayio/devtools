import { useContext } from "react";

import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import { RunResults } from "ui/components/Library/Team/View/TestRuns/Overview/RunResults";

import { RunSummary } from "./RunSummary";
import { TestRunOverviewContext } from "./TestRunOverviewContainerContextType";
import styles from "../../../../Library.module.css";

export function TestRunOverviewContent() {
  const { testRun } = useContext(TestRunOverviewContext);

  return (
    <div
      className={`m-4 ml-0 flex flex-col overflow-hidden rounded-xl text-sm shadow-lg ${styles.runOverview}`}
      style={{ width: "50rem" }}
    >
      {testRun ? (
        <>
          <RunSummary />
          <RunResults />
        </>
      ) : (
        <LibrarySpinner />
      )}
    </div>
  );
}
