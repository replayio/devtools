import { Page, test as base } from "@playwright/test";

import { TestRecordingKey } from "./helpers";
import { cloneTestRecording, deleteTestRecording } from "./helpers/utils";

type TestIsolatedRecordingFixture = {
  exampleKey: TestRecordingKey;
  pageWithMeta: {
    page: Page;
    recordingId: string;
  };
  _replay: any;
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

    await deleteTestRecording(newRecordingId);
  },

  _replay: [
    async ({ playwright, page }, use, testInfo) => {
      page.on("console", async msg => {
        const values = [];
        for (const arg of msg.args()) {
          //   values.push(await arg?.jsonValue?.());
        }
        // console.log(...values);
      });

      const csiListener = {
        onApiCallBegin: (apiName, params, stackTrace, wallTime, userData) => {
          if (
            ["Object.onApiCallBegin", "Object.onApiCallEnd"].includes(stackTrace.frames[0].function)
          ) {
            return;
          }

          if ("Page.<anonymous>" === stackTrace.frames[0].function) {
            return;
          }

          const args = JSON.stringify({ apiName, params });
          const id = userData?.userObject?.stepId;
          console.log(
            "onApiCallBegin",
            id,
            apiName,
            stackTrace.frames
              .map(f => f.function)
              .filter(Boolean)
              .join(" -> ")
          );

          page
            .evaluate(
              ([id, apiName]) => {
                console.log(`Page:: onApiCallBegin`, {
                  event: "step:start",
                  id,
                  apiName,
                });
                // @ts-ignore
                window.top.__RECORD_REPLAY_ANNOTATION__?.("replay-playwright");
              },
              [id, apiName]
            )
            .then()
            .catch(e => console.error);
        },

        onApiCallEnd: (userData, error) => {
          const functionName = userData.userObject?.location?.function;
          if (
            ["Object.onApiCallBegin", "Page.<anonymous>", "Object.onApiCallEnd"].includes(
              functionName
            )
          ) {
            return;
          }

          const id = userData?.userObject?.stepId;

          console.log("onApiCallEnd", id);
          page
            .evaluate(() => {
              console.log("Page:: onApiCallEnd");
              // @ts-ignore
              window.top.__RECORD_REPLAY_ANNOTATION__?.("replay-playwright");
            })
            .then()
            .catch(e => console.error);
        },
      };

      const clientInstrumentation = playwright._instrumentation;
      clientInstrumentation.addListener(csiListener);

      await use();

      clientInstrumentation.removeListener(csiListener);
    },
    { auto: "all-hooks-included", _title: "trace recording" },
  ],
});

export default testWithCloneRecording;
export { testWithCloneRecording as test };
export { expect } from "@playwright/test";
export type { Page } from "@playwright/test";
