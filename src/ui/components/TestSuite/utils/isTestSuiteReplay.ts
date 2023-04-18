import { Recording } from "shared/graphql/types";

export function isTestSuiteReplay(recording: Recording): boolean {
  return recording?.metadata?.test != null;
}
