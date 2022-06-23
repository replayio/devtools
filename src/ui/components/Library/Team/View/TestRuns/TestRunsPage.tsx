import { useContext, useEffect } from "react";
import { TestRunOverviewPage } from "./Overview/TestRunOverviewPage";
import { TestRunList } from "./TestRunList";
import { TestRunsContainer, TestRunsContext } from "./TestRunsContext";

export function TestRunsPage() {
  return (
    <TestRunsContainer>
      <TestRunsContent />
    </TestRunsContainer>
  );
}

function TestRunsContent() {
  const { focusId } = useContext(TestRunsContext);

  return (
    <div className="flex flex-row flex-grow">
      <TestRunList />
      {focusId ? <TestRunOverviewPage /> : null}
    </div>
  );
}
