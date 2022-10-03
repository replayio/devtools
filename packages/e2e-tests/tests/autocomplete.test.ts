import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { checkAutocompleteMatches } from "../helpers/autocomplete";
import { focusConsoleTextArea, openConsolePanel, warpToMessage } from "../helpers/console-panel";
import { clearTextArea } from "../helpers/utils";

test(`autocomplete in the console`, async ({ page }) => {
  await startTest(page, "doc_rr_objects.html");
  await openDevToolsTab(page);
  await warpToMessage(page, "Done");

  const objectProperties = Object.getOwnPropertyNames(Object.prototype);
  const textArea = await focusConsoleTextArea(page);

  // show all properties (including getters) of an object in the current scope
  textArea.fill("r.");

  await page.evaluate(() => {
    window.jsterm.showAutocomplete!(true);
  });

  await checkAutocompleteMatches(page, objectProperties.concat(["_foo", "foo"]));

  clearTextArea(page, textArea);

  // show all properties (including getters) of a nested object
  textArea.fill("r.foo.");

  await checkAutocompleteMatches(page, ["bar", "baz", "constructor"]);

  clearTextArea(page, textArea);

  // show matching properties (including getters) of a nested object
  textArea.fill("r.foo.ba");

  await checkAutocompleteMatches(page, ["bar", "baz"]);

  clearTextArea(page, textArea);

  // show all properties (including getters) of a nested object
  // using bracket notation without a quotation mark
  textArea.fill("r.foo[");

  await checkAutocompleteMatches(page, ["bar", "baz", "constructor"]);

  // clear the autocomplete matches before the next test
  // because it expects the same matches as the previous one
  clearTextArea(page, textArea);

  await page.evaluate(() => window.jsterm.showAutocomplete!(true));

  await checkAutocompleteMatches(page, []);

  // show matching properties (including getters) of a nested object
  // using bracket notation with a double quotation mark
  textArea.fill('r.foo["ba');

  await page.evaluate(() => window.jsterm.showAutocomplete!(true));

  await checkAutocompleteMatches(page, ["bar", "baz"]);

  clearTextArea(page, textArea);

  // show all properties (including getters) of a nested object
  // using bracket notation with a single quotation mark
  textArea.fill("r.foo[");

  await page.evaluate(() => window.jsterm.showAutocomplete!(true));

  await checkAutocompleteMatches(page, ["bar", "baz", "constructor"]);
});
