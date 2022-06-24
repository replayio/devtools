import { useSimulateListQuery } from "../../../../../../src/hooks";

export function useGetTestRunResults(testRunId: string) {
  return useSimulateListQuery(testRunId);
}
