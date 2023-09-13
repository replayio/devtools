import { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { executeAndVerifyTerminalExpression } from "../helpers/console-panel";
import {
  getEventJumpButton,
  getEventListItems,
  openEventsPanel,
} from "../helpers/info-event-panel";
import { resumeToLine, rewindToLine } from "../helpers/pause-information-panel";
import { openSourceExplorerPanel } from "../helpers/source-explorer-panel";
import { addBreakpoint } from "../helpers/source-panel";
import { debugPrint, delay, getByTestName, waitFor } from "../helpers/utils";
import test from "../testFixtureCloneRecording";

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

test(`jump-to-code-01: Test basic jumping functionality`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, exampleKey, recordingId);
  await openDevToolsTab(page);

  await openSourceExplorerPanel(page);
  await openEventsPanel(page);

  const eventListItems = getEventListItems(page);

  let numListItems = 0;
  await waitFor(async () => {
    numListItems = await eventListItems.count();
    expect(numListItems).toBe(expectedEvents.length);
  });

  // // Check that all the expected event items are present
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

  debugPrint(page, "Checking for a disabled 'Jump' button");
  // The text "test" was typed with no input focused, so no handlers
  const firstInvalidKeypress = eventListItems.nth(3);
  const firstInvalidJumpButton = getEventJumpButton(firstInvalidKeypress);
  expect(await firstInvalidJumpButton.isVisible()).toBe(true);
  await firstInvalidJumpButton.hover({});

  const firstInvalidButtonText = await getByTestName(
    firstInvalidJumpButton,
    "ButtonLabel"
  ).innerText();
  expect(firstInvalidButtonText).toBe("No results");

  // the text "Watch Bengals" was typed into an input, so there is a handler
  debugPrint(page, "Checking for an enabled 'Jump' button");
  const firstValidKeypress = eventListItems.nth(7);
  const firstValidJumpButton = getEventJumpButton(firstValidKeypress);
  expect(await firstValidJumpButton.isVisible()).toBe(true);
  await firstValidJumpButton.hover();
  const firstValidButtonText = await getByTestName(firstValidJumpButton, "ButtonLabel").innerText();
  expect(firstValidButtonText).toBe("Jump to code");
});
