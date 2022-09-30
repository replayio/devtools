import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { checkAutocompleteMatches } from "../helpers/autocomplete";
import { focusConsoleTextArea, openConsolePanel, warpToMessage } from "../helpers/console-panel";
import { clearTextArea } from "../helpers/utils";

test(`Test basic breakpoint functionality.`, async ({ page }) => {
  await startTest(page, "doc_rr_objects.html");
  await openDevToolsTab(page);
  await openConsolePanel(page);
  await warpToMessage(page, "Done");

  const textArea = await focusConsoleTextArea(page);

  textArea.fill("r.");

  await page.evaluate(() => {
    window.jsterm.showAutocomplete!(true);
  });

  const objectProperties = Object.getOwnPropertyNames(Object.prototype);

  await checkAutocompleteMatches(page, objectProperties.concat(["_foo", "foo"]));

  textArea.fill("foo.ba");

  await checkAutocompleteMatches(page, ["bar", "baz"]);
});
