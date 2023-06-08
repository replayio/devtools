import { TestRecording } from "shared/test-suites/RecordingTestMetadata";

export type TestTree = {
  scopes: { [name: string]: TestTree };
  testRecordings: TestRecording[];
};
