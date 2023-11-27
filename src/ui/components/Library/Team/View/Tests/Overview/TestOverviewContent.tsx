import { useContext } from "react";

import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";

import { useTest } from "../hooks/useTest";
import { TestContext } from "../TestContextRoot";
import { TestDetails } from "./TestDetails";
import styles from "../../../../Library.module.css";

export function TestOverviewContent() {
  const { testId } = useContext(TestContext);

  let children = null;

  if (testId) {
    children = <TestOverview testId={testId} />;
  } else {
    children = (
      <div className="flex h-full items-center justify-center p-2">
        <div className="rounded-md bg-chrome px-3 py-2 text-center">
          Select a test to see its details here
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full flex-col text-sm transition ${styles.runOverview} `}>
      {children}
    </div>
  );
}

function TestOverview({ testId }: { testId: string }) {
  const { test, loading, error } = useTest(testId);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-2">
        <LibrarySpinner />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="flex h-full items-center justify-center p-2">Failed to load test details</div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      <div className={styles.testTitle}>
        <div>{test.title}</div>
      </div>
      <div className="flex flex-col overflow-y-auto">
        <TestDetails executions={test.executions} />
      </div>
    </div>
  );
}
