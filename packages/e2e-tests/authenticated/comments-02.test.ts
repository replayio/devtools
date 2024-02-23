import { BrowserContext } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { E2E_USER_1, E2E_USER_2 } from "../helpers/authentication";
import {
  addSourceCodeComment,
  deleteAllComments,
  getComments,
  replyToComment,
} from "../helpers/comments";
import { openSource } from "../helpers/source-explorer-panel";
import test, { Page } from "../testFixtureCloneRecording";

const url = "authenticated_comments.html";

async function load(page: Page, recordingId: string, apiKey: string, testScope: string) {
  await startTest(page, recordingId, { apiKey, testScope });
  await page.coverage.startJSCoverage();

  await openDevToolsTab(page);
  await openSource(page, url);
}

test.use({ exampleKey: url, testUsers: [E2E_USER_1, E2E_USER_2] });

test(`authenticated/comments-02: Test shared comments and replies`, async ({
  browser,
  pageWithMeta: { recordingId, testScope },
  testUsers,
}) => {
  let contextOne: BrowserContext;
  let contextTwo: BrowserContext;
  let pageOne: Page;
  let pageTwo: Page;

  {
    console.log("User 1: Add comment");

    // User 1
    contextOne = await browser.newContext();
    const page = await contextOne.newPage();

    await load(page, recordingId, testUsers![0].apiKey, testScope);

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
    contextTwo = await browser.newContext();
    const page = await contextTwo.newPage();
    await load(page, recordingId, testUsers![1].apiKey, testScope);

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

  {
    // User 2
    const page = pageTwo;
    await page.reload();

    // Verify reply is visible
    await getComments(page, {
      text: "This is a reply from user 2",
      type: "source-code",
    });
  }

  {
    await pageOne.close();
    await contextOne.close();
    await pageTwo.close();
    await contextTwo.close();
  }
});
