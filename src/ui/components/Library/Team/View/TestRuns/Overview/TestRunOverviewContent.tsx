import { useContext } from "react";
import { RunResults } from "ui/components/Library/Overview/RunResults";
import { TestRunOverviewContext } from "./TestRunOverviewPage";
import styles from "../../../../Library.module.css";
import { RunSummary } from "ui/components/Library/Overview/RunSummary";

export function TestRunOverviewContent() {
  const { testRun } = useContext(TestRunOverviewContext);

  // TODO: Add a proper loading state indicator here -jaril.
  if (!testRun) {
    return (
      <div
        className={`flex flex-col overflow-hidden m-4 ml-0 text-sm rounded-xl shadow-lg ${styles.libraryRow}`}
        style={{ width: "50rem" }}
      >
        Loading Placeholder
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col overflow-hidden m-4 ml-0 text-sm rounded-xl shadow-lg ${styles.libraryRow}`}
      style={{ width: "50rem" }}
    >
      <RunSummary />
      <RunResults />
    </div>
  );
}
