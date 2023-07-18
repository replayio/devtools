import { Page, test as base } from "@playwright/test";

import { TestRecordingKey } from "./helpers";
import { cloneTestRecording, deleteTestRecording } from "./helpers/utils";

type TestIsolatedRecordingFixture = {
  exampleKey: TestRecordingKey;
  pageWithMeta: {
    page: Page;
    recordingId: string;
  };
};

const testWithCloneRecording = base.extend<TestIsolatedRecordingFixture>({
  exampleKey: undefined,
  pageWithMeta: async ({ page, exampleKey }, use) => {
    const exampleRecordings = require("./examples.json");
    if (!exampleRecordings[exampleKey]) {
      throw new Error("Invalid recording");
    }

    const newRecordingId = await cloneTestRecording(exampleRecordings[exampleKey]);

    await use({
      page,
      recordingId: newRecordingId,
    });

    console.log("Deleting cloned recording", newRecordingId);
    await deleteTestRecording(newRecordingId);
  },
});
export default testWithCloneRecording;
export { testWithCloneRecording as test };
export { expect, Page } from "@playwright/test";
