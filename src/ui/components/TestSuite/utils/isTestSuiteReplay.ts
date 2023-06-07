import { Recording } from "shared/graphql/types";
import { isGroupedTestCases, isIncrementalGroupedTestCases } from "shared/test-suites/types";

export function isTestSuiteReplay(recording: Recording): boolean {
  const testMetadata = recording?.metadata?.test;
  return (
    testMetadata != null &&
    (isIncrementalGroupedTestCases(testMetadata) || isGroupedTestCases(testMetadata))
  );
}
