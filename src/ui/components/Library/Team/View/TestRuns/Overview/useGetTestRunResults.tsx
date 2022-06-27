import { useSimulateListQuery } from "ui/utils/library";

export function useGetTestRunResults(testRunId: string) {
  return useSimulateListQuery(testRunId);
}
