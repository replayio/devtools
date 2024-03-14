import { Locator, expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  getEventJumpButton,
  getEventListItems,
  openEventsPanel,
} from "../helpers/info-event-panel";
import { openSourceExplorerPanel } from "../helpers/source-explorer-panel";
import {
  addLogpoint,
  getSelectedLineNumber,
  verifyLogpointStep,
  waitForSelectedSource,
} from "../helpers/source-panel";
import { getTimelineCurrentPercent } from "../helpers/timeline";
import { debugPrint, getByTestName, waitFor } from "../helpers/utils";
import test from "../testFixture";

test.use({ exampleKey: "redux-fundamentals/dist/index.html" });

type NavEvent = { type: "navigation"; url: string };
type KeypressEvent = { type: "keypress"; key: string };
type ClickEvent = { type: "mousedown" };

type Event = NavEvent | KeypressEvent | ClickEvent;

const makeKeypressEvent = (key: string): KeypressEvent => ({ type: "keypress", key } as const);

const expectedEvents: Event[] = (
  [
    { type: "navigation", url: "localhost:8080" },
    { type: "mousedown" },
    { type: "mousedown" },
    [..."test"].map(makeKeypressEvent),
    [..."Watch Bengals"].map(makeKeypressEvent),
    { type: "keypress", key: "Enter" },
    [..."Celebrate"].map(makeKeypressEvent),
    { type: "keypress", key: "Enter" },
    { type: "mousedown" },
    { type: "mousedown" },
    { type: "mousedown" },
    { type: "mousedown" },
    { type: "mousedown" },
    { type: "mousedown" },
    { type: "mousedown" },
    { type: "mousedown" },
    { type: "mousedown" },
    { type: "mousedown" },
  ] as const
).flat();

async function checkForJumpButton(eventLocator: Locator, shouldBeEnabled: boolean) {
  const jumpButton = getEventJumpButton(eventLocator);
  expect(await jumpButton.isVisible()).toBe(true);
  await jumpButton.hover({});

  await waitFor(async () => {
    const buttonText = await getByTestName(jumpButton, "JumpToCodeButtonLabel").innerText();
    const expectedText = shouldBeEnabled ? "Jump to code" : "No results";
    expect(buttonText).toBe(expectedText);
  });

  return jumpButton;
}

test(`jump-to-code-01: Test basic jumping functionality`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  const queryParams = new URLSearchParams();
  // Force this test to always re-run the Event Listeners (and other) routines
  // See pref names in packages/shared/user-data/GraphQL/config.ts
  // queryParams.set("features", "backend_rerunRoutines");

  await startTest(page, recordingId, undefined, queryParams);
  await openDevToolsTab(page);

  await openSourceExplorerPanel(page);
  await openEventsPanel(page);

  const eventListItems = getEventListItems(page);

  let numListItems = 0;
  await waitFor(async () => {
    numListItems = await eventListItems.count();
    expect(numListItems).toBe(expectedEvents.length);
  });

  // Check that all the expected event items are present
  for (const [index, event] of expectedEvents.entries()) {
    const eventLocator = eventListItems.nth(index);

    let expectedText = "";
    switch (event.type) {
      case "navigation": {
        expectedText = event.url;
        break;
      }
      case "keypress": {
        expectedText = `Key Press ${event.key}`;
        break;
      }
      case "mousedown": {
        expectedText = "Click";
        break;
      }
    }

    debugPrint(page, `Checking event: ${event.type} (text: '${expectedText}')`);

    const type = await eventLocator.getAttribute("data-test-type");
    expect(type).toBe(event.type);
    const labelText = await getByTestName(eventLocator, "EventLabel").innerText();
    expect(labelText).toBe(expectedText);
  }

  debugPrint(page, "Checking for a disabled click 'Jump' button");
  // First two clicks were at the margins of the page, so no handlers
  const firstInvalidClick = eventListItems.nth(1);
  await checkForJumpButton(firstInvalidClick, false);

  debugPrint(page, "Checking for a disabled keypress 'Jump' button");
  // The text "test" was typed with no input focused, so no handlers
  const firstInvalidKeypress = eventListItems.nth(3);
  await checkForJumpButton(firstInvalidKeypress, false);

  // the text "Watch Bengals" was typed into an input, so there is a handler
  debugPrint(page, "Checking for an enabled keypress 'Jump' button");
  const firstValidKeypress = eventListItems.nth(7);
  const firstValidKeypressJumpButton = await checkForJumpButton(firstValidKeypress, true);

  // Check interactions
  const navigationEvent = eventListItems.nth(0);
  await navigationEvent.click();
  await waitFor(async () => {
    const timelinePercent = await getTimelineCurrentPercent(page);
    expect(Math.round(timelinePercent)).toBe(0);
  });

  debugPrint(page, "Checking that the first keypress J2C jumps to the correct line");
  await firstValidKeypressJumpButton.click();
  await waitForSelectedSource(page, "Header.tsx");
  // Should highlight the line that ran
  await waitFor(async () => {
    const lineNumber = await getSelectedLineNumber(page, true);
    expect(lineNumber).toBe(12);
  });

  // Should also have jumped in time. Since this can vary (slightly different progress %
  // based on timing differences), we'll add a log statement and verify _which_ hit we're at.
  await addLogpoint(page, {
    url: "Header.tsx",
    lineNumber: 12,
  });

  // Should have paused on the handler for the first valid keystroke
  await verifyLogpointStep(page, "1/22", { url: "Header.tsx", lineNumber: 12 });

  // the next clicks were on real buttons, so there is a handler
  debugPrint(page, "Checking for an enabled click 'Jump' button");
  const firstValidClick = eventListItems.nth(31);
  const firstValidClickJumpButton = await checkForJumpButton(firstValidClick, true);

  debugPrint(page, "Checking that the first click J2C jumps to the correct line");
  await firstValidClickJumpButton.click();
  await waitForSelectedSource(page, "TodoListItem.tsx");
  // Should highlight the line that ran
  await waitFor(async () => {
    const lineNumber = await getSelectedLineNumber(page, true);
    expect(lineNumber).toBe(22);
  });

  // Should also have jumped in time
  // Should also have jumped in time. Since this can vary (slightly different progress %
  // based on timing differences), we'll add a log statement and verify _which_ hit we're at.
  await addLogpoint(page, {
    url: "TodoListItem.tsx",
    lineNumber: 22,
  });

  // Should have paused on the handler for the first valid click
  await verifyLogpointStep(page, "1/2", {
    url: "TodoListItem.tsx",
    lineNumber: 22,
  });
});
