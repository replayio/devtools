import { Recording } from "shared/graphql/types";
import {
  isGroupedTestCasesV2,
  isGroupedTestCasesV3,
} from "shared/test-suites/RecordingTestMetadata";

export function isTestSuiteReplay(recording: Recording): boolean {
  const testMetadata = recording?.metadata?.test;
  return (
    testMetadata != null &&
    (isGroupedTestCasesV2(testMetadata) || isGroupedTestCasesV3(testMetadata))
  );
}
