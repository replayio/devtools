import { Locator, Page, expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  findConsoleMessage,
  openConsolePanel,
  setConsoleMessageAsFocusEnd,
  setConsoleMessageAsFocusStart,
  verifyConsoleMessage,
} from "../helpers/console-panel";
import {
  getEventJumpButton,
  getEventListItems,
  openEventsPanel,
} from "../helpers/info-event-panel";
import { openSource } from "../helpers/source-explorer-panel";
import { addLogpoint, verifyJumpToCodeResults } from "../helpers/source-panel";
import {
  clearFocusRange,
  getFocusBeginTime,
  getFocusEndTime,
  getTimelineCurrentPercent,
  waitForTimelineAdvanced,
} from "../helpers/timeline";
import { debugPrint, getByTestName, waitFor } from "../helpers/utils";
import test from "../testFixture";

test.use({ exampleKey: "doc_long_busy.html" });

// The recording is about two minutes of ticks (one "Tick" message per second) with 24 clicks
// on the Increment button, five seconds apart. Click 13 holds the mouse button down for a
// second and logs "Holding increment button" before releasing it.
const NUM_CLICKS = 24;
const HELD_CLICK_NUMBER = 13;
// The script lives in its own JS file because jump-to-code ignores handlers in inline HTML scripts
const SOURCE_URL = "long_busy.js";
const CLICK_HANDLER_LINE = 42;

// Loading a multi-minute focus window can be slow; give it more time than the defaults
const LOAD_TIMEOUT = 60_000;

test("focus_mode-02: focus windows longer than 60 seconds on a long, busy recording", async ({
  pageWithMeta: { page, recordingId, testScope },
}) => {
  const queryParams = new URLSearchParams();
  queryParams.set("features", "backend_rerunRoutines");
  await startTest(page, recordingId, testScope, undefined, queryParams);
  await openDevToolsTab(page);

  await openSource(page, SOURCE_URL);
  await addLogpoint(page, {
    content: `"Handler", state.clicks`,
    lineNumber: CLICK_HANDLER_LINE,
    url: SOURCE_URL,
  });

  await openConsolePanel(page);

  debugPrint(page, "Focusing on the whole recording");
  await clearFocusRange(page);
  await waitFor(
    async () => {
      const begin = await getFocusBeginTime(page);
      const end = await getFocusEndTime(page);
      expect(begin).not.toBeNull();
      expect(end).not.toBeNull();
      expect(end! - begin!).toBeGreaterThan(60_000);
    },
    { timeout: LOAD_TIMEOUT }
  );

  await verifyConsoleMessage(page, "Clicked", "console-log", NUM_CLICKS);
  await verifyConsoleMessage(page, "Handler", "log-point", NUM_CLICKS);
  await verifyConsoleMessage(page, "Tick 120", "console-log", 1);

  debugPrint(page, "Narrowing the focus window to the second half");
  await setConsoleMessageAsFocusStart(
    page,
    await findConsoleMessage(page, `Clicked ${HELD_CLICK_NUMBER}`, "console-log")
  );
  const numClicksInSecondHalf = NUM_CLICKS - HELD_CLICK_NUMBER + 1;
  await verifyConsoleMessage(page, "Clicked", "console-log", numClicksInSecondHalf);
  // The log-point runs before the handler's "Clicked" message, so the one for the held click is
  // before the focus window
  await verifyConsoleMessage(page, "Handler", "log-point", numClicksInSecondHalf - 1);

  debugPrint(page, "Widening the focus window to the whole recording again");
  await clearFocusRange(page);
  await verifyConsoleMessage(page, "Clicked", "console-log", NUM_CLICKS);
  await verifyConsoleMessage(page, "Handler", "log-point", NUM_CLICKS);

  debugPrint(page, "Jumping to the handler of the first click");
  await openEventsPanel(page);
  const eventListItems = getEventListItems(page);
  // The navigation, one event per Increment click, and the Finish click
  await waitFor(async () => {
    expect(await eventListItems.count()).toBe(NUM_CLICKS + 2);
  });
  await clickJumpToCode(page, eventListItems.nth(1));
  await verifyJumpToCodeResults(page, SOURCE_URL, CLICK_HANDLER_LINE);
  const percentAtFirstClick = await getTimelineCurrentPercent(page);

  debugPrint(page, "Ending the focus window between a mousedown and its click handler");
  await openConsolePanel(page);
  await setConsoleMessageAsFocusEnd(
    page,
    await findConsoleMessage(page, "Holding increment button", "console-log")
  );
  await verifyConsoleMessage(page, "Clicked", "console-log", HELD_CLICK_NUMBER - 1);

  await openEventsPanel(page);
  // The navigation, then one event per click up to and including the held one
  await waitFor(async () => {
    expect(await eventListItems.count()).toBe(HELD_CLICK_NUMBER + 1);
  });

  // The held click's handler runs after the end of the focus window. Jump-to-code still finds it
  // and seeks there, but DevTools doesn't create pauses outside the focus window, so the most we
  // can check is that the timeline moved to the handler.
  await clickJumpToCode(page, eventListItems.last());
  await waitForTimelineAdvanced(page, percentAtFirstClick);
});

async function clickJumpToCode(page: Page, eventListItem: Locator) {
  const jumpButton = getEventJumpButton(eventListItem);
  await jumpButton.hover();
  await waitFor(
    async () => {
      const label = await getByTestName(jumpButton, "JumpToCodeButtonLabel").innerText();
      expect(label).toBe("Jump to code");
    },
    { timeout: LOAD_TIMEOUT }
  );
  await jumpButton.click();
}
