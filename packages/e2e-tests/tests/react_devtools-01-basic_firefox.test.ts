import { Locator } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  executeTerminalExpression,
  findConsoleMessage,
  openConsolePanel,
} from "../helpers/console-panel";
import {
  enableComponentPicker,
  getInspectedItem,
  getInspectedItemValue,
  getReactComponents,
  isComponentPickerEnabled,
  jumpToMessageAndCheckComponents,
  openReactDevtoolsPanel,
} from "../helpers/legacy-react-devtools-panel";
import { getPropertyValue } from "../helpers/object-inspector";
import { clickScreenshot, hoverScreenshot } from "../helpers/screenshot";
import { waitFor } from "../helpers/utils";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "cra/dist/index.html" });

async function waitForAndCheckInspectedItem(item: Locator, expectedValue: string) {
  await item.waitFor();
  const value = await getInspectedItemValue(item);
  expect(value).toBe(expectedValue);
}

test("react_devtools-01: Basic RDT behavior (FF)", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  // General behavior: should show a React component tree
  await jumpToMessageAndCheckComponents(page, "Initial list", 3);

  // and should update the tree based on time
  await jumpToMessageAndCheckComponents(page, "Added an entry", 4);

  // Should be able to jump backwards okay
  await jumpToMessageAndCheckComponents(page, "Initial list", 3);

  // Jumping to a point before React has initialized
  // should show a message in the React DevTools panel
  await page.locator(".progress-bar").click({ position: { x: 0, y: 16 } });
  await page
    .locator(
      ".secondary-toolbox-content:has-text('Try picking a different point on the timeline.')"
    )
    .waitFor();

  // And back to a later point should still work
  await jumpToMessageAndCheckComponents(page, "Added an entry", 4);

  // Verify that the React component picker
  // works, by manually calculating the coordinates of
  // a DOM node in the recording, activating the picker,
  // and hovering over the translated DOM node coordinates.
  await executeTerminalExpression(page, "document.querySelector('li').getBoundingClientRect()");
  const message = await findConsoleMessage(page, "DOMRect");
  const left = +(await getPropertyValue(message, "left"));
  const right = +(await getPropertyValue(message, "right"));
  const top = +(await getPropertyValue(message, "top"));
  const bottom = +(await getPropertyValue(message, "bottom"));
  const x = (left + right) / 2;
  const y = (top + bottom) / 2;
  await openReactDevtoolsPanel(page);
  await enableComponentPicker(page);
  await waitFor(async () => {
    await hoverScreenshot(page, x, y);
    await clickScreenshot(page, x, y);
    expect(await page.locator("[class^=InactiveSelectedElement]").count()).toBeGreaterThan(0);
  });

  await waitForAndCheckInspectedItem(getInspectedItem(page, "Props", "text"), '"Foo"');

  await jumpToMessageAndCheckComponents(page, "Removed an entry", 3);

  // Hovering components should highlight in the video preview
  let component = getReactComponents(page).nth(2);
  await component.hover();
  const highlighter = page.locator("#box-model-content");
  await highlighter.waitFor();
  const expectedHighlighterShape = `M${left},${top} L${right},${top} L${right},${bottom} L${left},${bottom}`;
  expect(await highlighter.getAttribute("d")).toEqual(expectedHighlighterShape);

  // React component props inspector works
  component = getReactComponents(page).nth(0);
  await component.click();
  const stateItem = getInspectedItem(page, "Hooks", "State");
  await stateItem.waitFor();
  await stateItem.locator("button").click();
  const childItem = getInspectedItem(page, "Hooks", "0");
  await waitForAndCheckInspectedItem(childItem, '{key: "2", text: "Bar"}');
  await childItem.locator("button").click();
  await waitForAndCheckInspectedItem(getInspectedItem(page, "Hooks", "key"), '"2"');
  await waitForAndCheckInspectedItem(getInspectedItem(page, "Hooks", "text"), '"Bar"');

  // Component picker should cancel if you click outside the video
  await enableComponentPicker(page);
  expect(await isComponentPickerEnabled(page)).toBe(true);

  // Click on the "Console" tab should cancel the component picker
  await openConsolePanel(page);
  await openReactDevtoolsPanel(page);
  await waitFor(async () => expect(await isComponentPickerEnabled(page)).toBe(false));
});
