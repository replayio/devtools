import { ReactNode, createContext } from "react";
type TestOverviewContainerContextType = {};

export const TestOverviewContext = createContext<TestOverviewContainerContextType>(null as any);

export function TestOverviewContainer({ children }: { children: ReactNode }) {
  return <TestOverviewContext.Provider value={{}}>{children}</TestOverviewContext.Provider>;
}
