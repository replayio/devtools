import { createContext, ReactNode, useContext } from "react";
import { useGetTeamRouteParams } from "../../../../src/utils";
import { FilterBar } from "./FilterBar";
import { RecordingsPage } from "./Recordings/RecordingsPage";
import { TestResultsPage } from "./TestResults/TestResultsPage";
import { TestRunsPage } from "./TestRuns/TestRunsPage";
import { ViewSwitcher } from "./ViewSwitcher";

type ViewContainerContextType = {
  view: string;
};

export const ViewContext = createContext<ViewContainerContextType>(null);

export function ViewContainer({ children }: { children: ReactNode }) {
  const { view } = useGetTeamRouteParams();

  return <ViewContext.Provider value={{ view }}>{children}</ViewContext.Provider>;
}

export function ViewPage() {
  return (
    <ViewContainer>
      <ViewPageContent />
    </ViewContainer>
  );
}

export function ViewPageContent() {
  const { view } = useContext(ViewContext);

  return (
    <div className="flex flex-col flex-grow overflow-hidden">
      <ViewSwitcher />
      <FilterBar />
      <div className="flex flex-row flex-grow overflow-hidden">
        {view === "recordings" ? (
          <RecordingsPage />
        ) : view === "runs" ? (
          <TestRunsPage />
        ) : (
          <TestResultsPage />
        )}
      </div>
    </div>
  );
}
