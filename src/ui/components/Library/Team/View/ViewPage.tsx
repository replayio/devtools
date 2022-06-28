import { useRouter } from "next/router";
import { createContext, ReactNode, useContext, useEffect } from "react";
import { useGetTeamRouteParams } from "ui/utils/library";
import { useFilters } from "../../useFilters";
import { FilterBarContainer } from "./FilterBarContainer";
import { FilterContext } from "./FilterContext";
import { RecordingsPage } from "./Recordings/RecordingsPage";
import { TestResultsPage } from "./TestResults/TestResultsPage";
import { TestRunsPage } from "./TestRuns/TestRunsPage";
import { ViewSwitcher } from "./ViewSwitcher";

type ViewContainerContextType = {
  view: string;
};

export const ViewContext = createContext<ViewContainerContextType>(null as any);
export function ViewContainer({
  children,
  defaultView,
}: {
  children: ReactNode;
  defaultView: string;
}) {
  const filters = useFilters();
  const router = useRouter();
  const view = useGetTeamRouteParams().view;

  useEffect(() => {
    if (!view) {
      router.push(`/${router.asPath}/${defaultView}`);
    }
  }, [view, router, defaultView]);

  return (
    <FilterContext.Provider value={filters}>
      <ViewContext.Provider value={{ view }}>{children}</ViewContext.Provider>
    </FilterContext.Provider>
  );
}

export function ViewPage({ defaultView }: { defaultView: string }) {
  return (
    <ViewContainer defaultView={defaultView}>
      <ViewPageContent />
    </ViewContainer>
  );
}

export function ViewPageContent() {
  const { view } = useContext(ViewContext);

  return (
    <div className="flex flex-col flex-grow overflow-hidden">
      <ViewSwitcher />
      <FilterBarContainer />
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
