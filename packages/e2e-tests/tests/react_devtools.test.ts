import test, { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  executeTerminalExpression,
  findConsoleMessage,
  openConsolePanel,
  warpToMessage,
} from "../helpers/console-panel";
import { getPropertyValue } from "../helpers/object-inspector";
import {
  enableComponentPicker,
  getInspectedItem,
  getReactComponents,
  openReactDevtoolsPanel,
  waitForAndCheckInspectedItem,
  waitForReactComponentCount,
} from "../helpers/react-devtools-panel";
import { hoverScreenshot } from "../helpers/screenshot";
import { waitFor } from "../helpers/utils";

test("react_devtools: Test React DevTools.", async ({ page }) => {
  await startTest(page, "cra/dist/index.html");
  await openDevToolsTab(page);

  await openConsolePanel(page);
  await warpToMessage(page, "Initial list");
  await openReactDevtoolsPanel(page);
  await waitForReactComponentCount(page, 3);

  await openConsolePanel(page);
  await warpToMessage(page, "Added an entry");
  await openReactDevtoolsPanel(page);
  await waitForReactComponentCount(page, 4);

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
    await expect(await page.locator("[class^=InactiveSelectedElement]").count()).toBeGreaterThan(0);
  });
  await waitForAndCheckInspectedItem(getInspectedItem(page, "Props", "text"), '"Foo"');

  await openConsolePanel(page);
  await warpToMessage(page, "Removed an entry");
  await openReactDevtoolsPanel(page);
  await waitForReactComponentCount(page, 3);

  let component = getReactComponents(page).nth(2);
  await component.hover();
  const highlighter = page.locator("#box-model-content");
  await highlighter.waitFor();
  const expectedHighlighterShape = `M${left},${top} L${right},${top} L${right},${bottom} L${left},${bottom}`;
  await expect(await highlighter.getAttribute("d")).toEqual(expectedHighlighterShape);

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

  await page.locator(".progress-bar").click({ position: { x: 0, y: 16 } });
  await page
    .locator(
      ".secondary-toolbox-content:has-text('Try picking a different point on the timeline.')"
    )
    .waitFor();
});
