import { useRouter } from "next/router";
import { createContext, ReactNode, useEffect } from "react";
import { useGetTeamRouteParams } from "ui/utils/library";
import { useFilters } from "./useFilters";
import { FilterContext } from "./FilterContext";

type ViewContainerContextType = {
  view: string;
};

export const ViewContext = createContext<ViewContainerContextType>(null as any);
export function ViewContextRoot({
  children,
  defaultView,
}: {
  children: ReactNode;
  defaultView: string;
}) {
  const filters = useFilters();
  const router = useRouter();
  const view = useGetTeamRouteParams().view;

  // Initialize the view to whatever the appropriate default view is for that team.
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
