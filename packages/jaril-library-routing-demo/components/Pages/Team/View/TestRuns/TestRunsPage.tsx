import { createContext, ReactNode, useContext } from "react";
import { useGetTeamRouteParams } from "../../../../../src/utils";
import { TestRunOverview } from "./Overview/TestRunOverview";
import { TestRunList } from "./TestRunList";

type TestRunsContextType = {
  focusId: string;
};

export const TestRunsContext = createContext<TestRunsContextType>(null);

export function TestRunsContainer({ children }: { children: ReactNode }) {
  const { focusId } = useGetTeamRouteParams();

  return <TestRunsContext.Provider value={{ focusId }}>{children}</TestRunsContext.Provider>;
}

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
      {focusId ? <TestRunOverview /> : null}
    </div>
  );
}
