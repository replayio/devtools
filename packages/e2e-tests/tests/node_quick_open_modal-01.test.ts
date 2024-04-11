import { openDevToolsTab, startTest } from "../helpers";
import { openSource } from "../helpers/source-explorer-panel";
import { getCommandKey } from "../helpers/utils";
import test from "../testFixture";

test.use({ exampleKey: "node/basic.js" });

test("node_quick_open_modal-01: Test basic searching functionality", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  await openSource(page, "basic.js");

  await page.keyboard.press(`${getCommandKey()}+Shift+O`);
  await page.focus('[data-test-id="QuickOpenInput"]');

  await page.keyboard.type("bar");

  const sourceRow = await page.waitForSelector(
    '[data-test-id="QuickOpenResultsList"]:has-text("bar")'
  );

  sourceRow.click();

  await page.waitForSelector(
    `[data-test-id="SourceLine-8"]>[data-test-name="ViewSourceHighlight"]`
  );
});
