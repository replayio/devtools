import test, { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { E2E_USER_1_API_KEY } from "../helpers/authentication";
import { warpToMessage } from "../helpers/console-panel";
import { isPassportItemCompleted, showPassport } from "../helpers/passport";
import { enablePassport } from "../helpers/settings";
import { addLogpoint, removeAllLogpoints } from "../helpers/source-panel";
import { resetTestUser, waitFor } from "../helpers/utils";

const url = "doc_rr_console.html";

test(`authenticated/passport-01: Time travel`, async ({ page }) => {
  await resetTestUser("frontende2e1@replay.io");

  await startTest(page, url, E2E_USER_1_API_KEY);

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
