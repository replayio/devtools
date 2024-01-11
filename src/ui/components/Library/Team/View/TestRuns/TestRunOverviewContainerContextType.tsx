import { ReactNode, createContext } from "react";

import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";

type TestRunOverviewContainerContextType = {
  view: string;
};

export const TestRunOverviewContext = createContext<TestRunOverviewContainerContextType>(
  null as any
);

export function TestRunOverviewContainer({ children }: { children: ReactNode }) {
  const { view } = useGetTeamRouteParams();

  return (
    <TestRunOverviewContext.Provider value={{ view }}>{children}</TestRunOverviewContext.Provider>
  );
}
