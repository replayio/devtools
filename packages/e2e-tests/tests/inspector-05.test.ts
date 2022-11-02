import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import {
  activateInspectorTool,
  checkAppliedRules,
  selectElementsRowWithText,
} from "../helpers/elements-panel";

test("inspector-05: Test that styles for elements can be viewed", async ({ page }) => {
  await startTest(page, "doc_inspector_sourcemapped.html");
  await openDevToolsTab(page);
  await openConsolePanel(page);
  await warpToMessage(page, "ExampleFinished");
  await activateInspectorTool(page);

  await selectElementsRowWithText(page, "maindiv");
  await checkAppliedRules(page, [
    {
      selector: "div",
      source: "styles.css:2",
      properties: [{ text: "background-color: blue;", overridden: false }],
    },
  ]);
});
