import { openDevToolsTab, startTest } from "../helpers";
import { E2E_USER_1 } from "../helpers/authentication";
import { isPassportItemCompleted } from "../helpers/passport";
import { enablePassport } from "../helpers/settings";
import { addLogpoint, editLogPoint, removeAllLogpoints } from "../helpers/source-panel";
import { enterFocusMode, saveFocusRange } from "../helpers/timeline";
import { clearTextArea, getCommandKey, waitFor } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "doc_rr_console.html", testUsers: [E2E_USER_1] });

test(`authenticated/passport-03: Swiss army knife`, async ({
  pageWithMeta: { page, recordingId, testScope },
  testUsers,
}) => {
  await startTest(page, recordingId, { apiKey: testUsers![0].apiKey, testScope });

  await enablePassport(page);

  expect(await isPassportItemCompleted(page, "Add a unicorn badge")).toBeFalsy();
  expect(await isPassportItemCompleted(page, "Search source text")).toBeFalsy();
  expect(await isPassportItemCompleted(page, "Set a focus window")).toBeFalsy();
  expect(await isPassportItemCompleted(page, "Go to file (cmd-p)")).toBeFalsy();

  await openDevToolsTab(page);

  await addLogpoint(page, { url: "doc_rr_console.html", lineNumber: 13 });
  await editLogPoint(page, { lineNumber: 13, badge: "unicorn", saveAfterEdit: true });
  await removeAllLogpoints(page);

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Add a unicorn badge")).toBeTruthy()
  );

  await page.locator('[data-test-name="ToolbarButton-Search"]').click();
  const searchInput = page.locator('[data-test-id="FileSearch-Input"]');
  await searchInput.focus();
  await clearTextArea(page, searchInput);
  await searchInput.fill("iteration");
  await page.keyboard.press("Enter");

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Search source text")).toBeTruthy()
  );

  await enterFocusMode(page);
  await saveFocusRange(page);

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Set a focus window")).toBeTruthy()
  );

  await page.keyboard.down(getCommandKey());
  await page.keyboard.type("p");
  await page.keyboard.up(getCommandKey());
  await page.keyboard.press("Escape");

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Go to file (cmd-p)")).toBeTruthy()
  );
});
