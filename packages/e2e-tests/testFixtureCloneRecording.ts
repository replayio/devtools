import { Page, test as base } from "@playwright/test";

import { cloneTestRecording, deleteTestRecording } from "./helpers/utils";

type TestIsolatedRecordingFixture = {
  recordingUrl: string;
  pageWithMeta: {
    page: Page;
    recordingId: string;
  };
};

export default base.extend<TestIsolatedRecordingFixture>({
  recordingUrl: undefined,
  pageWithMeta: async ({ page, recordingUrl }, use) => {
    const exampleRecordings = require("./examples.json");
    if (!exampleRecordings[recordingUrl]) {
      throw new Error("Invalid recording");
    }

    const newRecordingId = await cloneTestRecording(exampleRecordings[recordingUrl]);

    await use({
      page,
      recordingId: newRecordingId,
    });

    console.log("Deleting cloned recording", newRecordingId);
    await deleteTestRecording(newRecordingId);
  },
});

export { expect } from "@playwright/test";
