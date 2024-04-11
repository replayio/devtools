import { openDevToolsTab, startTest } from "../helpers";
import { E2E_USER_1 } from "../helpers/authentication";
import { warpToMessage } from "../helpers/console-panel";
import { openEventsPanel } from "../helpers/info-event-panel";
import { openNetworkPanel } from "../helpers/network-panel";
import { isPassportItemCompleted, showPassport } from "../helpers/passport";
import { enablePassport } from "../helpers/settings";
import { addLogpoint, removeAllLogpoints } from "../helpers/source-panel";
import { waitFor } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "redux-fundamentals/dist/index.html", testUsers: [E2E_USER_1] });

test(`authenticated/passport-01: Time travel`, async ({
  pageWithMeta: { page, recordingId, testScope },
  testUsers,
}) => {
  await startTest(page, recordingId, testScope, testUsers![0].apiKey);

  await enablePassport(page);
  await showPassport(page);

  expect(await isPassportItemCompleted(page, "Console time travel")).toBeFalsy();
  expect(await isPassportItemCompleted(page, "Add a console log")).toBeFalsy();
  expect(await isPassportItemCompleted(page, "Jump to code")).toBeFalsy();
  expect(await isPassportItemCompleted(page, "Jump to event")).toBeFalsy();
  expect(await isPassportItemCompleted(page, "Jump to network request")).toBeFalsy();

  await openDevToolsTab(page);

  await warpToMessage(page, "Found an issue?");

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Console time travel")).toBeTruthy()
  );

  await addLogpoint(page, { lineNumber: 499, saveAfterEdit: true });
  await removeAllLogpoints(page);

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Add a console log")).toBeTruthy()
  );

  await openEventsPanel(page);
  const event = page.locator('[data-test-name="Event"]:has-text("Key Press W")');
  await event.hover();
  await event.locator('[data-test-name="JumpToCode"]').click();

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Jump to code")).toBeTruthy()
  );

  await openEventsPanel(page);
  await event.click();

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Jump to event")).toBeTruthy()
  );

  await openNetworkPanel(page);
  const request = page.locator('[data-test-name="Network-RequestRow"]:has-text("todos")').first();
  await request.hover();
  await request.locator('[data-test-name="Network-RequestRow-SeekButton"]').click();

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Jump to network request")).toBeTruthy()
  );
});
