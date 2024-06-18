import { openDevToolsTab, startTest } from "../helpers";
import { warpToMessage } from "../helpers/console-panel";
import {
  getAsyncParentCount,
  isAsyncParentUnavailable,
  waitForAllFramesToLoad,
} from "../helpers/pause-information-panel";
import { setFocusRange } from "../helpers/timeline";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "doc_async_stack.html" });

test(`async-stack: should detect async stacks outside the focus window`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  await warpToMessage(page, "Starting", 7);
  await waitForAllFramesToLoad(page);
  expect(await getAsyncParentCount(page)).toBe(0);
  expect(await isAsyncParentUnavailable(page)).toBe(false);

  await warpToMessage(page, "ExampleFinished", 9);
  await waitForAllFramesToLoad(page);
  expect(await getAsyncParentCount(page)).toBe(1);
  expect(await isAsyncParentUnavailable(page)).toBe(false);

  await setFocusRange(page, { startTimeString: "00:01" });
  await waitForAllFramesToLoad(page);
  expect(await getAsyncParentCount(page)).toBe(1);
  expect(await isAsyncParentUnavailable(page)).toBe(true);
});
