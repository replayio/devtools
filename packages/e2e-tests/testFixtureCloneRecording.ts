import { Page, test as base } from "@playwright/test";

import { TestRecordingKey } from "./helpers";
import { cloneTestRecording, deleteTestRecording } from "./helpers/utils";

type TestIsolatedRecordingFixture = {
  exampleKey: TestRecordingKey;
  pageWithMeta: any;
};

let testWithCloneRecording = base.extend<TestIsolatedRecordingFixture>({
  exampleKey: undefined,
  pageWithMeta: [
    async ({ page, exampleKey }, use) => {
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
    { auto: true, _title: "Clone recording" },
  ],
});

testWithCloneRecording = testWithCloneRecording.extend<any>({
  _replay: [
    async ({ playwright, page }, use, testInfo) => {
      console.log("Replay Fixture is run");
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
            userData,
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
                window.__RECORD_REPLAY_ANNOTATION_HOOK__?.("replay-playwright", {
                  event: "step:start",
                  id,
                });
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
              window.__RECORD_REPLAY_ANNOTATION_HOOK__?.("replay-playwright", {
                event: "step:end",
                id,
              });
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
    { auto: "all-hooks-included", _title: "Replay fixture" },
  ],
});

export default testWithCloneRecording;
export { testWithCloneRecording as test };
export { expect } from "@playwright/test";
export type { Page } from "@playwright/test";
