import { useContext } from "react";
import { RunResults } from "ui/components/Library/Team/View/TestRuns/Overview/RunResults";
import { TestRunOverviewContext } from "./TestRunOverviewContainerContextType";
import styles from "../../../../Library.module.css";
import { RunSummary } from "./RunSummary";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";

export function TestRunOverviewContent() {
  const { testRun } = useContext(TestRunOverviewContext);

  return (
    <div
      className={`flex flex-col overflow-hidden m-4 ml-0 text-sm rounded-xl shadow-lg ${styles.navigation}`}
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
