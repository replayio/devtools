import { ReactNode, createContext } from "react";

import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";

type TestOverviewContainerContextType = {
  view: string;
};

export const TestOverviewContext = createContext<TestOverviewContainerContextType>(null as any);

export function TestOverviewContainer({ children }: { children: ReactNode }) {
  const { view } = useGetTeamRouteParams();

  return <TestOverviewContext.Provider value={{ view }}>{children}</TestOverviewContext.Provider>;
}
