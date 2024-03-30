import { openDevToolsTab, startTest } from "../helpers";
import { findConsoleMessage, waitForTerminal, warpToMessage } from "../helpers/console-panel";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "doc_rr_objects.html" });

test(`object_preview-08: should render ellipsis for collapsed objects with truncated properties`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await waitForTerminal(page);

  await warpToMessage(page, "Done");

  {
    // Properties truncated by the Protocol (overflow)
    const message = await findConsoleMessage(
      page,
      "{a: 0, a0: 0, a1: 1, a2: 2, a3: 3, …}",
      "console-log"
    );
    await expect(message).toBeVisible();
  }

  {
    // Properties truncated by the client (no overflow)
    const message = await findConsoleMessage(page, "76objectWithSixProperties", "console-log");
    const textContent = await message.textContent();
    expect(textContent).toContain("{a: 1, b: 2, c: 3, d: 4, e: 5, …}");
  }
});
