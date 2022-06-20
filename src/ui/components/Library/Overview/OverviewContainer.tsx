import { createContext, ReactNode, useContext } from "react";
import { TestRun, useGetTestRunForWorkspace } from "ui/hooks/tests";
import { LibraryContext } from "../useFilters";

// This is an oversimplification of the possible states for the testRun
// as we fetch it and doesn't acccount for errors. Todo: Make it more robust.
type OverviewContextType =
  | {
      testRun: null;
      loading: true;
    }
  | {
      testRun: TestRun;
      loading: false;
    };

export const OverviewContext = createContext<OverviewContextType>({
  testRun: null,
  loading: true,
});

export function OverviewContainer({ children }: { children: ReactNode }) {
  const { preview } = useContext(LibraryContext);
  const { testRun, loading } = useGetTestRunForWorkspace(preview!.id as string);

  return (
    <OverviewContext.Provider value={{ testRun, loading } as OverviewContextType}>
      <div
        className="flex flex-col overflow-hidden text-sm bg-themeBase-100 rounded-md shadow-md"
        style={{ width: "50rem" }}
      >
        {children}
      </div>
    </OverviewContext.Provider>
  );
}
