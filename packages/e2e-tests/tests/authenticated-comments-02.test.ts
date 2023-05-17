import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  addSourceComment,
  deleteAllComments,
  getComments,
  replyToComment,
} from "../helpers/comments";
import { openSource } from "../helpers/source-explorer-panel";

// Each authenticated e2e test must use a unique recording id;
// else shared state from one test could impact another test running in parallel.
// TODO [SCS-1066] Share recordings between other tests
const url = "authenticated_comments_2.html";

test(`comments-02: Test shared comments and replies`, async ({ page }) => {
  await startTest(page, url, process.env.E2E_USER_1_API_KEY);
  await openDevToolsTab(page);
  await openSource(page, url);

  // Clean up from previous tests
  // TODO [SCS-1066] Ideally we would create a fresh recording for each test run
  await deleteAllComments(page);

  await addSourceComment(page, {
    text: "This is a test comment from user 1",
    lineNumber: 3,
    url,
  });

  // Switch to user 2
  await startTest(page, url, process.env.E2E_USER_2_API_KEY);
  await openDevToolsTab(page);
  await openSource(page, url);

  const commentLocator = await getComments(page, {
    text: "This is a test comment from user 1",
    type: "source-code",
  });

  await replyToComment(page, commentLocator, {
    text: "This is a reply from user 2",
    url,
  });

  // Switch back to user 1
  await startTest(page, url, process.env.E2E_USER_1_API_KEY);
  await openDevToolsTab(page);
  await openSource(page, url);

  // Verify reply is visible
  const replyLocator = await getComments(page, {
    text: "This is a reply from user 2",
    type: "source-code",
  });

  await deleteAllComments(page);
});
