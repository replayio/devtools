import { openDevToolsTab, startTest } from "../helpers";
import { E2E_USER_1 } from "../helpers/authentication";
import { warpToMessage } from "../helpers/console-panel";
import { isPassportItemCompleted, showPassport } from "../helpers/passport";
import { enablePassport } from "../helpers/settings";
import { addLogpoint, removeAllLogpoints } from "../helpers/source-panel";
import { waitFor } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "doc_rr_console.html", testUsers: [E2E_USER_1] });

test(`authenticated/passport-01: Time travel`, async ({
  pageWithMeta: { page, recordingId, testScope },
  testUsers,
}) => {
  await startTest(page, recordingId, testScope, testUsers![0].apiKey);

  await enablePassport(page);
  await showPassport(page);

  expect(await isPassportItemCompleted(page, "Console time travel")).toBeFalsy();
  expect(await isPassportItemCompleted(page, "Add a console log")).toBeFalsy();
  expect(await isPassportItemCompleted(page, "Jump to event")).toBeFalsy();

  await openDevToolsTab(page);

  await warpToMessage(page, "Iteration 1");

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Console time travel")).toBeTruthy()
  );

  await addLogpoint(page, { lineNumber: 13, saveAfterEdit: true });
  await removeAllLogpoints(page);

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Add a console log")).toBeTruthy()
  );

  await page.locator('[data-test-name="ToolbarButton-ReplayInfo"]').click();
  await page.locator('[data-test-name="Event"]').click();

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Jump to event")).toBeTruthy()
  );
});
