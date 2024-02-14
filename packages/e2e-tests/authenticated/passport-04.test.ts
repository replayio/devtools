import { openDevToolsTab, startTest } from "../helpers";
import { E2E_USER_1 } from "../helpers/authentication";
import { addSourceCodeComment, deleteComment } from "../helpers/comments";
import { isPassportItemCompleted } from "../helpers/passport";
import { enablePassport } from "../helpers/settings";
import { waitFor } from "../helpers/utils";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_rr_console.html", testUsers: [E2E_USER_1] });

test(`authenticated/passport-04: Multiplayer`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
  testUsers,
}) => {
  await startTest(page, recordingId, { apiKey: testUsers![0].apiKey, testScope });

  await enablePassport(page);

  expect(await isPassportItemCompleted(page, "Add a comment")).toBeFalsy();

  // Test users have no role, so they don't see the "Share" button
  //
  // expect(await isPassportItemCompleted(page, "Share")).toBeFalsy();

  await openDevToolsTab(page);

  const commentLocator = await addSourceCodeComment(page, {
    text: "This is a test comment",
    lineNumber: 3,
    url: exampleKey,
  });
  await deleteComment(page, commentLocator);

  await waitFor(async () =>
    expect(await isPassportItemCompleted(page, "Add a comment")).toBeTruthy()
  );

  // Test users have no role, so they don't see the "Share" button
  //
  // await page.locator('button:has-text("Share")').click();
  // await page.locator('button:has-text("Copy URL")').click();
  // await page.keyboard.press("Escape");
  //
  // await waitFor(async () => expect(await isPassportItemCompleted(page, "Share")).toBeTruthy());
});
