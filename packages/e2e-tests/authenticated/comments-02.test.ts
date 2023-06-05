import test, { Page } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { E2E_USER_1_API_KEY, E2E_USER_2_API_KEY } from "../helpers/authentication";
import {
  addSourceCodeComment,
  deleteAllComments,
  getComments,
  replyToComment,
} from "../helpers/comments";
import { openSource } from "../helpers/source-explorer-panel";

// Each authenticated e2e test must use a unique recording id;
// else shared state from one test could impact another test running in parallel.
// TODO [SCS-1066] Share recordings between other tests
const url = "authenticated_comments_2.html";

async function load(page: Page, apiKey: string) {
  await startTest(page, url, apiKey);

  await openDevToolsTab(page);
  await openSource(page, url);
}

test(`authenticated/comments-02: Test shared comments and replies`, async ({ browser }) => {
  let pageOne: Page;
  let pageTwo: Page;

  {
    console.log("User 1: Add comment");

    // User 1
    const context = await browser.newContext();
    const page = await context.newPage();
    await load(page, E2E_USER_1_API_KEY);

    // Clean up from previous tests
    // TODO [SCS-1066] Ideally we would create a fresh recording for each test run
    await deleteAllComments(page);

    await addSourceCodeComment(page, {
      text: "This is a test comment from user 1",
      lineNumber: 3,
      url,
    });

    pageOne = page;
  }

  {
    console.log("User 2: Reply to comment");

    // User 2
    const context = await browser.newContext();
    const page = await context.newPage();
    await load(page, E2E_USER_2_API_KEY);

    const commentLocator = await getComments(page, {
      text: "This is a test comment from user 1",
      type: "source-code",
    });

    await replyToComment(page, commentLocator, {
      text: "This is a reply from user 2",
      url,
    });

    pageTwo = page;
  }

  {
    console.log("User 1: View reply (and delete comment)");

    // User 1
    const page = pageOne;
    await page.reload();

    // Verify reply is visible
    await getComments(page, {
      text: "This is a reply from user 2",
      type: "source-code",
    });

    await deleteAllComments(page);
  }
});
