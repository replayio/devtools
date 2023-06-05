import { TestRecording } from "shared/test-suites/types";

export type TestTree = {
  scopes: { [name: string]: TestTree };
  testRecordings: TestRecording[];
};
