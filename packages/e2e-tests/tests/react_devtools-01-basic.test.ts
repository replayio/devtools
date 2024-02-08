import { openDevToolsTab, startTest } from "../helpers";
import {
  executeTerminalExpression,
  findConsoleMessage,
  openConsolePanel,
} from "../helpers/console-panel";
import { findElementCoordinates, openElementsPanel } from "../helpers/elements-panel";
import {
  enableComponentPicker,
  getComponentName,
  getInspectedHook,
  getReactComponents,
  getSelectedRow,
  isComponentPickerEnabled,
  jumpToMessageAndCheckComponents,
  openReactDevtoolsPanel,
  verifyInspectedPropertyValue,
} from "../helpers/new-react-devtools-panel";
import { getGetterValue } from "../helpers/object-inspector";
import { clickScreenshot, hoverScreenshot } from "../helpers/screenshot";
import { waitFor } from "../helpers/utils";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "cra/dist/index.html" });

test("react_devtools-01: Basic RDT behavior", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  const queryParams = new URLSearchParams();
  // Force this test to always re-run the RDT (and other) routines
  // See pref names in packages/shared/user-data/GraphQL/config.ts
  queryParams.set("features", "backend_rerunRoutines");

  await startTest(page, recordingId, undefined, queryParams);

  await openDevToolsTab(page);

  // If the "React" tab shows up, we know that the routine ran
  await openReactDevtoolsPanel(page);

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

  // Simplify test by jumping to a point where there's only one <li> so we can easily select it
  await jumpToMessageAndCheckComponents(page, "Initial list", 3);

  // Verify that the React component picker
  // works, by manually calculating the coordinates of
  // a DOM node in the recording, activating the picker,
  // and hovering over the translated DOM node coordinates.
  await executeTerminalExpression(page, "document.querySelector('li').getBoundingClientRect()");
  const message = await findConsoleMessage(page, "DOMRect");
  // These show up as getters in Chromium, not properties
  const left = +(await getGetterValue(message, "left"));
  const right = +(await getGetterValue(message, "right"));
  const top = +(await getGetterValue(message, "top"));
  const bottom = +(await getGetterValue(message, "bottom"));

  await openElementsPanel(page);
  const { x, y } = await findElementCoordinates(page, "<li>");

  await openReactDevtoolsPanel(page);
  await enableComponentPicker(page);
  await waitFor(async () => {
    await page.mouse.move(0, 0); // Stop hovering
    await hoverScreenshot(page, x, y);
    await clickScreenshot(page, x, y);
    const actualName = await getComponentName(getSelectedRow(page));
    expect(actualName).toBe("Item");
  });

  await verifyInspectedPropertyValue(page, "Props", "text", '"Foo"');

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
  const stateItem = getInspectedHook(page, "State");
  await stateItem.waitFor();
  await stateItem.locator('[role="button"]').click();
  await waitFor(async () => {
    await expect(await stateItem.textContent()).toContain('{key: "2", text: "Bar"}');
  });

  // Component picker should cancel if you click outside the video
  await enableComponentPicker(page);
  expect(await isComponentPickerEnabled(page)).toBe(true);

  // Click on the "Console" tab should cancel the component picker
  await openConsolePanel(page);
  await openReactDevtoolsPanel(page);
  await waitFor(async () => expect(await isComponentPickerEnabled(page)).toBe(false));
});
