import { useContext, useState } from "react";

import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import { TestRunListItem } from "ui/components/Library/Team/View/TestRuns/TestRunListItem";
import { SecondaryButton } from "ui/components/shared/Button";

import { TestRunsContext } from "./TestRunsContextRoot";

const PAGE_SIZE = 50;

export function TestRunList() {
  const [countToRender, setCountToRender] = useState(PAGE_SIZE);
  const { loading, testRuns } = useContext(TestRunsContext);

  const hasMore = countToRender < testRuns.length;
  const loadMore = () => {
    setCountToRender(Math.min(countToRender + PAGE_SIZE, testRuns.length));
  };

  if (loading) {
    return <LibrarySpinner />;
  }

  return (
    <div className="no-scrollbar m-4 flex flex-grow flex-col space-y-0 overflow-auto rounded-t-xl text-sm">
      {testRuns.slice(0, countToRender).map(testRun => (
        <TestRunListItem key={testRun.id} testRun={testRun} />
      ))}
      {hasMore && (
        <div className="flex justify-center p-4">
          <SecondaryButton className="" color="blue" onClick={loadMore}>
            Show More
          </SecondaryButton>
        </div>
      )}
    </div>
  );
}
