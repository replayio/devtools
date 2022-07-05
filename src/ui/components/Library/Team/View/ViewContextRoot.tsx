import { useRouter } from "next/router";
import { createContext, ReactNode, useContext, useEffect } from "react";
import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import { useFilters } from "./useFilters";
import { FilterContext } from "./FilterContext";
import { TeamContext } from "../TeamContextRoot";

type ViewContainerContextType = {
  view: View;
  setView: (view: View) => void;
};

export type View = "recordings" | "results" | "runs";

export const ViewContext = createContext<ViewContainerContextType>(null as any);
export function ViewContextRoot({
  children,
  defaultView,
}: {
  children: ReactNode;
  defaultView: string;
}) {
  const view = useGetTeamRouteParams().view;
  const filters = useFilters(view);
  const router = useRouter();
  const { teamId } = useContext(TeamContext);

  // Initialize the view to whatever the appropriate default view is for that team.
  useEffect(() => {
    if (!view) {
      router.push(`${router.asPath}/${defaultView}`);
    }
  }, [view, router, defaultView]);

  const setView = (view: View) => {
    router.push(`/team/${teamId}/${view}`);
  };

  return (
    <FilterContext.Provider value={filters}>
      <ViewContext.Provider value={{ view, setView }}>{children}</ViewContext.Provider>
    </FilterContext.Provider>
  );
}
